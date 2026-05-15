"use strict";

const multer = require("multer");

function registerApiRoutes(app, dependencies) {
  const {
    env: {
      chatRequestTimeoutMs,
      webSearchServerEnabled,
      webSearchResultCount,
      maxWorkspaceFilesPerRequest,
      maxWorkspaceFileSizeBytes,
      authRateLimitWindowMs,
      authRateLimitMaxAttemptsPerIp,
      authRateLimitMaxAttemptsPerUser,
      authLockoutMs,
      registerRateLimitWindowMs,
      registerRateLimitMaxAttemptsPerIp
    },
    authService: {
      requireAuth,
      requireAdmin,
      getAuthenticatedUser,
      toPublicUser,
      validateUsername,
      validatePassword,
      createStoredUser,
      createUserSession,
      destroySession,
      getUserByUsername,
      verifyPassword,
      persistUsersStore,
      clearSessionCookie,
      sessionStore,
      usersStore,
      normalizeRole,
      getUserById,
      countEnabledAdmins,
      createPasswordRecord,
      invalidateUserSessions
    },
    announcementsStore: {
      listAnnouncements,
      toPublicAnnouncement,
      persistAnnouncementsStore,
      createStoredAnnouncement,
      removeStoredAnnouncement
    },
    conversationsStore: {
      getUserConversationsState,
      saveUserConversationsState,
      conversationsStore,
      persistConversationsStore
    },
    workspacesStore: {
      deleteUserWorkspaceData
    },
    runtimeConfigStore: {
      getRuntimeConfig,
      getEnabledApiConfigs,
      serializeConfigForClient,
      updateRuntimeConfig,
      maskApiKey,
      readConfigFromBody
    },
    httpService: {
      requestJsonWithRetry,
      createApiHeaders,
      createUpstreamError,
      getHttpClient,
      wait,
      isRetryableStatus,
      isRetryableNetworkError,
      extractErrorDetail
    },
    webSearchService: {
      compactConversationText,
      truncateText,
      fetchGitHubRepoResultsFromQuery,
      fetchSearxngResultsFromQueryVariants,
      enrichSearchResultsWithPages,
      computeWebResultScore,
      enrichPayloadWithWebSearch
    },
    chatService: {
      fetchModelsWithConfigs,
      buildChatPayload,
      buildImageGenerationPayload,
      generateImagesWithConfig,
      sendSseEvent
    },
    workspaceSearchService: {
      listWorkspaceFiles,
      uploadWorkspaceFiles,
      deleteWorkspaceFile,
      enrichPayloadWithWorkspaceContext
    }
  } = dependencies;
  const workspaceUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxWorkspaceFileSizeBytes,
      files: maxWorkspaceFilesPerRequest
    }
  });

  const authAttemptStore = {
    loginByIp: new Map(),
    loginByUser: new Map(),
    registerByIp: new Map()
  };

function getRequestIpAddress(request) {
  const forwardedFor = String(request.headers["x-forwarded-for"] || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)[0];

  return (
    forwardedFor ||
    request.ip ||
    request.socket?.remoteAddress ||
    "unknown"
  );
}

function normalizeAttemptKey(value, fallback) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || fallback;
}

function pruneExpiredAttemptEntries(store, windowMs) {
  const now = Date.now();

  for (const [key, record] of store.entries()) {
    if (!record) {
      store.delete(key);
      continue;
    }

    if (Number(record.lockedUntil || 0) > now) {
      continue;
    }

    if (now - Number(record.windowStartedAt || 0) > windowMs) {
      store.delete(key);
    }
  }
}

function getAttemptRecord(store, key, windowMs) {
  pruneExpiredAttemptEntries(store, windowMs);

  const normalizedKey = normalizeAttemptKey(key, "unknown");
  const now = Date.now();
  let record = store.get(normalizedKey);

  if (!record || now - Number(record.windowStartedAt || 0) > windowMs) {
    record = {
      attempts: 0,
      windowStartedAt: now,
      lockedUntil: 0
    };
    store.set(normalizedKey, record);
  }

  return record;
}

