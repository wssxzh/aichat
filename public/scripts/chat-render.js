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

function syncMessageTextBlock(container, message) {
  renderMessageContent(container, message);

  const hasText = Boolean(compactText(getMessageTextContent(message)));
  container.hidden = !hasText;

  if (hasText) {
    container.removeAttribute("aria-hidden");
    return;
  }

  container.setAttribute("aria-hidden", "true");
}

function openImagePreview(attachment) {
  if (!elements.imagePreviewModal || !elements.imagePreviewImage) {
    return;
  }

  elements.imagePreviewImage.src = attachment.url;
  elements.imagePreviewImage.alt = attachment.name || "上传图片";
  elements.imagePreviewModal.hidden = false;
}

function closeImagePreview() {
  if (!elements.imagePreviewModal || !elements.imagePreviewImage) {
    return;
  }

  elements.imagePreviewModal.hidden = true;
  elements.imagePreviewImage.removeAttribute("src");
  elements.imagePreviewImage.alt = "";
}

function createMessageAttachmentElement(attachment) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "message-attachment-link";
  button.setAttribute("aria-label", `查看大图：${attachment.name || "图片"}`);

  const image = document.createElement("img");
  image.className = "message-attachment-image";
  image.src = attachment.url;
  image.alt = attachment.name || "上传图片";
  image.loading = "lazy";

  button.appendChild(image);
  button.addEventListener("click", () => {
    openImagePreview(attachment);
  });
  return button;
}

