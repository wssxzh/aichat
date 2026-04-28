const storageKeys = {
  legacyConversations: "wssxzh.conversations",
  legacyActiveConversationId: "wssxzh.activeConversationId",
  conversationsByAccount: "wssxzh.conversationsByAccount",
  activeConversationIdByAccount: "wssxzh.activeConversationIdByAccount",
  dismissedAnnouncementIdByAccount: "wssxzh.dismissedAnnouncementIdByAccount",
  sidebarTab: "wssxzh.sidebarTab",
  sidebarCollapsed: "wssxzh.sidebarCollapsed",
  webSearchEnabled: "wssxzh.webSearchEnabled",
  legacySelectedModelId: "wssxzh.selectedModelId",
  legacySystemPrompt: "wssxzh.systemPrompt",
  legacyTemperature: "wssxzh.temperature"
};
const defaultConversationAccountKey = "guest";

const starterPrompts = [
  "帮我解释一下什么是人工智能，并举 3 个日常生活例子",
  "给我写一段简洁的产品介绍文案，语气年轻一点",
  "帮我检查一段 JavaScript 代码可能存在的 bug"
];

const defaultTemperature = 0.7;
const typingIntervalMs = 18;
const recentListInitialBatch = 24;
const recentListBatchSize = 20;
const recentListLoadOffsetPx = 88;
const graphemeSegmenter =
  typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("zh-CN", { granularity: "grapheme" })
    : null;

const elements = {
  appShell: document.getElementById("appShell"),
  sidebar: document.querySelector(".sidebar"),
  sidebarBackdrop: document.getElementById("sidebarBackdrop"),
  sidebarCollapseButton: document.getElementById("sidebarCollapseButton"),
  sidebarMobileButton: document.getElementById("sidebarMobileButton"),
  conversationNavButton: document.getElementById("conversationNavButton"),
  modelNavButton: document.getElementById("modelNavButton"),
  userNavButton: document.getElementById("userNavButton"),
  announcementNavButton: document.getElementById("announcementNavButton"),
  newChatButton: document.getElementById("newChatButton"),
  recentList: document.getElementById("recentList"),
  chatWorkspace: document.getElementById("chatWorkspace"),
  modelWorkspace: document.getElementById("modelWorkspace"),
  userWorkspace: document.getElementById("userWorkspace"),
  announcementWorkspace: document.getElementById("announcementWorkspace"),
  userWorkspacePanel: document.getElementById("userWorkspacePanel"),
  userAdminSection: document.getElementById("userAdminSection"),
  modelSelect: document.getElementById("modelSelect"),
  selectedModelMeta: document.getElementById("selectedModelMeta"),
  clearChatButton: document.getElementById("clearChatButton"),
  errorBanner: document.getElementById("errorBanner"),
  announcementNotice: document.getElementById("announcementNotice"),
  announcementNoticeTitle: document.getElementById("announcementNoticeTitle"),
  announcementNoticeMeta: document.getElementById("announcementNoticeMeta"),
  announcementNoticeText: document.getElementById("announcementNoticeText"),
  announcementNoticeCloseButton: document.getElementById("announcementNoticeCloseButton"),
  chatMessages: document.getElementById("chatMessages"),
  settingsPanel: document.getElementById("settingsPanel"),
  toggleSettingsButton: document.getElementById("toggleSettingsButton"),
  webSearchToggleButton: document.getElementById("webSearchToggleButton"),
  systemPromptInput: document.getElementById("systemPromptInput"),
  temperatureRange: document.getElementById("temperatureRange"),
  temperatureValue: document.getElementById("temperatureValue"),
  chatForm: document.getElementById("chatForm"),
  userInput: document.getElementById("userInput"),
  sendButton: document.getElementById("sendButton"),
  composerHint: document.getElementById("composerHint"),
  connectionStatus: document.getElementById("connectionStatus"),
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  keyStatus: document.getElementById("keyStatus"),
  modelStats: document.getElementById("modelStats"),
  configApiBaseUrlInput: document.getElementById("configApiBaseUrlInput"),
  configApiKeyInput: document.getElementById("configApiKeyInput"),
  saveConfigButton: document.getElementById("saveConfigButton"),
  testConfigButton: document.getElementById("testConfigButton"),
  configStatusBanner: document.getElementById("configStatusBanner"),
  configTestResult: document.getElementById("configTestResult"),
  adminAuthButton: document.getElementById("adminAuthButton"),
  adminAuthIdentityText: document.getElementById("adminAuthIdentityText"),
  adminAuthRoleBadge: document.getElementById("adminAuthRoleBadge"),
  adminAuthStatusText: document.getElementById("adminAuthStatusText"),
  refreshModelsButton: document.getElementById("refreshModelsButton"),
  modelSearchInput: document.getElementById("modelSearchInput"),
  modelList: document.getElementById("modelList"),
  adminAuthDialog: document.getElementById("adminAuthDialog"),
  adminAuthDialogTitle: document.getElementById("adminAuthDialogTitle"),
  adminAuthDialogDescription: document.getElementById("adminAuthDialogDescription"),
  adminAuthUsernameInput: document.getElementById("adminAuthUsernameInput"),
  adminAuthPasswordInput: document.getElementById("adminAuthPasswordInput"),
  adminAuthModeToggleButton: document.getElementById("adminAuthModeToggleButton"),
  adminAuthError: document.getElementById("adminAuthError"),
  adminAuthSubmitButton: document.getElementById("adminAuthSubmitButton"),
  adminAuthCancelButton: document.getElementById("adminAuthCancelButton"),
  createUserUsernameInput: document.getElementById("createUserUsernameInput"),
  createUserPasswordInput: document.getElementById("createUserPasswordInput"),
  createUserRoleSelect: document.getElementById("createUserRoleSelect"),
  createUserButton: document.getElementById("createUserButton"),
  userAdminBanner: document.getElementById("userAdminBanner"),
  userList: document.getElementById("userList"),
  announcementBanner: document.getElementById("announcementBanner"),
  announcementTitleInput: document.getElementById("announcementTitleInput"),
  announcementContentInput: document.getElementById("announcementContentInput"),
  publishAnnouncementButton: document.getElementById("publishAnnouncementButton"),
  announcementList: document.getElementById("announcementList"),
  confirmDialog: document.getElementById("confirmDialog"),
  confirmDialogTitle: document.getElementById("confirmDialogTitle"),
  confirmDialogMessage: document.getElementById("confirmDialogMessage"),
  confirmDialogCancelButton: document.getElementById("confirmDialogCancelButton"),
  confirmDialogConfirmButton: document.getElementById("confirmDialogConfirmButton")
};

const iconMarkup = {
  copy:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9.5A1.5 1.5 0 0 1 10.5 8h8A1.5 1.5 0 0 1 20 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 9 18.5v-9ZM6 16H5.5A1.5 1.5 0 0 1 4 14.5v-9A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5V6" /></svg>',
  check:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 9.2 17 19 7.5" /></svg>',
  like:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v10M7 10H4.5A1.5 1.5 0 0 0 3 11.5v6A1.5 1.5 0 0 0 4.5 19H7m0-9 3.4-6.8A1.5 1.5 0 0 1 13.2 3l.8.53a2.5 2.5 0 0 1 1.1 2.58L14.5 10H18a2 2 0 0 1 2 2.4l-1 5A2 2 0 0 1 17 19H7" /></svg>',
  dislike:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 14V4m0 10h2.5A1.5 1.5 0 0 1 21 12.5v-6A1.5 1.5 0 0 1 19.5 5H17m0 9-3.4 6.8a1.5 1.5 0 0 1-2.8.2l-.8-.53a2.5 2.5 0 0 1-1.1-2.58L9.5 14H6a2 2 0 0 1-2-2.4l1-5A2 2 0 0 1 7 5h10" /></svg>',
  more:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h.01M12 12h.01M18 12h.01" /></svg>',
  sound:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 14h3l4 4V6L8 10H5v4Zm10.5-4.5a4 4 0 0 1 0 5m2.5-7.5a7 7 0 0 1 0 10" /></svg>',
  recent:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7.5A3.5 3.5 0 0 1 10.5 4h5A3.5 3.5 0 0 1 19 7.5v3a3.5 3.5 0 0 1-3.5 3.5H13l-3.55 2.9A.9.9 0 0 1 8 16.2V14.5A3.5 3.5 0 0 1 7 10.5v-3Z" /></svg>'
};

const state = {
  apiBaseUrl: "",
  keyConfigured: false,
  models: [],
  filteredModels: [],
  conversationAccountKey: defaultConversationAccountKey,
  conversations: [],
  activeConversationId: "",
  activeSidebarTab:
    getSidebarTabFromHash() ||
    (["models", "users", "announcements"].includes(readStorageItem(storageKeys.sidebarTab))
      ? readStorageItem(storageKeys.sidebarTab)
      : "conversations"),
  loading: false,
  webSearchEnabled: readStorageItem(storageKeys.webSearchEnabled) === "1",
  abortController: null,
  typingController: null,
  sidebarUi: {
    collapsed: readStorageItem(storageKeys.sidebarCollapsed) === "1",
    mobileOpen: false
  },
  openRecentMenuConversationId: "",
  pendingConfirmResolver: null,
  recentList: {
    loadedCount: 0,
    signature: ""
  },
  conversationSync: {
    bootstrapping: false,
    loadingRemote: false,
    savingRemote: false,
    pendingSaveTimer: null,
    pendingSavePromise: null,
    pendingSaveResolve: null,
    pendingSaveReject: null,
    saveVersion: 0,
    lastSavedVersion: 0,
    currentAccountKey: defaultConversationAccountKey
  },
  configForm: {
    apiBaseUrl: "",
    apiKey: "",
    saving: false,
    testing: false,
    testResult: null
  },
  announcements: {
    latest: null,
    list: [],
    loading: false,
    publishing: false,
    dismissedLatestId: ""
  },
  adminAuth: {
    authenticated: false,
    checking: false,
    loggingIn: false,
    nextTabAfterLogin: "",
    mode: "login",
    user: null,
    users: [],
    usersLoading: false,
    creatingUser: false,
    announcementsLoading: false
  }
};

function getSidebarTabFromHash() {
  const normalized = window.location.hash.replace(/^#/, "").trim().toLowerCase();

  if (normalized === "models") {
    return "models";
  }

  if (normalized === "users" || normalized === "user") {
    return "users";
  }

  if (normalized === "announcements" || normalized === "announcement" || normalized === "notice") {
    return "announcements";
  }

  if (normalized === "chat" || normalized === "conversations") {
    return "conversations";
  }

  return "";
}

function isMobileSidebarViewport() {
  return window.matchMedia("(max-width: 1160px)").matches;
}

function syncSidebarToggleButtons() {
  const isMobile = isMobileSidebarViewport();
  const collapsed = Boolean(state.sidebarUi.collapsed);
  const mobileOpen = Boolean(state.sidebarUi.mobileOpen);
  const expanded = isMobile ? mobileOpen : !collapsed;

  if (elements.sidebarCollapseButton) {
    elements.sidebarCollapseButton.setAttribute("aria-expanded", String(expanded));
    elements.sidebarCollapseButton.setAttribute(
      "aria-label",
      expanded ? "收起侧栏" : "展开侧栏"
    );
    elements.sidebarCollapseButton.classList.toggle("is-collapsed", !isMobile && collapsed);
  }

  if (elements.sidebarMobileButton) {
    elements.sidebarMobileButton.hidden = !(isMobile && !mobileOpen);
    elements.sidebarMobileButton.setAttribute("aria-expanded", String(mobileOpen));
    elements.sidebarMobileButton.setAttribute(
      "aria-label",
      mobileOpen ? "收起侧栏" : "展开侧栏"
    );
  }
}

function applySidebarLayoutState() {
  if (!elements.appShell) {
    return;
  }

  const isMobile = isMobileSidebarViewport();

  if (!isMobile && state.sidebarUi.mobileOpen) {
    state.sidebarUi.mobileOpen = false;
  }

  elements.appShell.classList.toggle("sidebar-collapsed", !isMobile && state.sidebarUi.collapsed);
  elements.appShell.classList.toggle("sidebar-mobile-open", isMobile && state.sidebarUi.mobileOpen);

  if (elements.sidebarBackdrop) {
    elements.sidebarBackdrop.hidden = !(isMobile && state.sidebarUi.mobileOpen);
  }

  document.body.classList.toggle("sidebar-mobile-locked", isMobile && state.sidebarUi.mobileOpen);
  syncSidebarToggleButtons();
}

function renderWebSearchToggle() {
  if (!elements.webSearchToggleButton) {
    return;
  }

  const enabled = Boolean(state.webSearchEnabled);
  elements.webSearchToggleButton.classList.toggle("active", enabled);
  elements.webSearchToggleButton.setAttribute("aria-pressed", String(enabled));
  elements.webSearchToggleButton.title = enabled ? "Web Search: On" : "Web Search: Off";
}

function setWebSearchEnabled(enabled, options = {}) {
  const { persist = true } = options;
  state.webSearchEnabled = Boolean(enabled);

  if (persist) {
    writeStorageItem(storageKeys.webSearchEnabled, state.webSearchEnabled ? "1" : "0");
  }

  renderWebSearchToggle();
}

function setSidebarCollapsed(collapsed, options = {}) {
  const { persist = true } = options;

  state.sidebarUi.collapsed = Boolean(collapsed);

  if (persist) {
    writeStorageItem(
      storageKeys.sidebarCollapsed,
      state.sidebarUi.collapsed ? "1" : "0"
    );
  }

  applySidebarLayoutState();
}

function setMobileSidebarOpen(open) {
  state.sidebarUi.mobileOpen = Boolean(open);
  applySidebarLayoutState();
}

function closeMobileSidebarIfNeeded() {
  if (isMobileSidebarViewport() && state.sidebarUi.mobileOpen) {
    setMobileSidebarOpen(false);
  }
}

function mountUserAdminSection() {
  if (!elements.userAdminSection || !elements.userWorkspacePanel) {
    return;
  }

  if (elements.userAdminSection.parentElement !== elements.userWorkspacePanel) {
    elements.userWorkspacePanel.appendChild(elements.userAdminSection);
    elements.userAdminSection.classList.add("standalone");
  }
}

function handleSidebarToggleClick() {
  if (isMobileSidebarViewport()) {
    setMobileSidebarOpen(!state.sidebarUi.mobileOpen);
    return;
  }

  setSidebarCollapsed(!state.sidebarUi.collapsed);
}

function handleSidebarMobileButtonClick() {
  setMobileSidebarOpen(true);
}

function clampTemperature(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return defaultTemperature;
  }

  return Math.max(0, Math.min(2, numeric));
}

function createId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function splitIntoGraphemes(text) {
  if (!text) {
    return [];
  }

  if (graphemeSegmenter) {
    return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment);
  }

  return Array.from(text);
}

