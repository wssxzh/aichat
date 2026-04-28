"use strict";

const fs = require("fs");
const http = require("http");
const https = require("https");
const crypto = require("crypto");
const path = require("path");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";
const defaultRequestTimeoutMs = 60000;
const chatRequestTimeoutMs = 120000;
const webSearchTimeoutMs = Math.min(
  45000,
  Math.max(3000, Number(process.env.SEARXNG_TIMEOUT_MS) || 12000)
);
const webSearchResultCount = Math.min(
  8,
  Math.max(1, Number(process.env.SEARXNG_RESULT_COUNT) || 5)
);
const webSearchSnippetMaxLength = Math.min(
  1200,
  Math.max(120, Number(process.env.SEARXNG_SNIPPET_MAX_LENGTH) || 320)
);
const webSearchContextMaxLength = Math.min(
  16000,
  Math.max(1500, Number(process.env.SEARXNG_CONTEXT_MAX_LENGTH) || 7200)
);
const webSearchServerEnabled =
  String(process.env.WEB_SEARCH_SERVER_ENABLED || "true").trim().toLowerCase() !== "false";
const webSearchDefaultEnabled =
  String(process.env.WEB_SEARCH_DEFAULT_ENABLED || "false").trim().toLowerCase() === "true";
const searxngBaseUrl = trimTrailingSlashes(process.env.SEARXNG_BASE_URL || "http://127.0.0.1:8080");
const searxngSearchPath = (() => {
  const raw = String(process.env.SEARXNG_SEARCH_PATH || "/search").trim();
  if (!raw) {
    return "/search";
  }

  return raw.startsWith("/") ? raw : `/${raw}`;
})();
const searxngLanguage = String(process.env.SEARXNG_LANGUAGE || "").trim();
const searxngSafeSearch = String(process.env.SEARXNG_SAFESEARCH || "").trim();
const runtimeConfigPath = process.env.RUNTIME_CONFIG_PATH
  ? path.resolve(process.env.RUNTIME_CONFIG_PATH)
  : path.join(__dirname, ".runtime-config.json");
const usersConfigPath = process.env.USERS_CONFIG_PATH
  ? path.resolve(process.env.USERS_CONFIG_PATH)
  : path.join(__dirname, ".runtime-users.json");
const announcementsConfigPath = process.env.ANNOUNCEMENTS_CONFIG_PATH
  ? path.resolve(process.env.ANNOUNCEMENTS_CONFIG_PATH)
  : path.join(__dirname, ".runtime-announcements.json");
const conversationsConfigPath = process.env.CONVERSATIONS_CONFIG_PATH
  ? path.resolve(process.env.CONVERSATIONS_CONFIG_PATH)
  : path.join(__dirname, ".runtime-conversations.json");
const maxStoredAnnouncements = Math.max(
  1,
  Number(process.env.MAX_STORED_ANNOUNCEMENTS || process.env.ANNOUNCEMENTS_MAX_ITEMS) || 80
);
const maxStoredConversationsPerUser = Math.min(
  300,
  Math.max(1, Number(process.env.MAX_STORED_CONVERSATIONS_PER_USER) || 120)
);
const maxMessagesPerConversation = Math.min(
  1200,
  Math.max(1, Number(process.env.MAX_MESSAGES_PER_CONVERSATION) || 320)
);
const maxConversationMessageLength = Math.min(
  64000,
  Math.max(200, Number(process.env.MAX_CONVERSATION_MESSAGE_LENGTH) || 12000)
);
const maxConversationSystemPromptLength = Math.min(
  32000,
  Math.max(50, Number(process.env.MAX_CONVERSATION_SYSTEM_PROMPT_LENGTH) || 6000)
);
const maxConversationTitleLength = 120;
const sessionCookieName = "aichat_session";
const sessionTtlMs = Math.max(
  5 * 60 * 1000,
  Number(process.env.SESSION_TTL_MS || process.env.ADMIN_SESSION_TTL_MS) || 8 * 60 * 60 * 1000
);
const sessionCookieSecure =
  String(process.env.SESSION_COOKIE_SECURE || process.env.ADMIN_COOKIE_SECURE || "").toLowerCase() === "true";
const defaultAdminUsername = String(process.env.ADMIN_USERNAME || "admin").trim();
const defaultAdminPassword = String(process.env.ADMIN_PASSWORD || "demo-admin-password-change-me").trim();
const sessionStore = new Map();

if (defaultAdminPassword === "demo-admin-password-change-me") {
  console.warn(
    "WARNING: Using default ADMIN_PASSWORD. Please set a strong ADMIN_PASSWORD before production deployment."
  );
}

app.use(express.json({ limit: "4mb" }));
app.use(express.static(path.join(__dirname, "public")));

