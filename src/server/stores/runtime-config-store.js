"use strict";

const fs = require("fs");

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

  return normalized;
}

function sanitizeApiKey(value) {
  return String(value || "").trim();
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

function readSavedRuntimeConfig() {
  if (!fs.existsSync(runtimeConfigPath)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(runtimeConfigPath, "utf8");
    const parsed = JSON.parse(raw);

    return {
      apiBaseUrl: parsed?.apiBaseUrl ? validateApiBaseUrl(parsed.apiBaseUrl) : undefined,
      apiKey: parsed?.apiKey !== undefined ? sanitizeApiKey(parsed.apiKey) : undefined
    };
  } catch (error) {
    console.warn("Failed to read runtime config:", error);
    return {};
  }
}

const runtimeConfig = {
  apiBaseUrl: validateApiBaseUrl(process.env.API_BASE_URL || "https://api.example.com"),
  apiKey: sanitizeApiKey(process.env.API_KEY || "demo-key-change-me"),
  ...readSavedRuntimeConfig()
};

function getRuntimeConfig() {
  return {
    apiBaseUrl: runtimeConfig.apiBaseUrl,
    apiKey: runtimeConfig.apiKey
  };
}

function serializeConfigForClient(includeApiKey = false) {
  const config = getRuntimeConfig();

  return {
    apiBaseUrl: config.apiBaseUrl,
    apiKey: includeApiKey ? config.apiKey : undefined,
    apiKeyPreview: maskApiKey(config.apiKey),
    keyConfigured: Boolean(config.apiKey),
    webSearch: {
      serverEnabled: webSearchServerEnabled,
      defaultEnabled: webSearchDefaultEnabled,
      directUrlEnabled: webSearchDirectUrlEnabled
    }
  };
}

function persistRuntimeConfig(config) {
  fs.writeFileSync(
    runtimeConfigPath,
    JSON.stringify(
      {
        apiBaseUrl: config.apiBaseUrl,
        apiKey: config.apiKey
      },
      null,
      2
    ),
    "utf8"
  );
}

function updateRuntimeConfig(nextValues) {
  const nextConfig = {
    apiBaseUrl: validateApiBaseUrl(nextValues.apiBaseUrl),
    apiKey: sanitizeApiKey(nextValues.apiKey)
  };

  runtimeConfig.apiBaseUrl = nextConfig.apiBaseUrl;
  runtimeConfig.apiKey = nextConfig.apiKey;
  persistRuntimeConfig(runtimeConfig);

  return getRuntimeConfig();
}


function readConfigFromBody(body, fallbackToRuntime = false) {
  const currentConfig = fallbackToRuntime ? getRuntimeConfig() : { apiBaseUrl: "", apiKey: "" };
  const nextBaseUrl = body?.apiBaseUrl !== undefined ? body.apiBaseUrl : currentConfig.apiBaseUrl;
  const nextApiKey = body?.apiKey !== undefined ? body.apiKey : currentConfig.apiKey;

  return {
    apiBaseUrl: validateApiBaseUrl(nextBaseUrl),
    apiKey: sanitizeApiKey(nextApiKey)
  };
}


  return {
    getRuntimeConfig,
    serializeConfigForClient,
    updateRuntimeConfig,
    maskApiKey,
    readConfigFromBody,
    validateApiBaseUrl,
    sanitizeApiKey
  };
}

module.exports = { createRuntimeConfigStore };