function compactText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(text, maxLength = 28) {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function getMessageTextContent(message) {
  return typeof message?.content === "string" ? message.content : "";
}

function deriveConversationTitle(messages) {
  const firstUserMessage = Array.isArray(messages)
    ? messages.find((message) => message.role === "user" && compactText(message.content))
    : null;

  if (!firstUserMessage) {
    return "新对话";
  }

  return truncateText(compactText(firstUserMessage.content), 24) || "新对话";
}

function normalizeMessageFeedback(feedback) {
  return feedback === "like" || feedback === "dislike" ? feedback : "";
}

function sanitizeStoredMessage(message) {
  return {
    id: typeof message?.id === "string" ? message.id : createId(message?.role || "message"),
    role: message?.role === "assistant" ? "assistant" : "user",
    content: typeof message?.content === "string" ? message.content : "",
    model: typeof message?.model === "string" ? message.model : "",
    timestamp: Number(message?.timestamp) || Date.now(),
    feedback: normalizeMessageFeedback(message?.feedback),
    streaming: false
  };
}

function sanitizeStoredConversation(conversation) {
  const messages = Array.isArray(conversation?.messages)
    ? conversation.messages.map(sanitizeStoredMessage)
    : [];
  const createdAt = Number(conversation?.createdAt) || Date.now();

  return {
    id: typeof conversation?.id === "string" ? conversation.id : createId("conversation"),
    title:
      typeof conversation?.title === "string" && compactText(conversation.title)
        ? compactText(conversation.title)
        : deriveConversationTitle(messages),
    createdAt,
    updatedAt: Number(conversation?.updatedAt) || createdAt,
    modelId: typeof conversation?.modelId === "string" ? conversation.modelId : "",
    systemPrompt: typeof conversation?.systemPrompt === "string" ? conversation.systemPrompt : "",
    temperature: clampTemperature(conversation?.temperature),
    pinned: Boolean(conversation?.pinned),
    messages
  };
}

function getLegacyConversationDefaults() {
  return {
    modelId: readStorageItem(storageKeys.legacySelectedModelId) || "",
    systemPrompt: readStorageItem(storageKeys.legacySystemPrompt) || "",
    temperature: clampTemperature(readStorageItem(storageKeys.legacyTemperature))
  };
}

function safeParseStoredValue(rawValue, fallbackValue) {
  if (!rawValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    return fallbackValue;
  }
}

function readStorageItem(storageKey) {
  try {
    return localStorage.getItem(storageKey);
  } catch (error) {
    return null;
  }
}

function writeStorageItem(storageKey, value) {
  try {
    localStorage.setItem(storageKey, value);
    return true;
  } catch (error) {
    return false;
  }
}

function loadScopedStorageMap(storageKey) {
  const parsed = safeParseStoredValue(readStorageItem(storageKey), {});

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  return parsed;
}

function clearScopedStorageEntry(storageKey, scopedKey) {
  const scopedMap = loadScopedStorageMap(storageKey);
  delete scopedMap[scopedKey];
  writeStorageItem(storageKey, JSON.stringify(scopedMap));
}

function clearLocalConversationCacheForAccount(accountKey = state.conversationAccountKey) {
  clearScopedStorageEntry(storageKeys.conversationsByAccount, accountKey);
  clearScopedStorageEntry(storageKeys.activeConversationIdByAccount, accountKey);
}

function isAuthenticatedConversationAccount(accountKey = state.conversationAccountKey) {
  return typeof accountKey === "string" && accountKey.startsWith("user:");
}

function buildConversationStatePayload() {
  return {
    conversations: state.conversations.map((conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) => ({
        ...message,
        streaming: false
      }))
    })),
    activeConversationId: state.activeConversationId || ""
  };
}

function applyConversationStateFromPayload(payload = {}) {
  const nextConversations = Array.isArray(payload?.conversations)
    ? payload.conversations.map(sanitizeStoredConversation)
    : [];
  const nextActiveConversationId =
    typeof payload?.activeConversationId === "string" ? payload.activeConversationId : "";

  state.conversations = nextConversations;
  state.activeConversationId = nextActiveConversationId;
  ensureConversationState();
  synchronizeConversationModels();
}

async function loadRemoteConversationState(accountKey = state.conversationAccountKey) {
  if (!isAuthenticatedConversationAccount(accountKey)) {
    return false;
  }

  state.conversationSync.loadingRemote = true;

  try {
    const response = await fetch("/api/conversations");
    const payload = await response.json();

    if (response.status === 401) {
      throw new Error("登录状态已失效，请重新登录。");
    }

    if (!response.ok) {
      throw new Error(parseErrorPayload(payload, "加载云端会话失败。"));
    }

    if (state.conversationAccountKey !== accountKey) {
      return false;
    }

    applyConversationStateFromPayload(payload);
    state.conversationSync.lastSavedVersion = state.conversationSync.saveVersion;
    return true;
  } catch (error) {
    console.warn("Failed to load cloud conversations.", error);
    return false;
  } finally {
    state.conversationSync.loadingRemote = false;
  }
}

async function saveRemoteConversationStateNow() {
  if (!isAuthenticatedConversationAccount()) {
    return true;
  }

  if (state.conversationSync.savingRemote) {
    return state.conversationSync.pendingSavePromise || true;
  }

  if (state.conversationSync.lastSavedVersion === state.conversationSync.saveVersion) {
    return true;
  }

  state.conversationSync.savingRemote = true;
  const payload = buildConversationStatePayload();

  const requestPromise = (async () => {
    try {
      const response = await fetch("/api/conversations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (response.status === 401) {
        throw new Error("登录状态已失效，请重新登录。");
      }

      if (!response.ok) {
        throw new Error(parseErrorPayload(result, "保存云端会话失败。"));
      }

      state.conversationSync.lastSavedVersion = state.conversationSync.saveVersion;
      return true;
    } catch (error) {
      console.warn("Failed to save cloud conversations.", error);
      return false;
    } finally {
      state.conversationSync.savingRemote = false;
      state.conversationSync.pendingSavePromise = null;
    }
  })();

  state.conversationSync.pendingSavePromise = requestPromise;
  return requestPromise;
}

function queueRemoteConversationSave() {
  if (!isAuthenticatedConversationAccount()) {
    return;
  }

  state.conversationSync.saveVersion += 1;

  if (state.conversationSync.pendingSaveTimer) {
    clearTimeout(state.conversationSync.pendingSaveTimer);
  }

  state.conversationSync.pendingSaveTimer = setTimeout(() => {
    state.conversationSync.pendingSaveTimer = null;
    saveRemoteConversationStateNow();
  }, 320);
}

async function flushRemoteConversationSave() {
  if (!isAuthenticatedConversationAccount()) {
    return true;
  }

  if (state.conversationSync.pendingSaveTimer) {
    clearTimeout(state.conversationSync.pendingSaveTimer);
    state.conversationSync.pendingSaveTimer = null;
  }

  return saveRemoteConversationStateNow();
}

function getDismissedAnnouncementIdForAccount(accountKey = state.conversationAccountKey) {
  const scopedDismissedAnnouncementId =
    loadScopedStorageMap(storageKeys.dismissedAnnouncementIdByAccount)[accountKey];

  if (typeof scopedDismissedAnnouncementId === "string") {
    return scopedDismissedAnnouncementId;
  }

  return "";
}

function persistDismissedAnnouncementIdForAccount(
  dismissedAnnouncementId = "",
  accountKey = state.conversationAccountKey
) {
  const scopedMap = loadScopedStorageMap(storageKeys.dismissedAnnouncementIdByAccount);

  if (!dismissedAnnouncementId) {
    delete scopedMap[accountKey];
  } else {
    scopedMap[accountKey] = String(dismissedAnnouncementId);
  }

  writeStorageItem(storageKeys.dismissedAnnouncementIdByAccount, JSON.stringify(scopedMap));
}

function resolveConversationAccountKey(
  authenticated = state.adminAuth.authenticated,
  user = state.adminAuth.user
) {
  const userId = typeof user?.id === "string" ? user.id.trim() : "";

  if (authenticated && userId) {
    return `user:${userId}`;
  }

  return defaultConversationAccountKey;
}

function getConversationAccountLabel() {
  const username = typeof state.adminAuth.user?.username === "string"
    ? state.adminAuth.user.username.trim()
    : "";

  if (state.adminAuth.authenticated && username) {
    return `当前账号：${username}`;
  }

  return "当前账号：访客";
}

function loadStoredConversations(accountKey = state.conversationAccountKey) {
  const scopedConversations = loadScopedStorageMap(storageKeys.conversationsByAccount)[accountKey];

  if (Array.isArray(scopedConversations)) {
    return scopedConversations.map(sanitizeStoredConversation);
  }

  if (accountKey === defaultConversationAccountKey) {
    const legacyList = safeParseStoredValue(
      readStorageItem(storageKeys.legacyConversations),
      []
    );

    if (Array.isArray(legacyList)) {
      return legacyList.map(sanitizeStoredConversation);
    }
  }

  return [];
}

function loadStoredActiveConversationId(accountKey = state.conversationAccountKey) {
  const scopedActiveConversationId =
    loadScopedStorageMap(storageKeys.activeConversationIdByAccount)[accountKey];

  if (typeof scopedActiveConversationId === "string") {
    return scopedActiveConversationId;
  }

  if (accountKey === defaultConversationAccountKey) {
    return readStorageItem(storageKeys.legacyActiveConversationId) || "";
  }

  return "";
}

async function loadConversationStateForAccount(accountKey) {
  state.conversationAccountKey = accountKey || defaultConversationAccountKey;
  state.conversationSync.currentAccountKey = state.conversationAccountKey;
  state.announcements.dismissedLatestId = getDismissedAnnouncementIdForAccount(state.conversationAccountKey);
  state.openRecentMenuConversationId = "";
  state.recentList.loadedCount = 0;
  state.recentList.signature = "";

  if (isAuthenticatedConversationAccount(state.conversationAccountKey)) {
    const loadedRemote = await loadRemoteConversationState(state.conversationAccountKey);
    const remoteConversationCount = state.conversations.length;
    const localFallbackConversations = loadStoredConversations(state.conversationAccountKey);
    const localFallbackActiveConversationId = loadStoredActiveConversationId(state.conversationAccountKey);
    const remoteHasHistory = state.conversations.some(conversationHasHistory);
    const localHasHistory = localFallbackConversations.some(conversationHasHistory);

    if ((!loadedRemote || !remoteHasHistory) && localHasHistory) {
      state.conversations = localFallbackConversations;
      state.activeConversationId = localFallbackActiveConversationId;
      ensureConversationState();
      synchronizeConversationModels();
      queueRemoteConversationSave();
      clearLocalConversationCacheForAccount(state.conversationAccountKey);
    } else {
      ensureConversationState();
      synchronizeConversationModels();

      if (!loadedRemote || remoteConversationCount < 1) {
        queueRemoteConversationSave();
      }
    }
  } else {
    state.conversations = loadStoredConversations(state.conversationAccountKey);
    state.activeConversationId = loadStoredActiveConversationId(state.conversationAccountKey);
    ensureConversationState();
    synchronizeConversationModels();
    persistConversationState();
  }

  syncConversationControls();
}

async function switchConversationStateByUser(
  nextAuthenticated = state.adminAuth.authenticated,
  nextUser = state.adminAuth.user
) {
  const nextAccountKey = resolveConversationAccountKey(nextAuthenticated, nextUser);

  if (state.conversationAccountKey === nextAccountKey) {
    return false;
  }

  try {
    await flushRemoteConversationSave();
    await loadConversationStateForAccount(nextAccountKey);
    clearError();
    elements.userInput.value = "";
    autoResizeComposer();
    renderConversationList();
    renderModelSelect();
    renderModelList();
    updateSelectedModelView();
    renderMessages();
    return true;
  } catch (error) {
    console.warn("Failed to switch conversation account scope.", error);
    return false;
  }
}

function getConversationDefaults() {
  const activeConversation = getActiveConversation();
  const legacyDefaults = getLegacyConversationDefaults();

  return {
    modelId: activeConversation?.modelId || legacyDefaults.modelId || state.models[0]?.id || "",
    systemPrompt: activeConversation?.systemPrompt || legacyDefaults.systemPrompt || "",
    temperature:
      typeof activeConversation?.temperature === "number"
        ? activeConversation.temperature
        : legacyDefaults.temperature
  };
}

function createConversation(overrides = {}) {
  const defaults = getConversationDefaults();
  const createdAt = Date.now();

  return {
    id: createId("conversation"),
    title: "新对话",
    createdAt,
    updatedAt: createdAt,
    modelId:
      typeof overrides.modelId === "string"
        ? overrides.modelId
        : defaults.modelId || state.models[0]?.id || "",
    systemPrompt:
      typeof overrides.systemPrompt === "string" ? overrides.systemPrompt : defaults.systemPrompt,
    temperature:
      overrides.temperature !== undefined
        ? clampTemperature(overrides.temperature)
        : clampTemperature(defaults.temperature),
    pinned: Boolean(overrides.pinned),
    messages: Array.isArray(overrides.messages)
      ? overrides.messages.map(sanitizeStoredMessage)
      : []
  };
}

function ensureConversationState() {
  if (!state.conversations.length) {
    state.conversations.push(createConversation());
  }

  if (!state.conversations.some((conversation) => conversation.id === state.activeConversationId)) {
    state.activeConversationId = state.conversations[0].id;
  }
}

function getActiveConversation() {
  return state.conversations.find((conversation) => conversation.id === state.activeConversationId) || null;
}

function persistConversationState() {
  const accountKey = state.conversationAccountKey || defaultConversationAccountKey;

  if (isAuthenticatedConversationAccount(accountKey)) {
    queueRemoteConversationSave();
    return true;
  }

  const payload = state.conversations.map((conversation) => ({
    ...conversation,
    messages: conversation.messages.map((message) => ({
      ...message,
      streaming: false
    }))
  }));
  const conversationsByAccount = loadScopedStorageMap(storageKeys.conversationsByAccount);
  const activeConversationIdByAccount = loadScopedStorageMap(storageKeys.activeConversationIdByAccount);

  conversationsByAccount[accountKey] = payload;
  activeConversationIdByAccount[accountKey] = state.activeConversationId || "";

  const scopedConversationsOk = writeStorageItem(
    storageKeys.conversationsByAccount,
    JSON.stringify(conversationsByAccount)
  );
  const scopedActiveConversationOk = writeStorageItem(
    storageKeys.activeConversationIdByAccount,
    JSON.stringify(activeConversationIdByAccount)
  );

  let legacyConversationsOk = true;
  let legacyActiveConversationOk = true;
  if (accountKey === defaultConversationAccountKey) {
    legacyConversationsOk = writeStorageItem(storageKeys.legacyConversations, JSON.stringify(payload));
    legacyActiveConversationOk = writeStorageItem(
      storageKeys.legacyActiveConversationId,
      state.activeConversationId || ""
    );
  }

  const persistedSuccessfully =
    scopedConversationsOk &&
    scopedActiveConversationOk &&
    legacyConversationsOk &&
    legacyActiveConversationOk;

  if (!persistedSuccessfully) {
    console.warn("Conversation state persistence failed. Local storage may be unavailable or full.");
  }

  return persistedSuccessfully;
}

function autoResizeComposer() {
  elements.userInput.style.height = "auto";
  elements.userInput.style.height = `${Math.min(elements.userInput.scrollHeight, 220)}px`;
}

function formatProvider(value) {
  if (!value) {
    return "Unknown";
  }

  if (value.toLowerCase() === "openai") {
    return "OpenAI";
  }

  if (value.toLowerCase() === "google") {
    return "Google";
  }

  return value;
}

function formatDate(timestamp) {
  if (!timestamp) {
    return "未知时间";
  }

  try {
    return new Date(timestamp * 1000).toLocaleDateString("zh-CN");
  } catch (error) {
    return "未知时间";
  }
}

function formatClock(timestamp) {
  return new Date(timestamp).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatRelativeTime(timestamp) {
  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));

  if (diffMinutes < 1) {
    return "刚刚";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  }

  if (diffMinutes < 1440) {
    return `${Math.floor(diffMinutes / 60)} 小时前`;
  }

  if (diffMinutes < 2880) {
    return "昨天";
  }

  return `${Math.floor(diffMinutes / 1440)} 天前`;
}

function formatMessageTime(message) {
  const timeText = formatClock(message.timestamp);
  return message.streaming ? `${timeText} · 正在生成...` : timeText;
}

function showError(message) {
  elements.errorBanner.hidden = false;
  elements.errorBanner.textContent = message;
}

function clearError() {
  elements.errorBanner.hidden = true;
  elements.errorBanner.textContent = "";
}

function resolveConfirmDialog(result) {
  if (state.pendingConfirmResolver) {
    state.pendingConfirmResolver(result);
    state.pendingConfirmResolver = null;
  }

  elements.confirmDialogCancelButton.textContent = "取消";
  elements.confirmDialogConfirmButton.textContent = "确认删除";
  elements.confirmDialog.hidden = true;
}

function requestDeleteConfirmation(title, options = {}) {
  if (state.pendingConfirmResolver) {
    resolveConfirmDialog(false);
  }

  const dialogTitle = options.dialogTitle || "删除当前对话？";
  const targetTitle = title || options.fallbackTitle || "当前对话";
  const dialogMessage = options.dialogMessage || `确定删除“${targetTitle}”吗？此操作不可撤销。`;

  elements.confirmDialogTitle.textContent = dialogTitle;
  elements.confirmDialogMessage.textContent = dialogMessage;
  elements.confirmDialog.hidden = false;

  return new Promise((resolve) => {
    state.pendingConfirmResolver = resolve;
    elements.confirmDialogCancelButton.focus();
  });
}

