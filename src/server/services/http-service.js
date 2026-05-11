"use strict";

const http = require("http");
const https = require("https");

function createHttpService(options) {
  const { defaultRequestTimeoutMs } = options;

function getHttpClient(targetUrl) {
  return targetUrl.protocol === "https:" ? https : http;
}

function createApiHeaders(apiKey, extraHeaders = {}) {
  return {
    Authorization: `Bearer ${apiKey}`,
    ...extraHeaders
  };
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function requestJson(url, { method = "GET", headers = {}, body, timeout = defaultRequestTimeoutMs } = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const client = getHttpClient(target);

    const upstreamRequest = client.request(
      target,
      {
        method,
        headers,
        timeout
      },
      (upstreamResponse) => {
        let raw = "";

        upstreamResponse.setEncoding("utf8");
        upstreamResponse.on("data", (chunk) => {
          raw += chunk;
        });

        upstreamResponse.on("end", () => {
          let data = raw;

          try {
            data = raw ? JSON.parse(raw) : {};
          } catch (error) {
            data = raw;
          }

          resolve({
            ok: Number(upstreamResponse.statusCode) >= 200 && Number(upstreamResponse.statusCode) < 300,
            status: Number(upstreamResponse.statusCode) || 500,
            data,
            raw
          });
        });
      }
    );

    upstreamRequest.on("timeout", () => {
      const timeoutError = new Error("上游请求超时。");
      timeoutError.code = "ETIMEDOUT";
      upstreamRequest.destroy(timeoutError);
    });

    upstreamRequest.on("error", reject);

    if (body) {
      upstreamRequest.write(body);
    }

    upstreamRequest.end();
  });
}

function isRetryableNetworkError(error) {
  return ["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "ECONNREFUSED", "EPIPE", "ENOTFOUND"].includes(error.code);
}

function isRetryableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

async function requestJsonWithRetry(url, options = {}, maxAttempts = 3) {
  let lastError = null;
  let lastResponse = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await requestJson(url, options);

      if (response.ok || !isRetryableStatus(response.status) || attempt === maxAttempts) {
        return response;
      }

      lastResponse = response;
    } catch (error) {
      lastError = error;

      if (!isRetryableNetworkError(error) || attempt === maxAttempts) {
        throw error;
      }
    }

    await wait(350 * attempt);
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError || new Error("上游请求失败。");
}

function extractErrorDetail(rawBody, status) {
  if (!rawBody) {
    return `上游接口返回 ${status}`;
  }

  try {
    const payload = JSON.parse(rawBody);

    if (typeof payload.detail === "string" && payload.detail.trim()) {
      return payload.detail;
    }

    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }

    if (payload.error && typeof payload.error.message === "string" && payload.error.message.trim()) {
      return payload.error.message;
    }

    return rawBody;
  } catch (error) {
    return rawBody;
  }
}

function createUpstreamError(upstreamResponse) {
  const detail =
    (typeof upstreamResponse.data === "object" &&
      upstreamResponse.data !== null &&
      (upstreamResponse.data.detail ||
        upstreamResponse.data.error?.message ||
        upstreamResponse.data.error)) ||
    upstreamResponse.raw ||
    `上游接口返回 ${upstreamResponse.status}`;

  const error = new Error(detail);
  error.status = upstreamResponse.status;
  error.detail = detail;
  return error;
}


  return {
    getHttpClient,
    createApiHeaders,
    wait,
    requestJson,
    isRetryableNetworkError,
    isRetryableStatus,
    requestJsonWithRetry,
    extractErrorDetail,
    createUpstreamError
  };
}

module.exports = { createHttpService };