function renderMessageAttachments(container, message) {
  if (!(container instanceof HTMLElement)) {
    return;
  }

  const attachments = getMessageAttachments(message);
  container.innerHTML = "";
  container.hidden = !attachments.length;

  if (!attachments.length) {
    return;
  }

  for (const attachment of attachments) {
    container.appendChild(createMessageAttachmentElement(attachment));
  }
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

    const attachments = document.createElement("div");
    attachments.className = "message-attachments";
    renderMessageAttachments(attachments, message);

    const text = document.createElement("div");
    text.className = "message-text";
    syncMessageTextBlock(text, message);

    const footer = document.createElement("div");
    footer.className = "message-footer";

    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = formatMessageTime(message);
    footer.appendChild(time);

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
    const deleteAction = createMessageAction("delete", "删除此条消息", async () => {
      await deleteConversationMessagesFromMessageId(message.id);
    });
    syncFeedbackActionState(likeAction, dislikeAction, normalizeMessageFeedback(message.feedback));
    deleteAction.classList.add("danger");
    actions.append(copyAction, likeAction, dislikeAction, deleteAction);

    card.append(attachments, text, footer);
    stack.append(card, actions);
    article.append(avatar, stack);
    return article;
  }

  const stack = document.createElement("div");
  stack.className = "user-stack";
  const attachments = getMessageAttachments(message);
  const hasText = Boolean(compactText(getMessageTextContent(message)));

  if (attachments.length) {
    const attachmentStack = document.createElement("div");
    attachmentStack.className = "message-user-attachments";

    const attachmentGrid = document.createElement("div");
    attachmentGrid.className = "message-attachments user-attachments";
    renderMessageAttachments(attachmentGrid, message);

    attachmentStack.appendChild(attachmentGrid);

    if (!hasText) {
      const attachmentMeta = document.createElement("div");
      attachmentMeta.className = "message-attachment-meta";

      const attachmentTime = document.createElement("span");
      attachmentTime.className = "message-time";
      attachmentTime.textContent = formatMessageTime(message);
      attachmentMeta.appendChild(attachmentTime);
      attachmentStack.appendChild(attachmentMeta);
    }

    stack.appendChild(attachmentStack);
  }

  if (hasText || !attachments.length) {
    const card = document.createElement("div");
    card.className = "message-card user-card";

    const text = document.createElement("div");
    text.className = "message-text";
    syncMessageTextBlock(text, message);

    const footer = document.createElement("div");
    footer.className = "message-footer";

    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = formatMessageTime(message);
    footer.appendChild(time);

    card.append(text, footer);
    stack.appendChild(card);
  }

  if (hasText || attachments.length) {
    const actions = document.createElement("div");
    actions.className = "message-actions";

    if (hasText) {
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
    }

    const deleteAction = createMessageAction("delete", "删除此条消息", async () => {
      await deleteConversationMessagesFromMessageId(message.id);
    });
    deleteAction.classList.add("danger");
    actions.append(deleteAction);
    stack.appendChild(actions);
  }

  const avatar = document.createElement("div");
  avatar.className = "user-avatar";
  avatar.textContent = "你";

  article.append(stack, avatar);
  return article;
}
function scrollChatToBottom() {
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function getChatScrollSnapshot() {
  return {
    scrollTop: elements.chatMessages.scrollTop,
    distanceFromBottom: Math.max(
      0,
      elements.chatMessages.scrollHeight - elements.chatMessages.clientHeight - elements.chatMessages.scrollTop
    )
  };
}

function isChatAtBottom() {
  return (
    elements.chatMessages.scrollHeight - elements.chatMessages.clientHeight - elements.chatMessages.scrollTop
  ) <= chatAutoFollowBottomThresholdPx;
}

function setChatAutoFollow(enabled) {
  state.chatScroll.autoFollow = Boolean(enabled);
}

function enableChatAutoFollow() {
  setChatAutoFollow(true);
}

function handleChatMessagesScroll() {
  setChatAutoFollow(isChatAtBottom());
}

function renderMessages(options = {}) {
  const { forceScroll = false } = options;
  const activeConversation = getActiveConversation();
  const previousScroll = getChatScrollSnapshot();

  if (!activeConversation || !activeConversation.messages.length) {
    enableChatAutoFollow();
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

  if (forceScroll || state.chatScroll.autoFollow) {
    enableChatAutoFollow();
    scrollChatToBottom();
    return;
  }

  const maxScrollTop = Math.max(0, elements.chatMessages.scrollHeight - elements.chatMessages.clientHeight);
  elements.chatMessages.scrollTop = Math.min(
    maxScrollTop,
    Math.max(0, elements.chatMessages.scrollHeight - elements.chatMessages.clientHeight - previousScroll.distanceFromBottom)
  );
}

function syncMessageElement(message) {
  const article = elements.chatMessages.querySelector(`[data-message-id="${message.id}"]`);

  if (!article) {
    renderMessages();
    return;
  }

  const card = article.querySelector(".message-card");
  const attachments = article.querySelector(".message-attachments");
  const text = article.querySelector(".message-text");
  const time = article.querySelector(".message-time");

  if (card) {
    card.classList.toggle("streaming", Boolean(message.streaming));
  }

  if (attachments) {
    renderMessageAttachments(attachments, message);
  }

  if (text) {
    syncMessageTextBlock(text, message);
  }

  if (time) {
    time.textContent = formatMessageTime(message);
  }

  if (state.chatScroll.autoFollow) {
    scrollChatToBottom();
  }
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
    elements.composerHint.textContent = `正在使用 ${activeConversation?.modelId || "当前模型"} 流式生成，点击按钮可停止。`;
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
        hasRenderableMessageContent(message)
      );
    })
    .map((message) => {
      const role = message.role;
      const content = getMessageTextContent(message);
      const attachments = getMessageAttachments(message);

      if (role === "user" && attachments.length) {
        const parts = [];

        if (compactText(content)) {
          parts.push({
            type: "text",
            text: content
          });
        }

        for (const attachment of attachments) {
          parts.push({
            type: "image_url",
            image_url: {
              url: attachment.url,
              detail: "auto"
            }
          });
        }

        return { role, content: parts };
      }

      return { role, content };
    });

  if (!systemPrompt) {
    return [{ role: "system", content: defaultMarkdownFormatInstruction }, ...conversationMessages];
  }

  return [
    {
      role: "system",
      content: `${defaultMarkdownFormatInstruction}\n\n补充系统要求：\n${systemPrompt}`
    },
    ...conversationMessages
  ];
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

      // 直接按当前收到的流式片段批量刷新，避免逐字动画拖慢显示速度。
      controller.message.content += controller.queue.join("");
      controller.queue.length = 0;
      syncMessageElement(controller.message);
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
  if (!text || controller.cancelled) {
    return;
  }

  controller.queue.push(String(text));
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