function requestLogoutConfirmation() {
  closeMobileSidebarIfNeeded();

  if (state.pendingConfirmResolver) {
    resolveConfirmDialog(false);
  }

  elements.confirmDialogTitle.textContent = "退出登录？";
  elements.confirmDialogMessage.textContent = "确认退出当前账号吗？退出后将无法继续发送消息。";
  elements.confirmDialogCancelButton.textContent = "继续使用";
  elements.confirmDialogConfirmButton.textContent = "确认退出";
  elements.confirmDialog.hidden = false;

  return new Promise((resolve) => {
    state.pendingConfirmResolver = resolve;
    elements.confirmDialogCancelButton.focus();
  });
}

function setInlineBanner(message, type = "success") {
  if (!message) {
    elements.configStatusBanner.hidden = true;
    elements.configStatusBanner.textContent = "";
    elements.configStatusBanner.className = "inline-banner";
    return;
  }

  elements.configStatusBanner.hidden = false;
  elements.configStatusBanner.textContent = message;
  elements.configStatusBanner.className = `inline-banner ${type}`;
}

function renderTestResult() {
  const result = state.configForm.testResult;

  if (!result) {
    elements.configTestResult.hidden = true;
    elements.configTestResult.textContent = "";
    elements.configTestResult.className = "result-box";
    return;
  }

  elements.configTestResult.hidden = false;
  elements.configTestResult.className = `result-box ${result.ok ? "success" : "warning"}`;

  if (result.ok) {
    const sampleModels = Array.isArray(result.sampleModels) && result.sampleModels.length
      ? `示例模型：${result.sampleModels.join("、")}`
      : "没有返回模型示例。";

    elements.configTestResult.textContent = `测试成功\n接口：${result.apiBaseUrl}\n模型数量：${result.modelCount}\n${sampleModels}`;
    return;
  }

  elements.configTestResult.textContent = `测试失败\n${result.detail || "请检查 API 地址与密钥。"}`;
}

function setAdminAuthError(message) {
  if (!message) {
    elements.adminAuthError.hidden = true;
    elements.adminAuthError.textContent = "";
    return;
  }

  elements.adminAuthError.hidden = false;
  elements.adminAuthError.textContent = message;
}

function isAdminUser() {
  return Boolean(state.adminAuth.authenticated && state.adminAuth.user?.role === "admin");
}

function setUserAdminBanner(message, type = "success") {
  if (!message) {
    elements.userAdminBanner.hidden = true;
    elements.userAdminBanner.textContent = "";
    elements.userAdminBanner.className = "inline-banner";
    return;
  }

  elements.userAdminBanner.hidden = false;
  elements.userAdminBanner.textContent = message;
  elements.userAdminBanner.className = `inline-banner ${type}`;
}

function setAnnouncementBanner(message, type = "success") {
  if (!message) {
    elements.announcementBanner.hidden = true;
    elements.announcementBanner.textContent = "";
    elements.announcementBanner.className = "inline-banner";
    return;
  }

  elements.announcementBanner.hidden = false;
  elements.announcementBanner.textContent = message;
  elements.announcementBanner.className = `inline-banner ${type}`;
}

function clearAnnouncementNotice() {
  const noticeTitleElement = elements.announcementNoticeTitle;
  const noticeMetaElement = elements.announcementNoticeMeta;
  const noticeTextElement = elements.announcementNoticeText || elements.announcementNotice;
  state.announcements.latest = null;
  elements.announcementNotice.hidden = true;
  if (noticeTitleElement) {
    noticeTitleElement.textContent = "最新公告";
  }
  if (noticeMetaElement) {
    noticeMetaElement.textContent = "";
  }
  noticeTextElement.textContent = "";
}

function formatAnnouncementTime(timestamp) {
  if (!timestamp) {
    return "刚刚";
  }

  try {
    return new Date(timestamp).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (error) {
    return "刚刚";
  }
}

function renderAnnouncementNotice() {
  const noticeTitleElement = elements.announcementNoticeTitle;
  const noticeMetaElement = elements.announcementNoticeMeta;
  const noticeTextElement = elements.announcementNoticeText || elements.announcementNotice;
  const announcement = state.announcements.latest;
  const isDismissedCurrentAnnouncement =
    Boolean(announcement?.id) &&
    String(state.announcements.dismissedLatestId || "") === String(announcement.id);
  const visible = Boolean(
    state.adminAuth.authenticated &&
      announcement &&
      announcement.content &&
      !isDismissedCurrentAnnouncement
  );

  if (!visible) {
    elements.announcementNotice.hidden = true;
    if (noticeTitleElement) {
      noticeTitleElement.textContent = "最新公告";
    }
    if (noticeMetaElement) {
      noticeMetaElement.textContent = "";
    }
    noticeTextElement.textContent = "";
    return;
  }

  const title = String(announcement.title || "").trim();
  const headerTitle = title || "最新公告";
  const publishTime = formatAnnouncementTime(announcement.createdAt || announcement.updatedAt || Date.now());
  const content = String(announcement.content || "").trim();

  elements.announcementNotice.hidden = false;
  if (noticeTitleElement) {
    noticeTitleElement.textContent = headerTitle;
  }
  if (noticeMetaElement) {
    noticeMetaElement.textContent = `发布时间：${publishTime}`;
  }
  noticeTextElement.textContent = content;
}

function closeAnnouncementNotice() {
  const announcementId = String(state.announcements.latest?.id || "").trim();

  if (!announcementId) {
    clearAnnouncementNotice();
    return;
  }

  state.announcements.dismissedLatestId = announcementId;
  persistDismissedAnnouncementIdForAccount(announcementId, state.conversationAccountKey);
  renderAnnouncementNotice();
}

function clearAdminAnnouncementsState() {
  state.announcements.list = [];
  state.adminAuth.announcementsLoading = false;
  state.announcements.publishing = false;
  setAnnouncementBanner("");
}

function renderAnnouncementList() {
  if (!isAdminUser()) {
    elements.announcementList.innerHTML = '<div class="empty-state compact">管理员登录后可发布公告。</div>';
    return;
  }

  if (state.adminAuth.announcementsLoading) {
    elements.announcementList.innerHTML = '<div class="empty-state compact">正在加载公告列表...</div>';
    return;
  }

  if (!state.announcements.list.length) {
    elements.announcementList.innerHTML = '<div class="empty-state compact">暂无公告，可在上方发布。</div>';
    return;
  }

  elements.announcementList.innerHTML = "";

  for (const announcement of state.announcements.list) {
    const row = document.createElement("article");
    row.className = "announcement-item";

    const top = document.createElement("div");
    top.className = "announcement-item-top";

    const title = document.createElement("strong");
    title.className = "announcement-title";
    title.textContent = String(announcement.title || "").trim() || "未命名公告";

    const time = document.createElement("span");
    time.className = "announcement-time";
    time.textContent = formatAnnouncementTime(announcement.createdAt || announcement.updatedAt || Date.now());

    const content = document.createElement("p");
    content.className = "announcement-content";
    content.textContent = String(announcement.content || "").trim();

    const meta = document.createElement("div");
    meta.className = "announcement-meta";
    meta.textContent = announcement.authorName ? `发布者：${announcement.authorName}` : "发布者：管理员";

    const actions = document.createElement("div");
    actions.className = "announcement-actions-row";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "user-action-button danger";
    deleteButton.textContent = "删除";
    deleteButton.disabled = state.announcements.publishing || state.loading;
    deleteButton.addEventListener("click", () => {
      deleteAnnouncement(announcement.id, title.textContent);
    });

    actions.append(deleteButton);
    top.append(title, time);
    row.append(top, meta, content, actions);
    elements.announcementList.appendChild(row);
  }
}

function renderAuthDialogMode() {
  const isRegisterMode = state.adminAuth.mode === "register";

  elements.adminAuthDialogTitle.textContent = isRegisterMode ? "用户注册" : "用户登录";
  elements.adminAuthDialogDescription.textContent = isRegisterMode
    ? "创建新账号后会自动登录。管理员账号请使用已分配账号登录。"
    : "输入用户名和密码进行登录。没有账号可直接注册。";
  elements.adminAuthSubmitButton.textContent = isRegisterMode ? "注册并登录" : "登录";
  elements.adminAuthModeToggleButton.textContent = isRegisterMode ? "已有账号？去登录" : "没有账号？去注册";
  elements.adminAuthPasswordInput.setAttribute("autocomplete", isRegisterMode ? "new-password" : "current-password");
}

function clearAdminUsersState() {
  state.adminAuth.users = [];
  state.adminAuth.usersLoading = false;
  state.adminAuth.creatingUser = false;
  setUserAdminBanner("");
}

function renderUserList() {
  if (!isAdminUser()) {
    elements.userList.innerHTML = '<div class="empty-state compact">管理员登录后可管理用户。</div>';
    return;
  }

  if (state.adminAuth.usersLoading) {
    elements.userList.innerHTML = '<div class="empty-state compact">正在加载用户列表...</div>';
    return;
  }

  if (!state.adminAuth.users.length) {
    elements.userList.innerHTML = '<div class="empty-state compact">暂无用户数据。</div>';
    return;
  }

  elements.userList.innerHTML = "";

  for (const user of state.adminAuth.users) {
    const row = document.createElement("div");
    row.className = "user-item";

    const top = document.createElement("div");
    top.className = "user-item-top";

    const name = document.createElement("span");
    name.className = "user-name";
    name.textContent = user.username || "未知用户";

    const roleBadge = document.createElement("span");
    roleBadge.className = `user-role-badge${user.role === "admin" ? " admin" : ""}`;
    roleBadge.textContent = user.role === "admin" ? "管理员" : "普通用户";

    const meta = document.createElement("div");
    meta.className = "user-item-meta";
    meta.textContent = user.lastLoginAt
      ? `最近登录：${formatRelativeTime(Number(user.lastLoginAt))}`
      : "最近登录：从未登录";

    const actions = document.createElement("div");
    actions.className = "user-item-actions";

    const roleSelect = document.createElement("select");
    roleSelect.className = "user-role-select";
    roleSelect.disabled = state.loading || state.adminAuth.creatingUser;
    roleSelect.innerHTML = `
      <option value="user">普通用户</option>
      <option value="admin">管理员</option>
    `;
    roleSelect.value = user.role === "admin" ? "admin" : "user";
    roleSelect.addEventListener("change", () => {
      updateManagedUserRole(user.id, roleSelect.value);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "user-action-button danger";
    deleteButton.textContent = "删除";
    deleteButton.disabled = user.id === state.adminAuth.user?.id || state.adminAuth.creatingUser;
    deleteButton.addEventListener("click", () => {
      deleteManagedUser(user.id, user.username);
    });

    top.append(name, roleBadge);
    actions.append(roleSelect, deleteButton);
    row.append(top, meta, actions);
    elements.userList.appendChild(row);
  }
}

function renderAdminAuthState() {
  const user = state.adminAuth.user;
  const isAuthenticated = Boolean(state.adminAuth.authenticated && user);
  const isAdmin = Boolean(isAuthenticated && user.role === "admin");

  elements.adminAuthIdentityText.textContent = isAuthenticated ? user.username : "用户登录";
  elements.adminAuthRoleBadge.textContent = isAuthenticated
    ? user.role === "admin"
      ? "管理员"
      : "普通用户"
    : "未登录";
  elements.adminAuthRoleBadge.classList.toggle("admin", isAuthenticated && user.role === "admin");
  elements.adminAuthRoleBadge.classList.toggle("user", isAuthenticated && user.role !== "admin");
  elements.adminAuthRoleBadge.classList.toggle("guest", !isAuthenticated);
  elements.adminAuthStatusText.textContent = isAuthenticated ? "点击退出登录" : "点击登录或注册";
  elements.adminAuthButton.setAttribute("aria-label", isAuthenticated ? "退出登录" : "打开登录面板");
  elements.modelNavButton.hidden = !isAdmin;
  elements.userNavButton.hidden = !isAdmin;
  elements.announcementNavButton.hidden = !isAdmin;

  if (
    !isAdmin &&
    (state.activeSidebarTab === "models" ||
      state.activeSidebarTab === "users" ||
      state.activeSidebarTab === "announcements")
  ) {
    setSidebarTab("conversations");
  } else {
    renderSidebarNavigation();
  }

  renderUserList();
  renderAnnouncementList();
  renderAnnouncementNotice();
  setConfigButtonsState();
}

function clearAdminConfigState() {
  state.configForm.apiBaseUrl = "";
  state.configForm.apiKey = "";
  state.configForm.testResult = null;
  syncConfigFormInputs();
  renderTestResult();
}

function openAdminAuthDialog(nextTab = "", mode = "login") {
  state.adminAuth.nextTabAfterLogin = nextTab || "";
  state.adminAuth.mode = mode === "register" ? "register" : "login";
  setAdminAuthError("");
  elements.adminAuthUsernameInput.value = "";
  elements.adminAuthPasswordInput.value = "";
  renderAuthDialogMode();
  elements.adminAuthDialog.hidden = false;
}

function closeAdminAuthDialog() {
  elements.adminAuthDialog.hidden = true;
  setAdminAuthError("");
  elements.adminAuthUsernameInput.value = "";
  elements.adminAuthPasswordInput.value = "";
  state.adminAuth.nextTabAfterLogin = "";
}

async function loadAdminAuthStatus() {
  state.adminAuth.checking = true;

  try {
    const response = await fetch("/api/auth/status");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(parseErrorPayload(payload, "无法获取登录状态。"));
    }

    state.adminAuth.authenticated = Boolean(payload.authenticated && payload.user);
    state.adminAuth.user = payload.user || null;
    await switchConversationStateByUser(state.adminAuth.authenticated, state.adminAuth.user);
  } catch (error) {
    state.adminAuth.authenticated = false;
    state.adminAuth.user = null;
    await switchConversationStateByUser(false, null);
  } finally {
    state.adminAuth.checking = false;
    renderAdminAuthState();
    await loadLatestAnnouncement();
  }
}

function handleAdminUnauthorized(message = "登录已失效，请重新登录。") {
  state.adminAuth.authenticated = false;
  state.adminAuth.user = null;
  void switchConversationStateByUser(false, null);
  clearAdminConfigState();
  clearAdminUsersState();
  clearAdminAnnouncementsState();
  clearAnnouncementNotice();
  renderAdminAuthState();
  setLoading(state.loading);
  setInlineBanner(message, "warning");
}

function handleAdminForbidden() {
  clearAdminConfigState();
  clearAdminUsersState();
  clearAdminAnnouncementsState();
  renderAdminAuthState();
  setSidebarTab("conversations");
  setInlineBanner("当前账号没有管理员权限。", "warning");
}

async function loginAdmin() {
  const username = elements.adminAuthUsernameInput.value.trim();
  const password = elements.adminAuthPasswordInput.value;
  const isRegisterMode = state.adminAuth.mode === "register";

  if (!username) {
    setAdminAuthError("请输入用户名。");
    return;
  }

  if (!String(password || "").trim()) {
    setAdminAuthError("请输入密码。");
    return;
  }

  if (state.adminAuth.loggingIn) {
    return;
  }

  state.adminAuth.loggingIn = true;
  elements.adminAuthSubmitButton.disabled = true;
  elements.adminAuthCancelButton.disabled = true;
  elements.adminAuthModeToggleButton.disabled = true;
  setAdminAuthError("");

  try {
    const response = await fetch(isRegisterMode ? "/api/auth/register" : "/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(parseErrorPayload(payload, isRegisterMode ? "注册失败。" : "登录失败。"));
    }

    const nextTabAfterLogin = state.adminAuth.nextTabAfterLogin;
    state.adminAuth.authenticated = true;
    state.adminAuth.user = payload.user || null;
    await switchConversationStateByUser(state.adminAuth.authenticated, state.adminAuth.user);
    renderAdminAuthState();

    if (isAdminUser()) {
      await loadAdminConfig();
      await loadAdminUsers();
      await loadAdminAnnouncements();
    } else {
      clearAdminConfigState();
      clearAdminUsersState();
      clearAdminAnnouncementsState();
      renderUserList();
      renderAnnouncementList();
    }

    closeAdminAuthDialog();
    setInlineBanner(payload.message || (isRegisterMode ? "注册成功。" : "登录成功。"), "success");

    if (
      (nextTabAfterLogin === "models" ||
        nextTabAfterLogin === "users" ||
        nextTabAfterLogin === "announcements") &&
      isAdminUser()
    ) {
      setSidebarTab(nextTabAfterLogin);

      if (nextTabAfterLogin === "users") {
      } else if (nextTabAfterLogin === "announcements") {
      } else {
      }
    } else if (
      nextTabAfterLogin === "models" ||
      nextTabAfterLogin === "users" ||
      nextTabAfterLogin === "announcements"
    ) {
      setSidebarTab("conversations");
    }

    await loadLatestAnnouncement();
  } catch (error) {
    setAdminAuthError(error.message || (isRegisterMode ? "注册失败。" : "登录失败。"));
  } finally {
    state.adminAuth.loggingIn = false;
    elements.adminAuthSubmitButton.disabled = false;
    elements.adminAuthCancelButton.disabled = false;
    elements.adminAuthModeToggleButton.disabled = false;
    setLoading(state.loading);
  }
}

async function logoutAdmin() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST"
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(parseErrorPayload(payload, "退出登录失败。"));
    }

    state.adminAuth.authenticated = false;
    state.adminAuth.user = null;
    await switchConversationStateByUser(false, null);
    clearAdminConfigState();
    clearAdminUsersState();
    clearAdminAnnouncementsState();
    clearAnnouncementNotice();
    renderAdminAuthState();
    setLoading(state.loading);
    setSidebarTab("conversations");
    setInlineBanner(payload.message || "已退出登录。", "success");
  } catch (error) {
    setInlineBanner(error.message || "退出登录失败。", "warning");
  }
}

