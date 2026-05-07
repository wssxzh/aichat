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
  renderMessages({ forceScroll: true });
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
  enableChatAutoFollow();
  renderMessages({ forceScroll: true });
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
  enableChatAutoFollow();
  renderMessages({ forceScroll: true });
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
  const webSearchConfig =
    payload.webSearch && typeof payload.webSearch === "object" ? payload.webSearch : {};
  state.webSearchFeatureEnabled = webSearchConfig.serverEnabled !== false;

  if (!state.webSearchPreferenceSynced) {
    setWebSearchEnabled(Boolean(webSearchConfig.defaultEnabled), { persist: false });
  }

  renderWebSearchToggle();
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
    webEnabled: Boolean(state.webSearchFeatureEnabled && state.webSearchEnabled)
  };

  const assistantMessage = createAssistantMessage(activeConversation.modelId);
  activeConversation.messages.push(assistantMessage);
  persistConversationState();

  elements.userInput.value = "";
  autoResizeComposer();
  renderConversationList();
  enableChatAutoFollow();
  renderMessages({ forceScroll: true });
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
  elements.chatMessages.addEventListener("scroll", handleChatMessagesScroll);
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
