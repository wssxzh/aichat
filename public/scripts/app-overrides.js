function applyStaticUiOverrides() {
  if (elements.configApiBaseUrlInput) {
    elements.configApiBaseUrlInput.placeholder = "https://example.com/v1";
  }

  const imageWorkspaceTitleCopy = document.querySelector("#imageWorkspace .workspace-title-block .section-caption");
  if (imageWorkspaceTitleCopy) {
    imageWorkspaceTitleCopy.textContent = "会从当前已启用接口中识别可用的生图模型。";
  }

  const imageSettingsCopy = document.querySelector("#imageWorkspace .admin-panel .panel-heading p");
  if (imageSettingsCopy) {
    imageSettingsCopy.textContent = "从已启用接口中选择识别到的生图模型来生成图片。";
  }

  const modelConfigCopy = document.querySelector("#modelWorkspace .admin-panel .panel-heading p");
  if (modelConfigCopy) {
    modelConfigCopy.innerHTML =
      '为每个接口分别配置 API Base URL 与 API Key，API Base URL 必须填写到版本层，例如 <code>https://example.com/v1</code>。';
  }
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

function syncConfigFormInputs() {
  state.configForm.apiConfigs = normalizeClientApiConfigList(state.configForm.apiConfigs);
  renderApiConfigList();
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

function renderImageGenerationControls() {
  const selectedImageModel = getSelectedImageModel();
  const hasImageModels = state.imageModels.length > 0;

  if (elements.imageGenerationStatus) {
    if (!hasImageModels) {
      elements.imageGenerationStatus.textContent = "当前已启用接口中没有识别到生图模型。";
    } else if (!state.adminAuth.authenticated) {
      elements.imageGenerationStatus.textContent = `已识别到 ${state.imageModels.length} 个生图模型，登录后即可生成图片。`;
    } else {
      elements.imageGenerationStatus.textContent = `已从当前启用的接口中识别到 ${state.imageModels.length} 个生图模型。`;
    }
  }

  if (elements.imageGenerationModelMeta) {
    if (!hasImageModels) {
      elements.imageGenerationModelMeta.textContent = "没有从已启用接口的 /v1/models 中识别到可用的生图模型。";
    } else if (!state.adminAuth.authenticated) {
      elements.imageGenerationModelMeta.textContent = "可先选择模型并填写提示词，登录后即可生成。";
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
    elements.imageSizeSelect.disabled = state.imageGeneration.loading || !hasImageModels;
  }

  if (elements.imagePromptInput) {
    elements.imagePromptInput.disabled = state.imageGeneration.loading || !hasImageModels;
  }

  if (elements.generateImageButton) {
    elements.generateImageButton.disabled =
      state.imageGeneration.loading || !state.adminAuth.authenticated || !hasImageModels;
    elements.generateImageButton.textContent = state.imageGeneration.loading ? "生成中..." : "生成图片";
  }
}

function renderSidebarNavigation() {
  const canAccessAdminTabs = isAdminUser();
  const showImages = state.activeSidebarTab === "images";
  const showModels = canAccessAdminTabs && state.activeSidebarTab === "models";
  const showUsers = canAccessAdminTabs && state.activeSidebarTab === "users";
  const showAnnouncements = canAccessAdminTabs && state.activeSidebarTab === "announcements";
  const showConversations = !showImages && !showModels && !showUsers && !showAnnouncements;

  if (elements.imageGenNavButton) {
    elements.imageGenNavButton.hidden = false;
    elements.imageGenNavButton.classList.toggle("active", showImages);
    elements.imageGenNavButton.setAttribute("aria-pressed", String(showImages));
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
  const nextTab = (() => {
    if (tab === "images") {
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

function normalizeImageGenerationTimestamp(timestamp) {
  const numeric = Number(timestamp);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return numeric < 1e12 ? numeric * 1000 : numeric;
}

function formatImageGenerationTimestamp(timestamp) {
  const normalizedTimestamp = normalizeImageGenerationTimestamp(timestamp);

  if (!normalizedTimestamp) {
    return "";
  }

  try {
    return new Date(normalizedTimestamp).toLocaleString("zh-CN", {
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
  elements.imageResultList.classList.toggle("is-generating", state.imageGeneration.loading);

  if (state.imageGeneration.loading) {
    const loadingCard = document.createElement("article");
    loadingCard.className = "image-result-card generating";

    const loadingPreview = document.createElement("div");
    loadingPreview.className = "image-result-loading-preview";

    const spinner = document.createElement("span");
    spinner.className = "image-generation-spinner";
    spinner.setAttribute("aria-hidden", "true");
    loadingPreview.appendChild(spinner);

    const loadingMeta = document.createElement("div");
    loadingMeta.className = "image-result-loading-copy";

    const loadingTitle = document.createElement("strong");
    loadingTitle.className = "image-result-loading-title";
    loadingTitle.textContent = "正在生成图片";

    const loadingHint = document.createElement("p");
    loadingHint.className = "image-result-loading-hint";
    loadingHint.textContent = "模型正在处理提示词，生成完成后会自动显示在这里。";

    loadingMeta.append(loadingTitle, loadingHint);
    loadingCard.append(loadingPreview, loadingMeta);
    elements.imageResultList.appendChild(loadingCard);
  }

  if (!results.length) {
    if (!state.imageGeneration.loading) {
      elements.imageResultList.innerHTML = '<div class="empty-state compact">暂无生成结果</div>';
      elements.imageResultList.classList.remove("is-generating");
    }
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
    if (!hasImageModels) {
      elements.imageGenerationStatus.textContent = "当前已启用接口中没有识别到生图模型。";
    } else if (!state.adminAuth.authenticated) {
      elements.imageGenerationStatus.textContent = `已识别到 ${state.imageModels.length} 个生图模型，登录后即可生成图片。`;
    } else if (state.imageGeneration.loading) {
      elements.imageGenerationStatus.textContent = "正在生成图片，请稍候...";
    } else {
      elements.imageGenerationStatus.textContent = `已从当前启用的接口中识别到 ${state.imageModels.length} 个生图模型。`;
    }
  }

  if (elements.imageGenerationModelMeta) {
    if (!hasImageModels) {
      elements.imageGenerationModelMeta.textContent = "没有从已启用接口的 /v1/models 中识别到可用的生图模型。";
    } else if (!state.adminAuth.authenticated) {
      elements.imageGenerationModelMeta.textContent = "可先选择模型并填写提示词，登录后即可生成。";
    } else if (state.imageGeneration.loading) {
      elements.imageGenerationModelMeta.textContent = "图片生成中，完成后会自动更新结果列表。";
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
    elements.imageSizeSelect.disabled = state.imageGeneration.loading || !hasImageModels;
  }

  if (elements.imagePromptInput) {
    elements.imagePromptInput.disabled = state.imageGeneration.loading || !hasImageModels;
  }

  if (elements.generateImageButton) {
    elements.generateImageButton.disabled =
      state.imageGeneration.loading || !state.adminAuth.authenticated || !hasImageModels;
    elements.generateImageButton.innerHTML = state.imageGeneration.loading
      ? '<span class="image-generation-button-spinner" aria-hidden="true"></span><span>生成中...</span>'
      : "生成图片";
  }
}

applyStaticUiOverrides();

const preferredSidebarTab =
  getSidebarTabFromHash() ||
  (["images", "models", "users", "announcements"].includes(readStorageItem(storageKeys.sidebarTab))
    ? readStorageItem(storageKeys.sidebarTab)
    : state.activeSidebarTab);

setSidebarTab(preferredSidebarTab, { updateHash: false, closeMobileSidebar: false });