function requireAdminAccess(nextTab = "") {
  if (!state.adminAuth.authenticated) {
    setInlineBanner("请先登录账号。", "warning");
    openAdminAuthDialog(nextTab, "login");
    return false;
  }

  if (!isAdminUser()) {
    setInlineBanner("当前账号没有管理员权限。", "warning");
    setSidebarTab("conversations");
    return false;
  }

  return true;
}

function requireUserAccess() {
  if (state.adminAuth.authenticated) {
    return true;
  }

  showError("请先登录后再进行对话。");
  openAdminAuthDialog("conversations", "login");
  return false;
}

function renderSidebarNavigation() {
  const canAccessAdminTabs = isAdminUser();
  const showModels = canAccessAdminTabs && state.activeSidebarTab === "models";
  const showUsers = canAccessAdminTabs && state.activeSidebarTab === "users";
  const showAnnouncements = canAccessAdminTabs && state.activeSidebarTab === "announcements";
  const showConversations = !showModels && !showUsers && !showAnnouncements;

  elements.modelNavButton.hidden = !canAccessAdminTabs;
  elements.userNavButton.hidden = !canAccessAdminTabs;
  elements.announcementNavButton.hidden = !canAccessAdminTabs;
  elements.chatWorkspace.hidden = !showConversations;
  elements.modelWorkspace.hidden = !showModels;
  elements.userWorkspace.hidden = !showUsers;
  elements.announcementWorkspace.hidden = !showAnnouncements;
  elements.conversationNavButton.classList.toggle("active", showConversations);
  elements.modelNavButton.classList.toggle("active", canAccessAdminTabs && showModels);
  elements.userNavButton.classList.toggle("active", canAccessAdminTabs && showUsers);
  elements.announcementNavButton.classList.toggle("active", canAccessAdminTabs && showAnnouncements);
  elements.conversationNavButton.setAttribute("aria-pressed", String(showConversations));
  elements.modelNavButton.setAttribute("aria-pressed", String(canAccessAdminTabs && showModels));
  elements.userNavButton.setAttribute("aria-pressed", String(canAccessAdminTabs && showUsers));
  elements.announcementNavButton.setAttribute("aria-pressed", String(canAccessAdminTabs && showAnnouncements));
}

function setSidebarTab(tab, options = {}) {
  const { updateHash = true, closeMobileSidebar = true } = options;
  const canAccessAdminTabs = isAdminUser();
  const nextTab =
    canAccessAdminTabs && (tab === "models" || tab === "users" || tab === "announcements")
      ? tab
      : "conversations";

  state.activeSidebarTab = nextTab;
  localStorage.setItem(storageKeys.sidebarTab, state.activeSidebarTab);

  if (updateHash) {
    const hashByTab = {
      conversations: "#chat",
      models: "#models",
      users: "#users",
      announcements: "#announcements"
    };
    const nextHash = hashByTab[state.activeSidebarTab] || "#chat";

    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
  }

  renderSidebarNavigation();

  if (state.activeSidebarTab === "users" && isAdminUser()) {
    loadAdminUsers();
  } else if (state.activeSidebarTab === "announcements" && isAdminUser()) {
    loadAdminAnnouncements();
  }

  if (closeMobileSidebar) {
    closeMobileSidebarIfNeeded();
  }
}

function setConnectionStatus(text, isHealthy = false) {
  elements.connectionStatus.textContent = text;
  elements.connectionStatus.style.color = isHealthy ? "var(--success)" : "var(--muted)";
}

function ensureConversationModel(conversation) {
  if (!conversation || !state.models.length) {
    return;
  }

  if (!conversation.modelId || !state.models.some((model) => model.id === conversation.modelId)) {
    conversation.modelId = state.models[0].id;
  }
}

function synchronizeConversationModels() {
  if (!state.models.length) {
    return;
  }

  let changed = false;

  for (const conversation of state.conversations) {
    const previousModelId = conversation.modelId;
    ensureConversationModel(conversation);

    if (previousModelId !== conversation.modelId) {
      changed = true;
    }
  }

  if (changed) {
    persistConversationState();
  }
}

function getSelectedModel() {
  const activeConversation = getActiveConversation();

  if (!activeConversation) {
    return null;
  }

  return state.models.find((model) => model.id === activeConversation.modelId) || null;
}

function sortConversations(conversations) {
  return [...conversations].sort((left, right) => {
    if (Boolean(left.pinned) !== Boolean(right.pinned)) {
      return left.pinned ? -1 : 1;
    }

    if (left.updatedAt !== right.updatedAt) {
      return right.updatedAt - left.updatedAt;
    }

    return right.createdAt - left.createdAt;
  });
}

function conversationHasHistory(conversation) {
  return Array.isArray(conversation?.messages) && conversation.messages.some((message) => {
    return message.role === "user" && typeof message.content === "string" && message.content.trim().length > 0;
  });
}

function getConversationPreview(conversation) {
  const lastMeaningfulMessage = [...conversation.messages]
    .reverse()
    .find((message) => compactText(message.content));

  if (lastMeaningfulMessage) {
    return truncateText(compactText(lastMeaningfulMessage.content), 36);
  }

  if (compactText(conversation.systemPrompt)) {
    return "已配置系统提示词";
  }

  return conversation.modelId ? `模型：${conversation.modelId}` : "等待选择模型";
}

function getRecentConversations() {
  if (!state.adminAuth.authenticated) {
    return [];
  }

  return sortConversations(state.conversations.filter(conversationHasHistory));
}

function getRecentConversationSignature(conversations) {
  return conversations
    .map((conversation) => `${conversation.id}:${conversation.updatedAt}:${conversation.pinned ? 1 : 0}`)
    .join("|");
}

function syncRecentListWindow(conversations) {
  const signature = getRecentConversationSignature(conversations);
  const listChanged = signature !== state.recentList.signature;

  if (listChanged) {
    state.recentList.signature = signature;
    state.recentList.loadedCount = Math.min(recentListInitialBatch, conversations.length);
  } else {
    state.recentList.loadedCount = Math.min(state.recentList.loadedCount, conversations.length);

    if (!state.recentList.loadedCount && conversations.length) {
      state.recentList.loadedCount = Math.min(recentListInitialBatch, conversations.length);
    }
  }

  const activeIndex = conversations.findIndex(
    (conversation) => conversation.id === state.activeConversationId
  );

  if (activeIndex >= state.recentList.loadedCount) {
    state.recentList.loadedCount = Math.min(conversations.length, activeIndex + 1);
  }
}

function canLoadMoreRecentConversations(conversations = getRecentConversations()) {
  return state.recentList.loadedCount < conversations.length;
}

function ensureRecentListFilled() {
  const listElement = elements.recentList;

  if (!listElement) {
    return;
  }

  const conversations = getRecentConversations();

  if (!canLoadMoreRecentConversations(conversations)) {
    return;
  }

  if (listElement.scrollHeight <= listElement.clientHeight + 2) {
    state.recentList.loadedCount = Math.min(
      conversations.length,
      state.recentList.loadedCount + recentListBatchSize
    );
    renderConversationList({ preserveScrollTop: listElement.scrollTop });
  }
}

function loadMoreRecentConversations() {
  const conversations = getRecentConversations();

  if (!canLoadMoreRecentConversations(conversations)) {
    return;
  }

  const previousScrollTop = elements.recentList.scrollTop;
  state.recentList.loadedCount = Math.min(
    conversations.length,
    state.recentList.loadedCount + recentListBatchSize
  );
  renderConversationList({ preserveScrollTop: previousScrollTop });
}

function handleRecentListScroll() {
  if (state.openRecentMenuConversationId) {
    window.requestAnimationFrame(adjustRecentMenuPlacement);
  }

  const remainingDistance =
    elements.recentList.scrollHeight -
    elements.recentList.scrollTop -
    elements.recentList.clientHeight;

  if (remainingDistance <= recentListLoadOffsetPx) {
    loadMoreRecentConversations();
  }
}

function closeRecentConversationMenu(options = {}) {
  const { preserveScrollTop = elements.recentList.scrollTop } = options;

  if (!state.openRecentMenuConversationId) {
    return;
  }

  state.openRecentMenuConversationId = "";
  renderConversationList({ preserveScrollTop });
}

function adjustRecentMenuPlacement() {
  const openRow = elements.recentList.querySelector(".recent-row.menu-open");

  if (!openRow) {
    return;
  }

  const menuWrap = openRow.querySelector(".recent-more-wrap");
  const menu = menuWrap?.querySelector(".recent-more-menu");

  if (!menuWrap || !menu) {
    return;
  }

  menuWrap.classList.remove("open-up");

  const listRect = elements.recentList.getBoundingClientRect();
  const rowRect = openRow.getBoundingClientRect();
  const menuHeight = menu.offsetHeight;
  const spaceBelow = listRect.bottom - rowRect.bottom;
  const spaceAbove = rowRect.top - listRect.top;
  const needOpenUp = spaceBelow < menuHeight + 8 && spaceAbove > spaceBelow;

  if (needOpenUp) {
    menuWrap.classList.add("open-up");
  }
}

function toggleRecentConversationMenu(conversationId) {
  const preserveScrollTop = elements.recentList.scrollTop;
  state.openRecentMenuConversationId =
    state.openRecentMenuConversationId === conversationId ? "" : conversationId;
  renderConversationList({ preserveScrollTop });
}

function toggleConversationPinned(conversationId) {
  const targetConversation = state.conversations.find(
    (conversation) => conversation.id === conversationId
  );

  if (!targetConversation) {
    return;
  }

  targetConversation.pinned = !targetConversation.pinned;
  persistConversationState();
  renderConversationList({ preserveScrollTop: elements.recentList.scrollTop });
}

async function deleteConversationById(conversationId, options = {}) {
  const { requireConfirm = true, forceConversationTab = false } = options;
  const targetConversation = state.conversations.find(
    (conversation) => conversation.id === conversationId
  );

  if (!targetConversation) {
    return false;
  }

  if (state.openRecentMenuConversationId) {
    const preserveScrollTop = elements.recentList.scrollTop;
    state.openRecentMenuConversationId = "";
    renderConversationList({ preserveScrollTop });
  }

  if (requireConfirm) {
    const confirmed = await requestDeleteConfirmation(targetConversation.title || "当前对话");

    if (!confirmed) {
      return false;
    }
  }

  const currentIndex = state.conversations.findIndex(
    (conversation) => conversation.id === targetConversation.id
  );

  if (currentIndex === -1) {
    return false;
  }

  const wasActiveConversation = state.activeConversationId === targetConversation.id;
  state.conversations = state.conversations.filter(
    (conversation) => conversation.id !== targetConversation.id
  );
  state.openRecentMenuConversationId = "";

  if (!state.conversations.length) {
    const replacementConversation = createConversation({
      modelId: targetConversation.modelId,
      systemPrompt: targetConversation.systemPrompt,
      temperature: targetConversation.temperature
    });

    ensureConversationModel(replacementConversation);
    state.conversations = [replacementConversation];
    state.activeConversationId = replacementConversation.id;
  } else if (wasActiveConversation) {
    const nextConversation = state.conversations[Math.min(currentIndex, state.conversations.length - 1)];
    state.activeConversationId = nextConversation.id;
    ensureConversationModel(nextConversation);
  }

  persistConversationState();
  syncConversationControls();
  renderConversationList();
  renderModelSelect();
  renderModelList();
  updateSelectedModelView();
  renderMessages();
  clearError();

  if (forceConversationTab) {
    setSidebarTab("conversations");
  }

  if (wasActiveConversation) {
    elements.userInput.value = "";
    autoResizeComposer();
  }

  return true;
}

function handleGlobalPointerDown(event) {
  if (!state.openRecentMenuConversationId) {
    return;
  }

  if (event.target instanceof Element && event.target.closest(".recent-more-wrap")) {
    return;
  }

  closeRecentConversationMenu();
}

function syncConversationControls() {
  const activeConversation = getActiveConversation();

  if (!activeConversation) {
    return;
  }

  elements.systemPromptInput.value = activeConversation.systemPrompt || "";
  elements.temperatureRange.value = String(clampTemperature(activeConversation.temperature));
  elements.temperatureValue.textContent = Number(elements.temperatureRange.value).toFixed(1);
}

function updateSelectedModelView() {
  const activeConversation = getActiveConversation();
  const model = getSelectedModel();

  if (!state.adminAuth.authenticated) {
    elements.selectedModelMeta.textContent = "";

    if (!state.loading) {
      elements.composerHint.textContent = "请先登录后开始对话。";
    }

    return;
  }

  if (!activeConversation || !model) {
    elements.selectedModelMeta.textContent = "";

    if (!state.loading) {
      elements.composerHint.textContent = state.models.length
        ? "请先选择一个模型后再发送消息。"
        : "等待模型列表加载完成...";
    }

    return;
  }

  elements.selectedModelMeta.textContent = "";

  if (!state.loading) {
    elements.composerHint.textContent = `当前模型：${model.id}`;
  }
}

function renderConfigSummary() {
  elements.apiBaseUrl.textContent = state.apiBaseUrl || "未配置";
  elements.keyStatus.textContent = state.keyConfigured ? "已配置" : "未配置";
  elements.modelStats.textContent = `${state.filteredModels.length || state.models.length} / ${state.models.length} 个模型`;
}

function syncConfigFormInputs() {
  elements.configApiBaseUrlInput.value = state.configForm.apiBaseUrl;
  elements.configApiKeyInput.value = state.configForm.apiKey;
}

function filterModels() {
  const keyword = elements.modelSearchInput.value.trim().toLowerCase();

  state.filteredModels = state.models.filter((model) => {
    const haystack = `${model.id} ${model.owned_by || ""}`.toLowerCase();
    return haystack.includes(keyword);
  });
}

function renderModelSelect() {
  const activeConversation = getActiveConversation();
  const groupedModels = state.models.reduce((groups, model) => {
    const key = formatProvider(model.owned_by);
    groups[key] = groups[key] || [];
    groups[key].push(model);
    return groups;
  }, {});

  elements.modelSelect.innerHTML = "";

  if (!state.models.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "暂无可用模型";
    elements.modelSelect.appendChild(option);
    elements.modelSelect.disabled = true;
    return;
  }

  for (const [provider, models] of Object.entries(groupedModels)) {
    const group = document.createElement("optgroup");
    group.label = provider;

    for (const model of models) {
      const option = document.createElement("option");
      option.value = model.id;
      option.textContent = model.id;
      option.selected = model.id === activeConversation?.modelId;
      group.appendChild(option);
    }

    elements.modelSelect.appendChild(group);
  }

  elements.modelSelect.disabled = state.loading;
}