function createRateLimitError(detail, retryAfterMs) {
  const error = new Error(detail);
  error.status = 429;
  error.code = "AUTH_RATE_LIMITED";
  error.retryAfterMs = Math.max(1000, Number(retryAfterMs) || 1000);
  return error;
}

function assertAttemptAllowed(store, key, windowMs, detail) {
  const record = getAttemptRecord(store, key, windowMs);
  const now = Date.now();

  if (Number(record.lockedUntil || 0) > now) {
    throw createRateLimitError(detail, record.lockedUntil - now);
  }
}

function recordAttemptFailure(store, key, maxAttempts, windowMs, lockoutMs) {
  const record = getAttemptRecord(store, key, windowMs);
  record.attempts += 1;

  if (record.attempts >= maxAttempts) {
    record.lockedUntil = Date.now() + lockoutMs;
    record.attempts = 0;
    record.windowStartedAt = Date.now();
  }
}

function clearAttemptRecord(store, key) {
  store.delete(normalizeAttemptKey(key, "unknown"));
}

function enforceLoginGuards(request, username) {
  const ipAddress = getRequestIpAddress(request);
  const normalizedUsername = normalizeAttemptKey(username, "anonymous");

  assertAttemptAllowed(
    authAttemptStore.loginByIp,
    ipAddress,
    authRateLimitWindowMs,
    "Too many login attempts from this address. Please try again later."
  );
  assertAttemptAllowed(
    authAttemptStore.loginByUser,
    normalizedUsername,
    authRateLimitWindowMs,
    "Too many login attempts for this account. Please try again later."
  );
}

function recordLoginFailure(request, username) {
  const ipAddress = getRequestIpAddress(request);
  const normalizedUsername = normalizeAttemptKey(username, "anonymous");

  recordAttemptFailure(
    authAttemptStore.loginByIp,
    ipAddress,
    authRateLimitMaxAttemptsPerIp,
    authRateLimitWindowMs,
    authLockoutMs
  );
  recordAttemptFailure(
    authAttemptStore.loginByUser,
    normalizedUsername,
    authRateLimitMaxAttemptsPerUser,
    authRateLimitWindowMs,
    authLockoutMs
  );
}

function clearLoginFailures(request, username) {
  clearAttemptRecord(authAttemptStore.loginByIp, getRequestIpAddress(request));
  clearAttemptRecord(authAttemptStore.loginByUser, username);
}

function enforceRegisterGuard(request) {
  assertAttemptAllowed(
    authAttemptStore.registerByIp,
    getRequestIpAddress(request),
    registerRateLimitWindowMs,
    "Too many registration attempts from this address. Please try again later."
  );
}

function recordRegisterFailure(request) {
  recordAttemptFailure(
    authAttemptStore.registerByIp,
    getRequestIpAddress(request),
    registerRateLimitMaxAttemptsPerIp,
    registerRateLimitWindowMs,
    authLockoutMs
  );
}

function clearRegisterFailures(request) {
  clearAttemptRecord(authAttemptStore.registerByIp, getRequestIpAddress(request));
}

function resolveRequestApiConfig(sourceApiId) {
  const enabledApiConfigs = getEnabledApiConfigs();

  if (!enabledApiConfigs.length) {
    const error = new Error("当前没有启用的 API 配置。");
    error.status = 503;
    throw error;
  }

  const normalizedSourceApiId = String(sourceApiId || "").trim();

  if (normalizedSourceApiId) {
    const matchedApiConfig = enabledApiConfigs.find((item) => item.id === normalizedSourceApiId);

    if (!matchedApiConfig) {
      const error = new Error("所选模型来源接口不存在或已被禁用。");
      error.status = 400;
      throw error;
    }

    return matchedApiConfig;
  }

  if (enabledApiConfigs.length === 1) {
    return enabledApiConfigs[0];
  }

  const error = new Error("当前配置了多个 API，请明确指定模型来源接口。");
  error.status = 400;
  throw error;
}

