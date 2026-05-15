"use strict";

const { env } = require("./config/env");
const { createApp } = require("./app");
const { createAuthService } = require("./services/auth-service");
const { createAnnouncementsStore } = require("./stores/announcements-store");
const { createConversationsStore } = require("./stores/conversations-store");
const { createWorkspacesStore } = require("./stores/workspaces-store");
const { createRuntimeConfigStore } = require("./stores/runtime-config-store");
const { createHttpService } = require("./services/http-service");
const { createWebSearchService } = require("./services/web-search-service");
const { createChatService } = require("./services/chat-service");
const { createWorkspaceSearchService } = require("./services/workspace-search-service");

function createDependencies() {
  const authService = createAuthService({
    usersConfigPath: env.usersConfigPath,
    sessionsConfigPath: env.sessionsConfigPath,
    defaultAdminUsername: env.defaultAdminUsername,
    defaultAdminPassword: env.defaultAdminPassword,
    sessionCookieName: env.sessionCookieName,
    sessionCookieSecure: env.sessionCookieSecure,
    sessionTtlMs: env.sessionTtlMs
  });
  const announcementsStore = createAnnouncementsStore({
    announcementsConfigPath: env.announcementsConfigPath,
    maxStoredAnnouncements: env.maxStoredAnnouncements,
    normalizeUsername: authService.normalizeUsername
  });
  const workspacesStore = createWorkspacesStore({
    workspacesRootDir: env.workspacesRootDir,
    maxWorkspaceFilesPerConversation: env.maxWorkspaceFilesPerConversation
  });
  const conversationsStore = createConversationsStore({
    conversationsConfigPath: env.conversationsConfigPath,
    maxStoredConversationsPerUser: env.maxStoredConversationsPerUser,
    maxMessagesPerConversation: env.maxMessagesPerConversation,
    maxConversationMessageLength: env.maxConversationMessageLength,
    maxConversationSystemPromptLength: env.maxConversationSystemPromptLength,
    maxConversationTitleLength: env.maxConversationTitleLength,
    onUserConversationsStateSaved: ({ userId, nextState }) => {
      return workspacesStore.pruneUserWorkspaces(
        userId,
        Array.isArray(nextState?.conversations)
          ? nextState.conversations.map((conversation) => conversation.id)
          : []
      );
    }
  });
  const runtimeConfigStore = createRuntimeConfigStore({
    runtimeConfigPath: env.runtimeConfigPath,
    webSearchServerEnabled: env.webSearchServerEnabled,
    webSearchDefaultEnabled: env.webSearchDefaultEnabled,
    webSearchDirectUrlEnabled: env.webSearchDirectUrlEnabled
  });
  const httpService = createHttpService({
    defaultRequestTimeoutMs: env.defaultRequestTimeoutMs
  });
  const webSearchService = createWebSearchService({
    requestJsonWithRetry: httpService.requestJsonWithRetry,
    createUpstreamError: httpService.createUpstreamError,
    webSearchTimeoutMs: env.webSearchTimeoutMs,
    webSearchResultCount: env.webSearchResultCount,
    webSearchSnippetMaxLength: env.webSearchSnippetMaxLength,
    webSearchContextMaxLength: env.webSearchContextMaxLength,
    webSearchMaxQueries: env.webSearchMaxQueries,
    webSearchFetchPageCount: env.webSearchFetchPageCount,
    webSearchPageTimeoutMs: env.webSearchPageTimeoutMs,
    webSearchMinScore: env.webSearchMinScore,
    webSearchFailureNoticeEnabled: env.webSearchFailureNoticeEnabled,
    webSearchServerEnabled: env.webSearchServerEnabled,
    webSearchDefaultEnabled: env.webSearchDefaultEnabled,
    searxngBaseUrl: env.searxngBaseUrl,
    searxngSearchPath: env.searxngSearchPath,
    searxngLanguage: env.searxngLanguage,
    searxngSafeSearch: env.searxngSafeSearch,
    searxngUserAgent: env.searxngUserAgent,
    searxngFallbackBaseUrl: env.searxngFallbackBaseUrl,
    githubApiBaseUrl: env.githubApiBaseUrl,
    webSearchDirectUrlEnabled: env.webSearchDirectUrlEnabled
  });
  const chatService = createChatService({
    requestJsonWithRetry: httpService.requestJsonWithRetry,
    createApiHeaders: httpService.createApiHeaders,
    createUpstreamError: httpService.createUpstreamError
  });
  const workspaceSearchService = createWorkspaceSearchService({
    workspacesStore,
    maxWorkspaceFilesPerConversation: env.maxWorkspaceFilesPerConversation,
    maxWorkspaceFileSizeBytes: env.maxWorkspaceFileSizeBytes,
    workspaceChunkSize: env.workspaceChunkSize,
    workspaceChunkOverlap: env.workspaceChunkOverlap,
    workspaceMaxChunksPerFile: env.workspaceMaxChunksPerFile,
    workspaceSearchResultCount: env.workspaceSearchResultCount,
    workspaceContextMaxLength: env.workspaceContextMaxLength
  });

  return {
    env,
    authService,
    announcementsStore,
    conversationsStore,
    workspacesStore,
    runtimeConfigStore,
    httpService,
    webSearchService,
    chatService,
    workspaceSearchService
  };
}

function startServer() {
  if (env.defaultAdminPassword === "demo-admin-password-change-me") {
    console.warn(
      "WARNING: Using default ADMIN_PASSWORD. Please set a strong ADMIN_PASSWORD before production deployment."
    );
  }

  const dependencies = createDependencies();
  const app = createApp(dependencies);

  return app.listen(env.port, env.host, () => {
    console.log(`Server listening on http://${env.host}:${env.port}`);
  });
}

module.exports = { createDependencies, startServer };
