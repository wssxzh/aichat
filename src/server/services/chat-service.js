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