function renderModelList() {
  const activeConversation = getActiveConversation();
  filterModels();
  renderConfigSummary();

  if (!state.filteredModels.length) {
    elements.modelList.innerHTML = '<div class="empty-state compact">没有匹配的模型。</div>';
    return;
  }

  elements.modelList.innerHTML = "";

  for (const model of state.filteredModels) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `model-item${model.id === activeConversation?.modelId ? " active" : ""}`;
    button.disabled = state.loading || state.configForm.saving || state.configForm.testing;

    const top = document.createElement("div");
    top.className = "model-item-top";

    const name = document.createElement("span");
    name.className = "model-name";
    name.textContent = model.id;

    const provider = document.createElement("span");
    provider.className = "model-provider";
    provider.textContent = formatProvider(model.owned_by);

    const bottom = document.createElement("div");
    bottom.className = "model-item-bottom";

    const createdAt = document.createElement("span");
    createdAt.className = "model-date";
    createdAt.textContent = `创建于 ${formatDate(model.created)}`;

    const activeLabel = document.createElement("span");
    activeLabel.className = "model-date";
    activeLabel.textContent = model.id === activeConversation?.modelId ? "当前使用" : "点击切换";

    top.append(name, provider);
    bottom.append(createdAt, activeLabel);
    button.append(top, bottom);

    button.addEventListener("click", () => {
      if (!state.loading && !state.configForm.saving && !state.configForm.testing) {
        setConversationModel(model.id);
      }
    });

    elements.modelList.appendChild(button);
  }
}

function renderConversationList(options = {}) {
  const { preserveScrollTop } = options;
  const conversations = getRecentConversations();
  const previousScrollTop =
    typeof preserveScrollTop === "number" ? preserveScrollTop : elements.recentList.scrollTop;
  syncRecentListWindow(conversations);
  const visibleConversations = conversations.slice(0, state.recentList.loadedCount);

  elements.recentList.innerHTML = "";

  for (const conversation of visibleConversations) {
    const row = document.createElement("div");
    row.className = `recent-row${conversation.id === state.activeConversationId ? " active" : ""}${
      conversation.pinned ? " pinned" : ""
    }${state.openRecentMenuConversationId === conversation.id ? " menu-open" : ""}`;

    const button = document.createElement("button");
    button.type = "button";
    button.className = `recent-item${conversation.id === state.activeConversationId ? " active" : ""}`;
    button.disabled = state.loading || state.configForm.saving || state.configForm.testing;

    const icon = document.createElement("span");
    icon.className = "recent-item-icon";
    icon.innerHTML = iconMarkup.recent;

    const body = document.createElement("div");
    body.className = "recent-item-body";

    const title = document.createElement("span");
    title.className = "recent-item-title";
    title.textContent = conversation.title;

    const titleHead = document.createElement("div");
    titleHead.className = "recent-item-head";
    titleHead.appendChild(title);

    if (conversation.pinned) {
      const pinnedBadge = document.createElement("span");
      pinnedBadge.className = "recent-pin-badge";
      pinnedBadge.setAttribute("aria-label", "已置顶");
      pinnedBadge.title = "已置顶";
      pinnedBadge.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4h6v3l2 2v1H7V9l2-2V4Zm3 6v10" /></svg>';
      titleHead.appendChild(pinnedBadge);
    }

    const preview = document.createElement("span");
    preview.className = "recent-item-preview";
    preview.textContent = getConversationPreview(conversation);

    const time = document.createElement("span");
    time.className = "recent-item-time";
    time.textContent = formatRelativeTime(conversation.updatedAt);

    body.append(titleHead, preview);
    button.append(icon, body, time);
    button.addEventListener("click", () => {
      if (!state.loading && !state.configForm.saving && !state.configForm.testing) {
        state.openRecentMenuConversationId = "";
        setActiveConversation(conversation.id);
      }
    });

    const menuWrap = document.createElement("div");
    menuWrap.className = "recent-more-wrap";

    const menuTrigger = document.createElement("button");
    menuTrigger.type = "button";
    menuTrigger.className = "recent-more-trigger";
    menuTrigger.setAttribute("aria-label", "更多操作");
    menuTrigger.setAttribute(
      "aria-expanded",
      String(state.openRecentMenuConversationId === conversation.id)
    );
    menuTrigger.innerHTML = iconMarkup.more;
    menuTrigger.disabled = state.loading || state.configForm.saving || state.configForm.testing;
    menuTrigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (state.loading || state.configForm.saving || state.configForm.testing) {
        return;
      }

      toggleRecentConversationMenu(conversation.id);
    });
    menuWrap.appendChild(menuTrigger);

    if (state.openRecentMenuConversationId === conversation.id) {
      const menu = document.createElement("div");
      menu.className = "recent-more-menu";

      const pinButton = document.createElement("button");
      pinButton.type = "button";
      pinButton.className = "recent-more-option";
      pinButton.textContent = conversation.pinned ? "取消置顶" : "置顶";
      pinButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        state.openRecentMenuConversationId = "";
        toggleConversationPinned(conversation.id);
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "recent-more-option danger";
      deleteButton.textContent = "删除";
      deleteButton.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await deleteConversationById(conversation.id, { requireConfirm: true });
      });

      menu.append(pinButton, deleteButton);
      menuWrap.appendChild(menu);
    }

    row.append(button, menuWrap);
    elements.recentList.appendChild(row);
  }

  const maxScrollTop = Math.max(0, elements.recentList.scrollHeight - elements.recentList.clientHeight);
  elements.recentList.scrollTop = Math.min(previousScrollTop, maxScrollTop);
  window.requestAnimationFrame(() => {
    adjustRecentMenuPlacement();
    ensureRecentListFilled();
  });
}

function createSuggestionChip(text) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "suggestion-chip";
  button.textContent = text;
  button.addEventListener("click", () => {
    focusComposerWithText(text);
  });
  return button;
}

function renderEmptyState() {
  const activeConversation = getActiveConversation();
  const wrapper = document.createElement("div");
  wrapper.className = "empty-state";

  if (!state.adminAuth.authenticated) {
    const title = document.createElement("div");
    title.className = "welcome-title";
    title.textContent = "请先登录";

    const copy = document.createElement("p");
    copy.className = "welcome-copy";
    copy.textContent = "登录后才能开始 AI 对话。注册一个账号即可使用，管理员账号可进入模型中心管理配置和用户。";

    const loginButton = document.createElement("button");
    loginButton.type = "button";
    loginButton.className = "suggestion-chip";
    loginButton.textContent = "立即登录 / 注册";
    loginButton.addEventListener("click", () => {
      openAdminAuthDialog("conversations", "login");
    });

    wrapper.append(title, copy, loginButton);
    elements.chatMessages.innerHTML = "";
    elements.chatMessages.appendChild(wrapper);
    return;
  }

  const title = document.createElement("div");
  title.className = "welcome-title";
  title.textContent = activeConversation?.title || "开始一段新的对话";

  const copy = document.createElement("p");
  copy.className = "welcome-copy";
  copy.textContent = state.models.length
    ? "每个对话都会独立保存上下文、模型和高级设定。你可以左侧新建多个会话，再随时切换回来继续。"
    : "正在连接模型服务，稍等片刻后就可以开始对话。";

  const suggestions = document.createElement("div");
  suggestions.className = "suggestion-grid";

  for (const text of starterPrompts) {
    suggestions.appendChild(createSuggestionChip(text));
  }

  const note = document.createElement("p");
  note.className = "empty-note";
  note.textContent = activeConversation?.modelId ? `当前模型：${activeConversation.modelId}` : "等待选择模型";

  wrapper.append(title, copy, suggestions, note);
  elements.chatMessages.innerHTML = "";
  elements.chatMessages.appendChild(wrapper);
}

function createMessageAction(iconName, label, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "message-action";
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-pressed", "false");
  button.title = label;
  button.innerHTML = iconMarkup[iconName];
  button.addEventListener("click", handler);
  return button;
}

function showCopyActionSuccess(actionButton) {
  if (!(actionButton instanceof HTMLElement)) {
    return;
  }

  const previousTimerId = Number(actionButton.dataset.copyTimerId || "0");

  if (previousTimerId > 0) {
    window.clearTimeout(previousTimerId);
  }

  actionButton.classList.add("copied");
  actionButton.innerHTML = iconMarkup.check;

  const nextTimerId = window.setTimeout(() => {
    actionButton.classList.remove("copied");
    actionButton.innerHTML = iconMarkup.copy;
    delete actionButton.dataset.copyTimerId;
  }, 2000);

  actionButton.dataset.copyTimerId = String(nextTimerId);
}

function syncFeedbackActionState(likeButton, dislikeButton, feedback) {
  likeButton.classList.toggle("active", feedback === "like");
  dislikeButton.classList.toggle("active", feedback === "dislike");
  likeButton.setAttribute("aria-pressed", String(feedback === "like"));
  dislikeButton.setAttribute("aria-pressed", String(feedback === "dislike"));
}

function toggleMessageFeedback(message, nextFeedback) {
  const normalized = normalizeMessageFeedback(nextFeedback);

  if (!normalized) {
    return;
  }

  message.feedback = message.feedback === normalized ? "" : normalized;
  persistConversationState();
}

function createMessageElement(message) {
  const article = document.createElement("article");
  article.className = `message-row ${message.role}`;
  article.dataset.messageId = message.id;

  if (message.role === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "assistant-avatar";
    avatar.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.75a4.47 4.47 0 0 1 4.37 3.53 4.46 4.46 0 0 1 3.6 6.58 4.46 4.46 0 0 1-1.48 5.61 4.47 4.47 0 0 1-6.11 2.38 4.47 4.47 0 0 1-6.11-2.38 4.46 4.46 0 0 1-1.48-5.61 4.46 4.46 0 0 1 3.6-6.58A4.47 4.47 0 0 1 12 2.75Zm-2.4 4.54-1.76 1.02-.02 2.03 1.74 1.02 1.76-1.01.02-2.04-1.74-1.02Zm4.81 0-1.76 1.02-.02 2.03 1.74 1.02 1.76-1.01.02-2.04-1.74-1.02Zm-2.4 4.15-1.76 1.02-.02 2.03 1.74 1.02 1.76-1.01.02-2.04-1.74-1.02Z" /></svg>';

    const stack = document.createElement("div");
    stack.className = "assistant-stack";

    const card = document.createElement("div");
    card.className = `message-card assistant-card${message.streaming ? " streaming" : ""}`;

    const text = document.createElement("div");
    text.className = "message-text";
    text.textContent = getMessageTextContent(message);

    const footer = document.createElement("div");
    footer.className = "message-footer";

    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = formatMessageTime(message);
    footer.appendChild(time);

    card.append(text, footer);

    const actions = document.createElement("div");
    actions.className = "message-actions";
    const copyAction = createMessageAction("copy", "澶嶅埗鍥炲", async (event) => {
      try {
        const actionButton = event.currentTarget;
        await copyText(getMessageTextContent(message));
        showCopyActionSuccess(actionButton);
      } catch (error) {
        showError("澶嶅埗澶辫触锛岃绋嶅悗閲嶈瘯銆?");
      }
    });
    const likeAction = createMessageAction("like", "鏈夊府鍔?", () => {
      toggleMessageFeedback(message, "like");
      syncFeedbackActionState(likeAction, dislikeAction, message.feedback);
    });
    const dislikeAction = createMessageAction("dislike", "娌″府鍔?", () => {
      toggleMessageFeedback(message, "dislike");
      syncFeedbackActionState(likeAction, dislikeAction, message.feedback);
    });
    syncFeedbackActionState(likeAction, dislikeAction, normalizeMessageFeedback(message.feedback));
    actions.append(copyAction, likeAction, dislikeAction);

    stack.append(card, actions);
    article.append(avatar, stack);
    return article;
  }

  const stack = document.createElement("div");
  stack.className = "user-stack";

  const card = document.createElement("div");
  card.className = "message-card user-card";
  const text = document.createElement("div");
  text.className = "message-text";
  text.textContent = getMessageTextContent(message);
  card.appendChild(text);

  const footer = document.createElement("div");
  footer.className = "message-footer";

  const time = document.createElement("span");
  time.className = "message-time";
  time.textContent = formatMessageTime(message);
  footer.appendChild(time);

  card.appendChild(footer);
  stack.appendChild(card);

  const avatar = document.createElement("div");
  avatar.className = "user-avatar";
  avatar.textContent = "浣?";

  article.append(stack, avatar);
  return article;
}

function scrollChatToBottom() {
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function renderMessages() {
  const activeConversation = getActiveConversation();

  if (!activeConversation || !activeConversation.messages.length) {
    renderEmptyState();
    return;
  }

  const list = document.createElement("div");
  list.className = "message-list";

  for (const message of activeConversation.messages) {
    list.appendChild(createMessageElement(message));
  }

  elements.chatMessages.innerHTML = "";
  elements.chatMessages.appendChild(list);
  scrollChatToBottom();
}

function syncMessageElement(message) {
  const article = elements.chatMessages.querySelector(`[data-message-id="${message.id}"]`);

  if (!article) {
    renderMessages();
    return;
  }

  const card = article.querySelector(".message-card");
  const text = article.querySelector(".message-text");
  const time = article.querySelector(".message-time");

  if (card) {
    card.classList.toggle("streaming", Boolean(message.streaming));
  }

  if (text) {
    text.textContent = getMessageTextContent(message);
  }

  if (time) {
    time.textContent = formatMessageTime(message);
  }

  scrollChatToBottom();
}

function setConfigButtonsState() {
  const isBusy = state.configForm.saving || state.configForm.testing;
  const canEditAdminConfig = isAdminUser() && !isBusy && !state.loading;

  elements.saveConfigButton.disabled = !canEditAdminConfig;
  elements.testConfigButton.disabled = !canEditAdminConfig;
  elements.refreshModelsButton.disabled = isBusy || state.loading;
  elements.modelSearchInput.disabled = isBusy;
  elements.configApiBaseUrlInput.disabled = !canEditAdminConfig;
  elements.configApiKeyInput.disabled = !canEditAdminConfig;
  elements.createUserButton.disabled = !canEditAdminConfig || state.adminAuth.creatingUser;
  elements.createUserUsernameInput.disabled = !canEditAdminConfig || state.adminAuth.creatingUser;
  elements.createUserPasswordInput.disabled = !canEditAdminConfig || state.adminAuth.creatingUser;
  elements.createUserRoleSelect.disabled = !canEditAdminConfig || state.adminAuth.creatingUser;
  elements.publishAnnouncementButton.disabled = !canEditAdminConfig || state.announcements.publishing;
  elements.announcementTitleInput.disabled = !canEditAdminConfig || state.announcements.publishing;
  elements.announcementContentInput.disabled = !canEditAdminConfig || state.announcements.publishing;
  elements.adminAuthButton.disabled = state.adminAuth.loggingIn;

  elements.saveConfigButton.textContent = state.configForm.saving ? "淇濆瓨涓?.." : "淇濆瓨閰嶇疆";
  elements.testConfigButton.textContent = state.configForm.testing ? "娴嬭瘯涓?.." : "娴嬭瘯杩為€氭€?";
}

function setLoading(isLoading) {
  const activeConversation = getActiveConversation();

  state.loading = isLoading;
  elements.newChatButton.disabled = isLoading || state.configForm.saving || state.configForm.testing;
  elements.clearChatButton.disabled = isLoading || state.configForm.saving || state.configForm.testing;
  elements.conversationNavButton.disabled = isLoading || state.configForm.saving || state.configForm.testing;
  elements.modelNavButton.disabled = isLoading || state.configForm.saving || state.configForm.testing;
  elements.modelSelect.disabled = isLoading || !state.models.length;
  setConfigButtonsState();
  renderConversationList();
  renderModelList();
  renderModelSelect();

  if (isLoading) {
    elements.sendButton.disabled = !state.adminAuth.authenticated;
    elements.sendButton.classList.add("stop");
    elements.sendButton.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7z" /></svg>';
    elements.composerHint.textContent = `姝ｅ湪浣跨敤 ${activeConversation?.modelId || "褰撳墠妯″瀷"} 閫愬瓧鐢熸垚锛岀偣鍑绘寜閽彲鍋滄銆俙`;
    return;
  }

  elements.sendButton.disabled = !activeConversation?.modelId || !state.adminAuth.authenticated;
  elements.sendButton.classList.remove("stop");
  elements.sendButton.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 19 4l-4.5 16-3.28-6.22L4 11.5Zm7.22 2.28L19 4" /></svg>';
  updateSelectedModelView();
}

function buildRequestMessages() {
  const activeConversation = getActiveConversation();

  if (!activeConversation) {
    return [];
  }

  const systemPrompt = activeConversation.systemPrompt.trim();
  const conversationMessages = activeConversation.messages
    .filter((message) => {
      return (
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
      );
    })
    .map(({ role, content }) => ({ role, content }));

  if (!systemPrompt) {
    return conversationMessages;
  }

  return [{ role: "system", content: systemPrompt }, ...conversationMessages];
}

function extractTextContent(content) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (typeof item?.text === "string") {
        return item.text;
      }

      if (typeof item?.content === "string") {
        return item.content;
      }

      return "";
    })
    .join("");
}

