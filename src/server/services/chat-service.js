"use strict";

function createChatService(options) {
  const { requestJsonWithRetry, createApiHeaders, createUpstreamError } = options;

function sortModels(left, right) {
  const leftOwner = String(left.owned_by || "");
  const rightOwner = String(right.owned_by || "");

  if (leftOwner !== rightOwner) {
    return leftOwner.localeCompare(rightOwner);
  }

  return String(left.id || "").localeCompare(String(right.id || ""));
}

function isValidMessagePart(part) {
  if (!part || typeof part !== "object" || Array.isArray(part)) {
    return false;
  }

  if (part.type === "text") {
    return typeof part.text === "string" && part.text.trim().length > 0;
  }

  if (part.type === "image_url") {
    const url = String(part?.image_url?.url || "").trim();
    const detail = part?.image_url?.detail;
    const isSupportedUrl = url.startsWith("data:image/") || /^https?:\/\//i.test(url);
    const isSupportedDetail =
      detail === undefined || detail === "auto" || detail === "low" || detail === "high";

    return Boolean(isSupportedUrl && isSupportedDetail);
  }

  return false;
}

function isValidMessageContent(content) {
  if (typeof content === "string") {
    return content.trim().length > 0;
  }

  if (!Array.isArray(content) || !content.length) {
    return false;
  }

  return content.every(isValidMessagePart);
}

function isValidMessages(messages) {
  return Array.isArray(messages) && messages.every((message) => {
    return (
      message &&
      typeof message.role === "string" &&
      message.role.trim().length > 0 &&
      isValidMessageContent(message.content)
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


  return {
    sortModels,
    buildChatPayload,
    sendSseEvent,
    fetchModelsWithConfig
  };
}

module.exports = { createChatService };