app.get("/api/config", (request, response) => {
  response.json(serializeConfigForClient(false));
});

app.get("/api/web-search/status", requireAuth, async (request, response) => {
  const query = compactConversationText(request.query?.q || "") || "OpenAI";

  if (!webSearchServerEnabled) {
    return response.json({
      enabled: false,
      connected: false,
      query,
      detail: "Server-side web search is disabled."
    });
  }

  const mergedResults = [];
  const seenUrls = new Set();
  let lastError = null;

  function appendResults(results) {
    if (!Array.isArray(results)) {
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
    lastError = error;
  }

  try {
    if (mergedResults.length < webSearchResultCount) {
      appendResults(await fetchSearxngResultsFromQueryVariants(query));
    }
  } catch (error) {
    lastError = error;
  }

  if (mergedResults.length) {
    const resultsWithPageContent = await enrichSearchResultsWithPages(query, mergedResults);
    const rankedResults = resultsWithPageContent
      .map((item) => ({
        ...item,
        _score: computeWebResultScore(query, item)
      }))
      .sort((left, right) => right._score - left._score);
    const finalResults = rankedResults
      .slice(0, webSearchResultCount)
      .map(({ _score, ...item }) => item);

    return response.json({
      enabled: true,
      connected: true,
      query,
      resultCount: finalResults.length,
      sample: finalResults.slice(0, 3)
    });
  }

  if (lastError) {
    return response.status(503).json({
      enabled: true,
      connected: false,
      query,
      detail: truncateText(lastError.message || "SearXNG request failed.", 800),
      code: lastError.code || null,
      status: Number(lastError.status) || null,
      url: lastError.url || null
    });
  }

  return response.json({
    enabled: true,
    connected: true,
    query,
    resultCount: 0,
    sample: [],
    detail: "No web results for this query."
  });
});

app.get("/api/auth/status", (request, response) => {
  const auth = getAuthenticatedUser(request);

  response.json({
    authenticated: Boolean(auth),
    user: auth ? toPublicUser(auth.user) : null,
    expiresAt: auth?.sessionRecord?.expiresAt || null
  });
});

app.post("/api/auth/register", async (request, response, next) => {
  try {
    enforceRegisterGuard(request);
    const username = validateUsername(request.body?.username);
    const password = validatePassword(request.body?.password);
    const user = createStoredUser({
      username,
      password,
      role: "user"
    });
    await persistUsersStore();
    clearRegisterFailures(request);
    const session = await createUserSession(response, user);

    response.status(201).json({
      authenticated: true,
      user: toPublicUser(user),
      expiresAt: session.expiresAt,
      message: "注册成功，已自动登录。"
    });
  } catch (error) {
    if (Number(error?.status) !== 429) {
      recordRegisterFailure(request);
    }

    error.status = error.status || 400;
    next(error);
  }
});

app.post("/api/auth/login", async (request, response, next) => {
  const rawUsername = request.body?.username;

  try {
    enforceLoginGuards(request, rawUsername);
    const username = validateUsername(rawUsername);
    const password = validatePassword(request.body?.password);
    const user = getUserByUsername(username);

    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      recordLoginFailure(request, username);
      return response.status(401).json({
        error: "登录失败",
        detail: "用户名或密码错误。"
      });
    }

    if (user.disabled) {
      recordLoginFailure(request, username);
      return response.status(403).json({
        error: "账号不可用",
        detail: "该账号已被禁用，请联系管理员。"
      });
    }

    user.lastLoginAt = Date.now();
    user.updatedAt = Date.now();
    await persistUsersStore();
    clearLoginFailures(request, username);
    const session = await createUserSession(response, user);

    response.json({
      authenticated: true,
      user: toPublicUser(user),
      expiresAt: session.expiresAt,
      message: "登录成功。"
    });
  } catch (error) {
    if (Number(error?.status) !== 429) {
      recordLoginFailure(request, rawUsername);
    }

    error.status = error.status || 400;
    next(error);
  }
});

