const storageKeys = {
  legacyConversations: "wssxzh.conversations",
  legacyActiveConversationId: "wssxzh.activeConversationId",
  conversationsByAccount: "wssxzh.conversationsByAccount",
  activeConversationIdByAccount: "wssxzh.activeConversationIdByAccount",
  dismissedAnnouncementIdByAccount: "wssxzh.dismissedAnnouncementIdByAccount",
  sidebarTab: "wssxzh.sidebarTab",
  sidebarCollapsed: "wssxzh.sidebarCollapsed",
  webSearchEnabled: "wssxzh.webSearchEnabled",
  workspacePanelOpen: "wssxzh.workspacePanelOpen",
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
const defaultMarkdownFormatInstruction = [
  "请始终使用 Markdown 输出回复内容。",
  "代码必须使用带语言标识的三反引号代码块，例如 ```js。",
  "表格必须使用标准 Markdown 表格语法。",
  "涉及步骤时优先使用有序或无序列表，不要输出纯文本堆叠。"
].join("\n");
const chatAutoFollowBottomThresholdPx = 2;
const maxComposerImageCount = 3;
const maxComposerImageFileSizeBytes = 2 * 1024 * 1024;
const maxStoredImageAttachmentUrlLength = 4 * 1024 * 1024;
const recentListInitialBatch = 24;
const recentListBatchSize = 20;
const recentListLoadOffsetPx = 88;

const elements = {
  appShell: document.getElementById("appShell"),
  sidebar: document.querySelector(".sidebar"),
  sidebarBackdrop: document.getElementById("sidebarBackdrop"),
  workspacePanelBackdrop: document.getElementById("workspacePanelBackdrop"),
  sidebarCollapseButton: document.getElementById("sidebarCollapseButton"),
  sidebarMobileButton: document.getElementById("sidebarMobileButton"),
  conversationNavButton: document.getElementById("conversationNavButton"),
  imageGenNavButton: document.getElementById("imageGenNavButton"),
  modelNavButton: document.getElementById("modelNavButton"),
  userNavButton: document.getElementById("userNavButton"),
  announcementNavButton: document.getElementById("announcementNavButton"),
  newChatButton: document.getElementById("newChatButton"),
  recentList: document.getElementById("recentList"),
  chatWorkspace: document.getElementById("chatWorkspace"),
  imageWorkspace: document.getElementById("imageWorkspace"),
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
  imagePreviewModal: document.getElementById("imagePreviewModal"),
  imagePreviewImage: document.getElementById("imagePreviewImage"),
  imagePreviewCloseButton: document.getElementById("imagePreviewCloseButton"),
  workspacePanelToggleButton: document.getElementById("workspacePanelToggleButton"),
  workspacePanelCloseButton: document.getElementById("workspacePanelCloseButton"),
  workspacePanel: document.getElementById("workspacePanel"),
  workspacePanelMeta: document.getElementById("workspacePanelMeta"),
  workspaceFileInput: document.getElementById("workspaceFileInput"),
  workspaceUploadButton: document.getElementById("workspaceUploadButton"),
  workspaceBanner: document.getElementById("workspaceBanner"),
  workspaceFileList: document.getElementById("workspaceFileList"),
  chatMessages: document.getElementById("chatMessages"),
  settingsPanel: document.getElementById("settingsPanel"),
  toggleSettingsButton: document.getElementById("toggleSettingsButton"),
  webSearchToggleButton: document.getElementById("webSearchToggleButton"),
  systemPromptInput: document.getElementById("systemPromptInput"),
  temperatureRange: document.getElementById("temperatureRange"),
  temperatureValue: document.getElementById("temperatureValue"),
  chatForm: document.getElementById("chatForm"),
  userInput: document.getElementById("userInput"),
  imageUploadButton: document.getElementById("imageUploadButton"),
  imageUploadInput: document.getElementById("imageUploadInput"),
  composerAttachmentList: document.getElementById("composerAttachmentList"),
  sendButton: document.getElementById("sendButton"),
  composerHint: document.getElementById("composerHint"),
  imageGenerationStatus: document.getElementById("imageGenerationStatus"),
  imageGenerationBanner: document.getElementById("imageGenerationBanner"),
  imageGenerationModelMeta: document.getElementById("imageGenerationModelMeta"),
  imageModelSelect: document.getElementById("imageModelSelect"),
  imageSizeSelect: document.getElementById("imageSizeSelect"),
  imagePromptInput: document.getElementById("imagePromptInput"),
  generateImageButton: document.getElementById("generateImageButton"),
  imageResultList: document.getElementById("imageResultList"),
  connectionStatus: document.getElementById("connectionStatus"),
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  keyStatus: document.getElementById("keyStatus"),
  modelStats: document.getElementById("modelStats"),
  apiConfigList: document.getElementById("apiConfigList"),
  addApiConfigButton: document.getElementById("addApiConfigButton"),
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
  delete:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M9 4h6l1 3H8l1-3Zm-2 3h10l-1 12H8L7 7Z" /></svg>',
  more:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h.01M12 12h.01M18 12h.01" /></svg>',
  sound:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 14h3l4 4V6L8 10H5v4Zm10.5-4.5a4 4 0 0 1 0 5m2.5-7.5a7 7 0 0 1 0 10" /></svg>',
  recent:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7.5A3.5 3.5 0 0 1 10.5 4h5A3.5 3.5 0 0 1 19 7.5v3a3.5 3.5 0 0 1-3.5 3.5H13l-3.55 2.9A.9.9 0 0 1 8 16.2V14.5A3.5 3.5 0 0 1 7 10.5v-3Z" /></svg>'
};

const storedWebSearchPreference = readStorageItem(storageKeys.webSearchEnabled);
const storedWorkspacePanelPreference = readStorageItem(storageKeys.workspacePanelOpen);

const state = {
  apiBaseUrl: "",
  apiConfigs: [],
  keyConfigured: false,
  models: [],
  allModels: [],
  imageModels: [],
  filteredModels: [],
  conversationAccountKey: defaultConversationAccountKey,
  conversations: [],
  activeConversationId: "",
  activeSidebarTab:
    getSidebarTabFromHash() ||
    (["images", "models", "users", "announcements"].includes(readStorageItem(storageKeys.sidebarTab))
      ? readStorageItem(storageKeys.sidebarTab)
      : "conversations"),
  loading: false,
  webSearchEnabled: storedWebSearchPreference === "1",
  webSearchPreferenceSynced: storedWebSearchPreference !== null,
  webSearchFeatureEnabled: true,
  workspace: {
    panelOpen: storedWorkspacePanelPreference !== "0",
    files: [],
    loading: false,
    uploading: false,
    bannerMessage: "",
    bannerTone: "",
    lastConversationId: ""
  },
  abortController: null,
  typingController: null,
  sidebarUi: {
    collapsed: readStorageItem(storageKeys.sidebarCollapsed) === "1",
    mobileOpen: false
  },
  openRecentMenuConversationId: "",
  pendingConfirmResolver: null,
  chatScroll: {
    autoFollow: true
  },
  composerAttachments: [],
  imageGeneration: {
    modelId: "",
    sourceApiId: "",
    loading: false,
    results: []
  },
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
    apiConfigs: [],
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
const maxStoredImageGenerationResults = 24;
const imageGenerationSessionStateByAccount = new Map();

function getSidebarTabFromHash() {
  const normalized = window.location.hash.replace(/^#/, "").trim().toLowerCase();

  if (normalized === "models") {
    return "models";
  }

  if (normalized === "images" || normalized === "image" || normalized === "generate") {
    return "images";
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
  const workspaceOverlayOpen = isMobile && Boolean(state.workspace?.panelOpen);
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
    elements.sidebarMobileButton.hidden = !(isMobile && !mobileOpen && !workspaceOverlayOpen);
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

  const featureEnabled = Boolean(state.webSearchFeatureEnabled);
  const enabled = Boolean(featureEnabled && state.webSearchEnabled);
  elements.webSearchToggleButton.hidden = !featureEnabled;
  elements.webSearchToggleButton.disabled = !featureEnabled;
  elements.webSearchToggleButton.classList.toggle("active", enabled);
  elements.webSearchToggleButton.setAttribute("aria-pressed", String(enabled));
  elements.webSearchToggleButton.title = featureEnabled
    ? (enabled ? "Web Search: On" : "Web Search: Off")
    : "Web Search: Disabled";
}

function setWebSearchEnabled(enabled, options = {}) {
  const { persist = true } = options;
  state.webSearchEnabled = Boolean(enabled);

  if (persist) {
    state.webSearchPreferenceSynced = true;
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
  if (Boolean(open) && isMobileSidebarViewport() && state.workspace?.panelOpen && typeof setWorkspacePanelOpen === "function") {
    setWorkspacePanelOpen(false);
  }

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

function compactText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(text, maxLength = 28) {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function buildModelKey(sourceApiId, modelId) {
  return `${String(sourceApiId || "").trim()}::${String(modelId || "").trim()}`;
}

function parseModelKey(value) {
  const normalized = String(value || "").trim();
  const separatorIndex = normalized.indexOf("::");

  if (separatorIndex < 0) {
    return {
      sourceApiId: "",
      modelId: normalized
    };
  }

  return {
    sourceApiId: normalized.slice(0, separatorIndex),
    modelId: normalized.slice(separatorIndex + 2)
  };
}

function sanitizeClientApiConfigEntry(input, index = 0) {
  return {
    id:
      typeof input?.id === "string" && input.id.trim()
        ? input.id.trim().slice(0, 120)
        : createId("api"),
    name:
      typeof input?.name === "string" && input.name.trim()
        ? input.name.trim().slice(0, 80)
        : `接口 ${index + 1}`,
    apiBaseUrl: typeof input?.apiBaseUrl === "string" ? input.apiBaseUrl.trim() : "",
    apiKey: typeof input?.apiKey === "string" ? input.apiKey.trim() : "",
    apiKeyPreview: typeof input?.apiKeyPreview === "string" ? input.apiKeyPreview.trim() : "",
    keyConfigured: Boolean(input?.keyConfigured || (typeof input?.apiKey === "string" && input.apiKey.trim())),
    enabled: input?.enabled !== false
  };
}

function normalizeClientApiConfigList(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  const seenIds = new Set();

  return list.map((item, index) => {
    const normalizedItem = sanitizeClientApiConfigEntry(item, index);

    while (seenIds.has(normalizedItem.id)) {
      normalizedItem.id = createId("api");
    }

    seenIds.add(normalizedItem.id);
    return normalizedItem;
  });
}

function getMessageTextContent(message) {
  if (typeof message?.content === "string") {
    return message.content;
  }

  if (!Array.isArray(message?.content)) {
    return "";
  }

  return message.content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      if (part?.type === "text" && typeof part.text === "string") {
        return part.text;
      }

      return "";
    })
    .join("\n");
}

function sanitizeMessageAttachment(input) {
  const rawUrl = typeof input?.url === "string" ? input.url.trim() : "";
  const isSupportedUrl = rawUrl.startsWith("data:image/") || /^https?:\/\//i.test(rawUrl);

  if (!rawUrl || !isSupportedUrl) {
    return null;
  }

  return {
    id:
      typeof input?.id === "string" && input.id.trim()
        ? input.id.trim().slice(0, 120)
        : createId("attachment"),
    name:
      typeof input?.name === "string" && input.name.trim()
        ? input.name.trim().slice(0, 120)
        : "图片",
    mimeType:
      typeof input?.mimeType === "string" && input.mimeType.trim()
        ? input.mimeType.trim().slice(0, 120)
        : "image/*",
    size: Math.max(0, Number(input?.size) || 0),
    url: rawUrl.slice(0, maxStoredImageAttachmentUrlLength)
  };
}

function getMessageAttachments(message) {
  return Array.isArray(message?.attachments)
    ? message.attachments.map(sanitizeMessageAttachment).filter(Boolean)
    : [];
}

function hasMessageAttachments(message) {
  return getMessageAttachments(message).length > 0;
}

function hasRenderableMessageContent(message) {
  return Boolean(compactText(getMessageTextContent(message)) || hasMessageAttachments(message));
}

function getMessagePreviewText(message, attachmentFallback = "图片消息") {
  const text = compactText(getMessageTextContent(message));

  if (text) {
    return text;
  }

  if (hasMessageAttachments(message)) {
    return attachmentFallback;
  }

  return "";
}

function renderComposerAttachments() {
  if (!elements.composerAttachmentList) {
    return;
  }

  state.composerAttachments = state.composerAttachments
    .map(sanitizeMessageAttachment)
    .filter(Boolean)
    .slice(0, maxComposerImageCount);

  if (!state.composerAttachments.length) {
    elements.composerAttachmentList.hidden = true;
    elements.composerAttachmentList.innerHTML = "";
    return;
  }

  elements.composerAttachmentList.hidden = false;
  elements.composerAttachmentList.innerHTML = "";

  for (const attachment of state.composerAttachments) {
    const item = document.createElement("div");
    item.className = "composer-attachment-item";

    const preview = document.createElement("img");
    preview.className = "composer-attachment-preview";
    preview.src = attachment.url;
    preview.alt = attachment.name || "上传图片";
    preview.loading = "lazy";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "composer-attachment-remove";
    removeButton.setAttribute("aria-label", `移除图片：${attachment.name || "图片"}`);
    removeButton.title = "移除图片";
    removeButton.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" /></svg>';
    removeButton.addEventListener("click", () => {
      state.composerAttachments = state.composerAttachments.filter((item) => item.id !== attachment.id);
      renderComposerAttachments();
    });

    item.append(preview, removeButton);
    elements.composerAttachmentList.appendChild(item);
  }
}

function clearComposerAttachments() {
  state.composerAttachments = [];

  if (elements.imageUploadInput) {
    elements.imageUploadInput.value = "";
  }

  renderComposerAttachments();
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMarkdownToSafeHtml(markdownText) {
  const source = String(markdownText || "");

  if (!source.trim()) {
    return "";
  }

  const markedParser = window.marked;

  if (!markedParser || typeof markedParser.parse !== "function") {
    return escapeHtml(source).replace(/\n/g, "<br>");
  }

  try {
    const renderedHtml = markedParser.parse(source, {
      gfm: true,
      breaks: true,
      headerIds: false,
      mangle: false
    });
    const purifier = window.DOMPurify;

    if (purifier && typeof purifier.sanitize === "function") {
      return purifier.sanitize(renderedHtml, {
        USE_PROFILES: { html: true }
      });
    }

    return escapeHtml(source).replace(/\n/g, "<br>");
  } catch (error) {
    return escapeHtml(source).replace(/\n/g, "<br>");
  }
}

function decorateMessageLinks(container) {
  if (!(container instanceof HTMLElement)) {
    return;
  }

  const links = container.querySelectorAll("a");

  for (const link of links) {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer nofollow");
  }
}

function renderMessageContent(container, message) {
  if (!(container instanceof HTMLElement)) {
    return;
  }

  const rawText = getMessageTextContent(message);

  if (message?.role === "assistant") {
    container.classList.add("message-markdown");
    container.innerHTML = renderMarkdownToSafeHtml(rawText);
    decorateMessageLinks(container);
    return;
  }

  container.classList.remove("message-markdown");
  container.textContent = rawText;
}

function deriveConversationTitle(messages) {
  const firstUserMessage = Array.isArray(messages)
    ? messages.find((message) => message.role === "user" && hasRenderableMessageContent(message))
    : null;

  if (!firstUserMessage) {
    return "新对话";
  }

  return truncateText(getMessagePreviewText(firstUserMessage, "图片对话"), 24) || "新对话";
}

function normalizeMessageFeedback(feedback) {
  return feedback === "like" || feedback === "dislike" ? feedback : "";
}

function sanitizeStoredMessage(message) {
  return {
    id: typeof message?.id === "string" ? message.id : createId(message?.role || "message"),
    role: message?.role === "assistant" ? "assistant" : "user",
    content: getMessageTextContent(message),
    attachments: getMessageAttachments(message),
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
    sourceApiId: typeof conversation?.sourceApiId === "string" ? conversation.sourceApiId : "",
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

function sanitizeImageGenerationResult(input) {
  const url = typeof input?.url === "string" ? input.url.trim() : "";

  if (!url) {
    return null;
  }

  return {
    id:
      typeof input?.id === "string" && input.id.trim()
        ? input.id.trim().slice(0, 120)
        : createId("generated-image"),
    modelId: typeof input?.modelId === "string" ? input.modelId.slice(0, 200) : "",
    sourceApiId: typeof input?.sourceApiId === "string" ? input.sourceApiId.slice(0, 120) : "",
    sourceApiName: typeof input?.sourceApiName === "string" ? input.sourceApiName.slice(0, 80) : "",
    prompt: typeof input?.prompt === "string" ? input.prompt.slice(0, 4000) : "",
    revisedPrompt: typeof input?.revisedPrompt === "string" ? input.revisedPrompt.slice(0, 4000) : "",
    size: typeof input?.size === "string" ? input.size.slice(0, 40) : "",
    url,
    mimeType: typeof input?.mimeType === "string" ? input.mimeType.slice(0, 120) : "image/png",
    timestamp: Number(input?.timestamp) || Date.now()
  };
}

function sanitizeImageGenerationSession(payload) {
  return {
    modelId: typeof payload?.modelId === "string" ? payload.modelId.slice(0, 200) : "",
    sourceApiId: typeof payload?.sourceApiId === "string" ? payload.sourceApiId.slice(0, 120) : "",
    prompt: typeof payload?.prompt === "string" ? payload.prompt.slice(0, 4000) : "",
    size: typeof payload?.size === "string" ? payload.size.slice(0, 40) : "",
    results: Array.isArray(payload?.results)
      ? payload.results.map(sanitizeImageGenerationResult).filter(Boolean).slice(0, maxStoredImageGenerationResults)
      : []
  };
}

function buildImageGenerationSessionPayload() {
  return sanitizeImageGenerationSession({
    modelId: state.imageGeneration.modelId,
    sourceApiId: state.imageGeneration.sourceApiId,
    prompt: elements.imagePromptInput?.value || "",
    size: elements.imageSizeSelect?.value || "",
    results: state.imageGeneration.results
  });
}

function applyImageGenerationSession(payload = null) {
  const normalized = sanitizeImageGenerationSession(payload);

  state.imageGeneration.modelId = normalized.modelId;
  state.imageGeneration.sourceApiId = normalized.sourceApiId;
  state.imageGeneration.results = normalized.results;

  if (elements.imagePromptInput) {
    elements.imagePromptInput.value = normalized.prompt;
  }

  if (elements.imageSizeSelect) {
    const hasOption = [...elements.imageSizeSelect.options].some((option) => option.value === normalized.size);
    elements.imageSizeSelect.value = hasOption ? normalized.size : "";
  }
}

function persistImageGenerationSessionState(accountKey = state.conversationAccountKey) {
  imageGenerationSessionStateByAccount.set(
    accountKey || defaultConversationAccountKey,
    buildImageGenerationSessionPayload()
  );
}

function loadImageGenerationSessionStateForAccount(accountKey = state.conversationAccountKey) {
  const scopedPayload = imageGenerationSessionStateByAccount.get(accountKey || defaultConversationAccountKey);
  applyImageGenerationSession(scopedPayload);
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
  loadImageGenerationSessionStateForAccount(state.conversationAccountKey);
  setImageGenerationBanner("");

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
    persistImageGenerationSessionState(state.conversationAccountKey);
    await flushRemoteConversationSave();
    await loadConversationStateForAccount(nextAccountKey);
    clearError();
    elements.userInput.value = "";
    autoResizeComposer();
    renderConversationList();
    renderModelSelect();
    renderImageModelSelect();
    renderImageGenerationControls();
    renderImageGenerationResults();
    renderModelList();
    updateSelectedModelView();
    renderMessages();
    if (typeof loadWorkspaceFilesForActiveConversation === "function") {
      void loadWorkspaceFilesForActiveConversation();
    }
    return true;
  } catch (error) {
    console.warn("Failed to switch conversation account scope.", error);
    return false;
  }
}

function getConversationDefaults() {
  const activeConversation = getActiveConversation();
  const legacyDefaults = getLegacyConversationDefaults();
  const firstChatModel = state.models[0] || null;

  return {
    modelId: activeConversation?.modelId || legacyDefaults.modelId || firstChatModel?.id || "",
    sourceApiId: activeConversation?.sourceApiId || firstChatModel?.sourceApiId || "",
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
  const explicitModelId = typeof overrides.modelId === "string" ? overrides.modelId : "";
  const explicitSourceApiId = typeof overrides.sourceApiId === "string" ? overrides.sourceApiId : "";
  const matchedExplicitModel = explicitModelId
    ? (
        findModelByReference(explicitModelId, explicitSourceApiId) ||
        (state.models.filter((model) => model.id === explicitModelId).length === 1
          ? state.models.find((model) => model.id === explicitModelId)
          : null)
      )
    : null;

  return {
    id: createId("conversation"),
    title: "新对话",
    createdAt,
    updatedAt: createdAt,
    modelId:
      explicitModelId
        ? explicitModelId
        : defaults.modelId || state.models[0]?.id || "",
    sourceApiId:
      explicitSourceApiId
        ? explicitSourceApiId
        : matchedExplicitModel?.sourceApiId || defaults.sourceApiId || state.models[0]?.sourceApiId || "",
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

// Final overrides: keep model/image rendering bound to sourceApiId.
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

  const sourceLabel = getModelSourceLabel(model);
  elements.selectedModelMeta.textContent = sourceLabel;

  if (!state.loading) {
    elements.composerHint.textContent = sourceLabel
      ? `当前模型：${model.id}（${sourceLabel}）`
      : `当前模型：${model.id}`;
  }
}

function renderConfigSummary() {
  ensureApiConfigEditorShell();
  const apiConfigs = Array.isArray(state.apiConfigs) ? state.apiConfigs : [];
  const enabledApiCount = apiConfigs.filter((item) => item.enabled).length;
  const keyedApiCount = apiConfigs.filter((item) => item.keyConfigured).length;
  const chatModelCount = state.models.length;
  const imageModelCount = state.imageModels.length;
  const totalModelCount = state.allModels.length || chatModelCount;

  elements.apiBaseUrl.textContent = apiConfigs.length
    ? `${enabledApiCount}/${apiConfigs.length} 个接口已启用`
    : "未配置";
  elements.keyStatus.textContent = apiConfigs.length
    ? `${keyedApiCount}/${apiConfigs.length} 个接口已配置密钥`
    : "未配置";
  elements.modelStats.textContent = `聊天模型 ${chatModelCount} 个 / 生图模型 ${imageModelCount} 个 / 总计 ${totalModelCount} 个`;
}

function filterModels() {
  const keyword = elements.modelSearchInput.value.trim().toLowerCase();

  state.filteredModels = state.allModels.filter((model) => {
    const capabilities = getModelCapabilities(model);
    const capabilityText = `${capabilities.chatCompletion ? "聊天" : ""} ${capabilities.imageGeneration ? "生图" : ""}`;
    const haystack = `${model.id} ${model.owned_by || ""} ${model.sourceApiName || ""} ${capabilityText}`.toLowerCase();
    return haystack.includes(keyword);
  });
}

function ensureImageGenerationModel() {
  if (!state.imageModels.length) {
    state.imageGeneration.modelId = "";
    state.imageGeneration.sourceApiId = "";
    return;
  }

  const matchedModel = findModelByReference(
    state.imageGeneration.modelId,
    state.imageGeneration.sourceApiId,
    state.imageModels
  );

  if (!matchedModel) {
    state.imageGeneration.modelId = state.imageModels[0].id;
    state.imageGeneration.sourceApiId = state.imageModels[0].sourceApiId || "";
  }
}

function getSelectedImageModel() {
  if (!state.imageGeneration.modelId) {
    return null;
  }

  return findModelByReference(
    state.imageGeneration.modelId,
    state.imageGeneration.sourceApiId,
    state.imageModels
  );
}

function setImageGenerationModel(modelKeyOrId, fallbackSourceApiId = "") {
  const nextModelReference =
    String(modelKeyOrId || "").includes("::") || !fallbackSourceApiId
      ? parseModelKey(modelKeyOrId)
      : {
          modelId: String(modelKeyOrId || "").trim(),
          sourceApiId: String(fallbackSourceApiId || "").trim()
        };
  const matchedModel = findModelByReference(
    nextModelReference.modelId,
    nextModelReference.sourceApiId,
    state.imageModels
  );

  if (!matchedModel) {
    return;
  }

  state.imageGeneration.modelId = matchedModel.id;
  state.imageGeneration.sourceApiId = matchedModel.sourceApiId || "";
  persistImageGenerationSessionState();
  renderImageModelSelect();
  renderImageGenerationControls();
  renderModelList();
}

function ensureConversationModel(conversation) {
  if (!conversation || !state.models.length) {
    return;
  }

  const matchedModel = findModelByReference(conversation.modelId, conversation.sourceApiId);

  if (!matchedModel) {
    conversation.modelId = state.models[0].id;
    conversation.sourceApiId = state.models[0].sourceApiId || "";
    return;
  }

  conversation.modelId = matchedModel.id;
  conversation.sourceApiId = matchedModel.sourceApiId || "";
}

function synchronizeConversationModels() {
  if (!state.models.length) {
    return;
  }

  let changed = false;

  for (const conversation of state.conversations) {
    const previousModelId = conversation.modelId;
    const previousSourceApiId = conversation.sourceApiId;
    ensureConversationModel(conversation);

    if (
      previousModelId !== conversation.modelId ||
      previousSourceApiId !== conversation.sourceApiId
    ) {
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

  return findModelByReference(activeConversation.modelId, activeConversation.sourceApiId) || null;
}

function renderModelSelect() {
  const activeConversation = getActiveConversation();
  const groupedModels = state.models.reduce((groups, model) => {
    const key = `${String(model.sourceApiName || "未命名接口").trim()} · ${formatProvider(model.owned_by)}`;
    groups[key] = groups[key] || [];
    groups[key].push(model);
    return groups;
  }, {});

  elements.modelSelect.innerHTML = "";

  if (!state.models.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "暂无可用聊天模型";
    elements.modelSelect.appendChild(option);
    elements.modelSelect.disabled = true;
    return;
  }

  for (const [provider, models] of Object.entries(groupedModels)) {
    const group = document.createElement("optgroup");
    group.label = provider;

    for (const model of models) {
      const option = document.createElement("option");
      option.value = model.modelKey || buildModelKey(model.sourceApiId, model.id);
      option.textContent = model.id;
      option.selected =
        model.id === activeConversation?.modelId &&
        model.sourceApiId === activeConversation?.sourceApiId;
      group.appendChild(option);
    }

    elements.modelSelect.appendChild(group);
  }

  elements.modelSelect.disabled = state.loading;
}

function renderImageModelSelect() {
  if (!elements.imageModelSelect) {
    return;
  }

  ensureImageGenerationModel();
  elements.imageModelSelect.innerHTML = "";

  if (!state.imageModels.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "暂无可用生图模型";
    elements.imageModelSelect.appendChild(option);
    elements.imageModelSelect.disabled = true;
    return;
  }

  const groupedModels = state.imageModels.reduce((groups, model) => {
    const key = `${String(model.sourceApiName || "未命名接口").trim()} · ${formatProvider(model.owned_by)}`;
    groups[key] = groups[key] || [];
    groups[key].push(model);
    return groups;
  }, {});

  for (const [provider, models] of Object.entries(groupedModels)) {
    const group = document.createElement("optgroup");
    group.label = provider;

    for (const model of models) {
      const option = document.createElement("option");
      option.value = model.modelKey || buildModelKey(model.sourceApiId, model.id);
      option.textContent = model.id;
      option.selected =
        model.id === state.imageGeneration.modelId &&
        model.sourceApiId === state.imageGeneration.sourceApiId;
      group.appendChild(option);
    }

    elements.imageModelSelect.appendChild(group);
  }

  elements.imageModelSelect.disabled = state.imageGeneration.loading;
}

function renderImageGenerationResults() {
  if (!elements.imageResultList) {
    return;
  }

  const results = Array.isArray(state.imageGeneration.results) ? state.imageGeneration.results : [];
  elements.imageResultList.innerHTML = "";

  if (!results.length) {
    elements.imageResultList.innerHTML = '<div class="empty-state compact">暂无生成结果</div>';
    return;
  }

  for (const item of results) {
    const card = document.createElement("article");
    card.className = "image-result-card";

    const previewButton = document.createElement("button");
    previewButton.type = "button";
    previewButton.className = "image-result-preview";
    previewButton.addEventListener("click", () => {
      openImagePreview({
        url: item.url,
        name: item.modelId || "生成图片"
      });
    });

    const image = document.createElement("img");
    image.className = "image-result-image";
    image.src = item.url;
    image.alt = item.prompt || "生成图片";
    image.loading = "lazy";
    previewButton.appendChild(image);

    const meta = document.createElement("div");
    meta.className = "image-result-meta";

    const top = document.createElement("div");
    top.className = "image-result-top";

    const model = document.createElement("strong");
    const modelSourceLabel = item.sourceApiName ? `（${item.sourceApiName}）` : "";
    model.textContent = `${item.modelId || "生图模型"}${modelSourceLabel}`;

    const time = document.createElement("span");
    time.className = "image-result-time";
    time.textContent = formatImageGenerationTimestamp(item.timestamp);

    top.append(model, time);

    const prompt = document.createElement("p");
    prompt.className = "image-result-prompt";
    prompt.textContent = item.prompt || "";
    meta.append(top, prompt);

    if (item.revisedPrompt && item.revisedPrompt !== item.prompt) {
      const revisedPrompt = document.createElement("p");
      revisedPrompt.className = "image-result-revised-prompt";
      revisedPrompt.textContent = `修订提示词：${item.revisedPrompt}`;
      meta.appendChild(revisedPrompt);
    }

    if (item.size) {
      const size = document.createElement("p");
      size.className = "image-result-size";
      size.textContent = `尺寸：${item.size}`;
      meta.appendChild(size);
    }

    card.append(previewButton, meta);
    elements.imageResultList.appendChild(card);
  }
}

function renderImageGenerationControls() {
  const selectedImageModel = getSelectedImageModel();
  const hasImageModels = state.imageModels.length > 0;

  if (elements.imageGenerationStatus) {
    if (!state.adminAuth.authenticated) {
      elements.imageGenerationStatus.textContent = "请先登录后再使用图片生成。";
    } else if (!hasImageModels) {
      elements.imageGenerationStatus.textContent = "当前已启用接口中没有识别到生图模型。";
    } else {
      elements.imageGenerationStatus.textContent = `已从当前启用的接口中识别到 ${state.imageModels.length} 个生图模型。`;
    }
  }

  if (elements.imageGenerationModelMeta) {
    if (!state.adminAuth.authenticated) {
      elements.imageGenerationModelMeta.textContent = "请先登录后再使用图片生成功能。";
    } else if (!hasImageModels) {
      elements.imageGenerationModelMeta.textContent = "没有从已启用接口的 /v1/models 中识别到可用的生图模型。";
    } else {
      const sourceLabel = selectedImageModel?.sourceApiName ? `（${selectedImageModel.sourceApiName}）` : "";
      elements.imageGenerationModelMeta.textContent = `当前生图模型：${selectedImageModel?.id || state.imageGeneration.modelId}${sourceLabel}`;
    }
  }

  renderImageModelSelect();

  if (elements.imageModelSelect) {
    elements.imageModelSelect.disabled = state.imageGeneration.loading || !hasImageModels;
  }

  if (elements.imageSizeSelect) {
    elements.imageSizeSelect.disabled = state.imageGeneration.loading || !state.adminAuth.authenticated;
  }

  if (elements.imagePromptInput) {
    elements.imagePromptInput.disabled = state.imageGeneration.loading || !state.adminAuth.authenticated;
  }

  if (elements.generateImageButton) {
    elements.generateImageButton.disabled =
      state.imageGeneration.loading || !state.adminAuth.authenticated || !hasImageModels;
    elements.generateImageButton.textContent = state.imageGeneration.loading ? "生成中..." : "生成图片";
  }
}

function renderModelList() {
  const activeConversation = getActiveConversation();
  const selectedImageModel = getSelectedImageModel();
  filterModels();
  renderConfigSummary();

  if (!state.filteredModels.length) {
    elements.modelList.innerHTML = '<div class="empty-state compact">没有匹配的模型</div>';
    return;
  }

  elements.modelList.innerHTML = "";

  for (const model of state.filteredModels) {
    const capabilities = getModelCapabilities(model);
    const isActiveChatModel =
      model.id === activeConversation?.modelId &&
      model.sourceApiId === activeConversation?.sourceApiId;
    const isActiveImageModel =
      model.id === selectedImageModel?.id &&
      model.sourceApiId === selectedImageModel?.sourceApiId;
    const isUsableModel = capabilities.chatCompletion || capabilities.imageGeneration;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `model-item${isActiveChatModel || isActiveImageModel ? " active" : ""}`;
    button.disabled = state.loading || state.configForm.saving || state.configForm.testing || !isUsableModel;

    const top = document.createElement("div");
    top.className = "model-item-top";

    const name = document.createElement("span");
    name.className = "model-name";
    name.textContent = model.id;

    const provider = document.createElement("span");
    provider.className = "model-provider";
    provider.textContent = getModelSourceLabel(model);

    const badges = document.createElement("div");
    badges.className = "model-capability-badges";

    if (capabilities.chatCompletion) {
      const badge = document.createElement("span");
      badge.className = "model-capability-badge chat";
      badge.textContent = "聊天";
      badges.appendChild(badge);
    }

    if (capabilities.imageGeneration) {
      const badge = document.createElement("span");
      badge.className = "model-capability-badge image";
      badge.textContent = "生图";
      badges.appendChild(badge);
    }

    if (!isUsableModel) {
      const badge = document.createElement("span");
      badge.className = "model-capability-badge other";
      badge.textContent = "其他";
      badges.appendChild(badge);
    }

    const bottom = document.createElement("div");
    bottom.className = "model-item-bottom";

    const createdAt = document.createElement("span");
    createdAt.className = "model-date";
    createdAt.textContent = `创建于 ${formatDate(model.created)}`;

    const activeLabel = document.createElement("span");
    activeLabel.className = "model-date";

    if (isActiveChatModel) {
      activeLabel.textContent = "当前聊天模型";
    } else if (isActiveImageModel) {
      activeLabel.textContent = "当前生图模型";
    } else if (capabilities.chatCompletion) {
      activeLabel.textContent = capabilities.imageGeneration ? "点击切换为聊天模型" : "点击切换";
    } else if (capabilities.imageGeneration) {
      activeLabel.textContent = "点击切换到图片生成";
    } else {
      activeLabel.textContent = "不可用于聊天";
    }

    top.append(name, provider, badges);
    bottom.append(createdAt, activeLabel);
    button.append(top, bottom);

    button.addEventListener("click", () => {
      if (state.loading || state.configForm.saving || state.configForm.testing || !isUsableModel) {
        return;
      }

      const nextModelKey = model.modelKey || buildModelKey(model.sourceApiId, model.id);

      if (capabilities.imageGeneration && state.activeSidebarTab === "images") {
        setImageGenerationModel(nextModelKey);
        return;
      }

      if (capabilities.chatCompletion) {
        setConversationModel(nextModelKey);
        return;
      }

      if (capabilities.imageGeneration) {
        setImageGenerationModel(nextModelKey);
        setSidebarTab("images");
      }
    });

    elements.modelList.appendChild(button);
  }
}

// Keep the final active implementations multi-API aware even if earlier legacy
// definitions still exist in this bundled file.
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

  const sourceLabel = getModelSourceLabel(model);
  elements.selectedModelMeta.textContent = sourceLabel;

  if (!state.loading) {
    elements.composerHint.textContent = sourceLabel
      ? `当前模型：${model.id}（${sourceLabel}）`
      : `当前模型：${model.id}`;
  }
}

function renderConfigSummary() {
  ensureApiConfigEditorShell();
  const apiConfigs = Array.isArray(state.apiConfigs) ? state.apiConfigs : [];
  const enabledApiCount = apiConfigs.filter((item) => item.enabled).length;
  const keyedApiCount = apiConfigs.filter((item) => item.keyConfigured).length;
  const chatModelCount = state.models.length;
  const imageModelCount = state.imageModels.length;
  const totalModelCount = state.allModels.length || chatModelCount;

  elements.apiBaseUrl.textContent = apiConfigs.length
    ? `${enabledApiCount}/${apiConfigs.length} 个接口已启用`
    : "未配置";
  elements.keyStatus.textContent = apiConfigs.length
    ? `${keyedApiCount}/${apiConfigs.length} 个接口已配置密钥`
    : "未配置";
  elements.modelStats.textContent = `聊天模型 ${chatModelCount} 个 / 生图模型 ${imageModelCount} 个 / 总计 ${totalModelCount} 个`;
}

function filterModels() {
  const keyword = elements.modelSearchInput.value.trim().toLowerCase();

  state.filteredModels = state.allModels.filter((model) => {
    const capabilities = getModelCapabilities(model);
    const capabilityText = `${capabilities.chatCompletion ? "聊天" : ""} ${capabilities.imageGeneration ? "生图" : ""}`;
    const haystack = `${model.id} ${model.owned_by || ""} ${model.sourceApiName || ""} ${capabilityText}`.toLowerCase();
    return haystack.includes(keyword);
  });
}

function ensureImageGenerationModel() {
  if (!state.imageModels.length) {
    state.imageGeneration.modelId = "";
    state.imageGeneration.sourceApiId = "";
    return;
  }

  const matchedModel = findModelByReference(
    state.imageGeneration.modelId,
    state.imageGeneration.sourceApiId,
    state.imageModels
  );

  if (!matchedModel) {
    state.imageGeneration.modelId = state.imageModels[0].id;
    state.imageGeneration.sourceApiId = state.imageModels[0].sourceApiId || "";
  }
}

function getSelectedImageModel() {
  if (!state.imageGeneration.modelId) {
    return null;
  }

  return findModelByReference(
    state.imageGeneration.modelId,
    state.imageGeneration.sourceApiId,
    state.imageModels
  );
}

function setImageGenerationModel(modelKeyOrId, fallbackSourceApiId = "") {
  const nextModelReference =
    String(modelKeyOrId || "").includes("::") || !fallbackSourceApiId
      ? parseModelKey(modelKeyOrId)
      : {
          modelId: String(modelKeyOrId || "").trim(),
          sourceApiId: String(fallbackSourceApiId || "").trim()
        };
  const matchedModel = findModelByReference(
    nextModelReference.modelId,
    nextModelReference.sourceApiId,
    state.imageModels
  );

  if (!matchedModel) {
    return;
  }

  state.imageGeneration.modelId = matchedModel.id;
  state.imageGeneration.sourceApiId = matchedModel.sourceApiId || "";
  persistImageGenerationSessionState();
  renderImageModelSelect();
  renderImageGenerationControls();
  renderModelList();
}

function ensureConversationModel(conversation) {
  if (!conversation || !state.models.length) {
    return;
  }

  const matchedModel = findModelByReference(conversation.modelId, conversation.sourceApiId);

  if (!matchedModel) {
    conversation.modelId = state.models[0].id;
    conversation.sourceApiId = state.models[0].sourceApiId || "";
    return;
  }

  conversation.modelId = matchedModel.id;
  conversation.sourceApiId = matchedModel.sourceApiId || "";
}

function synchronizeConversationModels() {
  if (!state.models.length) {
    return;
  }

  let changed = false;

  for (const conversation of state.conversations) {
    const previousModelId = conversation.modelId;
    const previousSourceApiId = conversation.sourceApiId;
    ensureConversationModel(conversation);

    if (
      previousModelId !== conversation.modelId ||
      previousSourceApiId !== conversation.sourceApiId
    ) {
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

  return findModelByReference(activeConversation.modelId, activeConversation.sourceApiId) || null;
}

function renderModelSelect() {
  const activeConversation = getActiveConversation();
  const groupedModels = state.models.reduce((groups, model) => {
    const key = `${String(model.sourceApiName || "未命名接口").trim()} · ${formatProvider(model.owned_by)}`;
    groups[key] = groups[key] || [];
    groups[key].push(model);
    return groups;
  }, {});

  elements.modelSelect.innerHTML = "";

  if (!state.models.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "暂无可用聊天模型";
    elements.modelSelect.appendChild(option);
    elements.modelSelect.disabled = true;
    return;
  }

  for (const [provider, models] of Object.entries(groupedModels)) {
    const group = document.createElement("optgroup");
    group.label = provider;

    for (const model of models) {
      const option = document.createElement("option");
      option.value = model.modelKey || buildModelKey(model.sourceApiId, model.id);
      option.textContent = model.id;
      option.selected =
        model.id === activeConversation?.modelId &&
        model.sourceApiId === activeConversation?.sourceApiId;
      group.appendChild(option);
    }

    elements.modelSelect.appendChild(group);
  }

  elements.modelSelect.disabled = state.loading;
}

function renderImageModelSelect() {
  if (!elements.imageModelSelect) {
    return;
  }

  ensureImageGenerationModel();
  elements.imageModelSelect.innerHTML = "";

  if (!state.imageModels.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "暂无可用生图模型";
    elements.imageModelSelect.appendChild(option);
    elements.imageModelSelect.disabled = true;
    return;
  }

  const groupedModels = state.imageModels.reduce((groups, model) => {
    const key = `${String(model.sourceApiName || "未命名接口").trim()} · ${formatProvider(model.owned_by)}`;
    groups[key] = groups[key] || [];
    groups[key].push(model);
    return groups;
  }, {});

  for (const [provider, models] of Object.entries(groupedModels)) {
    const group = document.createElement("optgroup");
    group.label = provider;

    for (const model of models) {
      const option = document.createElement("option");
      option.value = model.modelKey || buildModelKey(model.sourceApiId, model.id);
      option.textContent = model.id;
      option.selected =
        model.id === state.imageGeneration.modelId &&
        model.sourceApiId === state.imageGeneration.sourceApiId;
      group.appendChild(option);
    }

    elements.imageModelSelect.appendChild(group);
  }

  elements.imageModelSelect.disabled = state.imageGeneration.loading;
}

function renderImageGenerationResults() {
  if (!elements.imageResultList) {
    return;
  }

  const results = Array.isArray(state.imageGeneration.results) ? state.imageGeneration.results : [];
  elements.imageResultList.innerHTML = "";

  if (!results.length) {
    elements.imageResultList.innerHTML = '<div class="empty-state compact">暂无生成结果</div>';
    return;
  }

  for (const item of results) {
    const card = document.createElement("article");
    card.className = "image-result-card";

    const previewButton = document.createElement("button");
    previewButton.type = "button";
    previewButton.className = "image-result-preview";
    previewButton.addEventListener("click", () => {
      openImagePreview({
        url: item.url,
        name: item.modelId || "生成图片"
      });
    });

    const image = document.createElement("img");
    image.className = "image-result-image";
    image.src = item.url;
    image.alt = item.prompt || "生成图片";
    image.loading = "lazy";
    previewButton.appendChild(image);

    const meta = document.createElement("div");
    meta.className = "image-result-meta";

    const top = document.createElement("div");
    top.className = "image-result-top";

    const model = document.createElement("strong");
    const modelSourceLabel = item.sourceApiName ? `（${item.sourceApiName}）` : "";
    model.textContent = `${item.modelId || "生图模型"}${modelSourceLabel}`;

    const time = document.createElement("span");
    time.className = "image-result-time";
    time.textContent = formatImageGenerationTimestamp(item.timestamp);

    top.append(model, time);

    const prompt = document.createElement("p");
    prompt.className = "image-result-prompt";
    prompt.textContent = item.prompt || "";
    meta.append(top, prompt);

    if (item.revisedPrompt && item.revisedPrompt !== item.prompt) {
      const revisedPrompt = document.createElement("p");
      revisedPrompt.className = "image-result-revised-prompt";
      revisedPrompt.textContent = `修订提示词：${item.revisedPrompt}`;
      meta.appendChild(revisedPrompt);
    }

    if (item.size) {
      const size = document.createElement("p");
      size.className = "image-result-size";
      size.textContent = `尺寸：${item.size}`;
      meta.appendChild(size);
    }

    card.append(previewButton, meta);
    elements.imageResultList.appendChild(card);
  }
}

function renderImageGenerationControls() {
  const selectedImageModel = getSelectedImageModel();
  const hasImageModels = state.imageModels.length > 0;

  if (elements.imageGenerationStatus) {
    if (!state.adminAuth.authenticated) {
      elements.imageGenerationStatus.textContent = "请先登录后再使用图片生成。";
    } else if (!hasImageModels) {
      elements.imageGenerationStatus.textContent = "当前已启用接口中没有识别到生图模型。";
    } else {
      elements.imageGenerationStatus.textContent = `已从当前启用的接口中识别到 ${state.imageModels.length} 个生图模型。`;
    }
  }

  if (elements.imageGenerationModelMeta) {
    if (!state.adminAuth.authenticated) {
      elements.imageGenerationModelMeta.textContent = "请先登录后再使用图片生成功能。";
    } else if (!hasImageModels) {
      elements.imageGenerationModelMeta.textContent = "没有从已启用接口的 /v1/models 中识别到可用的生图模型。";
    } else {
      const sourceLabel = selectedImageModel?.sourceApiName ? `（${selectedImageModel.sourceApiName}）` : "";
      elements.imageGenerationModelMeta.textContent = `当前生图模型：${selectedImageModel?.id || state.imageGeneration.modelId}${sourceLabel}`;
    }
  }

  renderImageModelSelect();

  if (elements.imageModelSelect) {
    elements.imageModelSelect.disabled = state.imageGeneration.loading || !hasImageModels;
  }

  if (elements.imageSizeSelect) {
    elements.imageSizeSelect.disabled = state.imageGeneration.loading || !state.adminAuth.authenticated;
  }

  if (elements.imagePromptInput) {
    elements.imagePromptInput.disabled = state.imageGeneration.loading || !state.adminAuth.authenticated;
  }

  if (elements.generateImageButton) {
    elements.generateImageButton.disabled =
      state.imageGeneration.loading || !state.adminAuth.authenticated || !hasImageModels;
    elements.generateImageButton.textContent = state.imageGeneration.loading ? "生成中..." : "生成图片";
  }
}

function renderModelList() {
  const activeConversation = getActiveConversation();
  const selectedImageModel = getSelectedImageModel();
  filterModels();
  renderConfigSummary();

  if (!state.filteredModels.length) {
    elements.modelList.innerHTML = '<div class="empty-state compact">没有匹配的模型</div>';
    return;
  }

  elements.modelList.innerHTML = "";

  for (const model of state.filteredModels) {
    const capabilities = getModelCapabilities(model);
    const isActiveChatModel =
      model.id === activeConversation?.modelId &&
      model.sourceApiId === activeConversation?.sourceApiId;
    const isActiveImageModel =
      model.id === selectedImageModel?.id &&
      model.sourceApiId === selectedImageModel?.sourceApiId;
    const isUsableModel = capabilities.chatCompletion || capabilities.imageGeneration;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `model-item${isActiveChatModel || isActiveImageModel ? " active" : ""}`;
    button.disabled = state.loading || state.configForm.saving || state.configForm.testing || !isUsableModel;

    const top = document.createElement("div");
    top.className = "model-item-top";

    const name = document.createElement("span");
    name.className = "model-name";
    name.textContent = model.id;

    const provider = document.createElement("span");
    provider.className = "model-provider";
    provider.textContent = getModelSourceLabel(model);

    const badges = document.createElement("div");
    badges.className = "model-capability-badges";

    if (capabilities.chatCompletion) {
      const badge = document.createElement("span");
      badge.className = "model-capability-badge chat";
      badge.textContent = "聊天";
      badges.appendChild(badge);
    }

    if (capabilities.imageGeneration) {
      const badge = document.createElement("span");
      badge.className = "model-capability-badge image";
      badge.textContent = "生图";
      badges.appendChild(badge);
    }

    if (!isUsableModel) {
      const badge = document.createElement("span");
      badge.className = "model-capability-badge other";
      badge.textContent = "其他";
      badges.appendChild(badge);
    }

    const bottom = document.createElement("div");
    bottom.className = "model-item-bottom";

    const createdAt = document.createElement("span");
    createdAt.className = "model-date";
    createdAt.textContent = `创建于 ${formatDate(model.created)}`;

    const activeLabel = document.createElement("span");
    activeLabel.className = "model-date";

    if (isActiveChatModel) {
      activeLabel.textContent = "当前聊天模型";
    } else if (isActiveImageModel) {
      activeLabel.textContent = "当前生图模型";
    } else if (capabilities.chatCompletion) {
      activeLabel.textContent = capabilities.imageGeneration ? "点击切换为聊天模型" : "点击切换";
    } else if (capabilities.imageGeneration) {
      activeLabel.textContent = "点击切换到图片生成";
    } else {
      activeLabel.textContent = "不可用于聊天";
    }

    top.append(name, provider, badges);
    bottom.append(createdAt, activeLabel);
    button.append(top, bottom);

    button.addEventListener("click", () => {
      if (state.loading || state.configForm.saving || state.configForm.testing || !isUsableModel) {
        return;
      }

      const nextModelKey = model.modelKey || buildModelKey(model.sourceApiId, model.id);

      if (capabilities.imageGeneration && state.activeSidebarTab === "images") {
        setImageGenerationModel(nextModelKey);
        return;
      }

      if (capabilities.chatCompletion) {
        setConversationModel(nextModelKey);
        return;
      }

      if (capabilities.imageGeneration) {
        setImageGenerationModel(nextModelKey);
        setSidebarTab("images");
      }
    });

    elements.modelList.appendChild(button);
  }
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
    sourceApiId: typeof conversation?.sourceApiId === "string" ? conversation.sourceApiId : "",
    systemPrompt: typeof conversation?.systemPrompt === "string" ? conversation.systemPrompt : "",
    temperature: clampTemperature(conversation?.temperature),
    pinned: Boolean(conversation?.pinned),
    messages
  };
}

function createEmptyApiConfigEntry(index = 0) {
  return sanitizeClientApiConfigEntry(
    {
      name: `接口 ${index + 1}`,
      apiBaseUrl: "",
      apiKey: "",
      enabled: true
    },
    index
  );
}

function ensureApiConfigEditorShell() {
  const actionRow = elements.saveConfigButton?.parentElement;

  if (!actionRow) {
    return;
  }

  const baseUrlField = elements.configApiBaseUrlInput?.closest(".settings-field");
  const apiKeyField = elements.configApiKeyInput?.closest(".settings-field");

  if (baseUrlField) {
    baseUrlField.hidden = true;
  }

  if (apiKeyField) {
    apiKeyField.hidden = true;
  }

  if (!elements.apiConfigList) {
    const field = document.createElement("div");
    field.className = "settings-field";

    const title = document.createElement("span");
    title.textContent = "API 列表";

    const list = document.createElement("div");
    list.id = "apiConfigList";
    list.className = "api-config-list";

    field.append(title, list);
    actionRow.parentElement.insertBefore(field, actionRow);
    elements.apiConfigList = list;
  }

  if (!elements.addApiConfigButton) {
    const button = document.createElement("button");
    button.id = "addApiConfigButton";
    button.className = "secondary-inline-button";
    button.type = "button";
    button.textContent = "新增接口";
    actionRow.insertBefore(button, actionRow.firstChild);
    elements.addApiConfigButton = button;
  }

  if (elements.addApiConfigButton && !elements.addApiConfigButton.dataset.bound) {
    elements.addApiConfigButton.dataset.bound = "true";
    elements.addApiConfigButton.addEventListener("click", () => {
      state.configForm.apiConfigs = [
        ...normalizeClientApiConfigList(state.configForm.apiConfigs),
        createEmptyApiConfigEntry(state.configForm.apiConfigs.length)
      ];
      renderApiConfigList();
      setConfigButtonsState();
    });
  }
}

function renderApiConfigList() {
  ensureApiConfigEditorShell();

  if (!elements.apiConfigList) {
    return;
  }

  state.configForm.apiConfigs = normalizeClientApiConfigList(state.configForm.apiConfigs);

  if (!state.configForm.apiConfigs.length) {
    state.configForm.apiConfigs = [createEmptyApiConfigEntry(0)];
  }

  const canEdit =
    isAdminUser() && !state.configForm.saving && !state.configForm.testing && !state.loading;

  if (elements.addApiConfigButton) {
    elements.addApiConfigButton.disabled = !canEdit;
  }

  elements.apiConfigList.innerHTML = "";

  for (const [index, apiConfig] of state.configForm.apiConfigs.entries()) {
    const card = document.createElement("div");
    card.className = "api-config-card";

    const top = document.createElement("div");
    top.className = "api-config-top";

    const title = document.createElement("strong");
    title.textContent = apiConfig.name || `接口 ${index + 1}`;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "secondary-inline-button";
    removeButton.textContent = "删除";
    removeButton.disabled = !canEdit || state.configForm.apiConfigs.length <= 1;
    removeButton.addEventListener("click", async () => {
      const confirmed = await requestDeleteConfirmation(apiConfig.name || `接口 ${index + 1}`, {
        dialogTitle: "删除接口配置？",
        fallbackTitle: `接口 ${index + 1}`
      });

      if (!confirmed) {
        return;
      }

      state.configForm.apiConfigs = state.configForm.apiConfigs.filter((item) => item.id !== apiConfig.id);
      renderApiConfigList();
      setConfigButtonsState();
    });

    top.append(title, removeButton);

    const grid = document.createElement("div");
    grid.className = "api-config-grid";

    const nameLabel = document.createElement("label");
    nameLabel.className = "settings-field";
    const nameText = document.createElement("span");
    nameText.textContent = "接口名称";
    const nameInput = document.createElement("input");
    nameInput.className = "text-input";
    nameInput.type = "text";
    nameInput.placeholder = "例如：主接口";
    nameInput.value = apiConfig.name || "";
    nameInput.disabled = !canEdit;
    nameInput.addEventListener("input", () => {
      apiConfig.name = nameInput.value;
      title.textContent = nameInput.value.trim() || `接口 ${index + 1}`;
    });
    nameLabel.append(nameText, nameInput);

    const urlLabel = document.createElement("label");
    urlLabel.className = "settings-field";
    const urlText = document.createElement("span");
    urlText.textContent = "API Base URL";
    const urlInput = document.createElement("input");
    urlInput.className = "text-input";
    urlInput.type = "url";
    urlInput.placeholder = "https://example.com/v1 或 https://example.com/v3";
    urlInput.value = apiConfig.apiBaseUrl || "";
    urlInput.disabled = !canEdit;
    urlInput.addEventListener("input", () => {
      apiConfig.apiBaseUrl = urlInput.value;
    });
    urlLabel.append(urlText, urlInput);

    const keyLabel = document.createElement("label");
    keyLabel.className = "settings-field";
    const keyText = document.createElement("span");
    keyText.textContent = "API Key";
    const keyInput = document.createElement("input");
    keyInput.className = "text-input";
    keyInput.type = "text";
    keyInput.placeholder = "请输入 API 密钥";
    keyInput.value = apiConfig.apiKey || "";
    keyInput.disabled = !canEdit;
    keyInput.addEventListener("input", () => {
      apiConfig.apiKey = keyInput.value;
      apiConfig.keyConfigured = Boolean(keyInput.value.trim());
    });
    keyLabel.append(keyText, keyInput);

    const toggleWrap = document.createElement("label");
    toggleWrap.className = "api-config-toggle";
    const toggleInput = document.createElement("input");
    toggleInput.type = "checkbox";
    toggleInput.checked = apiConfig.enabled !== false;
    toggleInput.disabled = !canEdit;
    toggleInput.addEventListener("change", () => {
      apiConfig.enabled = Boolean(toggleInput.checked);
    });
    const toggleText = document.createElement("span");
    toggleText.textContent = "启用这个接口";
    toggleWrap.append(toggleInput, toggleText);

    grid.append(nameLabel, urlLabel, keyLabel, toggleWrap);
    card.append(top, grid);
    elements.apiConfigList.appendChild(card);
  }
}

function syncConfigFormInputs() {
  state.configForm.apiConfigs = normalizeClientApiConfigList(state.configForm.apiConfigs);
  renderApiConfigList();
}

function findModelByReference(modelId, sourceApiId, models = state.models) {
  const normalizedModelId = String(modelId || "").trim();
  const normalizedSourceApiId = String(sourceApiId || "").trim();

  if (!normalizedModelId) {
    return null;
  }

  if (normalizedSourceApiId) {
    return (
      models.find((model) => model.id === normalizedModelId && model.sourceApiId === normalizedSourceApiId) || null
    );
  }

  const matchedModels = models.filter((model) => model.id === normalizedModelId);
  return matchedModels.length === 1 ? matchedModels[0] : null;
}

function getModelSourceLabel(model) {
  if (!model) {
    return "";
  }

  const providerName = formatProvider(model.owned_by);
  const apiName = String(model.sourceApiName || "").trim();

  return apiName ? `${apiName} · ${providerName}` : providerName;
}

function renderConfigSummary() {
  ensureApiConfigEditorShell();
  const apiConfigs = Array.isArray(state.apiConfigs) ? state.apiConfigs : [];
  const enabledApiCount = apiConfigs.filter((item) => item.enabled).length;
  const keyedApiCount = apiConfigs.filter((item) => item.keyConfigured).length;
  const chatModelCount = state.models.length;
  const imageModelCount = state.imageModels.length;
  const totalModelCount = state.allModels.length || chatModelCount;

  elements.apiBaseUrl.textContent = apiConfigs.length
    ? `${enabledApiCount}/${apiConfigs.length} 个接口已启用`
    : "未配置";
  elements.keyStatus.textContent = apiConfigs.length
    ? `${keyedApiCount}/${apiConfigs.length} 个接口已配置密钥`
    : "未配置";
  elements.modelStats.textContent = `聊天模型 ${chatModelCount} 个 / 生图模型 ${imageModelCount} 个 / 总计 ${totalModelCount} 个`;
}

function getConversationDefaults() {
  const activeConversation = getActiveConversation();
  const legacyDefaults = getLegacyConversationDefaults();
  const fallbackModel = state.models[0] || null;
  const selectedModel = findModelByReference(activeConversation?.modelId, activeConversation?.sourceApiId) || fallbackModel;

  return {
    modelId: activeConversation?.modelId || legacyDefaults.modelId || selectedModel?.id || "",
    sourceApiId: activeConversation?.sourceApiId || selectedModel?.sourceApiId || "",
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
    sourceApiId:
      typeof overrides.sourceApiId === "string"
        ? overrides.sourceApiId
        : defaults.sourceApiId || state.models[0]?.sourceApiId || "",
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

function ensureConversationModel(conversation) {
  if (!conversation || !state.models.length) {
    return;
  }

  const matchedModel = findModelByReference(conversation.modelId, conversation.sourceApiId);

  if (!matchedModel) {
    conversation.modelId = state.models[0].id;
    conversation.sourceApiId = state.models[0].sourceApiId || "";
  }
}

function getSelectedModel() {
  const activeConversation = getActiveConversation();

  if (!activeConversation) {
    return null;
  }

  return findModelByReference(activeConversation.modelId, activeConversation.sourceApiId) || null;
}

function ensureImageGenerationModel() {
  if (!state.imageModels.length) {
    state.imageGeneration.modelId = "";
    state.imageGeneration.sourceApiId = "";
    return;
  }

  const matchedModel =
    state.imageModels.find((model) => {
      return (
        model.id === state.imageGeneration.modelId &&
        model.sourceApiId === state.imageGeneration.sourceApiId
      );
    }) || null;

  if (!matchedModel) {
    state.imageGeneration.modelId = state.imageModels[0].id;
    state.imageGeneration.sourceApiId = state.imageModels[0].sourceApiId || "";
  }
}

function getSelectedImageModel() {
  if (!state.imageGeneration.modelId) {
    return null;
  }

  return (
    state.imageModels.find((model) => {
      return (
        model.id === state.imageGeneration.modelId &&
        model.sourceApiId === state.imageGeneration.sourceApiId
      );
    }) || null
  );
}

function setImageGenerationModel(modelKeyOrId, fallbackSourceApiId = "") {
  const nextModelReference =
    String(modelKeyOrId || "").includes("::") || !fallbackSourceApiId
      ? parseModelKey(modelKeyOrId)
      : {
          modelId: String(modelKeyOrId || "").trim(),
          sourceApiId: String(fallbackSourceApiId || "").trim()
        };
  const matchedModel = findModelByReference(
    nextModelReference.modelId,
    nextModelReference.sourceApiId,
    state.imageModels
  );

  if (!matchedModel) {
    return;
  }

  state.imageGeneration.modelId = matchedModel.id;
  state.imageGeneration.sourceApiId = matchedModel.sourceApiId || "";
  renderImageModelSelect();
  renderImageGenerationControls();
  renderModelList();
}

function renderModelSelect() {
  const activeConversation = getActiveConversation();
  const groupedModels = state.models.reduce((groups, model) => {
    const key = `${String(model.sourceApiName || "未命名接口").trim()} · ${formatProvider(model.owned_by)}`;
    groups[key] = groups[key] || [];
    groups[key].push(model);
    return groups;
  }, {});

  elements.modelSelect.innerHTML = "";

  if (!state.models.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "暂无可用聊天模型";
    elements.modelSelect.appendChild(option);
    elements.modelSelect.disabled = true;
    return;
  }

  for (const [provider, models] of Object.entries(groupedModels)) {
    const group = document.createElement("optgroup");
    group.label = provider;

    for (const model of models) {
      const option = document.createElement("option");
      option.value = model.modelKey || buildModelKey(model.sourceApiId, model.id);
      option.textContent = model.id;
      option.selected =
        model.id === activeConversation?.modelId &&
        model.sourceApiId === activeConversation?.sourceApiId;
      group.appendChild(option);
    }

    elements.modelSelect.appendChild(group);
  }

  elements.modelSelect.disabled = state.loading;
}

function renderImageModelSelect() {
  if (!elements.imageModelSelect) {
    return;
  }

  ensureImageGenerationModel();
  elements.imageModelSelect.innerHTML = "";

  if (!state.imageModels.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "暂无可用生图模型";
    elements.imageModelSelect.appendChild(option);
    elements.imageModelSelect.disabled = true;
    return;
  }

  const groupedModels = state.imageModels.reduce((groups, model) => {
    const key = `${String(model.sourceApiName || "未命名接口").trim()} · ${formatProvider(model.owned_by)}`;
    groups[key] = groups[key] || [];
    groups[key].push(model);
    return groups;
  }, {});

  for (const [provider, models] of Object.entries(groupedModels)) {
    const group = document.createElement("optgroup");
    group.label = provider;

    for (const model of models) {
      const option = document.createElement("option");
      option.value = model.modelKey || buildModelKey(model.sourceApiId, model.id);
      option.textContent = model.id;
      option.selected =
        model.id === state.imageGeneration.modelId &&
        model.sourceApiId === state.imageGeneration.sourceApiId;
      group.appendChild(option);
    }

    elements.imageModelSelect.appendChild(group);
  }

  elements.imageModelSelect.disabled = state.imageGeneration.loading;
}

function filterModels() {
  const keyword = elements.modelSearchInput.value.trim().toLowerCase();

  state.filteredModels = state.allModels.filter((model) => {
    const capabilities = getModelCapabilities(model);
    const capabilityText = `${capabilities.chatCompletion ? "聊天" : ""} ${capabilities.imageGeneration ? "生图" : ""}`;
    const haystack = `${model.id} ${model.owned_by || ""} ${model.sourceApiName || ""} ${capabilityText}`.toLowerCase();
    return haystack.includes(keyword);
  });
}

function renderModelList() {
  const activeConversation = getActiveConversation();
  const selectedImageModel = getSelectedImageModel();
  filterModels();
  renderConfigSummary();

  if (!state.filteredModels.length) {
    elements.modelList.innerHTML = '<div class="empty-state compact">没有匹配的模型</div>';
    return;
  }

  elements.modelList.innerHTML = "";

  for (const model of state.filteredModels) {
    const capabilities = getModelCapabilities(model);
    const isActiveChatModel =
      model.id === activeConversation?.modelId &&
      model.sourceApiId === activeConversation?.sourceApiId;
    const isActiveImageModel =
      model.id === selectedImageModel?.id &&
      model.sourceApiId === selectedImageModel?.sourceApiId;
    const isUsableModel = capabilities.chatCompletion || capabilities.imageGeneration;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `model-item${isActiveChatModel || isActiveImageModel ? " active" : ""}`;
    button.disabled = state.loading || state.configForm.saving || state.configForm.testing || !isUsableModel;

    const top = document.createElement("div");
    top.className = "model-item-top";

    const name = document.createElement("span");
    name.className = "model-name";
    name.textContent = model.id;

    const provider = document.createElement("span");
    provider.className = "model-provider";
    provider.textContent = getModelSourceLabel(model);

    const badges = document.createElement("div");
    badges.className = "model-capability-badges";

    if (capabilities.chatCompletion) {
      const badge = document.createElement("span");
      badge.className = "model-capability-badge chat";
      badge.textContent = "聊天";
      badges.appendChild(badge);
    }

    if (capabilities.imageGeneration) {
      const badge = document.createElement("span");
      badge.className = "model-capability-badge image";
      badge.textContent = "生图";
      badges.appendChild(badge);
    }

    if (!isUsableModel) {
      const badge = document.createElement("span");
      badge.className = "model-capability-badge other";
      badge.textContent = "其他";
      badges.appendChild(badge);
    }

    const bottom = document.createElement("div");
    bottom.className = "model-item-bottom";

    const createdAt = document.createElement("span");
    createdAt.className = "model-date";
    createdAt.textContent = `创建于 ${formatDate(model.created)}`;

    const activeLabel = document.createElement("span");
    activeLabel.className = "model-date";

    if (isActiveChatModel) {
      activeLabel.textContent = "当前聊天模型";
    } else if (isActiveImageModel) {
      activeLabel.textContent = "当前生图模型";
    } else if (capabilities.chatCompletion) {
      activeLabel.textContent = capabilities.imageGeneration ? "点击切换为聊天模型" : "点击切换";
    } else if (capabilities.imageGeneration) {
      activeLabel.textContent = "点击切换到图片生成";
    } else {
      activeLabel.textContent = "不可用于聊天";
    }

    top.append(name, provider, badges);
    bottom.append(createdAt, activeLabel);
    button.append(top, bottom);

    button.addEventListener("click", () => {
      if (state.loading || state.configForm.saving || state.configForm.testing || !isUsableModel) {
        return;
      }

      const nextModelKey = model.modelKey || buildModelKey(model.sourceApiId, model.id);

      if (capabilities.imageGeneration && state.activeSidebarTab === "images") {
        setImageGenerationModel(nextModelKey);
        return;
      }

      if (capabilities.chatCompletion) {
        setConversationModel(nextModelKey);
        return;
      }

      if (capabilities.imageGeneration) {
        setImageGenerationModel(nextModelKey);
        setSidebarTab("images");
      }
    });

    elements.modelList.appendChild(button);
  }
}

function renderImageGenerationControls() {
  const selectedImageModel = getSelectedImageModel();
  const hasImageModels = state.imageModels.length > 0;

  if (elements.imageGenerationStatus) {
    if (!state.adminAuth.authenticated) {
      elements.imageGenerationStatus.textContent = "请先登录后再使用图片生成。";
    } else if (!hasImageModels) {
      elements.imageGenerationStatus.textContent = "当前 API 未识别到生图模型。";
    } else {
      elements.imageGenerationStatus.textContent = `已从当前配置的接口中识别到 ${state.imageModels.length} 个生图模型。`;
    }
  }

  if (elements.imageGenerationModelMeta) {
    if (!state.adminAuth.authenticated) {
      elements.imageGenerationModelMeta.textContent = "请先登录后再使用图片生成功能。";
    } else if (!hasImageModels) {
      elements.imageGenerationModelMeta.textContent = "没有从已启用接口的 /v1/models 中识别到可用的生图模型。";
    } else {
      const sourceLabel = selectedImageModel?.sourceApiName ? `（${selectedImageModel.sourceApiName}）` : "";
      elements.imageGenerationModelMeta.textContent = `当前生图模型：${selectedImageModel?.id || state.imageGeneration.modelId}${sourceLabel}`;
    }
  }

  renderImageModelSelect();

  if (elements.imageModelSelect) {
    elements.imageModelSelect.disabled = state.imageGeneration.loading || !hasImageModels;
  }

  if (elements.imageSizeSelect) {
    elements.imageSizeSelect.disabled = state.imageGeneration.loading || !state.adminAuth.authenticated;
  }

  if (elements.imagePromptInput) {
    elements.imagePromptInput.disabled = state.imageGeneration.loading || !state.adminAuth.authenticated;
  }

  if (elements.generateImageButton) {
    elements.generateImageButton.disabled =
      state.imageGeneration.loading || !state.adminAuth.authenticated || !hasImageModels;
    elements.generateImageButton.textContent = state.imageGeneration.loading ? "生成中..." : "生成图片";
  }
}

function renderImageGenerationResults() {
  if (!elements.imageResultList) {
    return;
  }

  const results = Array.isArray(state.imageGeneration.results) ? state.imageGeneration.results : [];
  elements.imageResultList.innerHTML = "";

  if (!results.length) {
    elements.imageResultList.innerHTML = '<div class="empty-state compact">暂无生成结果</div>';
    return;
  }

  for (const item of results) {
    const card = document.createElement("article");
    card.className = "image-result-card";

    const previewButton = document.createElement("button");
    previewButton.type = "button";
    previewButton.className = "image-result-preview";
    previewButton.addEventListener("click", () => {
      openImagePreview({
        url: item.url,
        name: item.modelId || "生成图片"
      });
    });

    const image = document.createElement("img");
    image.className = "image-result-image";
    image.src = item.url;
    image.alt = item.prompt || "生成图片";
    image.loading = "lazy";
    previewButton.appendChild(image);

    const meta = document.createElement("div");
    meta.className = "image-result-meta";

    const top = document.createElement("div");
    top.className = "image-result-top";

    const model = document.createElement("strong");
    const modelSourceLabel = item.sourceApiName ? `（${item.sourceApiName}）` : "";
    model.textContent = `${item.modelId || "生图模型"}${modelSourceLabel}`;

    const time = document.createElement("span");
    time.className = "image-result-time";
    time.textContent = formatImageGenerationTimestamp(item.timestamp);

    top.append(model, time);

    const prompt = document.createElement("p");
    prompt.className = "image-result-prompt";
    prompt.textContent = item.prompt || "";
    meta.append(top, prompt);

    if (item.revisedPrompt && item.revisedPrompt !== item.prompt) {
      const revisedPrompt = document.createElement("p");
      revisedPrompt.className = "image-result-revised-prompt";
      revisedPrompt.textContent = `修订提示词：${item.revisedPrompt}`;
      meta.appendChild(revisedPrompt);
    }

    if (item.size) {
      const size = document.createElement("p");
      size.className = "image-result-size";
      size.textContent = `尺寸：${item.size}`;
      meta.appendChild(size);
    }

    card.append(previewButton, meta);
    elements.imageResultList.appendChild(card);
  }
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
      ? `聊天模型示例：${result.sampleModels.join("、")}`
      : "聊天模型示例：无";
    const sampleImageModels = Array.isArray(result.sampleImageModels) && result.sampleImageModels.length
      ? `生图模型示例：${result.sampleImageModels.join("、")}`
      : "生图模型示例：无";
    const apiStatuses = Array.isArray(result.apiStatuses)
      ? result.apiStatuses.map((item) => {
        if (!item?.ok) {
          return `接口 ${item?.name || "未命名"}：失败${item?.detail ? `（${item.detail}）` : ""}`;
        }

        return `接口 ${item?.name || "未命名"}：成功，模型 ${item?.totalModelCount || 0} 个（聊天 ${item?.chatModelCount || 0} / 生图 ${item?.imageModelCount || 0}）`;
      })
      : [];

    elements.configTestResult.textContent = [
      "测试成功",
      `接口数量：${result.apiCount || 0}`,
      `模型总数：${result.modelCount || 0}`,
      `聊天模型：${result.chatModelCount || 0}`,
      `生图模型：${result.imageModelCount || 0}`,
      sampleModels,
      sampleImageModels,
      ...apiStatuses
    ].join("\n");
    return;
  }

  elements.configTestResult.textContent = `测试失败\n${result.detail || "请检查接口地址、密钥和网络状态。"}`;
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

  if (
    (!isAuthenticated && state.activeSidebarTab === "images") ||
    (!isAdmin && (state.activeSidebarTab === "models" || state.activeSidebarTab === "users" || state.activeSidebarTab === "announcements"))
  ) {
    setSidebarTab("conversations");
  } else {
    renderSidebarNavigation();
  }

  renderUserList();
  renderAnnouncementList();
  renderAnnouncementNotice();
  renderImageGenerationControls();
  renderImageGenerationResults();
  setConfigButtonsState();
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
      nextTabAfterLogin === "images" ||
      ((nextTabAfterLogin === "models" ||
        nextTabAfterLogin === "users" ||
        nextTabAfterLogin === "announcements") &&
        isAdminUser())
    ) {
      setSidebarTab(nextTabAfterLogin);
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
    renderImageGenerationControls();
  }
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
      ? `聊天模型示例：${result.sampleModels.join("、")}`
      : "聊天模型示例：无";
    const sampleImageModels = Array.isArray(result.sampleImageModels) && result.sampleImageModels.length
      ? `生图模型示例：${result.sampleImageModels.join("、")}`
      : "生图模型示例：无";

    elements.configTestResult.textContent = [
      "测试成功",
      `接口：${result.apiBaseUrl}`,
      `模型总数：${result.modelCount || 0}`,
      `聊天模型：${result.chatModelCount || 0}`,
      `生图模型：${result.imageModelCount || 0}`,
      sampleModels,
      sampleImageModels
    ].join("\n");
    return;
  }

  elements.configTestResult.textContent = `测试失败\n${result.detail || "请检查 API Base URL 和 API Key。"}`;
}

function setConnectionStatus(text, isHealthy = false) {
  elements.connectionStatus.textContent = text;
  elements.connectionStatus.style.color = isHealthy ? "var(--success)" : "var(--muted)";
}

function getModelCapabilities(model) {
  const capabilities = model?.capabilities && typeof model.capabilities === "object"
    ? model.capabilities
    : {};

  return {
    chatCompletion: Boolean(capabilities.chatCompletion),
    imageGeneration: Boolean(capabilities.imageGeneration)
  };
}

function ensureImageGenerationModel() {
  if (!state.imageModels.length) {
    state.imageGeneration.modelId = "";
    state.imageGeneration.sourceApiId = "";
    return;
  }

  const matchedModel = state.imageModels.find((model) => {
    return (
      model.id === state.imageGeneration.modelId &&
      model.sourceApiId === state.imageGeneration.sourceApiId
    );
  });

  if (!matchedModel) {
    state.imageGeneration.modelId = state.imageModels[0].id;
    state.imageGeneration.sourceApiId = state.imageModels[0].sourceApiId || "";
  }
}

function getSelectedImageModel() {
  if (!state.imageGeneration.modelId) {
    return null;
  }

  return (
    state.imageModels.find((model) => {
      return (
        model.id === state.imageGeneration.modelId &&
        model.sourceApiId === state.imageGeneration.sourceApiId
      );
    }) || null
  );
}

function setImageGenerationModel(modelKeyOrModelId, fallbackSourceApiId = "") {
  const { modelId, sourceApiId } =
    fallbackSourceApiId || String(modelKeyOrModelId || "").includes("::")
      ? parseModelKey(modelKeyOrModelId)
      : { modelId: String(modelKeyOrModelId || "").trim(), sourceApiId: String(fallbackSourceApiId || "").trim() };
  const matchedModel = state.imageModels.find((model) => {
    return model.id === modelId && model.sourceApiId === sourceApiId;
  });

  if (!matchedModel) {
    return;
  }

  state.imageGeneration.modelId = matchedModel.id;
  state.imageGeneration.sourceApiId = matchedModel.sourceApiId || "";
  renderImageModelSelect();
  renderImageGenerationControls();
  renderModelList();
}

function ensureConversationModel(conversation) {
  if (!conversation || !state.models.length) {
    return;
  }

  const matchedModel = state.models.find((model) => {
    return model.id === conversation.modelId && model.sourceApiId === conversation.sourceApiId;
  });

  if (!matchedModel) {
    conversation.modelId = state.models[0].id;
    conversation.sourceApiId = state.models[0].sourceApiId || "";
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

  return (
    state.models.find((model) => {
      return model.id === activeConversation.modelId && model.sourceApiId === activeConversation.sourceApiId;
    }) || null
  );
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
    return message.role === "user" && hasRenderableMessageContent(message);
  });
}

function getConversationPreview(conversation) {
  const lastMeaningfulMessage = [...conversation.messages]
    .reverse()
    .find((message) => hasRenderableMessageContent(message));

  if (lastMeaningfulMessage) {
    return truncateText(getMessagePreviewText(lastMeaningfulMessage), 36);
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
  if (typeof loadWorkspaceFilesForActiveConversation === "function") {
    void loadWorkspaceFilesForActiveConversation();
  }
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
  const pinnedConversations = visibleConversations.filter((conversation) => conversation.pinned);
  const regularConversations = visibleConversations.filter((conversation) => !conversation.pinned);
  const conversationListHeading = document.querySelector("#conversationSection .conversation-list-header h2");

  elements.recentList.innerHTML = "";

  if (conversationListHeading) {
    conversationListHeading.textContent = pinnedConversations.length
      ? "\u7f6e\u9876\u5bf9\u8bdd"
      : "\u6700\u8fd1\u5bf9\u8bdd";
  }

  const appendRecentSectionHeader = (title) => {
    const sectionHeader = document.createElement("div");
    sectionHeader.className = "conversation-list-header recent-section-header";

    const heading = document.createElement("h2");
    heading.textContent = title;
    sectionHeader.appendChild(heading);
    elements.recentList.appendChild(sectionHeader);
  };

  const renderConversationRow = (conversation) => {
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
  };

  for (const conversation of pinnedConversations) {
    renderConversationRow(conversation);
  }

  if (pinnedConversations.length && regularConversations.length) {
    appendRecentSectionHeader("\u6700\u8fd1\u5bf9\u8bdd");
  }

  for (const conversation of regularConversations) {
    renderConversationRow(conversation);
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

function renderConfigSummary() {
  const chatModelCount = state.models.length;
  const imageModelCount = state.imageModels.length;
  const totalModelCount = state.allModels.length || chatModelCount;

  elements.apiBaseUrl.textContent = state.apiBaseUrl || "Not configured";
  elements.keyStatus.textContent = state.keyConfigured ? "Configured" : "Missing";
  elements.modelStats.textContent = `${chatModelCount} 个聊天模型 / ${imageModelCount} 个生图模型 / 共 ${totalModelCount} 个模型`;
}

function filterModels() {
  const keyword = elements.modelSearchInput.value.trim().toLowerCase();

  state.filteredModels = state.allModels.filter((model) => {
    const capabilities = getModelCapabilities(model);
    const capabilityText = `${capabilities.chatCompletion ? "chat" : ""} ${capabilities.imageGeneration ? "image" : ""}`;
    const haystack = `${model.id} ${model.owned_by || ""} ${capabilityText}`.toLowerCase();
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
    option.textContent = "No chat models";
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

function renderImageModelSelect() {
  if (!elements.imageModelSelect) {
    return;
  }

  ensureImageGenerationModel();
  elements.imageModelSelect.innerHTML = "";

  if (!state.imageModels.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "暂无可用生图模型";
    elements.imageModelSelect.appendChild(option);
    elements.imageModelSelect.disabled = true;
    return;
  }

  const groupedModels = state.imageModels.reduce((groups, model) => {
    const key = formatProvider(model.owned_by);
    groups[key] = groups[key] || [];
    groups[key].push(model);
    return groups;
  }, {});

  for (const [provider, models] of Object.entries(groupedModels)) {
    const group = document.createElement("optgroup");
    group.label = provider;

    for (const model of models) {
      const option = document.createElement("option");
      option.value = model.id;
      option.textContent = model.id;
      option.selected = model.id === state.imageGeneration.modelId;
      group.appendChild(option);
    }

    elements.imageModelSelect.appendChild(group);
  }

  elements.imageModelSelect.disabled = state.imageGeneration.loading;
}

function setImageGenerationBanner(message = "", type = "warning") {
  if (!elements.imageGenerationBanner) {
    return;
  }

  if (!message) {
    elements.imageGenerationBanner.hidden = true;
    elements.imageGenerationBanner.textContent = "";
    elements.imageGenerationBanner.className = "inline-banner";
    return;
  }

  elements.imageGenerationBanner.hidden = false;
  elements.imageGenerationBanner.textContent = message;
  elements.imageGenerationBanner.className = `inline-banner ${type}`;
}

function formatImageGenerationTimestamp(timestamp) {
  if (!timestamp) {
    return "";
  }

  try {
    return new Date(timestamp).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (error) {
    return "";
  }
}

function renderImageGenerationResults() {
  if (!elements.imageResultList) {
    return;
  }

  const results = Array.isArray(state.imageGeneration.results) ? state.imageGeneration.results : [];
  elements.imageResultList.innerHTML = "";

  if (!results.length) {
    elements.imageResultList.innerHTML = '<div class="empty-state compact">暂无生成结果</div>';
    return;
  }

  for (const item of results) {
    const card = document.createElement("article");
    card.className = "image-result-card";

    const previewButton = document.createElement("button");
    previewButton.type = "button";
    previewButton.className = "image-result-preview";
    previewButton.addEventListener("click", () => {
      openImagePreview({
        url: item.url,
        name: item.modelId || "生成图片"
      });
    });

    const image = document.createElement("img");
    image.className = "image-result-image";
    image.src = item.url;
    image.alt = item.prompt || "生成图片";
    image.loading = "lazy";
    previewButton.appendChild(image);

    const meta = document.createElement("div");
    meta.className = "image-result-meta";

    const top = document.createElement("div");
    top.className = "image-result-top";

    const model = document.createElement("strong");
    model.textContent = item.modelId || "生图模型";

    const time = document.createElement("span");
    time.className = "image-result-time";
    time.textContent = formatImageGenerationTimestamp(item.timestamp);

    top.append(model, time);

    const prompt = document.createElement("p");
    prompt.className = "image-result-prompt";
    prompt.textContent = item.prompt || "";
    meta.append(top, prompt);

    if (item.revisedPrompt && item.revisedPrompt !== item.prompt) {
      const revisedPrompt = document.createElement("p");
      revisedPrompt.className = "image-result-revised-prompt";
      revisedPrompt.textContent = `修订提示词：${item.revisedPrompt}`;
      meta.appendChild(revisedPrompt);
    }

    if (item.size) {
      const size = document.createElement("p");
      size.className = "image-result-size";
      size.textContent = `尺寸：${item.size}`;
      meta.appendChild(size);
    }

    card.append(previewButton, meta);
    elements.imageResultList.appendChild(card);
  }
}

function renderImageGenerationControls() {
  const selectedImageModel = getSelectedImageModel();
  const hasImageModels = state.imageModels.length > 0;

  if (elements.imageGenerationStatus) {
    if (!state.adminAuth.authenticated) {
      elements.imageGenerationStatus.textContent = "请先登录后再使用图片生成。";
    } else if (!hasImageModels) {
      elements.imageGenerationStatus.textContent = "当前 API 未识别到生图模型。";
    } else {
      elements.imageGenerationStatus.textContent = `已从当前 API 识别到 ${state.imageModels.length} 个生图模型。`;
    }
  }

  if (elements.imageGenerationModelMeta) {
    if (!state.adminAuth.authenticated) {
      elements.imageGenerationModelMeta.textContent = "请先登录后再使用图片生成功能。";
    } else if (!hasImageModels) {
      elements.imageGenerationModelMeta.textContent = "没有从 /v1/models 中识别到可用的生图模型。";
    } else {
      elements.imageGenerationModelMeta.textContent = `当前生图模型：${selectedImageModel?.id || state.imageGeneration.modelId}`;
    }
  }

  renderImageModelSelect();

  if (elements.imageModelSelect) {
    elements.imageModelSelect.disabled = state.imageGeneration.loading || !hasImageModels;
  }

  if (elements.imageSizeSelect) {
    elements.imageSizeSelect.disabled = state.imageGeneration.loading || !state.adminAuth.authenticated;
  }

  if (elements.imagePromptInput) {
    elements.imagePromptInput.disabled = state.imageGeneration.loading || !state.adminAuth.authenticated;
  }

  if (elements.generateImageButton) {
    elements.generateImageButton.disabled =
      state.imageGeneration.loading || !state.adminAuth.authenticated || !hasImageModels;
    elements.generateImageButton.textContent = state.imageGeneration.loading ? "生成中..." : "生成图片";
  }
}

function renderModelList() {
  const activeConversation = getActiveConversation();
  const selectedImageModel = getSelectedImageModel();
  filterModels();
  renderConfigSummary();

  if (!state.filteredModels.length) {
    elements.modelList.innerHTML = '<div class="empty-state compact">没有匹配的模型</div>';
    return;
  }

  elements.modelList.innerHTML = "";

  for (const model of state.filteredModels) {
    const capabilities = getModelCapabilities(model);
    const isActiveChatModel = model.id === activeConversation?.modelId;
    const isActiveImageModel = model.id === selectedImageModel?.id;
    const isUsableModel = capabilities.chatCompletion || capabilities.imageGeneration;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `model-item${isActiveChatModel || isActiveImageModel ? " active" : ""}`;
    button.disabled = state.loading || state.configForm.saving || state.configForm.testing || !isUsableModel;

    const top = document.createElement("div");
    top.className = "model-item-top";

    const name = document.createElement("span");
    name.className = "model-name";
    name.textContent = model.id;

    const provider = document.createElement("span");
    provider.className = "model-provider";
    provider.textContent = formatProvider(model.owned_by);

    const badges = document.createElement("div");
    badges.className = "model-capability-badges";

    if (capabilities.chatCompletion) {
      const badge = document.createElement("span");
      badge.className = "model-capability-badge chat";
      badge.textContent = "聊天";
      badges.appendChild(badge);
    }

    if (capabilities.imageGeneration) {
      const badge = document.createElement("span");
      badge.className = "model-capability-badge image";
      badge.textContent = "生图";
      badges.appendChild(badge);
    }

    if (!isUsableModel) {
      const badge = document.createElement("span");
      badge.className = "model-capability-badge other";
      badge.textContent = "其他";
      badges.appendChild(badge);
    }

    const bottom = document.createElement("div");
    bottom.className = "model-item-bottom";

    const createdAt = document.createElement("span");
    createdAt.className = "model-date";
    createdAt.textContent = `创建于 ${formatDate(model.created)}`;

    const activeLabel = document.createElement("span");
    activeLabel.className = "model-date";

    if (isActiveChatModel) {
      activeLabel.textContent = "当前聊天模型";
    } else if (isActiveImageModel) {
      activeLabel.textContent = "当前生图模型";
    } else if (capabilities.chatCompletion) {
      activeLabel.textContent = capabilities.imageGeneration ? "点击切换为聊天模型" : "点击切换";
    } else if (capabilities.imageGeneration) {
      activeLabel.textContent = "点击切换到图片生成";
    } else {
      activeLabel.textContent = "不可用于聊天";
    }

    top.append(name, provider, badges);
    bottom.append(createdAt, activeLabel);
    button.append(top, bottom);

    button.addEventListener("click", () => {
      if (state.loading || state.configForm.saving || state.configForm.testing || !isUsableModel) {
        return;
      }

      if (capabilities.imageGeneration && state.activeSidebarTab === "images") {
        setImageGenerationModel(model.id);
        return;
      }

      if (capabilities.chatCompletion) {
        setConversationModel(model.id);
        return;
      }

      if (capabilities.imageGeneration) {
        setImageGenerationModel(model.id);
        setSidebarTab("images");
      }
    });

    elements.modelList.appendChild(button);
  }
}

function requireUserAccess(nextTab = "conversations") {
  if (state.adminAuth.authenticated) {
    return true;
  }

  showError("请先登录后再使用此功能。");
  openAdminAuthDialog(nextTab, "login");
  return false;
}

function renderSidebarNavigation() {
  const canAccessAdminTabs = isAdminUser();
  const canAccessImageTab = Boolean(state.adminAuth.authenticated);
  const showImages = canAccessImageTab && state.activeSidebarTab === "images";
  const showModels = canAccessAdminTabs && state.activeSidebarTab === "models";
  const showUsers = canAccessAdminTabs && state.activeSidebarTab === "users";
  const showAnnouncements = canAccessAdminTabs && state.activeSidebarTab === "announcements";
  const showConversations = !showImages && !showModels && !showUsers && !showAnnouncements;

  if (elements.imageGenNavButton) {
    elements.imageGenNavButton.hidden = !canAccessImageTab;
    elements.imageGenNavButton.classList.toggle("active", canAccessImageTab && showImages);
    elements.imageGenNavButton.setAttribute("aria-pressed", String(canAccessImageTab && showImages));
  }

  elements.modelNavButton.hidden = !canAccessAdminTabs;
  elements.userNavButton.hidden = !canAccessAdminTabs;
  elements.announcementNavButton.hidden = !canAccessAdminTabs;
  elements.chatWorkspace.hidden = !showConversations;
  if (elements.imageWorkspace) {
    elements.imageWorkspace.hidden = !showImages;
  }
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
  const canAccessImageTab = Boolean(state.adminAuth.authenticated);
  const nextTab = (() => {
    if (canAccessImageTab && tab === "images") {
      return "images";
    }

    if (canAccessAdminTabs && (tab === "models" || tab === "users" || tab === "announcements")) {
      return tab;
    }

    return "conversations";
  })();

  state.activeSidebarTab = nextTab;
  localStorage.setItem(storageKeys.sidebarTab, state.activeSidebarTab);

  if (updateHash) {
    const hashByTab = {
      conversations: "#chat",
      images: "#images",
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
  renderWorkspacePanel();

  if (state.activeSidebarTab === "images") {
    renderImageGenerationControls();
    renderImageGenerationResults();
  } else if (state.activeSidebarTab === "users" && isAdminUser()) {
    loadAdminUsers();
  } else if (state.activeSidebarTab === "announcements" && isAdminUser()) {
    loadAdminAnnouncements();
  }

  if (closeMobileSidebar) {
    closeMobileSidebarIfNeeded();
  }
}