function extractStreamDelta(payload) {
  return extractTextContent(payload?.choices?.[0]?.delta?.content);
}

function parseErrorPayload(payload, fallbackMessage) {
  if (!payload) {
    return fallbackMessage;
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (typeof payload.detail === "string" && payload.detail.trim()) {
    return payload.detail;
  }

  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  if (payload.error && typeof payload.error.message === "string" && payload.error.message.trim()) {
    return payload.error.message;
  }

  return fallbackMessage;
}

function dispatchSseEvent(rawEvent, onEvent) {
  const normalized = rawEvent.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return;
  }

  let eventName = "message";
  const dataLines = [];

  for (const line of normalized.split("\n")) {
    if (!line || line.startsWith(":")) {
      continue;
    }

    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length) {
    onEvent(eventName, dataLines.join("\n"));
  }
}

function processSseBuffer(buffer, onEvent) {
  while (true) {
    const match = buffer.match(/\r?\n\r?\n/);

    if (!match || typeof match.index !== "number") {
      return buffer;
    }

    const rawEvent = buffer.slice(0, match.index);
    buffer = buffer.slice(match.index + match[0].length);
    dispatchSseEvent(rawEvent, onEvent);
  }
}

function createTypingController(message) {
  const controller = {
    message,
    queue: [],
    sourceDone: false,
    running: false,
    cancelled: false,
    completed: false,
    wake: null,
    resolveDone: null,
    donePromise: null
  };

  controller.donePromise = new Promise((resolve) => {
    controller.resolveDone = resolve;
  });

  return controller;
}

function completeTypingController(controller) {
  if (controller.completed) {
    return;
  }

  controller.completed = true;
  controller.running = false;

  if (controller.resolveDone) {
    controller.resolveDone();
  }
}

async function runTypingController(controller) {
  if (controller.running || controller.completed) {
    return controller.donePromise;
  }

  controller.running = true;

  try {
    while (!controller.cancelled) {
      if (!controller.queue.length) {
        if (controller.sourceDone) {
          break;
        }

        await new Promise((resolve) => {
          controller.wake = resolve;
        });
        controller.wake = null;
        continue;
      }

      controller.message.content += controller.queue.shift();
      syncMessageElement(controller.message);
      await sleep(typingIntervalMs);
    }
  } finally {
    completeTypingController(controller);
  }

  return controller.donePromise;
}

function wakeTypingController(controller) {
  if (controller.wake) {
    const resolve = controller.wake;
    controller.wake = null;
    resolve();
  }
}

function enqueueTypingText(controller, text) {
  const parts = splitIntoGraphemes(text);

  if (!parts.length || controller.cancelled) {
    return;
  }

  controller.queue.push(...parts);
  wakeTypingController(controller);
  runTypingController(controller);
}

function finishTypingController(controller) {
  controller.sourceDone = true;
  wakeTypingController(controller);
  runTypingController(controller);
  return controller.donePromise;
}

function cancelTypingController(controller) {
  if (!controller || controller.completed) {
    return;
  }

  controller.cancelled = true;
  controller.queue.length = 0;
  wakeTypingController(controller);

  if (!controller.running) {
    completeTypingController(controller);
  }
}

function stopStreaming() {
  if (state.abortController) {
    state.abortController.abort();
  }

  if (state.typingController) {
    cancelTypingController(state.typingController);
  }
}

async function streamAssistantReply(requestPayload, assistantMessage) {
  const controller = new AbortController();
  const typingController = createTypingController(assistantMessage);
  state.abortController = controller;
  state.typingController = typingController;

  try {
    const response = await fetch("/api/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal
    });

    if (!response.ok) {
      let payload = null;

      try {
        payload = await response.json();
      } catch (error) {
        payload = null;
      }

      if (response.status === 401) {
        handleAdminUnauthorized("登录已失效，请重新登录。");
      }

      throw new Error(parseErrorPayload(payload, "瀵硅瘽璇锋眰澶辫触銆?"));
    }

    if (!response.body) {
      throw new Error("褰撳墠娴忚鍣ㄤ笉鏀寔娴佸紡鍝嶅簲銆?");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      buffer = processSseBuffer(buffer, (eventName, data) => {
        if (eventName === "error") {
          let payload = null;

          try {
            payload = JSON.parse(data);
          } catch (error) {
            payload = data;
          }

          throw new Error(parseErrorPayload(payload, "娴佸紡鍝嶅簲澶辫触銆?"));
        }

        if (data === "[DONE]") {
          return;
        }

        let payload = null;

        try {
          payload = JSON.parse(data);
        } catch (error) {
          return;
        }

        const deltaText = extractStreamDelta(payload);

        if (deltaText) {
          enqueueTypingText(typingController, deltaText);
        }
      });
    }

    const trailing = decoder.decode();

    if (trailing) {
      buffer += trailing;
    }

    if (buffer.trim()) {
      dispatchSseEvent(buffer, (eventName, data) => {
        if (eventName === "error") {
          let payload = null;

          try {
            payload = JSON.parse(data);
          } catch (error) {
            payload = data;
          }

          throw new Error(parseErrorPayload(payload, "娴佸紡鍝嶅簲澶辫触銆?"));
        }

        if (data === "[DONE]") {
          return;
        }

        let payload = null;

        try {
          payload = JSON.parse(data);
        } catch (error) {
          return;
        }

        const deltaText = extractStreamDelta(payload);

        if (deltaText) {
          enqueueTypingText(typingController, deltaText);
        }
      });
    }

    await finishTypingController(typingController);
  } catch (error) {
    cancelTypingController(typingController);
    throw error;
  }
}

async function copyText(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function focusComposerWithText(text) {
  setSidebarTab("conversations");
  elements.userInput.value = text;
  autoResizeComposer();
}

function createMessageElement(message) {
  const article = document.createElement("article");
  article.className = `message-row ${message.role}`;
  article.dataset.messageId = message.id;

  if (message.role === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "assistant-avatar";
    avatar.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.75a4.47 4.47 0 0 1 4.37 3.53 4.46 4.46 0 0 1 3.6 6.58 4.46 4.46 0 0 1-1.48 5.61 4.47 4.47 0 0 1-6.11 2.38 4.47 4.47 0 0 1-6.11-2.38 4.46 4.46 0 0 1-1.48-5.61 4.46 4.46 0 0 1 3.6-6.58A4.47 4.47 0 0 1 12 2.75Zm-2.4 4.54-1.76 1.02-.02 2.03 1.74 1.02 1.76-1.01.02-2.04-1.74-1.02Zm4.81 0-1.76 1.02-.02 2.03 1.74 1.02 1.76-1.01.02-2.04-1.74-1.02Zm-2.4 4.15-1.76 1.02-.02 2.03 1.74 1.02 1.76-1.01.02-2.04-1.74-1.02Z" /></svg>';

    const stack = document.createElement("div");
    stack.className = "assistant-stack";

    const card = document.createElement("div");
    card.className = `message-card assistant-card${message.streaming ? " streaming" : ""}`;

    const text = document.createElement("div");
    text.className = "message-text";
    text.textContent = getMessageTextContent(message);

    const footer = document.createElement("div");
    footer.className = "message-footer";

    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = formatMessageTime(message);
    footer.appendChild(time);

    card.append(text, footer);

    const actions = document.createElement("div");
    actions.className = "message-actions";
    const copyAction = createMessageAction("copy", "复制回复", async (event) => {
      try {
        const actionButton = event.currentTarget;
        await copyText(getMessageTextContent(message));
        showCopyActionSuccess(actionButton);
      } catch (error) {
        showError("复制失败，请稍后重试。");
      }
    });
    const likeAction = createMessageAction("like", "有帮助", () => {
      toggleMessageFeedback(message, "like");
      syncFeedbackActionState(likeAction, dislikeAction, message.feedback);
    });
    const dislikeAction = createMessageAction("dislike", "没帮助", () => {
      toggleMessageFeedback(message, "dislike");
      syncFeedbackActionState(likeAction, dislikeAction, message.feedback);
    });
    syncFeedbackActionState(likeAction, dislikeAction, normalizeMessageFeedback(message.feedback));
    actions.append(copyAction, likeAction, dislikeAction);

    stack.append(card, actions);
    article.append(avatar, stack);
    return article;
  }

  const stack = document.createElement("div");
  stack.className = "user-stack";

  const card = document.createElement("div");
  card.className = "message-card user-card";
  const text = document.createElement("div");
  text.className = "message-text";
  text.textContent = getMessageTextContent(message);
  card.appendChild(text);

  const footer = document.createElement("div");
  footer.className = "message-footer";

  const time = document.createElement("span");
  time.className = "message-time";
  time.textContent = formatMessageTime(message);
  footer.appendChild(time);

  card.appendChild(footer);
  stack.appendChild(card);

  const actions = document.createElement("div");
  actions.className = "message-actions";

  const copyAction = createMessageAction("copy", "复制消息", async (event) => {
    try {
      const actionButton = event.currentTarget;
      await copyText(getMessageTextContent(message));
      showCopyActionSuccess(actionButton);
    } catch (error) {
      showError("复制失败，请稍后重试。");
    }
  });
  actions.append(copyAction);
  stack.appendChild(actions);

  const avatar = document.createElement("div");
  avatar.className = "user-avatar";
  avatar.textContent = "你";

  article.append(stack, avatar);
  return article;
}

function scrollChatToBottom() {
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function renderMessages() {
  const activeConversation = getActiveConversation();

  if (!activeConversation || !activeConversation.messages.length) {
    renderEmptyState();
    return;
  }

  const list = document.createElement("div");
  list.className = "message-list";

  for (const message of activeConversation.messages) {
    list.appendChild(createMessageElement(message));
  }

  elements.chatMessages.innerHTML = "";
  elements.chatMessages.appendChild(list);
  scrollChatToBottom();
}

function syncMessageElement(message) {
  const article = elements.chatMessages.querySelector(`[data-message-id="${message.id}"]`);

  if (!article) {
    renderMessages();
    return;
  }

  const card = article.querySelector(".message-card");
  const text = article.querySelector(".message-text");
  const time = article.querySelector(".message-time");

  if (card) {
    card.classList.toggle("streaming", Boolean(message.streaming));
  }

  if (text) {
    text.textContent = getMessageTextContent(message);
  }

  if (time) {
    time.textContent = formatMessageTime(message);
  }

  scrollChatToBottom();
}

function setConfigButtonsState() {
  const isBusy = state.configForm.saving || state.configForm.testing;
  const canEditAdminConfig = isAdminUser() && !isBusy && !state.loading;

  elements.saveConfigButton.disabled = !canEditAdminConfig;
  elements.testConfigButton.disabled = !canEditAdminConfig;
  elements.refreshModelsButton.disabled = isBusy || state.loading;
  elements.modelSearchInput.disabled = isBusy;
  elements.configApiBaseUrlInput.disabled = !canEditAdminConfig;
  elements.configApiKeyInput.disabled = !canEditAdminConfig;
  elements.createUserButton.disabled = !canEditAdminConfig || state.adminAuth.creatingUser;
  elements.createUserUsernameInput.disabled = !canEditAdminConfig || state.adminAuth.creatingUser;
  elements.createUserPasswordInput.disabled = !canEditAdminConfig || state.adminAuth.creatingUser;
  elements.createUserRoleSelect.disabled = !canEditAdminConfig || state.adminAuth.creatingUser;
  elements.adminAuthButton.disabled = state.adminAuth.loggingIn;

  elements.saveConfigButton.textContent = state.configForm.saving ? "保存中..." : "保存配置";
  elements.testConfigButton.textContent = state.configForm.testing ? "测试中..." : "测试连通性";
}

function setLoading(isLoading) {
  const activeConversation = getActiveConversation();

  state.loading = isLoading;
  elements.newChatButton.disabled = isLoading || state.configForm.saving || state.configForm.testing;
  elements.clearChatButton.disabled = isLoading || state.configForm.saving || state.configForm.testing;
  elements.conversationNavButton.disabled = isLoading || state.configForm.saving || state.configForm.testing;
  elements.modelNavButton.disabled = isLoading || state.configForm.saving || state.configForm.testing;
  elements.modelSelect.disabled = isLoading || !state.models.length;
  setConfigButtonsState();
  renderConversationList();
  renderModelList();
  renderModelSelect();

  if (isLoading) {
    elements.sendButton.disabled = !state.adminAuth.authenticated;
    elements.sendButton.classList.add("stop");
    elements.sendButton.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7z" /></svg>';
    elements.composerHint.textContent = `正在使用 ${activeConversation?.modelId || "当前模型"} 逐字生成，点击按钮可停止。`;
    return;
  }

  elements.sendButton.disabled = !activeConversation?.modelId || !state.adminAuth.authenticated;
  elements.sendButton.classList.remove("stop");
  elements.sendButton.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 19 4l-4.5 16-3.28-6.22L4 11.5Zm7.22 2.28L19 4" /></svg>';
  updateSelectedModelView();
}

function buildRequestMessages() {
  const activeConversation = getActiveConversation();

  if (!activeConversation) {
    return [];
  }

  const systemPrompt = activeConversation.systemPrompt.trim();
  const conversationMessages = activeConversation.messages
    .filter((message) => {
      return (
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
      );
    })
    .map(({ role, content }) => ({ role, content }));

  if (!systemPrompt) {
    return conversationMessages;
  }

  return [{ role: "system", content: systemPrompt }, ...conversationMessages];
}

function extractTextContent(content) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (typeof item?.text === "string") {
        return item.text;
      }

      if (typeof item?.content === "string") {
        return item.content;
      }

      return "";
    })
    .join("");
}

function extractStreamDelta(payload) {
  return extractTextContent(payload?.choices?.[0]?.delta?.content);
}

function parseErrorPayload(payload, fallbackMessage) {
  if (!payload) {
    return fallbackMessage;
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (typeof payload.detail === "string" && payload.detail.trim()) {
    return payload.detail;
  }

  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  if (payload.error && typeof payload.error.message === "string" && payload.error.message.trim()) {
    return payload.error.message;
  }

  return fallbackMessage;
}

function dispatchSseEvent(rawEvent, onEvent) {
  const normalized = rawEvent.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return;
  }

  let eventName = "message";
  const dataLines = [];

  for (const line of normalized.split("\n")) {
    if (!line || line.startsWith(":")) {
      continue;
    }

    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length) {
    onEvent(eventName, dataLines.join("\n"));
  }
}

function processSseBuffer(buffer, onEvent) {
  while (true) {
    const match = buffer.match(/\r?\n\r?\n/);

    if (!match || typeof match.index !== "number") {
      return buffer;
    }

    const rawEvent = buffer.slice(0, match.index);
    buffer = buffer.slice(match.index + match[0].length);
    dispatchSseEvent(rawEvent, onEvent);
  }
}

function createTypingController(message) {
  const controller = {
    message,
    queue: [],
    sourceDone: false,
    running: false,
    cancelled: false,
    completed: false,
    wake: null,
    resolveDone: null,
    donePromise: null
  };

  controller.donePromise = new Promise((resolve) => {
    controller.resolveDone = resolve;
  });

  return controller;
}

function completeTypingController(controller) {
  if (controller.completed) {
    return;
  }

  controller.completed = true;
  controller.running = false;

  if (controller.resolveDone) {
    controller.resolveDone();
  }
}