app.post("/api/auth/logout", (request, response) => {
  const auth = getAuthenticatedUser(request);

  if (auth?.sessionRecord?.token) {
    void destroySession(auth.sessionRecord.token).catch((error) => {
      console.warn("Failed to persist logout session removal:", error);
    });
  }

    clearSessionCookie(response);
    response.json({
      authenticated: false,
    message: "已退出登录。"
    });
});

app.get("/api/announcements", requireAuth, (request, response) => {
      response.json({
    announcements: listAnnouncements(1).map(toPublicAnnouncement)
      });
});

app.get("/api/conversations", requireAuth, (request, response) => {
  const conversationState = getUserConversationsState(request.currentUser.id);

  response.json({
    conversations: conversationState.conversations,
    activeConversationId: conversationState.activeConversationId,
    revision: conversationState.revision,
    updatedAt: conversationState.updatedAt
  });
});

app.put("/api/conversations", requireAuth, async (request, response, next) => {
  try {
    const savedState = await saveUserConversationsState(
      request.currentUser.id,
      {
        conversations: request.body?.conversations,
        activeConversationId: request.body?.activeConversationId
      },
      {
        expectedRevision: request.body?.baseRevision
      }
    );

    response.json({
      conversations: savedState.conversations,
      activeConversationId: savedState.activeConversationId,
      revision: savedState.revision,
      updatedAt: savedState.updatedAt
    });
  } catch (error) {
    if (error?.code === "CONVERSATION_REVISION_CONFLICT" && error?.currentState) {
      return response.status(409).json({
        error: "云端会话已更新",
        detail: "检测到其他标签页或设备已修改当前会话，已拒绝直接覆盖，请先合并后再重试。",
        code: error.code,
        conversations: error.currentState.conversations,
        activeConversationId: error.currentState.activeConversationId,
        revision: error.currentState.revision,
        updatedAt: error.currentState.updatedAt
      });
    }

    next(error);
  }
});

