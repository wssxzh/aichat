"use strict";

function createChatService(options) {
  const { requestJsonWithRetry, createApiHeaders, createUpstreamError } = options;

  function buildModelKey(sourceApiId, modelId) {
    return `${String(sourceApiId || "").trim()}::${String(modelId || "").trim()}`;
  }

  function sortModels(left, right) {
    const leftOwner = String(left.owned_by || "");
    const rightOwner = String(right.owned_by || "");

    if (leftOwner !== rightOwner) {
      return leftOwner.localeCompare(rightOwner);
    }

    const leftSource = String(left.sourceApiName || "");
    const rightSource = String(right.sourceApiName || "");

    if (leftSource !== rightSource) {
      return leftSource.localeCompare(rightSource, "zh-CN");
    }

    return String(left.id || "").localeCompare(String(right.id || ""));
  }

  function getModelSearchText(model) {
    return [
      model?.id,
      model?.owned_by,
      model?.object,
      model?.type,
      model?.name,
      model?.description
    ]
      .map((item) => String(item || "").trim().toLowerCase())
      .filter(Boolean)
      .join(" ");
  }

  function isLikelyImageGenerationModel(model) {
    const haystack = getModelSearchText(model);

    if (!haystack) {
      return false;
    }

    if (
      /(gpt-image|dall[-_ ]?e|stable[-_ ]?diffusion|sdxl|flux|imagen|recraft|playground|kolors|cogview|wanx|seedream|jimeng|qwen[-_ ]?image|text[-_ ]?to[-_ ]?image)/i.test(
        haystack
      )
    ) {
      return true;
    }

    if (!/\bimage\b/i.test(haystack)) {
      return false;
    }

    if (/\b(vision|vl|ocr|embed|embedding|rerank|audio|speech|whisper|transcribe)\b/i.test(haystack)) {
      return false;
    }

    return /\b(gen|generation|create|creator|draw|drawing|paint|painting|art)\b/i.test(haystack);
  }

  function isLikelyNonChatModel(model) {
    const haystack = getModelSearchText(model);

    if (!haystack) {
      return false;
    }

    if (isLikelyImageGenerationModel(model)) {
      return true;
    }

    return /(embedding|embed|rerank|moderation|whisper|transcri(?:be|ption)?|tts|speech|audio|omni-moderation)/i.test(
      haystack
    );
  }

  function inferModelCapabilities(model) {
    const imageGeneration = isLikelyImageGenerationModel(model);
    const chatCompletion = !isLikelyNonChatModel(model);

    return {
      chatCompletion,
      imageGeneration
    };
  }

  function annotateModel(model) {
    return {
      ...model,
      capabilities: inferModelCapabilities(model)
    };
  }

  function normalizeModelCatalog(payload, apiConfig) {
    const rawModels = Array.isArray(payload?.data) ? payload.data : [];
    const allModels = rawModels
      .map((model) => {
        const annotatedModel = annotateModel(model);

        return {
          ...annotatedModel,
          sourceApiId: apiConfig.id,
          sourceApiName: apiConfig.name,
          modelKey: buildModelKey(apiConfig.id, annotatedModel.id)
        };
      })
      .sort(sortModels);

    const chatModels = allModels.filter((model) => model.capabilities?.chatCompletion);
    const imageModels = allModels.filter((model) => model.capabilities?.imageGeneration);

    return {
      data: chatModels,
      chatModels,
      imageModels,
      allModels,
      summary: {
        totalModelCount: allModels.length,
        chatModelCount: chatModels.length,
        imageModelCount: imageModels.length
      }
    };
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
    const model = typeof body?.model === "string" ? body.model.trim() : "";
    const sourceApiId = typeof body?.sourceApiId === "string" ? body.sourceApiId.trim() : "";
    const { messages, temperature } = body || {};

    if (!model) {
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

    return {
      payload,
      model,
      sourceApiId
    };
  }

  function buildImageGenerationPayload(body) {
    const model = typeof body?.model === "string" ? body.model.trim() : "";
    const sourceApiId = typeof body?.sourceApiId === "string" ? body.sourceApiId.trim() : "";
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const size = typeof body?.size === "string" ? body.size.trim() : "";

    if (!model) {
      return {
        error: {
          status: 400,
          payload: { error: "请先选择生图模型。" }
        }
      };
    }

    if (!prompt) {
      return {
        error: {
          status: 400,
          payload: { error: "请输入图片提示词。" }
        }
      };
    }

    if (prompt.length > 4000) {
      return {
        error: {
          status: 400,
          payload: { error: "提示词过长，请控制在 4000 个字符以内。" }
        }
      };
    }

    if (size.length > 40) {
      return {
        error: {
          status: 400,
          payload: { error: "图片尺寸参数无效。" }
        }
      };
    }

    const payload = {
      model,
      prompt,
      n: 1
    };

    if (size) {
      payload.size = size;
    }

    return {
      payload,
      model,
      sourceApiId
    };
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

  async function fetchModelsForApiConfig(apiConfig) {
    const upstreamResponse = await requestJsonWithRetry(`${apiConfig.apiBaseUrl}/models`, {
      headers: createApiHeaders(apiConfig.apiKey)
    });

    if (!upstreamResponse.ok) {
      const error = createUpstreamError(upstreamResponse);
      error.apiConfigId = apiConfig.id;
      error.apiConfigName = apiConfig.name;
      throw error;
    }

    return normalizeModelCatalog(upstreamResponse.data, apiConfig);
  }

  async function fetchModelsWithConfigs(apiConfigs) {
    if (!Array.isArray(apiConfigs) || !apiConfigs.length) {
      throw new Error("当前没有可用的 API 配置。");
    }

    const settledResults = await Promise.allSettled(
      apiConfigs.map(async (apiConfig) => {
        const catalog = await fetchModelsForApiConfig(apiConfig);
        return {
          apiConfig,
          catalog
        };
      })
    );

    const chatModels = [];
    const imageModels = [];
    const allModels = [];
    const apiStatuses = [];
    let firstError = null;

    for (const item of settledResults) {
      if (item.status === "fulfilled") {
        const { apiConfig, catalog } = item.value;
        chatModels.push(...catalog.chatModels);
        imageModels.push(...catalog.imageModels);
        allModels.push(...catalog.allModels);
        apiStatuses.push({
          id: apiConfig.id,
          name: apiConfig.name,
          apiBaseUrl: apiConfig.apiBaseUrl,
          enabled: true,
          ok: true,
          totalModelCount: catalog.summary.totalModelCount,
          chatModelCount: catalog.summary.chatModelCount,
          imageModelCount: catalog.summary.imageModelCount
        });
        continue;
      }

      const error = item.reason;

      if (!firstError) {
        firstError = error;
      }

      apiStatuses.push({
        id: error?.apiConfigId || "",
        name: error?.apiConfigName || "未知接口",
        apiBaseUrl: error?.url || "",
        enabled: true,
        ok: false,
        detail: error?.message || "获取模型失败。"
      });
    }

    if (!allModels.length && firstError) {
      throw firstError;
    }

    chatModels.sort(sortModels);
    imageModels.sort(sortModels);
    allModels.sort(sortModels);

    return {
      data: chatModels,
      chatModels,
      imageModels,
      allModels,
      apiStatuses,
      summary: {
        apiCount: apiConfigs.length,
        reachableApiCount: apiStatuses.filter((item) => item.ok).length,
        failedApiCount: apiStatuses.filter((item) => !item.ok).length,
        totalModelCount: allModels.length,
        chatModelCount: chatModels.length,
        imageModelCount: imageModels.length
      }
    };
  }

  function extractImageGenerationItems(payload) {
    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    if (Array.isArray(payload?.images)) {
      return payload.images;
    }

    return [];
  }

  function normalizeGeneratedImage(item) {
    const rawBase64 = typeof item?.b64_json === "string" ? item.b64_json.trim() : "";
    const mimeType =
      typeof item?.mime_type === "string" && item.mime_type.includes("/")
        ? item.mime_type.trim()
        : "image/png";
    const remoteUrl = typeof item?.url === "string" ? item.url.trim() : "";
    let url = "";

    if (rawBase64) {
      url = rawBase64.startsWith("data:") ? rawBase64 : `data:${mimeType};base64,${rawBase64}`;
    } else if (remoteUrl) {
      url = remoteUrl;
    }

    if (!url) {
      return null;
    }

    return {
      url,
      mimeType,
      revisedPrompt: typeof item?.revised_prompt === "string" ? item.revised_prompt.trim() : "",
      seed: Number.isFinite(Number(item?.seed)) ? Number(item.seed) : null
    };
  }

  async function generateImagesWithConfig(apiConfig, payload) {
    const requestBody = JSON.stringify(payload);
    const upstreamResponse = await requestJsonWithRetry(`${apiConfig.apiBaseUrl}/images/generations`, {
      method: "POST",
      headers: createApiHeaders(apiConfig.apiKey, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody)
      }),
      body: requestBody
    });

    if (!upstreamResponse.ok) {
      throw createUpstreamError(upstreamResponse);
    }

    const imageItems = extractImageGenerationItems(upstreamResponse.data)
      .map(normalizeGeneratedImage)
      .filter(Boolean);
    const upstreamCreated = Number(upstreamResponse.data?.created);
    const created =
      Number.isFinite(upstreamCreated) && upstreamCreated > 0
        ? (upstreamCreated < 1e12 ? upstreamCreated * 1000 : upstreamCreated)
        : Date.now();

    return {
      created,
      data: imageItems
    };
  }

  return {
    buildModelKey,
    sortModels,
    inferModelCapabilities,
    buildChatPayload,
    buildImageGenerationPayload,
    sendSseEvent,
    fetchModelsForApiConfig,
    fetchModelsWithConfigs,
    generateImagesWithConfig
  };
}

module.exports = { createChatService };