async function runTypingController(controller) {
  if (controller.running || controller.completed) {
    return controller.donePromise;
  }

  controller.running = true;

  try {
    while (!controller.cancelled) {
      if (!controller.queue.length) {
        if (controller.sourceDone) {
          break;
        }

        await new Promise((resolve) => {
          controller.wake = resolve;
        });
        controller.wake = null;
        continue;
      }

      controller.message.content += controller.queue.shift();
      syncMessageElement(controller.message);
      await sleep(typingIntervalMs);
    }
  } finally {
    completeTypingController(controller);
  }

  return controller.donePromise;
}

function wakeTypingController(controller) {
  if (controller.wake) {
    const resolve = controller.wake;
    controller.wake = null;
    resolve();
  }
}

function enqueueTypingText(controller, text) {
  const parts = splitIntoGraphemes(text);

  if (!parts.length || controller.cancelled) {
    return;
  }

  controller.queue.push(...parts);
  wakeTypingController(controller);
  runTypingController(controller);
}

function finishTypingController(controller) {
  controller.sourceDone = true;
  wakeTypingController(controller);
  runTypingController(controller);
  return controller.donePromise;
}

function cancelTypingController(controller) {
  if (!controller || controller.completed) {
    return;
  }

  controller.cancelled = true;
  controller.queue.length = 0;
  wakeTypingController(controller);

  if (!controller.running) {
    completeTypingController(controller);
  }
}

function stopStreaming() {
  if (state.abortController) {
    state.abortController.abort();
  }

  if (state.typingController) {
    cancelTypingController(state.typingController);
  }
}

async function streamAssistantReply(requestPayload, assistantMessage) {
  const controller = new AbortController();
  const typingController = createTypingController(assistantMessage);
  state.abortController = controller;
  state.typingController = typingController;

  try {
    const response = await fetch("/api/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal
    });

    if (!response.ok) {
      let payload = null;

      try {
        payload = await response.json();
      } catch (error) {
        payload = null;
      }

      if (response.status === 401) {
        handleAdminUnauthorized("登录已失效，请重新登录。");
      }

      throw new Error(parseErrorPayload(payload, "对话请求失败。"));
    }

    if (!response.body) {
      throw new Error("当前浏览器不支持流式响应。");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      buffer = processSseBuffer(buffer, (eventName, data) => {
        if (eventName === "error") {
          let payload = null;

          try {
            payload = JSON.parse(data);
          } catch (error) {
            payload = data;
          }

          throw new Error(parseErrorPayload(payload, "流式响应失败。"));
        }

        if (data === "[DONE]") {
          return;
        }

        let payload = null;

        try {
          payload = JSON.parse(data);
        } catch (error) {
          return;
        }

        const deltaText = extractStreamDelta(payload);

        if (deltaText) {
          enqueueTypingText(typingController, deltaText);
        }
      });
    }

    const trailing = decoder.decode();

    if (trailing) {
      buffer += trailing;
    }

    if (buffer.trim()) {
      dispatchSseEvent(buffer, (eventName, data) => {
        if (eventName === "error") {
          let payload = null;

          try {
            payload = JSON.parse(data);
          } catch (error) {
            payload = data;
          }

          throw new Error(parseErrorPayload(payload, "流式响应失败。"));
        }

        if (data === "[DONE]") {
          return;
        }

        let payload = null;

        try {
          payload = JSON.parse(data);
        } catch (error) {
          return;
        }

        const deltaText = extractStreamDelta(payload);

        if (deltaText) {
          enqueueTypingText(typingController, deltaText);
        }
      });
    }

    await finishTypingController(typingController);
  } catch (error) {
    cancelTypingController(typingController);
    throw error;
  }
}

async function copyText(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function focusComposerWithText(text) {
  setSidebarTab("conversations");
  elements.userInput.value = text;
  autoResizeComposer();
}

function refreshConversationMetadata(conversation) {
  conversation.title = deriveConversationTitle(conversation.messages);
  conversation.updatedAt = Date.now();
}

function createUserMessage(content) {
  return {
    id: createId("user"),
    role: "user",
    content,
    model: "",
    timestamp: Date.now()
  };
}

function createAssistantMessage(modelId) {
  return {
    id: createId("assistant"),
    role: "assistant",
    content: "",
    model: modelId,
    timestamp: Date.now(),
    feedback: "",
    streaming: true
  };
}

function setConversationModel(modelId) {
  const activeConversation = getActiveConversation();

  if (!activeConversation) {
    return;
  }

  activeConversation.modelId = modelId;
  persistConversationState();
  renderConversationList();
  renderModelSelect();
  renderModelList();
  updateSelectedModelView();
  renderMessages();
}

function setActiveConversation(conversationId) {
  const targetConversation = state.conversations.find(
    (conversation) => conversation.id === conversationId
  );

  if (!targetConversation) {
    return;
  }

  state.activeConversationId = conversationId;
  state.openRecentMenuConversationId = "";
  ensureConversationModel(targetConversation);
  persistConversationState();
  syncConversationControls();
  renderConversationList();
  renderModelSelect();
  renderModelList();
  updateSelectedModelView();
  renderMessages();
  setSidebarTab("conversations");
}

function createNewConversation() {
  if (state.loading || state.configForm.saving || state.configForm.testing) {
    return;
  }

  const conversation = createConversation();
  ensureConversationModel(conversation);
  state.conversations.push(conversation);
  state.activeConversationId = conversation.id;
  state.openRecentMenuConversationId = "";
  persistConversationState();
  syncConversationControls();
  renderConversationList();
  renderModelSelect();
  renderModelList();
  updateSelectedModelView();
  renderMessages();
  clearError();
  setSidebarTab("conversations");
  elements.userInput.value = "";
  autoResizeComposer();
}

async function loadServerConfig() {
  const response = await fetch("/api/config");
  const payload = await response.json();

  state.apiBaseUrl = payload.apiBaseUrl || "";
  state.keyConfigured = Boolean(payload.keyConfigured);
  renderConfigSummary();
}

async function loadAdminConfig() {
  if (!isAdminUser()) {
    clearAdminConfigState();
    return;
  }

  const response = await fetch("/api/admin/config");
  const payload = await response.json();

  if (response.status === 401) {
    handleAdminUnauthorized();
    return;
  }

  if (response.status === 403) {
    handleAdminForbidden();
    return;
  }

  if (!response.ok) {
    throw new Error(parseErrorPayload(payload, "加载管理员配置失败。"));
  }

  state.configForm.apiBaseUrl = payload.apiBaseUrl || "";
  state.configForm.apiKey = payload.apiKey || "";
  syncConfigFormInputs();
}

async function loadAdminUsers() {
  if (!isAdminUser()) {
    clearAdminUsersState();
    renderUserList();
    return;
  }

  state.adminAuth.usersLoading = true;
  renderUserList();

  try {
    const response = await fetch("/api/admin/users");
    const payload = await response.json();

    if (response.status === 401) {
      handleAdminUnauthorized();
      return;
    }

    if (response.status === 403) {
      handleAdminForbidden();
      return;
    }

    if (!response.ok) {
      throw new Error(parseErrorPayload(payload, "加载用户列表失败。"));
    }

    state.adminAuth.users = Array.isArray(payload.users) ? payload.users : [];
  } catch (error) {
    setUserAdminBanner(error.message || "加载用户列表失败。", "warning");
  } finally {
    state.adminAuth.usersLoading = false;
    renderUserList();
  }
}

async function loadLatestAnnouncement(options = {}) {
  const suppressOlderOrEqualThan = Number(options?.suppressOlderOrEqualThan) || 0;

  if (!state.adminAuth.authenticated) {
    clearAnnouncementNotice();
    return;
  }

  state.announcements.dismissedLatestId = getDismissedAnnouncementIdForAccount(
    state.conversationAccountKey
  );

  try {
    const response = await fetch("/api/announcements");
    const payload = await response.json();

    if (response.status === 401) {
      handleAdminUnauthorized();
      clearAnnouncementNotice();
      return;
    }

    if (!response.ok) {
      throw new Error(parseErrorPayload(payload, "加载公告失败。"));
    }

    const announcements = Array.isArray(payload.announcements) ? payload.announcements : [];
    const latestAnnouncement = announcements[0] || null;
    const latestAnnouncementId = String(latestAnnouncement?.id || "").trim();
    const latestAnnouncementCreatedAt = Number(
      latestAnnouncement?.createdAt || latestAnnouncement?.updatedAt || 0
    );

    state.announcements.latest = latestAnnouncement;

    if (
      suppressOlderOrEqualThan > 0 &&
      latestAnnouncementId &&
      latestAnnouncementCreatedAt > 0 &&
      latestAnnouncementCreatedAt <= suppressOlderOrEqualThan
    ) {
      state.announcements.dismissedLatestId = latestAnnouncementId;
      persistDismissedAnnouncementIdForAccount(latestAnnouncementId, state.conversationAccountKey);
    }

    if (!latestAnnouncementId && state.announcements.dismissedLatestId) {
      state.announcements.dismissedLatestId = "";
      persistDismissedAnnouncementIdForAccount("", state.conversationAccountKey);
    } else if (
      latestAnnouncementId &&
      state.announcements.dismissedLatestId &&
      String(state.announcements.dismissedLatestId) !== latestAnnouncementId
    ) {
      state.announcements.dismissedLatestId = "";
      persistDismissedAnnouncementIdForAccount("", state.conversationAccountKey);
    }

    renderAnnouncementNotice();
  } catch (error) {
    clearAnnouncementNotice();
  }
}

async function loadAdminAnnouncements() {
  if (!isAdminUser()) {
    clearAdminAnnouncementsState();
    renderAnnouncementList();
    return;
  }

  state.adminAuth.announcementsLoading = true;
  renderAnnouncementList();

  try {
    const response = await fetch("/api/admin/announcements");
    const payload = await response.json();

    if (response.status === 401) {
      handleAdminUnauthorized();
      return;
    }

    if (response.status === 403) {
      handleAdminForbidden();
      return;
    }

    if (!response.ok) {
      throw new Error(parseErrorPayload(payload, "加载公告列表失败。"));
    }

    state.announcements.list = Array.isArray(payload.announcements) ? payload.announcements : [];
  } catch (error) {
    setAnnouncementBanner(error.message || "加载公告列表失败。", "warning");
  } finally {
    state.adminAuth.announcementsLoading = false;
    renderAnnouncementList();
  }
}

async function publishAnnouncement() {
  if (!requireAdminAccess("announcements")) {
    return;
  }

  const title = elements.announcementTitleInput.value.trim();
  const content = elements.announcementContentInput.value.trim();

  if (!content) {
    setAnnouncementBanner("请输入公告内容。", "warning");
    return;
  }

  state.announcements.publishing = true;
  setAnnouncementBanner("");
  setConfigButtonsState();

  try {
    const response = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title, content })
    });
    const payload = await response.json();

    if (response.status === 401) {
      handleAdminUnauthorized();
      return;
    }

    if (response.status === 403) {
      handleAdminForbidden();
      return;
    }

    if (!response.ok) {
      throw new Error(parseErrorPayload(payload, "发布公告失败。"));
    }

    elements.announcementTitleInput.value = "";
    elements.announcementContentInput.value = "";
    setAnnouncementBanner(payload.message || "公告发布成功。", "success");
    await loadAdminAnnouncements();
    await loadLatestAnnouncement();
  } catch (error) {
    setAnnouncementBanner(error.message || "发布公告失败。", "warning");
  } finally {
    state.announcements.publishing = false;
    setConfigButtonsState();
    renderAnnouncementList();
  }
}