app.get("/api/conversations/:conversationId/workspace/files", requireAuth, async (request, response, next) => {
  try {
    response.json({
      files: await listWorkspaceFiles(request.currentUser.id, request.params.conversationId)
    });
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/conversations/:conversationId/workspace/files",
  requireAuth,
  workspaceUpload.array("files", maxWorkspaceFilesPerRequest),
  async (request, response, next) => {
    try {
      const files = Array.isArray(request.files) ? request.files : [];

      if (!files.length) {
        return response.status(400).json({
          error: "请求失败",
          detail: "请先选择需要上传的工作区文件。"
        });
      }

      const result = await uploadWorkspaceFiles(
        request.currentUser.id,
        request.params.conversationId,
        files
      );

      response.status(201).json({
        ...result,
        message: result.uploaded.length
          ? `已导入 ${result.uploaded.length} 个工作区文件。`
          : "没有文件被成功导入。"
      });
    } catch (error) {
      next(error);
    }
  }
);

app.delete("/api/conversations/:conversationId/workspace/files/:fileId", requireAuth, async (request, response, next) => {
  try {
    const removedFile = await deleteWorkspaceFile(
      request.currentUser.id,
      request.params.conversationId,
      request.params.fileId
    );

    if (!removedFile) {
      return response.status(404).json({
        error: "未找到文件",
        detail: "指定的工作区文件不存在。"
      });
    }

    response.json({
      file: removedFile,
      files: await listWorkspaceFiles(request.currentUser.id, request.params.conversationId),
      message: "工作区文件已删除。"
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api/admin", requireAdmin);

app.get("/api/admin/announcements", (request, response) => {
  response.json({
    announcements: listAnnouncements().map(toPublicAnnouncement)
  });
});

app.post("/api/admin/announcements", async (request, response, next) => {
  try {
    const announcement = createStoredAnnouncement({
      title: request.body?.title,
      content: request.body?.content,
      author: request.currentUser
    });
    await persistAnnouncementsStore();

    response.status(201).json({
      message: "公告发布成功。",
      announcement: toPublicAnnouncement(announcement)
    });
  } catch (error) {
    error.status = error.status || 400;
    next(error);
  }
});

app.delete("/api/admin/announcements/:id", (request, response, next) => {
  const announcementId = String(request.params.id || "").trim();

  if (!announcementId) {
    return response.status(400).json({
      error: "请求失败",
      detail: "公告 ID 不能为空。"
    });
  }

  const removed = removeStoredAnnouncement(announcementId);

  if (!removed) {
    return response.status(404).json({
      error: "未找到公告",
      detail: "指定公告不存在。"
    });
  }

  void persistAnnouncementsStore().catch((error) => {
    console.warn("Failed to persist announcement removal:", error);
  });

  response.json({
    message: "公告已删除。"
  });
});

app.get("/api/admin/config", (request, response) => {
  response.json(serializeConfigForClient(true));
});

app.post("/api/admin/config", async (request, response, next) => {
  try {
    await updateRuntimeConfig(readConfigFromBody(request.body));

    response.json({
      message: "配置已保存。",
      ...serializeConfigForClient(true)
    });
  } catch (error) {
    error.status = error.status || 400;
    next(error);
  }
});

app.post("/api/admin/config/test", async (request, response, next) => {
  try {
    const config = readConfigFromBody(request.body, true);
    const enabledApiConfigs = Array.isArray(config.apiConfigs)
      ? config.apiConfigs.filter((item) => item.enabled)
      : [];
    const payload = await fetchModelsWithConfigs(enabledApiConfigs);

    response.json({
      ok: true,
      apiBaseUrl: enabledApiConfigs[0]?.apiBaseUrl || "",
      keyConfigured: enabledApiConfigs.some((item) => Boolean(item.apiKey)),
      apiKeyPreview: maskApiKey(enabledApiConfigs[0]?.apiKey || ""),
      apiCount: enabledApiConfigs.length,
      modelCount: payload.summary?.totalModelCount || payload.allModels?.length || payload.data.length,
      chatModelCount: payload.summary?.chatModelCount || payload.data.length,
      imageModelCount: payload.summary?.imageModelCount || payload.imageModels?.length || 0,
      sampleModels: (payload.data || []).slice(0, 8).map((model) => model.id),
      sampleImageModels: (payload.imageModels || []).slice(0, 6).map((model) => model.id),
      apiStatuses: payload.apiStatuses || []
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/users", (request, response) => {
  const users = [...usersStore.users]
    .sort((left, right) => {
      if (left.role !== right.role) {
        return left.role === "admin" ? -1 : 1;
      }

      return left.username.localeCompare(right.username, "zh-CN");
    })
    .map(toPublicUser);

  response.json({
    users
  });
});

app.post("/api/admin/users", async (request, response, next) => {
  try {
    const user = createStoredUser({
      username: request.body?.username,
      password: request.body?.password,
      role: normalizeRole(request.body?.role)
    });
    await persistUsersStore();

    response.status(201).json({
      message: "用户创建成功。",
      user: toPublicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/users/:id", async (request, response, next) => {
  try {
    const targetUser = getUserById(String(request.params.id || ""));

    if (!targetUser) {
      return response.status(404).json({
        error: "未找到用户",
        detail: "目标用户不存在。"
      });
    }

    const { role, password, disabled } = request.body || {};
    const nextRole = role !== undefined ? normalizeRole(role) : targetUser.role;
    const nextDisabled = disabled !== undefined ? Boolean(disabled) : targetUser.disabled;
    const currentUserId = request.currentUser?.id;

    if (targetUser.id === currentUserId && nextDisabled) {
      return response.status(400).json({
        error: "操作被拒绝",
        detail: "不能禁用当前登录账号。"
      });
    }

    const projectedUsers = usersStore.users.map((item) => {
      if (item.id !== targetUser.id) {
        return item;
      }

      return {
        ...item,
        role: nextRole,
        disabled: nextDisabled
      };
    });

    if (countEnabledAdmins(projectedUsers) < 1) {
      return response.status(400).json({
        error: "操作被拒绝",
        detail: "系统至少需要保留一个可用管理员账号。"
      });
    }

    targetUser.role = nextRole;
    targetUser.disabled = nextDisabled;

    if (password !== undefined && String(password).trim()) {
      const validatedPassword = validatePassword(password);
      const passwordRecord = createPasswordRecord(validatedPassword);
      targetUser.passwordSalt = passwordRecord.salt;
      targetUser.passwordHash = passwordRecord.hash;
      await invalidateUserSessions(targetUser.id);
    }

    targetUser.updatedAt = Date.now();
    await persistUsersStore();

    response.json({
      message: "用户已更新。",
      user: toPublicUser(targetUser)
    });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/users/:id", async (request, response, next) => {
  try {
    const userId = String(request.params.id || "");
    const targetUser = getUserById(userId);

    if (!targetUser) {
      return response.status(404).json({
        error: "未找到用户",
        detail: "目标用户不存在。"
      });
    }

    if (targetUser.id === request.currentUser?.id) {
      return response.status(400).json({
        error: "操作被拒绝",
        detail: "不能删除当前登录账号。"
      });
    }

    const projectedUsers = usersStore.users.filter((item) => item.id !== targetUser.id);

    if (countEnabledAdmins(projectedUsers) < 1) {
      return response.status(400).json({
        error: "操作被拒绝",
        detail: "系统至少需要保留一个可用管理员账号。"
      });
    }

    usersStore.users = projectedUsers;
    await persistUsersStore();
    if (conversationsStore.users[targetUser.id]) {
      delete conversationsStore.users[targetUser.id];
      await persistConversationsStore();
    }
    await deleteUserWorkspaceData(targetUser.id);
    await invalidateUserSessions(targetUser.id);

    response.json({
      message: "用户已删除。"
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/models", async (request, response, next) => {
  try {
    response.json(await fetchModelsWithConfigs(getEnabledApiConfigs()));
  } catch (error) {
    next(error);
  }
});

app.post("/api/chat", requireAuth, async (request, response, next) => {
  const result = buildChatPayload(request.body, { stream: false });

  if (result.error) {
    return response.status(result.error.status).json(result.error.payload);
  }

  try {
    const config = resolveRequestApiConfig(result.sourceApiId);
    const workspacePayload = await enrichPayloadWithWorkspaceContext(
      result.payload,
      request.body,
      request.currentUser
    );
    const payload = await enrichPayloadWithWebSearch(workspacePayload, request.body);
    const requestBody = JSON.stringify(payload);
    const upstreamResponse = await requestJsonWithRetry(`${config.apiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: createApiHeaders(config.apiKey, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody)
      }),
      body: requestBody,
      timeout: chatRequestTimeoutMs
    });

    if (!upstreamResponse.ok) {
      throw createUpstreamError(upstreamResponse);
    }

    response.json(upstreamResponse.data);
  } catch (error) {
    next(error);
  }
});

app.post("/api/chat/stream", requireAuth, async (request, response, next) => {
  const result = buildChatPayload(request.body, { stream: true });

  if (result.error) {
    return response.status(result.error.status).json(result.error.payload);
  }

  const config = resolveRequestApiConfig(result.sourceApiId);
  const workspacePayload = await enrichPayloadWithWorkspaceContext(
    result.payload,
    request.body,
    request.currentUser
  );
  const payload = await enrichPayloadWithWebSearch(workspacePayload, request.body);
  const requestBody = JSON.stringify(payload);
  const target = new URL(`${config.apiBaseUrl}/chat/completions`);
  const client = getHttpClient(target);
  let streamStarted = false;
  let clientClosed = false;
  let activeUpstreamRequest = null;
  const maxAttempts = 3;

  function failStream(status, detail) {
    if (!response.headersSent) {
      response.status(status).json({
        error: "请求失败",
        detail
      });
      return;
    }

    sendSseEvent(response, "error", { detail });
    response.end();
  }

  function startStreamAttempt(attempt) {
    if (clientClosed || response.writableEnded) {
      return;
    }

    const upstreamRequest = client.request(
      target,
      {
        method: "POST",
        headers: createApiHeaders(config.apiKey, {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestBody)
        }),
        timeout: chatRequestTimeoutMs
      },
      (upstreamResponse) => {
        const status = Number(upstreamResponse.statusCode) || 500;

        if (status < 200 || status >= 300) {
          let raw = "";

          upstreamResponse.setEncoding("utf8");
          upstreamResponse.on("data", (chunk) => {
            raw += chunk;
          });

          upstreamResponse.on("end", async () => {
            const detail = extractErrorDetail(raw, status);

            if (!streamStarted && !clientClosed && attempt < maxAttempts && isRetryableStatus(status)) {
              await wait(350 * attempt);
              startStreamAttempt(attempt + 1);
              return;
            }

            failStream(status, detail);
          });

          return;
        }

        streamStarted = true;
        response.status(200);
        response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        response.setHeader("Cache-Control", "no-cache, no-transform");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("X-Accel-Buffering", "no");

        if (typeof response.flushHeaders === "function") {
          response.flushHeaders();
        }

        upstreamResponse.on("data", (chunk) => {
          if (!response.writableEnded) {
            response.write(chunk);
          }
        });

        upstreamResponse.on("end", () => {
          if (!response.writableEnded) {
            response.end();
          }
        });

        upstreamResponse.on("error", (error) => {
          if (clientClosed) {
            return;
          }

          if (!response.writableEnded) {
            sendSseEvent(response, "error", {
              detail: error.message || "流式响应中断。"
            });
            response.end();
          }
        });
      }
    );

    activeUpstreamRequest = upstreamRequest;

    upstreamRequest.on("timeout", () => {
      const timeoutError = new Error("上游请求超时。");
      timeoutError.code = "ETIMEDOUT";
      upstreamRequest.destroy(timeoutError);
    });

    upstreamRequest.on("error", async (error) => {
      if (clientClosed) {
        return;
      }

      if (!streamStarted && attempt < maxAttempts && !response.headersSent && isRetryableNetworkError(error)) {
        await wait(350 * attempt);
        startStreamAttempt(attempt + 1);
        return;
      }

      if (!streamStarted && !response.headersSent) {
        next(error);
        return;
      }

      if (!response.writableEnded) {
        sendSseEvent(response, "error", {
          detail: error.message || "流式请求失败。"
        });
        response.end();
      }
    });

    upstreamRequest.write(requestBody);
    upstreamRequest.end();
  }

  response.on("close", () => {
    clientClosed = true;

    if (activeUpstreamRequest && !activeUpstreamRequest.destroyed) {
      activeUpstreamRequest.destroy();
    }
  });

  startStreamAttempt(1);
});

app.post("/api/images/generations", requireAuth, async (request, response, next) => {
  const result = buildImageGenerationPayload(request.body);

  if (result.error) {
    return response.status(result.error.status).json(result.error.payload);
  }

  try {
    const config = resolveRequestApiConfig(result.sourceApiId);
    response.json(await generateImagesWithConfig(config, result.payload));
  } catch (error) {
    next(error);
  }
});

app.get("/healthz", (request, response) => {
  response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});
}

module.exports = { registerApiRoutes };