function parseCookies(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== "string") {
    return {};
  }

  return cookieHeader.split(";").reduce((result, pair) => {
    const index = pair.indexOf("=");

    if (index <= 0) {
      return result;
    }

    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();

    if (!key) {
      return result;
    }

    try {
      result[key] = decodeURIComponent(value);
    } catch (error) {
      result[key] = value;
    }

    return result;
  }, {});
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }

  if (options.path) {
    parts.push(`Path=${options.path}`);
  }

  if (options.httpOnly) {
    parts.push("HttpOnly");
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  if (options.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function setSessionCookie(response, token, maxAgeMs) {
  response.setHeader(
    "Set-Cookie",
    serializeCookie(sessionCookieName, token, {
      maxAge: Math.floor(maxAgeMs / 1000),
      path: "/api",
      httpOnly: true,
      sameSite: "Strict",
      secure: sessionCookieSecure
    })
  );
}

function clearSessionCookie(response) {
  response.setHeader(
    "Set-Cookie",
    serializeCookie(sessionCookieName, "", {
      maxAge: 0,
      path: "/api",
      httpOnly: true,
      sameSite: "Strict",
      secure: sessionCookieSecure
    })
  );
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function removeExpiredSessions() {
  const now = Date.now();

  for (const [token, session] of sessionStore.entries()) {
    if (!session || session.expiresAt <= now) {
      sessionStore.delete(token);
    }
  }
}

function getSessionRecordFromRequest(request) {
  removeExpiredSessions();
  const cookies = parseCookies(request.headers.cookie || "");
  const token = cookies[sessionCookieName];

  if (!token) {
    return null;
  }

  const session = sessionStore.get(token);

  if (!session || session.expiresAt <= Date.now()) {
    sessionStore.delete(token);
    return null;
  }

  return {
    token,
    ...session
  };
}

function createPasswordRecord(password, saltHex) {
  const salt = saltHex || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");

  return {
    salt,
    hash
  };
}

function verifyPassword(candidatePassword, salt, expectedHash) {
  if (!candidatePassword || !salt || !expectedHash) {
    return false;
  }

  const record = createPasswordRecord(candidatePassword, salt);
  const left = Buffer.from(record.hash, "hex");
  const right = Buffer.from(expectedHash, "hex");

  if (!left.length || left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

function normalizeUsername(value) {
  return String(value || "").trim();
}

function normalizeUsernameLower(value) {
  return normalizeUsername(value).toLowerCase();
}

function validateUsername(value) {
  const username = normalizeUsername(value);

  if (!username) {
    throw new Error("用户名不能为空。");
  }

  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5-]{3,24}$/.test(username)) {
    throw new Error("用户名需为 3-24 位，可使用中文、字母、数字、下划线或中划线。");
  }

  return username;
}

function validatePassword(value) {
  const password = String(value || "");

  if (!password.trim()) {
    throw new Error("密码不能为空。");
  }

  if (password.length < 6 || password.length > 64) {
    throw new Error("密码长度需在 6-64 位之间。");
  }

  return password;
}

function normalizeRole(value) {
  return String(value || "").toLowerCase() === "admin" ? "admin" : "user";
}

function sanitizeLoadedUser(input) {
  const username = normalizeUsername(input?.username);
  const usernameLower = normalizeUsernameLower(input?.usernameLower || username);
  const role = normalizeRole(input?.role);

  if (!username || !usernameLower || !input?.id || !input?.passwordHash || !input?.passwordSalt) {
    return null;
  }

  return {
    id: String(input.id),
    username,
    usernameLower,
    role,
    disabled: Boolean(input.disabled),
    passwordHash: String(input.passwordHash),
    passwordSalt: String(input.passwordSalt),
    createdAt: Number(input.createdAt) || Date.now(),
    updatedAt: Number(input.updatedAt) || Date.now(),
    lastLoginAt: Number(input.lastLoginAt) || 0
  };
}

function readUsersStore() {
  if (!fs.existsSync(usersConfigPath)) {
    return {
      users: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  try {
    const raw = fs.readFileSync(usersConfigPath, "utf8");
    const parsed = JSON.parse(raw);
    const users = Array.isArray(parsed?.users) ? parsed.users.map(sanitizeLoadedUser).filter(Boolean) : [];

    return {
      users,
      createdAt: Number(parsed?.createdAt) || Date.now(),
      updatedAt: Number(parsed?.updatedAt) || Date.now()
    };
  } catch (error) {
    console.warn("Failed to read users config:", error);
    return {
      users: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
}

let usersStore = readUsersStore();

function persistUsersStore() {
  usersStore.updatedAt = Date.now();

  fs.writeFileSync(
    usersConfigPath,
    JSON.stringify(
      {
        users: usersStore.users,
        createdAt: usersStore.createdAt,
        updatedAt: usersStore.updatedAt
      },
      null,
      2
    ),
    "utf8"
  );
}

function createStoredUser({ username, password, role = "user" }) {
  const validatedUsername = validateUsername(username);
  const validatedPassword = validatePassword(password);
  const usernameLower = normalizeUsernameLower(validatedUsername);
  const normalizedRole = normalizeRole(role);

  if (usersStore.users.some((item) => item.usernameLower === usernameLower)) {
    const duplicateError = new Error("用户名已存在。");
    duplicateError.status = 409;
    throw duplicateError;
  }

  const passwordRecord = createPasswordRecord(validatedPassword);
  const now = Date.now();
  const user = {
    id: `user-${crypto.randomUUID()}`,
    username: validatedUsername,
    usernameLower,
    role: normalizedRole,
    disabled: false,
    passwordHash: passwordRecord.hash,
    passwordSalt: passwordRecord.salt,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: 0
  };

  usersStore.users.push(user);
  persistUsersStore();

  return user;
}

function countEnabledAdmins(users = usersStore.users) {
  return users.filter((user) => user.role === "admin" && !user.disabled).length;
}

function ensureDefaultAdminUser() {
  if (!defaultAdminUsername || !defaultAdminPassword) {
    return;
  }

  const adminUsername = validateUsername(defaultAdminUsername);
  const adminUsernameLower = normalizeUsernameLower(adminUsername);
  const existingAdmin = usersStore.users.find((user) => user.usernameLower === adminUsernameLower);

  if (!existingAdmin) {
    createStoredUser({
      username: adminUsername,
      password: defaultAdminPassword,
      role: "admin"
    });
    return;
  }

  if (existingAdmin.role !== "admin") {
    existingAdmin.role = "admin";
    existingAdmin.updatedAt = Date.now();
    persistUsersStore();
  }
}

ensureDefaultAdminUser();

function normalizeAnnouncementTitle(value) {
  return String(value || "").trim();
}

function validateAnnouncementTitle(value) {
  const title = normalizeAnnouncementTitle(value);

  if (title.length > 120) {
    const titleError = new Error("公告标题不能超过 120 个字符。");
    titleError.status = 400;
    throw titleError;
  }

  return title;
}

function validateAnnouncementContent(value) {
  const content = String(value || "").trim();

  if (!content) {
    const contentError = new Error("公告内容不能为空。");
    contentError.status = 400;
    throw contentError;
  }

  if (content.length > 4000) {
    const contentLengthError = new Error("公告内容不能超过 4000 个字符。");
    contentLengthError.status = 400;
    throw contentLengthError;
  }

  return content;
}

function sanitizeLoadedAnnouncement(input) {
  const id = String(input?.id || "").trim();
  const content = String(input?.content || "").trim();

  if (!id || !content) {
    return null;
  }

  const createdAt = Number(input?.createdAt) || Date.now();
  const updatedAt = Number(input?.updatedAt) || createdAt;
  const title = normalizeAnnouncementTitle(input?.title).slice(0, 120);

  return {
    id,
    title,
    content: content.slice(0, 4000),
    authorId: String(input?.authorId || "").trim(),
    authorName: normalizeUsername(input?.authorName || ""),
    createdAt,
    updatedAt
  };
}

function sortAnnouncements(left, right) {
  return Number(right.updatedAt || right.createdAt || 0) - Number(left.updatedAt || left.createdAt || 0);
}

function readAnnouncementsStore() {
  if (!fs.existsSync(announcementsConfigPath)) {
    return {
      announcements: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  try {
    const raw = fs.readFileSync(announcementsConfigPath, "utf8");
    const parsed = JSON.parse(raw);
    const announcements = Array.isArray(parsed?.announcements)
      ? parsed.announcements.map(sanitizeLoadedAnnouncement).filter(Boolean)
      : [];

    announcements.sort(sortAnnouncements);

    return {
      announcements: announcements.slice(0, maxStoredAnnouncements),
      createdAt: Number(parsed?.createdAt) || Date.now(),
      updatedAt: Number(parsed?.updatedAt) || Date.now()
    };
  } catch (error) {
    console.warn("Failed to read announcements config:", error);
    return {
      announcements: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
}

let announcementsStore = readAnnouncementsStore();

function persistAnnouncementsStore() {
  announcementsStore.updatedAt = Date.now();
  announcementsStore.announcements = announcementsStore.announcements
    .filter(Boolean)
    .sort(sortAnnouncements)
    .slice(0, maxStoredAnnouncements);

  fs.writeFileSync(
    announcementsConfigPath,
    JSON.stringify(
      {
        announcements: announcementsStore.announcements,
        createdAt: announcementsStore.createdAt,
        updatedAt: announcementsStore.updatedAt
      },
      null,
      2
    ),
    "utf8"
  );
}

function toPublicAnnouncement(announcement) {
  if (!announcement) {
    return null;
  }

  return {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    authorId: announcement.authorId || null,
    authorName: announcement.authorName || null,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt
  };
}

function listAnnouncements(limit) {
  const sortedAnnouncements = announcementsStore.announcements
    .filter(Boolean)
    .sort(sortAnnouncements);

  if (!Number.isFinite(Number(limit))) {
    return sortedAnnouncements;
  }

  return sortedAnnouncements.slice(0, Math.max(1, Math.floor(Number(limit))));
}

function createStoredAnnouncement({ title, content, author }) {
  const now = Date.now();
  const announcement = {
    id: `announcement-${crypto.randomUUID()}`,
    title: validateAnnouncementTitle(title),
    content: validateAnnouncementContent(content),
    authorId: String(author?.id || "").trim(),
    authorName: normalizeUsername(author?.username || ""),
    createdAt: now,
    updatedAt: now
  };

  announcementsStore.announcements.unshift(announcement);
  persistAnnouncementsStore();

  return announcement;
}

function removeStoredAnnouncement(announcementId) {
  const id = String(announcementId || "").trim();

  if (!id) {
    return null;
  }

  const targetIndex = announcementsStore.announcements.findIndex((item) => item.id === id);

  if (targetIndex < 0) {
    return null;
  }

  const [removed] = announcementsStore.announcements.splice(targetIndex, 1);
  persistAnnouncementsStore();

  return removed;
}

function clampConversationTemperature(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0.7;
  }

  return Math.min(2, Math.max(0, numeric));
}

function normalizeConversationFeedback(value) {
  return value === "like" || value === "dislike" ? value : "";
}

function normalizeConversationRole(value) {
  return value === "assistant" ? "assistant" : "user";
}

function compactConversationText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function deriveConversationTitle(messages) {
  const firstUserMessage = Array.isArray(messages)
    ? messages.find((message) => message.role === "user" && compactConversationText(message.content))
    : null;

  if (!firstUserMessage) {
    return "New chat";
  }

  const sourceText = compactConversationText(firstUserMessage.content);

  if (!sourceText) {
    return "New chat";
  }

  return sourceText.length > 24 ? `${sourceText.slice(0, 24)}...` : sourceText;
}

function sanitizeConversationMessage(input) {
  const content = String(input?.content || "").slice(0, maxConversationMessageLength);
  const timestamp = Number(input?.timestamp) || Date.now();
  const model = typeof input?.model === "string" ? input.model.slice(0, 200) : "";
  const id = typeof input?.id === "string" && input.id.trim()
    ? input.id.trim().slice(0, 120)
    : `message-${crypto.randomUUID()}`;

  return {
    id,
    role: normalizeConversationRole(input?.role),
    content,
    model,
    timestamp,
    feedback: normalizeConversationFeedback(input?.feedback),
    streaming: false
  };
}

function sanitizeConversationRecord(input) {
  const createdAt = Number(input?.createdAt) || Date.now();
  const messages = Array.isArray(input?.messages)
    ? input.messages.map(sanitizeConversationMessage).slice(-maxMessagesPerConversation)
    : [];
  const title = compactConversationText(input?.title).slice(0, maxConversationTitleLength);

  return {
    id: typeof input?.id === "string" && input.id.trim()
      ? input.id.trim().slice(0, 120)
      : `conversation-${crypto.randomUUID()}`,
    title: title || deriveConversationTitle(messages),
    createdAt,
    updatedAt: Number(input?.updatedAt) || createdAt,
    modelId: typeof input?.modelId === "string" ? input.modelId.slice(0, 200) : "",
    systemPrompt: typeof input?.systemPrompt === "string"
      ? input.systemPrompt.slice(0, maxConversationSystemPromptLength)
      : "",
    temperature: clampConversationTemperature(input?.temperature),
    pinned: Boolean(input?.pinned),
    messages
  };
}

function sortConversations(left, right) {
  if (Boolean(left?.pinned) !== Boolean(right?.pinned)) {
    return left?.pinned ? -1 : 1;
  }

  return Number(right?.updatedAt || 0) - Number(left?.updatedAt || 0);
}

function sanitizeUserConversationsState(input) {
  const conversations = Array.isArray(input?.conversations)
    ? input.conversations.map(sanitizeConversationRecord).sort(sortConversations).slice(0, maxStoredConversationsPerUser)
    : [];
  const providedActiveConversationId =
    typeof input?.activeConversationId === "string" ? input.activeConversationId.trim().slice(0, 120) : "";
  const resolvedActiveConversationId =
    conversations.some((conversation) => conversation.id === providedActiveConversationId)
      ? providedActiveConversationId
      : conversations[0]?.id || "";

  return {
    conversations,
    activeConversationId: resolvedActiveConversationId,
    updatedAt: Number(input?.updatedAt) || Date.now()
  };
}

function readConversationsStore() {
  if (!fs.existsSync(conversationsConfigPath)) {
    return {
      users: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  try {
    const raw = fs.readFileSync(conversationsConfigPath, "utf8");
    const parsed = JSON.parse(raw);
    const nextUsers = {};
    const usersNode = parsed?.users && typeof parsed.users === "object" ? parsed.users : {};

    for (const [userId, userState] of Object.entries(usersNode)) {
      const normalizedUserId = String(userId || "").trim();

      if (!normalizedUserId) {
        continue;
      }

      nextUsers[normalizedUserId] = sanitizeUserConversationsState(userState);
    }

    return {
      users: nextUsers,
      createdAt: Number(parsed?.createdAt) || Date.now(),
      updatedAt: Number(parsed?.updatedAt) || Date.now()
    };
  } catch (error) {
    console.warn("Failed to read conversations config:", error);
    return {
      users: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
}

let conversationsStore = readConversationsStore();

function persistConversationsStore() {
  conversationsStore.updatedAt = Date.now();

  fs.writeFileSync(
    conversationsConfigPath,
    JSON.stringify(
      {
        users: conversationsStore.users,
        createdAt: conversationsStore.createdAt,
        updatedAt: conversationsStore.updatedAt
      },
      null,
      2
    ),
    "utf8"
  );
}

function getUserConversationsState(userId) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    return sanitizeUserConversationsState(null);
  }

  if (!conversationsStore.users[normalizedUserId]) {
    conversationsStore.users[normalizedUserId] = sanitizeUserConversationsState(null);
  }

  return sanitizeUserConversationsState(conversationsStore.users[normalizedUserId]);
}

function saveUserConversationsState(userId, payload) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    const userIdError = new Error("Invalid user id");
    userIdError.status = 400;
    throw userIdError;
  }

  const sanitized = sanitizeUserConversationsState(payload);
  conversationsStore.users[normalizedUserId] = {
    ...sanitized,
    updatedAt: Date.now()
  };
  persistConversationsStore();

  return sanitizeUserConversationsState(conversationsStore.users[normalizedUserId]);
}

function toPublicUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    disabled: Boolean(user.disabled),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt || null
  };
}

function getUserById(userId) {
  return usersStore.users.find((user) => user.id === userId) || null;
}

function getUserByUsername(username) {
  const usernameLower = normalizeUsernameLower(username);
  return usersStore.users.find((user) => user.usernameLower === usernameLower) || null;
}

function invalidateUserSessions(userId) {
  for (const [token, session] of sessionStore.entries()) {
    if (session?.userId === userId) {
      sessionStore.delete(token);
    }
  }
}

function createUserSession(response, user) {
  const token = generateSessionToken();
  const now = Date.now();
  const expiresAt = now + sessionTtlMs;

  sessionStore.set(token, {
    userId: user.id,
    createdAt: now,
    expiresAt
  });
  setSessionCookie(response, token, sessionTtlMs);

  return {
    token,
    expiresAt
  };
}

function getAuthenticatedUser(request) {
  const sessionRecord = getSessionRecordFromRequest(request);

  if (!sessionRecord) {
    return null;
  }

  const user = getUserById(sessionRecord.userId);

  if (!user || user.disabled) {
    sessionStore.delete(sessionRecord.token);
    return null;
  }

  return {
    sessionRecord,
    user
  };
}

function requireAuth(request, response, next) {
  const auth = getAuthenticatedUser(request);

  if (!auth) {
    return response.status(401).json({
      error: "未登录",
      detail: "请先登录后再继续。"
    });
  }

  request.currentUser = auth.user;
  request.sessionRecord = auth.sessionRecord;
  next();
}

function requireAdmin(request, response, next) {
  requireAuth(request, response, () => {
    if (request.currentUser.role !== "admin") {
      return response.status(403).json({
        error: "权限不足",
        detail: "仅管理员可执行该操作。"
      });
    }

    next();
  });
}

function trimTrailingSlashes(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function validateApiBaseUrl(value) {
  const normalized = trimTrailingSlashes(value);

  if (!normalized) {
    throw new Error("API 地址不能为空。");
  }

  let parsedUrl = null;

  try {
    parsedUrl = new URL(normalized);
  } catch (error) {
    throw new Error("API 地址格式不正确。");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("API 地址必须以 http:// 或 https:// 开头。");
  }

  return normalized;
}

function sanitizeApiKey(value) {
  return String(value || "").trim();
}

function maskApiKey(apiKey) {
  if (!apiKey) {
    return "未配置";
  }

  if (apiKey.length <= 4) {
    return `${apiKey[0] || "*"}***`;
  }

  return `${apiKey.slice(0, 2)}***${apiKey.slice(-2)}`;
}

function readSavedRuntimeConfig() {
  if (!fs.existsSync(runtimeConfigPath)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(runtimeConfigPath, "utf8");
    const parsed = JSON.parse(raw);

    return {
      apiBaseUrl: parsed?.apiBaseUrl ? validateApiBaseUrl(parsed.apiBaseUrl) : undefined,
      apiKey: parsed?.apiKey !== undefined ? sanitizeApiKey(parsed.apiKey) : undefined
    };
  } catch (error) {
    console.warn("Failed to read runtime config:", error);
    return {};
  }
}

const runtimeConfig = {
  apiBaseUrl: validateApiBaseUrl(process.env.API_BASE_URL || "https://api.example.com"),
  apiKey: sanitizeApiKey(process.env.API_KEY || "demo-key-change-me"),
  ...readSavedRuntimeConfig()
};

function getRuntimeConfig() {
  return {
    apiBaseUrl: runtimeConfig.apiBaseUrl,
    apiKey: runtimeConfig.apiKey
  };
}

function serializeConfigForClient(includeApiKey = false) {
  const config = getRuntimeConfig();

  return {
    apiBaseUrl: config.apiBaseUrl,
    apiKey: includeApiKey ? config.apiKey : undefined,
    apiKeyPreview: maskApiKey(config.apiKey),
    keyConfigured: Boolean(config.apiKey)
  };
}

function persistRuntimeConfig(config) {
  fs.writeFileSync(
    runtimeConfigPath,
    JSON.stringify(
      {
        apiBaseUrl: config.apiBaseUrl,
        apiKey: config.apiKey
      },
      null,
      2
    ),
    "utf8"
  );
}

function updateRuntimeConfig(nextValues) {
  const nextConfig = {
    apiBaseUrl: validateApiBaseUrl(nextValues.apiBaseUrl),
    apiKey: sanitizeApiKey(nextValues.apiKey)
  };

  runtimeConfig.apiBaseUrl = nextConfig.apiBaseUrl;
  runtimeConfig.apiKey = nextConfig.apiKey;
  persistRuntimeConfig(runtimeConfig);

  return getRuntimeConfig();
}

function getHttpClient(targetUrl) {
  return targetUrl.protocol === "https:" ? https : http;
}

function createApiHeaders(apiKey, extraHeaders = {}) {
  return {
    Authorization: `Bearer ${apiKey}`,
    ...extraHeaders
  };
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function requestJson(url, { method = "GET", headers = {}, body, timeout = defaultRequestTimeoutMs } = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const client = getHttpClient(target);

    const upstreamRequest = client.request(
      target,
      {
        method,
        headers,
        timeout
      },
      (upstreamResponse) => {
        let raw = "";

        upstreamResponse.setEncoding("utf8");
        upstreamResponse.on("data", (chunk) => {
          raw += chunk;
        });

        upstreamResponse.on("end", () => {
          let data = raw;

          try {
            data = raw ? JSON.parse(raw) : {};
          } catch (error) {
            data = raw;
          }

          resolve({
            ok: Number(upstreamResponse.statusCode) >= 200 && Number(upstreamResponse.statusCode) < 300,
            status: Number(upstreamResponse.statusCode) || 500,
            data,
            raw
          });
        });
      }
    );

    upstreamRequest.on("timeout", () => {
      const timeoutError = new Error("上游请求超时。");
      timeoutError.code = "ETIMEDOUT";
      upstreamRequest.destroy(timeoutError);
    });

    upstreamRequest.on("error", reject);

    if (body) {
      upstreamRequest.write(body);
    }

    upstreamRequest.end();
  });
}

function isRetryableNetworkError(error) {
  return ["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "ECONNREFUSED", "EPIPE"].includes(error.code);
}

function isRetryableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

async function requestJsonWithRetry(url, options = {}, maxAttempts = 3) {
  let lastError = null;
  let lastResponse = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await requestJson(url, options);

      if (response.ok || !isRetryableStatus(response.status) || attempt === maxAttempts) {
        return response;
      }

      lastResponse = response;
    } catch (error) {
      lastError = error;

      if (!isRetryableNetworkError(error) || attempt === maxAttempts) {
        throw error;
      }
    }

    await wait(350 * attempt);
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError || new Error("上游请求失败。");
}

function extractErrorDetail(rawBody, status) {
  if (!rawBody) {
    return `上游接口返回 ${status}`;
  }

  try {
    const payload = JSON.parse(rawBody);

    if (typeof payload.detail === "string" && payload.detail.trim()) {
      return payload.detail;
    }

    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }

    if (payload.error && typeof payload.error.message === "string" && payload.error.message.trim()) {
      return payload.error.message;
    }

    return rawBody;
  } catch (error) {
    return rawBody;
  }
}

function createUpstreamError(upstreamResponse) {
  const detail =
    (typeof upstreamResponse.data === "object" &&
      upstreamResponse.data !== null &&
      (upstreamResponse.data.detail ||
        upstreamResponse.data.error?.message ||
        upstreamResponse.data.error)) ||
    upstreamResponse.raw ||
    `上游接口返回 ${upstreamResponse.status}`;

  const error = new Error(detail);
  error.status = upstreamResponse.status;
  error.detail = detail;
  return error;
}

function sortModels(left, right) {
  const leftOwner = String(left.owned_by || "");
  const rightOwner = String(right.owned_by || "");

  if (leftOwner !== rightOwner) {
    return leftOwner.localeCompare(rightOwner);
  }

  return String(left.id || "").localeCompare(String(right.id || ""));
}

function isValidMessages(messages) {
  return Array.isArray(messages) && messages.every((message) => {
    return (
      message &&
      typeof message.role === "string" &&
      message.role.trim().length > 0 &&
      typeof message.content === "string" &&
      message.content.trim().length > 0
    );
  });
}

function buildChatPayload(body, { stream = false } = {}) {
  const { model, messages, temperature } = body || {};

  if (!model || typeof model !== "string") {
    return {
      error: {
        status: 400,
        payload: { error: "请先选择模型后再发送消息。" }
      }
    };
  }

  if (!isValidMessages(messages)) {
    return {
      error: {
        status: 400,
        payload: { error: "消息列表格式不正确。" }
      }
    };
  }

  const payload = {
    model,
    messages,
    stream
  };

  if (typeof temperature === "number" && Number.isFinite(temperature)) {
    payload.temperature = Math.max(0, Math.min(2, temperature));
  }

  return { payload };
}

function parseBooleanFlag(value, fallback = false) {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function truncateText(value, maxLength) {
  const normalized = compactConversationText(value);

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
}

function extractLatestUserQuery(messages = []) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (String(message?.role || "").toLowerCase() !== "user") {
      continue;
    }

    const normalized = compactConversationText(message?.content);

    if (normalized) {
      return normalized.slice(0, 500);
    }
  }

  return "";
}

function normalizeSearxngResult(item) {
  const url = String(item?.url || "").trim();

  if (!url) {
    return null;
  }

  return {
    title: compactConversationText(item?.title) || url,
    url,
    snippet: truncateText(
      item?.content || item?.snippet || item?.description || item?.text,
      webSearchSnippetMaxLength
    ),
    source: compactConversationText(item?.engine || item?.source || item?.parsed_url?.[1] || ""),
    publishedAt: compactConversationText(item?.publishedDate || item?.published || "")
  };
}

async function fetchSearxngResults(query) {
  const searchUrl = new URL(searxngSearchPath, `${searxngBaseUrl}/`);
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("count", String(webSearchResultCount));

  if (searxngLanguage) {
    searchUrl.searchParams.set("language", searxngLanguage);
  }

  if (searxngSafeSearch) {
    searchUrl.searchParams.set("safesearch", searxngSafeSearch);
  }

  const upstreamResponse = await requestJsonWithRetry(
    searchUrl.toString(),
    { timeout: webSearchTimeoutMs },
    2
  );

  if (!upstreamResponse.ok) {
    throw createUpstreamError(upstreamResponse);
  }

  const results = Array.isArray(upstreamResponse.data?.results) ? upstreamResponse.data.results : [];

  return results
    .map(normalizeSearxngResult)
    .filter(Boolean)
    .slice(0, webSearchResultCount);
}

function buildWebSearchContextMessage(query, results) {
  const sourceText = results
    .map((item, index) => {
      const parts = [`[${index + 1}] ${item.title}`, `URL: ${item.url}`];

      if (item.source) {
        parts.push(`来源: ${item.source}`);
      }

      if (item.publishedAt) {
        parts.push(`时间: ${item.publishedAt}`);
      }

      if (item.snippet) {
        parts.push(`摘要: ${item.snippet}`);
      }

      return parts.join("\n");
    })
    .join("\n\n");

  const content = [
    "以下是系统通过 SearXNG 联网检索到的资料，请结合资料回答用户问题。",
    `用户当前问题: ${query}`,
    "",
    sourceText,
    "",
    "回答要求:",
    "1. 优先基于上述资料回答；",
    "2. 资料不足或冲突时请明确说明；",
    "3. 回答末尾附“参考来源”，列出使用到的 URL。"
  ].join("\n");

  return {
    role: "system",
    content: content.length > webSearchContextMaxLength
      ? content.slice(0, webSearchContextMaxLength)
      : content
  };
}

function injectWebSearchContext(messages, query, results) {
  if (!Array.isArray(messages) || !results.length) {
    return messages;
  }

  const contextMessage = buildWebSearchContextMessage(query, results);
  let insertIndex = messages.length;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (String(messages[index]?.role || "").toLowerCase() === "user") {
      insertIndex = index;
      break;
    }
  }

  return [
    ...messages.slice(0, insertIndex),
    contextMessage,
    ...messages.slice(insertIndex)
  ];
}

async function enrichPayloadWithWebSearch(payload, requestBody) {
  const webEnabled = parseBooleanFlag(requestBody?.webEnabled, webSearchDefaultEnabled);

  if (!webSearchServerEnabled || !webEnabled) {
    return payload;
  }

  const query = extractLatestUserQuery(payload?.messages);

  if (!query) {
    return payload;
  }

  try {
    const searchResults = await fetchSearxngResults(query);

    if (!searchResults.length) {
      return payload;
    }

    return {
      ...payload,
      messages: injectWebSearchContext(payload.messages, query, searchResults)
    };
  } catch (error) {
    console.warn("SearXNG web search failed, falling back to model-only mode:", error.message || error);
    return payload;
  }
}

function sendSseEvent(response, eventName, data) {
  if (response.writableEnded) {
    return;
  }

  if (eventName) {
    response.write(`event: ${eventName}\n`);
  }

  const serialized = typeof data === "string" ? data : JSON.stringify(data);
  response.write(`data: ${serialized}\n\n`);
}

async function fetchModelsWithConfig(config) {
  const upstreamResponse = await requestJsonWithRetry(`${config.apiBaseUrl}/v1/models`, {
    headers: createApiHeaders(config.apiKey)
  });

  if (!upstreamResponse.ok) {
    throw createUpstreamError(upstreamResponse);
  }

  const payload = upstreamResponse.data;
  const models = Array.isArray(payload.data) ? [...payload.data].sort(sortModels) : [];

  return {
    ...payload,
    data: models
  };
}

function readConfigFromBody(body, fallbackToRuntime = false) {
  const currentConfig = fallbackToRuntime ? getRuntimeConfig() : { apiBaseUrl: "", apiKey: "" };
  const nextBaseUrl = body?.apiBaseUrl !== undefined ? body.apiBaseUrl : currentConfig.apiBaseUrl;
  const nextApiKey = body?.apiKey !== undefined ? body.apiKey : currentConfig.apiKey;

  return {
    apiBaseUrl: validateApiBaseUrl(nextBaseUrl),
    apiKey: sanitizeApiKey(nextApiKey)
  };
}

app.get("/api/config", (request, response) => {
  response.json(serializeConfigForClient(false));
});

app.get("/api/auth/status", (request, response) => {
  const auth = getAuthenticatedUser(request);

  response.json({
    authenticated: Boolean(auth),
    user: auth ? toPublicUser(auth.user) : null,
    expiresAt: auth?.sessionRecord?.expiresAt || null
  });
});

app.post("/api/auth/register", (request, response, next) => {
  try {
    const username = validateUsername(request.body?.username);
    const password = validatePassword(request.body?.password);
    const user = createStoredUser({
      username,
      password,
      role: "user"
    });
    const session = createUserSession(response, user);

    response.status(201).json({
      authenticated: true,
      user: toPublicUser(user),
      expiresAt: session.expiresAt,
      message: "注册成功，已自动登录。"
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", (request, response, next) => {
  try {
    const username = validateUsername(request.body?.username);
    const password = validatePassword(request.body?.password);
    const user = getUserByUsername(username);

    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      return response.status(401).json({
        error: "登录失败",
        detail: "用户名或密码错误。"
      });
    }

    if (user.disabled) {
      return response.status(403).json({
        error: "账号不可用",
        detail: "该账号已被禁用，请联系管理员。"
      });
    }

    user.lastLoginAt = Date.now();
    user.updatedAt = Date.now();
    persistUsersStore();
    const session = createUserSession(response, user);

    response.json({
      authenticated: true,
      user: toPublicUser(user),
      expiresAt: session.expiresAt,
      message: "登录成功。"
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", (request, response) => {
  const auth = getAuthenticatedUser(request);

  if (auth?.sessionRecord?.token) {
    sessionStore.delete(auth.sessionRecord.token);
  }

  clearSessionCookie(response);
  response.json({
    authenticated: false,
    message: "已退出登录。"
  });
});

app.get("/api/announcements", requireAuth, (request, response) => {
  response.json({
    announcements: listAnnouncements(1).map(toPublicAnnouncement)
  });
});

app.get("/api/conversations", requireAuth, (request, response) => {
  const conversationState = getUserConversationsState(request.currentUser.id);

  response.json({
    conversations: conversationState.conversations,
    activeConversationId: conversationState.activeConversationId
  });
});

app.put("/api/conversations", requireAuth, (request, response, next) => {
  try {
    const savedState = saveUserConversationsState(request.currentUser.id, {
      conversations: request.body?.conversations,
      activeConversationId: request.body?.activeConversationId
    });

    response.json({
      conversations: savedState.conversations,
      activeConversationId: savedState.activeConversationId,
      updatedAt: savedState.updatedAt
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api/admin", requireAdmin);

app.get("/api/admin/announcements", (request, response) => {
  response.json({
    announcements: listAnnouncements().map(toPublicAnnouncement)
  });
});

app.post("/api/admin/announcements", (request, response, next) => {
  try {
    const announcement = createStoredAnnouncement({
      title: request.body?.title,
      content: request.body?.content,
      author: request.currentUser
    });

    response.status(201).json({
      message: "公告发布成功。",
      announcement: toPublicAnnouncement(announcement)
    });
  } catch (error) {
    error.status = error.status || 400;
    next(error);
  }
});

app.delete("/api/admin/announcements/:id", (request, response) => {
  const announcementId = String(request.params.id || "").trim();

  if (!announcementId) {
    return response.status(400).json({
      error: "请求失败",
      detail: "公告 ID 不能为空。"
    });
  }

  const removed = removeStoredAnnouncement(announcementId);

  if (!removed) {
    return response.status(404).json({
      error: "未找到公告",
      detail: "指定公告不存在。"
    });
  }

  response.json({
    message: "公告已删除。"
  });
});

app.get("/api/admin/config", (request, response) => {
  response.json(serializeConfigForClient(true));
});

app.post("/api/admin/config", (request, response, next) => {
  try {
    const savedConfig = updateRuntimeConfig(readConfigFromBody(request.body));

    response.json({
      message: "配置已保存。",
      ...serializeConfigForClient(true),
      apiBaseUrl: savedConfig.apiBaseUrl
    });
  } catch (error) {
    error.status = error.status || 400;
    next(error);
  }
});

app.post("/api/admin/config/test", async (request, response, next) => {
  try {
    const config = readConfigFromBody(request.body, true);
    const payload = await fetchModelsWithConfig(config);

    response.json({
      ok: true,
      apiBaseUrl: config.apiBaseUrl,
      keyConfigured: Boolean(config.apiKey),
      apiKeyPreview: maskApiKey(config.apiKey),
      modelCount: payload.data.length,
      sampleModels: payload.data.slice(0, 8).map((model) => model.id)
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/users", (request, response) => {
  const users = [...usersStore.users]
    .sort((left, right) => {
      if (left.role !== right.role) {
        return left.role === "admin" ? -1 : 1;
      }

      return left.username.localeCompare(right.username, "zh-CN");
    })
    .map(toPublicUser);

  response.json({
    users
  });
});

app.post("/api/admin/users", (request, response, next) => {
  try {
    const user = createStoredUser({
      username: request.body?.username,
      password: request.body?.password,
      role: normalizeRole(request.body?.role)
    });

    response.status(201).json({
      message: "用户创建成功。",
      user: toPublicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/users/:id", (request, response, next) => {
  try {
    const targetUser = getUserById(String(request.params.id || ""));

    if (!targetUser) {
      return response.status(404).json({
        error: "未找到用户",
        detail: "目标用户不存在。"
      });
    }

    const { role, password, disabled } = request.body || {};
    const nextRole = role !== undefined ? normalizeRole(role) : targetUser.role;
    const nextDisabled = disabled !== undefined ? Boolean(disabled) : targetUser.disabled;
    const currentUserId = request.currentUser?.id;

    if (targetUser.id === currentUserId && nextDisabled) {
      return response.status(400).json({
        error: "操作被拒绝",
        detail: "不能禁用当前登录账号。"
      });
    }

    const projectedUsers = usersStore.users.map((item) => {
      if (item.id !== targetUser.id) {
        return item;
      }

      return {
        ...item,
        role: nextRole,
        disabled: nextDisabled
      };
    });

    if (countEnabledAdmins(projectedUsers) < 1) {
      return response.status(400).json({
        error: "操作被拒绝",
        detail: "系统至少需要保留一个可用管理员账号。"
      });
    }

    targetUser.role = nextRole;
    targetUser.disabled = nextDisabled;

    if (password !== undefined && String(password).trim()) {
      const validatedPassword = validatePassword(password);
      const passwordRecord = createPasswordRecord(validatedPassword);
      targetUser.passwordSalt = passwordRecord.salt;
      targetUser.passwordHash = passwordRecord.hash;
      invalidateUserSessions(targetUser.id);
    }

    targetUser.updatedAt = Date.now();
    persistUsersStore();

    response.json({
      message: "用户已更新。",
      user: toPublicUser(targetUser)
    });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/users/:id", (request, response, next) => {
  try {
    const userId = String(request.params.id || "");
    const targetUser = getUserById(userId);

    if (!targetUser) {
      return response.status(404).json({
        error: "未找到用户",
        detail: "目标用户不存在。"
      });
    }

    if (targetUser.id === request.currentUser?.id) {
      return response.status(400).json({
        error: "操作被拒绝",
        detail: "不能删除当前登录账号。"
      });
    }

    const projectedUsers = usersStore.users.filter((item) => item.id !== targetUser.id);

    if (countEnabledAdmins(projectedUsers) < 1) {
      return response.status(400).json({
        error: "操作被拒绝",
        detail: "系统至少需要保留一个可用管理员账号。"
      });
    }

    usersStore.users = projectedUsers;
    persistUsersStore();
    if (conversationsStore.users[targetUser.id]) {
      delete conversationsStore.users[targetUser.id];
      persistConversationsStore();
    }
    invalidateUserSessions(targetUser.id);

    response.json({
      message: "用户已删除。"
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/models", async (request, response, next) => {
  try {
    response.json(await fetchModelsWithConfig(getRuntimeConfig()));
  } catch (error) {
    next(error);
  }
});

app.post("/api/chat", requireAuth, async (request, response, next) => {
  const result = buildChatPayload(request.body, { stream: false });

  if (result.error) {
    return response.status(result.error.status).json(result.error.payload);
  }

  try {
    const config = getRuntimeConfig();
    const payload = await enrichPayloadWithWebSearch(result.payload, request.body);
    const requestBody = JSON.stringify(payload);
    const upstreamResponse = await requestJsonWithRetry(`${config.apiBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: createApiHeaders(config.apiKey, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody)
      }),
      body: requestBody,
      timeout: chatRequestTimeoutMs
    });

    if (!upstreamResponse.ok) {
      throw createUpstreamError(upstreamResponse);
    }

    response.json(upstreamResponse.data);
  } catch (error) {
    next(error);
  }
});

app.post("/api/chat/stream", requireAuth, async (request, response, next) => {
  const result = buildChatPayload(request.body, { stream: true });

  if (result.error) {
    return response.status(result.error.status).json(result.error.payload);
  }

  const config = getRuntimeConfig();
  const payload = await enrichPayloadWithWebSearch(result.payload, request.body);
  const requestBody = JSON.stringify(payload);
  const target = new URL(`${config.apiBaseUrl}/v1/chat/completions`);
  const client = getHttpClient(target);
  let streamStarted = false;
  let clientClosed = false;
  let activeUpstreamRequest = null;
  const maxAttempts = 3;

  function failStream(status, detail) {
    if (!response.headersSent) {
      response.status(status).json({
        error: "请求失败",
        detail
      });
      return;
    }

    sendSseEvent(response, "error", { detail });
    response.end();
  }

  function startStreamAttempt(attempt) {
    if (clientClosed || response.writableEnded) {
      return;
    }

    const upstreamRequest = client.request(
      target,
      {
        method: "POST",
        headers: createApiHeaders(config.apiKey, {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestBody)
        }),
        timeout: chatRequestTimeoutMs
      },
      (upstreamResponse) => {
        const status = Number(upstreamResponse.statusCode) || 500;

        if (status < 200 || status >= 300) {
          let raw = "";

          upstreamResponse.setEncoding("utf8");
          upstreamResponse.on("data", (chunk) => {
            raw += chunk;
          });

          upstreamResponse.on("end", async () => {
            const detail = extractErrorDetail(raw, status);

            if (!streamStarted && !clientClosed && attempt < maxAttempts && isRetryableStatus(status)) {
              await wait(350 * attempt);
              startStreamAttempt(attempt + 1);
              return;
            }

            failStream(status, detail);
          });

          return;
        }

        streamStarted = true;
        response.status(200);
        response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        response.setHeader("Cache-Control", "no-cache, no-transform");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("X-Accel-Buffering", "no");

        if (typeof response.flushHeaders === "function") {
          response.flushHeaders();
        }

        upstreamResponse.on("data", (chunk) => {
          if (!response.writableEnded) {
            response.write(chunk);
          }
        });

        upstreamResponse.on("end", () => {
          if (!response.writableEnded) {
            response.end();
          }
        });

        upstreamResponse.on("error", (error) => {
          if (clientClosed) {
            return;
          }

          if (!response.writableEnded) {
            sendSseEvent(response, "error", {
              detail: error.message || "流式响应中断。"
            });
            response.end();
          }
        });
      }
    );

    activeUpstreamRequest = upstreamRequest;

    upstreamRequest.on("timeout", () => {
      const timeoutError = new Error("上游请求超时。");
      timeoutError.code = "ETIMEDOUT";
      upstreamRequest.destroy(timeoutError);
    });

    upstreamRequest.on("error", async (error) => {
      if (clientClosed) {
        return;
      }

      if (!streamStarted && attempt < maxAttempts && !response.headersSent && isRetryableNetworkError(error)) {
        await wait(350 * attempt);
        startStreamAttempt(attempt + 1);
        return;
      }

      if (!streamStarted && !response.headersSent) {
        next(error);
        return;
      }

      if (!response.writableEnded) {
        sendSseEvent(response, "error", {
          detail: error.message || "流式请求失败。"
        });
        response.end();
      }
    });

    upstreamRequest.write(requestBody);
    upstreamRequest.end();
  }

  response.on("close", () => {
    clientClosed = true;

    if (activeUpstreamRequest && !activeUpstreamRequest.destroyed) {
      activeUpstreamRequest.destroy();
    }
  });

  startStreamAttempt(1);
});

app.get("/healthz", (request, response) => {
  response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

app.use("/api/*", (request, response) => {
  response.status(404).json({ error: "未找到对应接口。" });
});

app.get("*", (request, response) => {
  response.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((error, request, response, next) => {
  const status = Number(error.status) || 500;
  const detail = error.detail || error.message || "服务器内部异常。";

  console.error(error);
  response.status(status).json({
    error: "请求失败",
    detail
  });
});

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
