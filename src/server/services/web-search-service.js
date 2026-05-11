"use strict";

function createWebSearchService(options) {
  const {
    requestJsonWithRetry,
    createUpstreamError,
    webSearchTimeoutMs,
    webSearchResultCount,
    webSearchSnippetMaxLength,
    webSearchContextMaxLength,
    webSearchMaxQueries,
    webSearchFetchPageCount,
    webSearchPageTimeoutMs,
    webSearchMinScore,
    webSearchFailureNoticeEnabled,
    webSearchServerEnabled,
    webSearchDefaultEnabled,
    searxngBaseUrl,
    searxngSearchPath,
    searxngLanguage,
    searxngSafeSearch,
    searxngUserAgent,
    searxngFallbackBaseUrl,
    githubApiBaseUrl,
    webSearchDirectUrlEnabled
  } = options;

  function trimTrailingSlashes(value) {
    return String(value || "").trim().replace(/\/+$/, "");
  }

  function compactConversationText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

function parseBooleanFlag(value, fallback = false) {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function truncateText(value, maxLength) {
  const normalized = compactConversationText(value);

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
}

function extractTextFromMessageContent(content) {
  if (typeof content === "string") {
    return compactConversationText(content);
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return compactConversationText(
    content
      .map((part) => {
        if (!part || typeof part !== "object" || Array.isArray(part)) {
          return "";
        }

        if (part.type === "text" && typeof part.text === "string") {
          return part.text;
        }

        return "";
      })
      .join(" ")
  );
}

function extractLatestUserQuery(messages = []) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (String(message?.role || "").toLowerCase() !== "user") {
      continue;
    }

    const normalized = extractTextFromMessageContent(message?.content);

    if (normalized) {
      return normalized.slice(0, 500);
    }
  }

  return "";
}

function extractFirstHttpUrl(text) {
  const matched = String(text || "").match(/https?:\/\/[^\s<>"'`]+/i);
  return matched ? matched[0].trim() : "";
}

function parseGitHubRepoUrl(url) {
  try {
    const parsed = new URL(url);
    const hostname = String(parsed.hostname || "").toLowerCase();

    if (hostname !== "github.com" && hostname !== "www.github.com") {
      return null;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);

    if (segments.length < 2) {
      return null;
    }

    const owner = String(segments[0] || "").trim();
    const repo = String(segments[1] || "").replace(/\.git$/i, "").trim();

    if (!owner || !repo) {
      return null;
    }

    return {
      owner,
      repo,
      canonicalUrl: `https://github.com/${owner}/${repo}`
    };
  } catch (error) {
    return null;
  }
}

function decodeBase64Utf8(value) {
  const normalized = String(value || "").replace(/\s+/g, "");

  if (!normalized) {
    return "";
  }

  try {
    return Buffer.from(normalized, "base64").toString("utf8");
  } catch (error) {
    return "";
  }
}

async function fetchGitHubRepoResultsFromQuery(query) {
  if (!webSearchDirectUrlEnabled) {
    return [];
  }

  const url = extractFirstHttpUrl(query);

  if (!url) {
    return [];
  }

  const target = parseGitHubRepoUrl(url);

  if (!target) {
    return [];
  }

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": searxngUserAgent
  };
  const repoApiUrl = `${githubApiBaseUrl}/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(target.repo)}`;
  const repoResponse = await requestJsonWithRetry(
    repoApiUrl,
    { headers, timeout: webSearchTimeoutMs },
    2
  );

  if (repoResponse.status === 404) {
    return [];
  }

  if (!repoResponse.ok) {
    const error = createUpstreamError(repoResponse);
    error.url = repoApiUrl;
    throw error;
  }

  const repo = typeof repoResponse.data === "object" && repoResponse.data !== null
    ? repoResponse.data
    : {};
  const fullName = compactConversationText(repo.full_name) || `${target.owner}/${target.repo}`;
  const description = compactConversationText(repo.description);
  const language = compactConversationText(repo.language);
  const stars = Number(repo.stargazers_count);
  const forks = Number(repo.forks_count);
  const openIssues = Number(repo.open_issues_count);
  const updatedAt = compactConversationText(repo.updated_at);
  const topics = Array.isArray(repo.topics)
    ? repo.topics.map((item) => compactConversationText(item)).filter(Boolean)
    : [];

  let readmeContent = "";
  const readmeApiUrl = `${repoApiUrl}/readme`;

  try {
    const readmeResponse = await requestJsonWithRetry(
      readmeApiUrl,
      { headers, timeout: webSearchTimeoutMs },
      2
    );

    if (readmeResponse.ok && typeof readmeResponse.data === "object" && readmeResponse.data !== null) {
      readmeContent = decodeBase64Utf8(readmeResponse.data.content);
    }
  } catch (error) {
    // Ignore README fetch failure; repository metadata is still useful.
  }

  const summaryParts = [];

  if (description) {
    summaryParts.push(`仓库描述: ${description}`);
  }

  if (language) {
    summaryParts.push(`主要语言: ${language}`);
  }

  if (Number.isFinite(stars)) {
    summaryParts.push(`Star: ${stars}`);
  }

  if (Number.isFinite(forks)) {
    summaryParts.push(`Fork: ${forks}`);
  }

  if (Number.isFinite(openIssues)) {
    summaryParts.push(`Open Issues: ${openIssues}`);
  }

  if (updatedAt) {
    summaryParts.push(`最近更新: ${updatedAt}`);
  }

  if (topics.length) {
    summaryParts.push(`主题: ${topics.join(", ")}`);
  }

  if (readmeContent) {
    summaryParts.push(`README 摘要:\n${truncateText(readmeContent, Math.max(400, webSearchSnippetMaxLength * 2))}`);
  }

  return [
    {
      title: `${fullName}（GitHub 仓库）`,
      url: target.canonicalUrl,
      snippet: truncateText(summaryParts.join("\n"), Math.max(500, webSearchSnippetMaxLength * 3)),
      source: "github-api",
      publishedAt: updatedAt
    }
  ];
}

function buildWebSearchQueries(query) {
  const base = compactConversationText(query).slice(0, 500);

  if (!base) {
    return [];
  }

  const variants = [base];
  const withoutUrl = compactConversationText(base.replace(/https?:\/\/[^\s<>"'`]+/gi, " "));

  if (withoutUrl && withoutUrl !== base) {
    variants.push(withoutUrl);
  }

  const github = parseGitHubRepoUrl(extractFirstHttpUrl(base));

  if (github) {
    variants.push(`${github.owner} ${github.repo} github`);
    variants.push(`${github.owner}/${github.repo}`);
  }

  const tokenSource = withoutUrl || base;
  const tokens = tokenSource.match(/[\u4e00-\u9fff]{2,}|[A-Za-z0-9_.-]{3,}/g) || [];

  if (tokens.length >= 2) {
    variants.push(tokens.slice(0, 6).join(" "));
  }

  const unique = [];
  const seen = new Set();

  for (const item of variants) {
    const normalized = compactConversationText(item);
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(normalized);

    if (unique.length >= webSearchMaxQueries) {
      break;
    }
  }

  return unique;
}

function decodeBasicHtmlEntities(text) {
  return String(text || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#(\d+);/g, (_, code) => {
      const value = Number(code);
      return Number.isFinite(value) ? String.fromCodePoint(value) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
      const value = Number.parseInt(code, 16);
      return Number.isFinite(value) ? String.fromCodePoint(value) : "";
    });
}

function extractReadableTextFromHtml(html) {
  const normalized = String(html || "");

  if (!normalized) {
    return "";
  }

  const withoutNoise = normalized
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ");
  const withBreaks = withoutNoise
    .replace(/<\/(p|div|article|section|h1|h2|h3|h4|h5|h6|li|tr|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
  const textOnly = withBreaks.replace(/<[^>]+>/g, " ");

  return compactConversationText(decodeBasicHtmlEntities(textOnly).replace(/\s*\n\s*/g, "\n"));
}

async function fetchPageTextSnippet(url) {
  if (webSearchFetchPageCount <= 0) {
    return "";
  }

  let target = null;

  try {
    target = new URL(url);
  } catch (error) {
    return "";
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    return "";
  }

  if (/\.(pdf|zip|rar|7z|png|jpg|jpeg|gif|webp|mp3|mp4|avi|mov)(\?|$)/i.test(target.pathname)) {
    return "";
  }

  const pageResponse = await requestJsonWithRetry(
    target.toString(),
    {
      timeout: webSearchPageTimeoutMs,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": searxngUserAgent
      }
    },
    2
  );

  if (!pageResponse.ok) {
    return "";
  }

  const raw = typeof pageResponse.data === "string"
    ? pageResponse.data
    : (typeof pageResponse.raw === "string" ? pageResponse.raw : "");

  if (!raw || raw.length < 40) {
    return "";
  }

  const readable = extractReadableTextFromHtml(raw);
  return truncateText(readable, Math.max(500, webSearchSnippetMaxLength * 4));
}

function computeWebResultScore(query, result) {
  const haystack = compactConversationText(
    `${result?.title || ""} ${result?.snippet || ""} ${result?.source || ""}`
  ).toLowerCase();
  const tokens = (compactConversationText(query).toLowerCase().match(/[\u4e00-\u9fff]{2,}|[a-z0-9_.-]{3,}/g) || [])
    .slice(0, 10);

  if (!tokens.length) {
    return 0.2;
  }

  let matched = 0;

  for (const token of tokens) {
    if (haystack.includes(token)) {
      matched += 1;
    }
  }

  let score = matched / tokens.length;

  if (String(result?.source || "").toLowerCase().includes("github")) {
    score += 0.15;
  }

  if (String(result?.snippet || "").length >= 220) {
    score += 0.1;
  }

  return score;
}

async function enrichSearchResultsWithPages(query, results) {
  if (!Array.isArray(results) || !results.length || webSearchFetchPageCount <= 0) {
    return results || [];
  }

  const enriched = results.map((item) => ({ ...item }));
  const candidates = enriched
    .map((item, index) => ({ index, item }))
    .filter(({ item }) => String(item?.source || "").toLowerCase() !== "github-api")
    .slice(0, webSearchFetchPageCount);

  await Promise.all(
    candidates.map(async ({ index, item }) => {
      try {
        const pageSnippet = await fetchPageTextSnippet(item.url);

        if (!pageSnippet) {
          return;
        }

        const mergedSnippet = compactConversationText(
          `${item.snippet || ""}\n页面正文摘要: ${pageSnippet}`
        );
        enriched[index] = {
          ...item,
          snippet: truncateText(mergedSnippet, Math.max(700, webSearchSnippetMaxLength * 5)),
          source: item.source ? `${item.source}+page` : "page"
        };
      } catch (error) {
        // Ignore single-page fetch failure.
      }
    })
  );

  return enriched;
}

function normalizeSearxngResult(item) {
  const url = String(item?.url || "").trim();

  if (!url) {
    return null;
  }

  return {
    title: compactConversationText(item?.title) || url,
    url,
    snippet: truncateText(
      item?.content || item?.snippet || item?.description || item?.text,
      webSearchSnippetMaxLength
    ),
    source: compactConversationText(item?.engine || item?.source || item?.parsed_url?.[1] || ""),
    publishedAt: compactConversationText(item?.publishedDate || item?.published || "")
  };
}

function buildSearxngSearchUrl(baseUrl, query) {
  const searchUrl = new URL(searxngSearchPath, `${trimTrailingSlashes(baseUrl)}/`);
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("count", String(webSearchResultCount));

  if (searxngLanguage) {
    searchUrl.searchParams.set("language", searxngLanguage);
  }

  if (searxngSafeSearch) {
    searchUrl.searchParams.set("safesearch", searxngSafeSearch);
  }

  return searchUrl;
}

function extractSearxngResultItems(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    const preview = typeof payload === "string"
      ? truncateText(payload.replace(/\s+/g, " "), 180)
      : "";
    const detail = preview
      ? `SearXNG response is not JSON object: ${preview}`
      : "SearXNG response is not JSON object.";
    const error = new Error(detail);
    error.status = 502;
    throw error;
  }

  const results = Array.isArray(payload?.results) ? payload.results : [];

  if (results.length) {
    return results;
  }

  if (typeof payload?.error === "string" && payload.error.trim()) {
    const error = new Error(payload.error.trim());
    error.status = 502;
    throw error;
  }

  return [];
}

async function fetchSearxngResults(query) {
  const candidateBaseUrls = [searxngBaseUrl];
  if (searxngFallbackBaseUrl && searxngFallbackBaseUrl !== searxngBaseUrl) {
    candidateBaseUrls.push(searxngFallbackBaseUrl);
  } else if (searxngBaseUrl.includes("://searxng")) {
    candidateBaseUrls.push("http://127.0.0.1:8080");
  }

  let lastError = null;

  for (const baseUrl of candidateBaseUrls) {
    const searchUrl = buildSearxngSearchUrl(baseUrl, query);

    try {
      const upstreamResponse = await requestJsonWithRetry(
        searchUrl.toString(),
        {
          timeout: webSearchTimeoutMs,
          headers: {
            Accept: "application/json",
            "User-Agent": searxngUserAgent
          }
        },
        2
      );

      if (!upstreamResponse.ok) {
        const error = createUpstreamError(upstreamResponse);
        error.url = searchUrl.toString();
        throw error;
      }

      const results = extractSearxngResultItems(upstreamResponse.data);
      return results
        .map(normalizeSearxngResult)
        .filter(Boolean)
        .slice(0, webSearchResultCount);
    } catch (error) {
      error.url = error.url || searchUrl.toString();
      lastError = error;
    }
  }

  throw lastError || new Error("SearXNG search failed.");
}

async function fetchSearxngResultsFromQueryVariants(query) {
  const queries = buildWebSearchQueries(query);

  if (!queries.length) {
    return [];
  }

  const settled = await Promise.allSettled(queries.map((item) => fetchSearxngResults(item)));
  const merged = [];
  const seen = new Set();
  let successCount = 0;
  let lastError = null;
  const maxMergedCount = Math.max(webSearchResultCount * 3, webSearchResultCount);

  for (const item of settled) {
    if (item.status === "fulfilled") {
      successCount += 1;

      for (const result of item.value) {
        const normalizedUrl = String(result?.url || "").trim();

        if (!normalizedUrl || seen.has(normalizedUrl)) {
          continue;
        }

        seen.add(normalizedUrl);
        merged.push(result);

        if (merged.length >= maxMergedCount) {
          break;
        }
      }
    } else if (item.reason) {
      lastError = item.reason;
    }

    if (merged.length >= maxMergedCount) {
      break;
    }
  }

  if (!successCount && lastError) {
    throw lastError;
  }

  return merged;
}

function buildWebSearchContextMessage(query, results) {
  const sourceText = results
    .map((item, index) => {
      const parts = [`[${index + 1}] ${item.title}`, `URL: ${item.url}`];

      if (item.source) {
        parts.push(`来源: ${item.source}`);
      }

      if (item.publishedAt) {
        parts.push(`时间: ${item.publishedAt}`);
      }

      if (item.snippet) {
        parts.push(`摘要: ${item.snippet}`);
      }

      return parts.join("\n");
    })
    .join("\n\n");

  const content = [
    "以下是系统联网检索到的资料（可能来自 SearXNG 检索和链接直连解析），请结合资料回答用户问题。",
    `用户当前问题: ${query}`,
    "",
    sourceText,
    "",
    "回答要求:",
    "1. 优先基于上述资料回答；",
    "2. 资料不足或冲突时请明确说明；",
    "3. 回答正文请尽量使用 [1][2] 这类编号标注对应证据；",
    "4. 回答末尾附“参考来源”，列出实际使用到的 URL。"
  ].join("\n");

  return {
    role: "system",
    content: content.length > webSearchContextMaxLength
      ? content.slice(0, webSearchContextMaxLength)
      : content
  };
}

function buildWebSearchFailureContextMessage(query, error) {
  const detail = truncateText(error?.message || String(error || ""), 200);

  return {
    role: "system",
    content: [
      "联网检索当前不可用，本次回答无法使用实时网页资料。",
      `用户问题: ${query}`,
      detail ? `检索失败信息: ${detail}` : "",
      "请明确告知用户本次未成功联网，并仅基于已有上下文回答，不要编造来源。"
    ].filter(Boolean).join("\n")
  };
}

function injectSystemMessageBeforeLatestUser(messages, systemMessage) {
  if (!Array.isArray(messages) || !messages.length || !systemMessage) {
    return messages;
  }

  let insertIndex = messages.length;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (String(messages[index]?.role || "").toLowerCase() === "user") {
      insertIndex = index;
      break;
    }
  }

  return [
    ...messages.slice(0, insertIndex),
    systemMessage,
    ...messages.slice(insertIndex)
  ];
}

function injectWebSearchContext(messages, query, results) {
  if (!Array.isArray(messages) || !results.length) {
    return messages;
  }

  const contextMessage = buildWebSearchContextMessage(query, results);
  let insertIndex = messages.length;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (String(messages[index]?.role || "").toLowerCase() === "user") {
      insertIndex = index;
      break;
    }
  }

  return [
    ...messages.slice(0, insertIndex),
    contextMessage,
    ...messages.slice(insertIndex)
  ];
}

async function enrichPayloadWithWebSearch(payload, requestBody) {
  const webEnabled = parseBooleanFlag(requestBody?.webEnabled, webSearchDefaultEnabled);

  if (!webSearchServerEnabled || !webEnabled) {
    return payload;
  }

  const query = extractLatestUserQuery(payload?.messages);

  if (!query) {
    return payload;
  }

  const mergedResults = [];
  const seenUrls = new Set();
  let lastSearchError = null;

  function appendResults(results) {
    if (!Array.isArray(results) || !results.length) {
      return;
    }

    for (const item of results) {
      const normalizedUrl = String(item?.url || "").trim();

      if (!normalizedUrl || seenUrls.has(normalizedUrl)) {
        continue;
      }

      seenUrls.add(normalizedUrl);
      mergedResults.push(item);

      if (mergedResults.length >= webSearchResultCount) {
        break;
      }
    }
  }

  try {
    appendResults(await fetchGitHubRepoResultsFromQuery(query));
  } catch (error) {
    lastSearchError = error;
    console.warn("Direct URL context fetch failed, continue with SearXNG:", {
      query,
      detail: truncateText(error.message || String(error), 800),
      code: error.code || null,
      status: Number(error.status) || null,
      url: error.url || null
    });
  }

  try {
    if (mergedResults.length < webSearchResultCount) {
      appendResults(await fetchSearxngResultsFromQueryVariants(query));
    }
  } catch (error) {
    lastSearchError = error;
    if (!mergedResults.length) {
      console.warn("SearXNG web search failed, falling back to model-only mode:", {
        query,
        detail: truncateText(error.message || String(error), 800),
        code: error.code || null,
        status: Number(error.status) || null,
        url: error.url || null
      });
    } else {
      console.warn("SearXNG web search failed, using direct URL context only:", {
        query,
        detail: truncateText(error.message || String(error), 800),
        code: error.code || null,
        status: Number(error.status) || null,
        url: error.url || null
      });
    }
  }

  if (mergedResults.length) {
    const resultsWithPageContent = await enrichSearchResultsWithPages(query, mergedResults);
    const rankedResults = resultsWithPageContent
      .map((item) => ({
        ...item,
        _score: computeWebResultScore(query, item)
      }))
      .sort((left, right) => right._score - left._score);
    const filteredResults = rankedResults.filter((item) => item._score >= webSearchMinScore);
    const finalRankedResults = (filteredResults.length ? filteredResults : rankedResults)
      .slice(0, webSearchResultCount)
      .map(({ _score, ...item }) => item);

    return {
      ...payload,
      messages: injectWebSearchContext(payload.messages, query, finalRankedResults)
    };
  }

  if (lastSearchError && webSearchFailureNoticeEnabled) {
    return {
      ...payload,
      messages: injectSystemMessageBeforeLatestUser(
        payload.messages,
        buildWebSearchFailureContextMessage(query, lastSearchError)
      )
    };
  }

  return payload;
}


  return {
    compactConversationText,
    truncateText,
    fetchGitHubRepoResultsFromQuery,
    fetchSearxngResultsFromQueryVariants,
    enrichSearchResultsWithPages,
    computeWebResultScore,
    enrichPayloadWithWebSearch
  };
}

module.exports = { createWebSearchService };
