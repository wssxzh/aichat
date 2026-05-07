"use strict";

const fs = require("fs");
const crypto = require("crypto");

function createAuthService(options) {
  const {
    usersConfigPath,
    defaultAdminUsername,
    defaultAdminPassword,
    sessionCookieName,
    sessionCookieSecure,
    sessionTtlMs
  } = options;
  const sessionStore = new Map();

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


  return {
    sessionStore,
    usersStore,
    persistUsersStore,
    validateUsername,
    validatePassword,
    normalizeRole,
    createStoredUser,
    countEnabledAdmins,
    createPasswordRecord,
    verifyPassword,
    getUserById,
    getUserByUsername,
    invalidateUserSessions,
    createUserSession,
    getAuthenticatedUser,
    requireAuth,
    requireAdmin,
    clearSessionCookie,
    toPublicUser,
    normalizeUsername
  };
}

module.exports = { createAuthService };
