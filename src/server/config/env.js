"use strict";

const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

function trimTrailingSlashes(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

const rootDir = path.resolve(__dirname, "..", "..", "..");
const publicDir = path.join(rootDir, "public");
const searxngSearchPath = (() => {
  const raw = String(process.env.SEARXNG_SEARCH_PATH || "/search").trim();

  if (!raw) {
    return "/search";
  }

  return raw.startsWith("/") ? raw : `/${raw}`;
})();

const env = {
  rootDir,
  publicDir,
  expressJsonLimit: String(process.env.EXPRESS_JSON_LIMIT || "15mb").trim() || "15mb",
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || "0.0.0.0",
  defaultRequestTimeoutMs: 60000,
  chatRequestTimeoutMs: 120000,
  webSearchTimeoutMs: Math.min(
    45000,
    Math.max(3000, Number(process.env.SEARXNG_TIMEOUT_MS) || 12000)
  ),
  webSearchResultCount: Math.min(
    8,
    Math.max(1, Number(process.env.SEARXNG_RESULT_COUNT) || 5)
  ),
  webSearchSnippetMaxLength: Math.min(
    1200,
    Math.max(120, Number(process.env.SEARXNG_SNIPPET_MAX_LENGTH) || 320)
  ),
  webSearchContextMaxLength: Math.min(
    16000,
    Math.max(1500, Number(process.env.SEARXNG_CONTEXT_MAX_LENGTH) || 7200)
  ),
  webSearchMaxQueries: Math.min(
    4,
    Math.max(1, Number(process.env.WEB_SEARCH_MAX_QUERIES) || 3)
  ),
  webSearchFetchPageCount: Math.min(
    6,
    Math.max(0, Number(process.env.WEB_SEARCH_FETCH_PAGE_COUNT) || 3)
  ),
  webSearchPageTimeoutMs: Math.min(
    30000,
    Math.max(2000, Number(process.env.WEB_SEARCH_PAGE_TIMEOUT_MS) || 8000)
  ),
  webSearchMinScore: Math.max(
    0,
    Math.min(3, Number(process.env.WEB_SEARCH_MIN_SCORE) || 0.12)
  ),
  webSearchFailureNoticeEnabled:
    String(process.env.WEB_SEARCH_FAILURE_NOTICE_ENABLED || "true").trim().toLowerCase() !== "false",
  webSearchServerEnabled:
    String(process.env.WEB_SEARCH_SERVER_ENABLED || "true").trim().toLowerCase() !== "false",
  webSearchDefaultEnabled:
    String(process.env.WEB_SEARCH_DEFAULT_ENABLED || "false").trim().toLowerCase() === "true",
  searxngBaseUrl: trimTrailingSlashes(process.env.SEARXNG_BASE_URL || "http://127.0.0.1:8080"),
  searxngSearchPath,
  searxngLanguage: String(process.env.SEARXNG_LANGUAGE || "").trim(),
  searxngSafeSearch: String(process.env.SEARXNG_SAFESEARCH || "").trim(),
  searxngUserAgent: String(
    process.env.SEARXNG_USER_AGENT ||
      "Mozilla/5.0 (compatible; wssxzh-ai-chat-web/1.0; +https://github.com/wssxzh/aichat)"
  ).trim(),
  searxngFallbackBaseUrl: trimTrailingSlashes(String(process.env.SEARXNG_FALLBACK_BASE_URL || "").trim()),
  githubApiBaseUrl: trimTrailingSlashes(String(process.env.GITHUB_API_BASE_URL || "https://api.github.com").trim()),
  webSearchDirectUrlEnabled:
    String(process.env.WEB_SEARCH_DIRECT_URL_ENABLED || "true").trim().toLowerCase() !== "false",
  runtimeConfigPath: process.env.RUNTIME_CONFIG_PATH
    ? path.resolve(process.env.RUNTIME_CONFIG_PATH)
    : path.join(rootDir, ".runtime-config.json"),
  usersConfigPath: process.env.USERS_CONFIG_PATH
    ? path.resolve(process.env.USERS_CONFIG_PATH)
    : path.join(rootDir, ".runtime-users.json"),
  announcementsConfigPath: process.env.ANNOUNCEMENTS_CONFIG_PATH
    ? path.resolve(process.env.ANNOUNCEMENTS_CONFIG_PATH)
    : path.join(rootDir, ".runtime-announcements.json"),
  conversationsConfigPath: process.env.CONVERSATIONS_CONFIG_PATH
    ? path.resolve(process.env.CONVERSATIONS_CONFIG_PATH)
    : path.join(rootDir, ".runtime-conversations.json"),
  workspacesRootDir: process.env.WORKSPACES_ROOT_DIR
    ? path.resolve(process.env.WORKSPACES_ROOT_DIR)
    : path.join(rootDir, "data", "workspaces"),
  maxStoredAnnouncements: Math.max(
    1,
    Number(process.env.MAX_STORED_ANNOUNCEMENTS || process.env.ANNOUNCEMENTS_MAX_ITEMS) || 80
  ),
  maxStoredConversationsPerUser: Math.min(
    300,
    Math.max(1, Number(process.env.MAX_STORED_CONVERSATIONS_PER_USER) || 120)
  ),
  maxMessagesPerConversation: Math.min(
    1200,
    Math.max(1, Number(process.env.MAX_MESSAGES_PER_CONVERSATION) || 320)
  ),
  maxConversationMessageLength: Math.min(
    64000,
    Math.max(200, Number(process.env.MAX_CONVERSATION_MESSAGE_LENGTH) || 12000)
  ),
  maxConversationSystemPromptLength: Math.min(
    32000,
    Math.max(50, Number(process.env.MAX_CONVERSATION_SYSTEM_PROMPT_LENGTH) || 6000)
  ),
  maxWorkspaceFilesPerConversation: Math.min(
    50,
    Math.max(1, Number(process.env.MAX_WORKSPACE_FILES_PER_CONVERSATION) || 20)
  ),
  maxWorkspaceFilesPerRequest: Math.min(
    10,
    Math.max(1, Number(process.env.MAX_WORKSPACE_FILES_PER_REQUEST) || 5)
  ),
  maxWorkspaceFileSizeBytes: Math.min(
    30 * 1024 * 1024,
    Math.max(512 * 1024, Number(process.env.MAX_WORKSPACE_FILE_SIZE_BYTES) || 10 * 1024 * 1024)
  ),
  workspaceChunkSize: Math.min(
    4000,
    Math.max(300, Number(process.env.WORKSPACE_CHUNK_SIZE) || 1100)
  ),
  workspaceChunkOverlap: Math.min(
    800,
    Math.max(0, Number(process.env.WORKSPACE_CHUNK_OVERLAP) || 180)
  ),
  workspaceMaxChunksPerFile: Math.min(
    200,
    Math.max(1, Number(process.env.WORKSPACE_MAX_CHUNKS_PER_FILE) || 80)
  ),
  workspaceSearchResultCount: Math.min(
    10,
    Math.max(1, Number(process.env.WORKSPACE_SEARCH_RESULT_COUNT) || 6)
  ),
  workspaceContextMaxLength: Math.min(
    24000,
    Math.max(1000, Number(process.env.WORKSPACE_CONTEXT_MAX_LENGTH) || 8000)
  ),
  maxConversationTitleLength: 120,
  sessionCookieName: "aichat_session",
  sessionTtlMs: Math.max(
    5 * 60 * 1000,
    Number(process.env.SESSION_TTL_MS || process.env.ADMIN_SESSION_TTL_MS) || 8 * 60 * 60 * 1000
  ),
  sessionCookieSecure:
    String(process.env.SESSION_COOKIE_SECURE || process.env.ADMIN_COOKIE_SECURE || "").toLowerCase() === "true",
  defaultAdminUsername: String(process.env.ADMIN_USERNAME || "admin").trim(),
  defaultAdminPassword: String(process.env.ADMIN_PASSWORD || "demo-admin-password-change-me").trim()
};

module.exports = { env };