async function deleteAnnouncement(announcementId, announcementTitle) {
  if (!requireAdminAccess("announcements")) {
    return;
  }

  const deletingAnnouncementId = String(announcementId || "").trim();
  const currentLatestAnnouncement = state.announcements.latest;
  const isDeletingCurrentLatest =
    Boolean(deletingAnnouncementId) &&
    deletingAnnouncementId === String(currentLatestAnnouncement?.id || "").trim();
  const currentLatestCreatedAt = Number(
    currentLatestAnnouncement?.createdAt || currentLatestAnnouncement?.updatedAt || 0
  );

  const confirmed = await requestDeleteConfirmation(announcementTitle || "该公告", {
    dialogTitle: "删除公告？"
  });

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/announcements/${encodeURIComponent(announcementId)}`, {
      method: "DELETE"
    });
    const payload = await response.json();

    if (response.status === 401) {
      handleAdminUnauthorized();
      return;
    }

    if (response.status === 403) {
      handleAdminForbidden();
      return;
    }

    if (!response.ok) {
      throw new Error(parseErrorPayload(payload, "删除公告失败。"));
    }

    setAnnouncementBanner(payload.message || "公告已删除。", "success");
    await loadAdminAnnouncements();

    if (isDeletingCurrentLatest && currentLatestCreatedAt > 0) {
      await loadLatestAnnouncement({
        suppressOlderOrEqualThan: currentLatestCreatedAt
      });
    } else {
      await loadLatestAnnouncement();
    }
  } catch (error) {
    setAnnouncementBanner(error.message || "删除公告失败。", "warning");
  }
}

async function createManagedUser() {
  if (!requireAdminAccess("users")) {
    return;
  }

  const username = elements.createUserUsernameInput.value.trim();
  const password = elements.createUserPasswordInput.value;
  const role = elements.createUserRoleSelect.value === "admin" ? "admin" : "user";

  if (!username) {
    setUserAdminBanner("请输入用户名。", "warning");
    return;
  }

  if (!String(password || "").trim()) {
    setUserAdminBanner("请输入初始密码。", "warning");
    return;
  }

  state.adminAuth.creatingUser = true;
  elements.createUserButton.disabled = true;
  setUserAdminBanner("");

  try {
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password, role })
    });
    const payload = await response.json();

    if (response.status === 401) {
      handleAdminUnauthorized();
      return;
    }

    if (response.status === 403) {
      handleAdminForbidden();
      return;
    }

    if (!response.ok) {
      throw new Error(parseErrorPayload(payload, "创建用户失败。"));
    }

    elements.createUserUsernameInput.value = "";
    elements.createUserPasswordInput.value = "";
    elements.createUserRoleSelect.value = "user";
    setUserAdminBanner(payload.message || "用户创建成功。", "success");
    await loadAdminUsers();
  } catch (error) {
    setUserAdminBanner(error.message || "创建用户失败。", "warning");
  } finally {
    state.adminAuth.creatingUser = false;
    elements.createUserButton.disabled = false;
    renderUserList();
  }
}

async function updateManagedUserRole(userId, role) {
  if (!requireAdminAccess("users")) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ role })
    });
    const payload = await response.json();

    if (response.status === 401) {
      handleAdminUnauthorized();
      return;
    }

    if (response.status === 403) {
      handleAdminForbidden();
      return;
    }

    if (!response.ok) {
      throw new Error(parseErrorPayload(payload, "更新用户角色失败。"));
    }

    setUserAdminBanner(payload.message || "用户角色已更新。", "success");
    await loadAdminUsers();
  } catch (error) {
    setUserAdminBanner(error.message || "更新用户角色失败。", "warning");
    await loadAdminUsers();
  }
}

async function deleteManagedUser(userId, username) {
  if (!requireAdminAccess("users")) {
    return;
  }

  const confirmed = await requestDeleteConfirmation(username || "该用户", {
    dialogTitle: "删除用户？"
  });

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: "DELETE"
    });
    const payload = await response.json();

    if (response.status === 401) {
      handleAdminUnauthorized();
      return;
    }

    if (response.status === 403) {
      handleAdminForbidden();
      return;
    }

    if (!response.ok) {
      throw new Error(parseErrorPayload(payload, "删除用户失败。"));
    }

    setUserAdminBanner(payload.message || "用户已删除。", "success");
    await loadAdminUsers();
  } catch (error) {
    setUserAdminBanner(error.message || "删除用户失败。", "warning");
  }
}

async function loadModels() {
  clearError();
  setConnectionStatus("正在获取模型列表...");
  elements.modelList.innerHTML = '<div class="empty-state compact">正在拉取模型列表...</div>';

  try {
    const response = await fetch("/api/models");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(parseErrorPayload(payload, "获取模型失败。"));
    }

    state.models = Array.isArray(payload.data) ? payload.data : [];

    if (!state.models.length) {
      renderConversationList();
      renderModelSelect();
      renderModelList();
      updateSelectedModelView();
      renderConfigSummary();
      setConnectionStatus("已连接，但暂无模型");
      elements.sendButton.disabled = true;
      return;
    }

    synchronizeConversationModels();
    syncConversationControls();
    renderConversationList();
    renderModelSelect();
    renderModelList();
    updateSelectedModelView();
    renderMessages();
    renderConfigSummary();
    setConnectionStatus(`连接正常 · 已加载 ${state.models.length} 个模型`, true);
    elements.sendButton.disabled = !state.adminAuth.authenticated;
  } catch (error) {
    state.models = [];
    renderConversationList();
    renderModelSelect();
    renderModelList();
    updateSelectedModelView();
    renderConfigSummary();
    setConnectionStatus("连接失败");
    showError(error.message || "无法获取模型列表。");
    elements.sendButton.disabled = true;
  }
}

async function saveApiConfig() {
  if (!requireAdminAccess("models")) {
    return;
  }

  const apiBaseUrl = elements.configApiBaseUrlInput.value.trim();
  const apiKey = elements.configApiKeyInput.value.trim();

  state.configForm.saving = true;
  setConfigButtonsState();
  setInlineBanner("");

  try {
    const response = await fetch("/api/admin/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ apiBaseUrl, apiKey })
    });

    const payload = await response.json();

    if (response.status === 401) {
      handleAdminUnauthorized();
      return;
    }

    if (!response.ok) {
      throw new Error(parseErrorPayload(payload, "保存配置失败。"));
    }

    state.configForm.apiBaseUrl = payload.apiBaseUrl || apiBaseUrl;
    state.configForm.apiKey = payload.apiKey || apiKey;
    syncConfigFormInputs();
    setInlineBanner(payload.message || "配置已保存。", "success");
    await loadServerConfig();
    await loadAdminConfig();
    await loadModels();
  } catch (error) {
    setInlineBanner(error.message || "保存配置失败。", "warning");
  } finally {
    state.configForm.saving = false;
    setConfigButtonsState();
  }
}

async function testApiConfig() {
  if (!requireAdminAccess("models")) {
    return;
  }

  const apiBaseUrl = elements.configApiBaseUrlInput.value.trim();
  const apiKey = elements.configApiKeyInput.value.trim();

  state.configForm.testing = true;
  state.configForm.testResult = null;
  renderTestResult();
  setConfigButtonsState();
  setInlineBanner("");

  try {
    const response = await fetch("/api/admin/config/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ apiBaseUrl, apiKey })
    });

    const payload = await response.json();

    if (response.status === 401) {
      handleAdminUnauthorized();
      return;
    }

    if (!response.ok) {
      throw new Error(parseErrorPayload(payload, "测试失败。"));
    }

    state.configForm.testResult = {
      ok: true,
      apiBaseUrl: payload.apiBaseUrl,
      modelCount: payload.modelCount,
      sampleModels: payload.sampleModels || []
    };
    renderTestResult();
    setInlineBanner("测试成功，可以正常获取模型列表。", "success");
  } catch (error) {
    state.configForm.testResult = {
      ok: false,
      detail: error.message || "测试失败。"
    };
    renderTestResult();
    setInlineBanner("测试失败，请检查 API 地址与密钥。", "warning");
  } finally {
    state.configForm.testing = false;
    setConfigButtonsState();
  }
}

async function sendMessage(event) {
  event.preventDefault();

  if (state.loading) {
    stopStreaming();
    return;
  }

  if (!requireUserAccess()) {
    return;
  }

  const activeConversation = getActiveConversation();
  const content = elements.userInput.value.trim();

  if (!content) {
    showError("请输入消息。");
    return;
  }

  if (!activeConversation?.modelId) {
    showError("请先选择一个模型。");
    return;
  }

  clearError();

  const userMessage = createUserMessage(content);
  activeConversation.messages.push(userMessage);
  refreshConversationMetadata(activeConversation);

  const requestPayload = {
    model: activeConversation.modelId,
    temperature: clampTemperature(activeConversation.temperature),
    messages: buildRequestMessages(),
    webEnabled: state.webSearchEnabled
  };

  const assistantMessage = createAssistantMessage(activeConversation.modelId);
  activeConversation.messages.push(assistantMessage);
  persistConversationState();

  elements.userInput.value = "";
  autoResizeComposer();
  renderConversationList();
  renderMessages();
  setLoading(true);

  try {
    await streamAssistantReply(requestPayload, assistantMessage);

    if (!assistantMessage.content.trim()) {
      assistantMessage.content = "模型未返回文本内容。";
    }
  } catch (error) {
    if (error.name === "AbortError") {
      if (!assistantMessage.content.trim()) {
        assistantMessage.content = "已停止生成。";
      }
    } else {
      if (!assistantMessage.content.trim()) {
        activeConversation.messages = activeConversation.messages.filter(
          (message) => message.id !== assistantMessage.id
        );
      }

      showError(error.message || "请求模型时发生异常。");
    }
  } finally {
    assistantMessage.streaming = false;
    refreshConversationMetadata(activeConversation);
    state.abortController = null;
    state.typingController = null;
    persistConversationState();
    setLoading(false);
    syncMessageElement(assistantMessage);
    renderConversationList();
    renderMessages();
  }
}

async function clearConversation() {
  const activeConversation = getActiveConversation();

  if (!activeConversation) {
    return;
  }

  await deleteConversationById(activeConversation.id, {
    requireConfirm: true,
    forceConversationTab: true
  });
}

function handleComposerKeydown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    elements.chatForm.requestSubmit();
  }
}

function toggleSettingsPanel() {
  const nextHidden = !elements.settingsPanel.hidden;
  elements.settingsPanel.hidden = nextHidden;
  elements.toggleSettingsButton.classList.toggle("active", !nextHidden);
}

async function bootstrapConversationState() {
  await loadConversationStateForAccount(state.conversationAccountKey);
}

function setConfigButtonsState() {
  const isBusy = state.configForm.saving || state.configForm.testing;
  const canEditAdminConfig = isAdminUser() && !isBusy && !state.loading;

  elements.saveConfigButton.disabled = !canEditAdminConfig;
  elements.testConfigButton.disabled = !canEditAdminConfig;
  elements.refreshModelsButton.disabled = isBusy || state.loading;
  elements.modelSearchInput.disabled = isBusy;
  elements.configApiBaseUrlInput.disabled = !canEditAdminConfig;
  elements.configApiKeyInput.disabled = !canEditAdminConfig;
  elements.createUserButton.disabled = !canEditAdminConfig || state.adminAuth.creatingUser;
  elements.createUserUsernameInput.disabled = !canEditAdminConfig || state.adminAuth.creatingUser;
  elements.createUserPasswordInput.disabled = !canEditAdminConfig || state.adminAuth.creatingUser;
  elements.createUserRoleSelect.disabled = !canEditAdminConfig || state.adminAuth.creatingUser;
  elements.publishAnnouncementButton.disabled = !canEditAdminConfig || state.announcements.publishing;
  elements.announcementTitleInput.disabled = !canEditAdminConfig || state.announcements.publishing;
  elements.announcementContentInput.disabled = !canEditAdminConfig || state.announcements.publishing;
  elements.adminAuthButton.disabled = state.adminAuth.loggingIn;

  elements.saveConfigButton.textContent = state.configForm.saving ? "保存中..." : "保存配置";
  elements.testConfigButton.textContent = state.configForm.testing ? "测试中..." : "测试连通性";
  elements.publishAnnouncementButton.textContent = state.announcements.publishing ? "发布中..." : "发布公告";
}

function setLoading(isLoading) {
  const activeConversation = getActiveConversation();

  state.loading = isLoading;
  elements.newChatButton.disabled = isLoading || state.configForm.saving || state.configForm.testing;
  elements.clearChatButton.disabled = isLoading || state.configForm.saving || state.configForm.testing;
  elements.conversationNavButton.disabled = isLoading || state.configForm.saving || state.configForm.testing;
  elements.modelNavButton.disabled = isLoading || state.configForm.saving || state.configForm.testing;
  elements.userNavButton.disabled = isLoading || state.configForm.saving || state.configForm.testing;
  elements.announcementNavButton.disabled = isLoading || state.configForm.saving || state.configForm.testing;
  elements.modelSelect.disabled = isLoading || !state.models.length;
  setConfigButtonsState();
  renderConversationList();
  renderModelList();
  renderModelSelect();

  if (isLoading) {
    elements.sendButton.disabled = !state.adminAuth.authenticated;
    elements.sendButton.classList.add("stop");
    elements.sendButton.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7z" /></svg>';
    elements.composerHint.textContent = `正在使用 ${activeConversation?.modelId || "当前模型"} 逐字生成，点击按钮可停止。`;
    return;
  }

  elements.sendButton.disabled = !activeConversation?.modelId || !state.adminAuth.authenticated;
  elements.sendButton.classList.remove("stop");
  elements.sendButton.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 19 4l-4.5 16-3.28-6.22L4 11.5Zm7.22 2.28L19 4" /></svg>';
  updateSelectedModelView();
}

async function bootstrap() {
  await bootstrapConversationState();
  mountUserAdminSection();
  applySidebarLayoutState();
  renderSidebarNavigation();
  renderConversationList();
  renderModelSelect();
  renderModelList();
  renderMessages();
  updateSelectedModelView();
  renderConfigSummary();
  renderTestResult();
  autoResizeComposer();
  setConfigButtonsState();
  setWebSearchEnabled(state.webSearchEnabled, { persist: false });

  elements.temperatureRange.addEventListener("input", () => {
    const activeConversation = getActiveConversation();

    if (!activeConversation) {
      return;
    }

    activeConversation.temperature = clampTemperature(elements.temperatureRange.value);
    elements.temperatureValue.textContent = Number(activeConversation.temperature).toFixed(1);
    persistConversationState();
  });

  elements.systemPromptInput.addEventListener("input", () => {
    const activeConversation = getActiveConversation();

    if (!activeConversation) {
      return;
    }

    activeConversation.systemPrompt = elements.systemPromptInput.value;
    persistConversationState();
    renderConversationList();
  });

  elements.modelSearchInput.addEventListener("input", renderModelList);
  elements.modelSelect.addEventListener("change", (event) => {
    setConversationModel(event.target.value);
  });
  elements.refreshModelsButton.addEventListener("click", loadModels);
  elements.saveConfigButton.addEventListener("click", saveApiConfig);
  elements.testConfigButton.addEventListener("click", testApiConfig);
  elements.chatForm.addEventListener("submit", sendMessage);
  if (elements.webSearchToggleButton) {
    elements.webSearchToggleButton.addEventListener("click", () => {
      setWebSearchEnabled(!state.webSearchEnabled);
    });
  }
  elements.userInput.addEventListener("keydown", handleComposerKeydown);
  elements.userInput.addEventListener("input", autoResizeComposer);
  elements.clearChatButton.addEventListener("click", clearConversation);
  elements.newChatButton.addEventListener("click", createNewConversation);
  elements.sidebarCollapseButton.addEventListener("click", handleSidebarToggleClick);
  elements.sidebarMobileButton.addEventListener("click", handleSidebarMobileButtonClick);
  elements.sidebarBackdrop.addEventListener("click", () => {
    setMobileSidebarOpen(false);
  });
  elements.recentList.addEventListener("scroll", handleRecentListScroll);
  elements.conversationNavButton.addEventListener("click", () => {
    setSidebarTab("conversations");
  });
  elements.modelNavButton.addEventListener("click", () => {
    if (!requireAdminAccess("models")) {
      return;
    }

    setSidebarTab("models");
  });
  elements.userNavButton.addEventListener("click", () => {
    if (!requireAdminAccess("users")) {
      return;
    }

    setSidebarTab("users");
  });
  elements.announcementNavButton.addEventListener("click", () => {
    if (!requireAdminAccess("announcements")) {
      return;
    }

    setSidebarTab("announcements");
  });
  if (elements.announcementNoticeCloseButton) {
    elements.announcementNoticeCloseButton.addEventListener("click", closeAnnouncementNotice);
  }
  if (elements.announcementNotice) {
    elements.announcementNotice.addEventListener("click", (event) => {
      if (event.target === elements.announcementNotice) {
        closeAnnouncementNotice();
      }
    });
  }
  elements.adminAuthButton.addEventListener("click", async () => {
    if (state.adminAuth.authenticated) {
      const confirmed = await requestLogoutConfirmation();

      if (!confirmed) {
        return;
      }

      await logoutAdmin();
      return;
    }

    closeMobileSidebarIfNeeded();
    openAdminAuthDialog("conversations", "login");
  });
  elements.createUserButton.addEventListener("click", createManagedUser);
  elements.publishAnnouncementButton.addEventListener("click", publishAnnouncement);
  elements.toggleSettingsButton.addEventListener("click", toggleSettingsPanel);
  window.addEventListener("hashchange", () => {
    const nextTab = getSidebarTabFromHash();

    if (nextTab) {
      if (
        (nextTab === "models" || nextTab === "users" || nextTab === "announcements") &&
        !isAdminUser()
      ) {
        setSidebarTab("conversations", { updateHash: false });
        openAdminAuthDialog(nextTab);
        return;
      }

      setSidebarTab(nextTab, { updateHash: false });
    }
  });
  elements.adminAuthSubmitButton.addEventListener("click", loginAdmin);
  elements.adminAuthCancelButton.addEventListener("click", closeAdminAuthDialog);
  elements.adminAuthModeToggleButton.addEventListener("click", () => {
    state.adminAuth.mode = state.adminAuth.mode === "register" ? "login" : "register";
    setAdminAuthError("");
    renderAuthDialogMode();
  });
  elements.adminAuthUsernameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      loginAdmin();
    }
  });
  elements.adminAuthPasswordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      loginAdmin();
    }
  });
  elements.adminAuthDialog.addEventListener("click", (event) => {
    if (event.target === elements.adminAuthDialog && !state.adminAuth.loggingIn) {
      closeAdminAuthDialog();
    }
  });
  elements.confirmDialogCancelButton.addEventListener("click", () => {
    resolveConfirmDialog(false);
  });
  elements.confirmDialogConfirmButton.addEventListener("click", () => {
    resolveConfirmDialog(true);
  });
  elements.confirmDialog.addEventListener("click", (event) => {
    if (event.target === elements.confirmDialog) {
      resolveConfirmDialog(false);
    }
  });
  window.addEventListener("pointerdown", handleGlobalPointerDown);
  window.addEventListener("resize", applySidebarLayoutState);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.sidebarUi.mobileOpen && isMobileSidebarViewport()) {
      setMobileSidebarOpen(false);
      return;
    }

    if (event.key === "Escape" && state.openRecentMenuConversationId) {
      closeRecentConversationMenu();
      return;
    }

    if (event.key === "Escape" && !elements.announcementNotice.hidden) {
      closeAnnouncementNotice();
      return;
    }

    if (event.key === "Escape" && !elements.confirmDialog.hidden) {
      resolveConfirmDialog(false);
      return;
    }

    if (event.key === "Escape" && !elements.adminAuthDialog.hidden && !state.adminAuth.loggingIn) {
      closeAdminAuthDialog();
    }
  });

  try {
    await loadServerConfig();
    await loadAdminAuthStatus();

    if (isAdminUser()) {
      await loadAdminConfig();
      await loadAdminUsers();
      await loadAdminAnnouncements();
    } else {
      clearAdminConfigState();
      clearAdminUsersState();
      clearAdminAnnouncementsState();
      renderUserList();
      renderAnnouncementList();
    }

    await loadModels();
    await loadLatestAnnouncement();
  } catch (error) {
    setConnectionStatus("初始化失败");
    showError(error.message || "初始化页面失败。");
    setInlineBanner(error.message || "初始化模型中心失败。", "warning");
  }

  const hashTab = getSidebarTabFromHash();

  if ((hashTab === "models" || hashTab === "users" || hashTab === "announcements") && !isAdminUser()) {
    setSidebarTab("conversations");
    openAdminAuthDialog(hashTab);
    return;
  }

  if (hashTab) {
    setSidebarTab(hashTab, { updateHash: false });
    return;
  }

  if (
    !isAdminUser() &&
    (
      state.activeSidebarTab === "models" ||
      state.activeSidebarTab === "users" ||
      state.activeSidebarTab === "announcements"
    )
  ) {
    state.activeSidebarTab = "conversations";
    localStorage.setItem(storageKeys.sidebarTab, state.activeSidebarTab);
  }

  setSidebarTab(state.activeSidebarTab);
}

bootstrap();
