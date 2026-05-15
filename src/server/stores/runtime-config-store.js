"use strict";

const fs = require("fs");
const crypto = require("crypto");
const { createQueuedTaskRunner, writeFileAtomic } = require("../utils/atomic-file");

function createRuntimeConfigStore(options) {
  const {
    runtimeConfigPath,
    webSearchServerEnabled,
    webSearchDefaultEnabled,
    webSearchDirectUrlEnabled
  } = options;

  function trimTrailingSlashes(value) {
    return String(value || "").trim().replace(/\/+$/, "");
  }

  function hasVersionSuffix(pathname) {
    const normalizedPathname = String(pathname || "").trim().replace(/\/+$/, "");
    return /\/v\d+(?:[A-Za-z0-9._-]*)$/i.test(normalizedPathname);
  }

  function validateApiBaseUrl(value) {
    const normalized = trimTrailingSlashes(value);

    if (!normalized) {
      throw new Error("API 地址不能为空。");
    }

    let parsedUrl = null;

    try {
      parsedUrl = new URL(normalized);
    } catch (error) {
      throw new Error("API 地址格式不正确。");
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("API 地址必须以 http:// 或 https:// 开头。");
    }

    if (hasVersionSuffix(parsedUrl.pathname)) {
      return normalized;
    }

    throw new Error("API 基础地址必须填到版本层，例如 https://example.com/v1 或 https://example.com/v3。");
  }

  function sanitizeApiKey(value) {
    return String(value || "").trim();
  }

  function sanitizeApiConfigName(value, index = 0) {
    const normalized = String(value || "").trim().slice(0, 80);
    return normalized || `接口 ${index + 1}`;
  }

  function sanitizeApiConfigId(value) {
    const normalized = String(value || "").trim().slice(0, 120);
    return normalized || `api-${crypto.randomUUID()}`;
  }

  function maskApiKey(apiKey) {
    if (!apiKey) {
      return "未配置";
    }

    if (apiKey.length <= 4) {
      return `${apiKey[0] || "*"}***`;
    }

    return `${apiKey.slice(0, 2)}***${apiKey.slice(-2)}`;
  }

  function normalizeApiConfig(input, index = 0) {
    return {
      id: sanitizeApiConfigId(input?.id),
      name: sanitizeApiConfigName(input?.name, index),
      apiBaseUrl: validateApiBaseUrl(input?.apiBaseUrl),
      apiKey: sanitizeApiKey(input?.apiKey),
      enabled: input?.enabled !== false
    };
  }

  function normalizeApiConfigList(inputs) {
    if (!Array.isArray(inputs) || !inputs.length) {
      throw new Error("至少需要配置一个 API。");
    }

    const seenIds = new Set();
    const normalizedList = inputs.map((item, index) => {
      const normalizedItem = normalizeApiConfig(item, index);

      while (seenIds.has(normalizedItem.id)) {
        normalizedItem.id = `api-${crypto.randomUUID()}`;
      }

      seenIds.add(normalizedItem.id);
      return normalizedItem;
    });

    if (!normalizedList.some((item) => item.enabled)) {
      throw new Error("至少需要启用一个 API。");
    }

    return normalizedList;
  }

  function createDefaultRuntimeConfig() {
    return {
      apiConfigs: normalizeApiConfigList([
        {
          id: "api-default",
          name: "默认接口",
          apiBaseUrl: process.env.API_BASE_URL || "https://api.example.com/v1",
          apiKey: process.env.API_KEY || "demo-key-change-me",
          enabled: true
        }
      ])
    };
  }

  function readSavedRuntimeConfig() {
    if (!fs.existsSync(runtimeConfigPath)) {
      return {};
    }

    try {
      const raw = fs.readFileSync(runtimeConfigPath, "utf8");
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed?.apiConfigs) && parsed.apiConfigs.length) {
        return {
          apiConfigs: normalizeApiConfigList(parsed.apiConfigs)
        };
      }

      if (parsed?.apiBaseUrl) {
        return {
          apiConfigs: normalizeApiConfigList([
            {
              id: "api-default",
              name: "默认接口",
              apiBaseUrl: parsed.apiBaseUrl,
              apiKey: parsed.apiKey
            }
          ])
        };
      }

      return {};
    } catch (error) {
      console.warn("Failed to read runtime config:", error);
      return {};
    }
  }

  const runtimeConfig = {
    ...createDefaultRuntimeConfig(),
    ...readSavedRuntimeConfig()
  };

  function getApiConfigs() {
    return runtimeConfig.apiConfigs.map((item) => ({ ...item }));
  }

  function getEnabledApiConfigs() {
    return getApiConfigs().filter((item) => item.enabled);
  }

  function getRuntimeConfig() {
    return getEnabledApiConfigs()[0] || getApiConfigs()[0] || null;
  }

  function getApiConfigById(apiConfigId) {
    const normalizedId = String(apiConfigId || "").trim();

    if (!normalizedId) {
      return null;
    }

    return getApiConfigs().find((item) => item.id === normalizedId) || null;
  }

  function serializeApiConfigForClient(apiConfig, includeApiKey = false) {
    return {
      id: apiConfig.id,
      name: apiConfig.name,
      apiBaseUrl: apiConfig.apiBaseUrl,
      apiKey: includeApiKey ? apiConfig.apiKey : undefined,
      apiKeyPreview: maskApiKey(apiConfig.apiKey),
      keyConfigured: Boolean(apiConfig.apiKey),
      enabled: Boolean(apiConfig.enabled)
    };
  }

  function serializeConfigForClient(includeApiKey = false) {
    const firstApiConfig = getRuntimeConfig();
    const apiConfigs = getApiConfigs().map((item) => serializeApiConfigForClient(item, includeApiKey));
    const enabledCount = apiConfigs.filter((item) => item.enabled).length;

    return {
      apiBaseUrl: firstApiConfig?.apiBaseUrl || "",
      apiKey: includeApiKey ? (firstApiConfig?.apiKey || "") : undefined,
      apiKeyPreview: maskApiKey(firstApiConfig?.apiKey || ""),
      keyConfigured: apiConfigs.some((item) => item.keyConfigured),
      apiCount: apiConfigs.length,
      enabledApiCount: enabledCount,
      apiConfigs,
      webSearch: {
        serverEnabled: webSearchServerEnabled,
        defaultEnabled: webSearchDefaultEnabled,
        directUrlEnabled: webSearchDirectUrlEnabled
      }
    };
  }

  function buildRuntimeConfigSnapshot(config) {
    return {
      apiConfigs: config.apiConfigs.map((item) => ({
        id: item.id,
        name: item.name,
        apiBaseUrl: item.apiBaseUrl,
        apiKey: item.apiKey,
        enabled: Boolean(item.enabled)
      }))
    };
  }

  const persistRuntimeConfigQueued = createQueuedTaskRunner(async (snapshot) => {
    await writeFileAtomic(runtimeConfigPath, JSON.stringify(snapshot, null, 2), "utf8");
  });

  async function persistRuntimeConfig(config) {
    await persistRuntimeConfigQueued(buildRuntimeConfigSnapshot(config));
  }

  async function updateRuntimeConfig(nextValues) {
    const nextConfig = {
      apiConfigs: normalizeApiConfigList(nextValues.apiConfigs)
    };

    runtimeConfig.apiConfigs = nextConfig.apiConfigs;
    await persistRuntimeConfig(runtimeConfig);

    return {
      apiConfigs: getApiConfigs()
    };
  }

  function readConfigFromBody(body, fallbackToRuntime = false) {
    if (Array.isArray(body?.apiConfigs)) {
      return {
        apiConfigs: normalizeApiConfigList(body.apiConfigs)
      };
    }

    const currentConfig = fallbackToRuntime
      ? getApiConfigs()
      : [
          {
            id: "api-default",
            name: "默认接口",
            apiBaseUrl: "",
            apiKey: "",
            enabled: true
          }
        ];

    const baseApiConfig = currentConfig[0] || {
      id: "api-default",
      name: "默认接口",
      apiBaseUrl: "",
      apiKey: "",
      enabled: true
    };

    const nextBaseUrl = body?.apiBaseUrl !== undefined ? body.apiBaseUrl : baseApiConfig.apiBaseUrl;
    const nextApiKey = body?.apiKey !== undefined ? body.apiKey : baseApiConfig.apiKey;

    return {
      apiConfigs: normalizeApiConfigList([
        {
          ...baseApiConfig,
          apiBaseUrl: nextBaseUrl,
          apiKey: nextApiKey
        }
      ])
    };
  }

  return {
    getRuntimeConfig,
    getApiConfigs,
    getEnabledApiConfigs,
    getApiConfigById,
    serializeConfigForClient,
    updateRuntimeConfig,
    maskApiKey,
    readConfigFromBody,
    validateApiBaseUrl,
    sanitizeApiKey
  };
}

module.exports = { createRuntimeConfigStore };
