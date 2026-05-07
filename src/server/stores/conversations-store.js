"use strict";

const fs = require("fs");
const crypto = require("crypto");

function createConversationsStore(options) {
  const {
    conversationsConfigPath,
    maxStoredConversationsPerUser,
    maxMessagesPerConversation,
    maxConversationMessageLength,
    maxConversationSystemPromptLength,
    maxConversationTitleLength
  } = options;

function clampConversationTemperature(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0.7;
  }

  return Math.min(2, Math.max(0, numeric));
}

function normalizeConversationFeedback(value) {
  return value === "like" || value === "dislike" ? value : "";
}

function normalizeConversationRole(value) {
  return value === "assistant" ? "assistant" : "user";
}

function compactConversationText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function deriveConversationTitle(messages) {
  const firstUserMessage = Array.isArray(messages)
    ? messages.find((message) => message.role === "user" && compactConversationText(message.content))
    : null;

  if (!firstUserMessage) {
    return "New chat";
  }

  const sourceText = compactConversationText(firstUserMessage.content);

  if (!sourceText) {
    return "New chat";
  }

  return sourceText.length > 24 ? `${sourceText.slice(0, 24)}...` : sourceText;
}

function sanitizeConversationMessage(input) {
  const content = String(input?.content || "").slice(0, maxConversationMessageLength);
  const timestamp = Number(input?.timestamp) || Date.now();
  const model = typeof input?.model === "string" ? input.model.slice(0, 200) : "";
  const id = typeof input?.id === "string" && input.id.trim()
    ? input.id.trim().slice(0, 120)
    : `message-${crypto.randomUUID()}`;

  return {
    id,
    role: normalizeConversationRole(input?.role),
    content,
    model,
    timestamp,
    feedback: normalizeConversationFeedback(input?.feedback),
    streaming: false
  };
}

function sanitizeConversationRecord(input) {
  const createdAt = Number(input?.createdAt) || Date.now();
  const messages = Array.isArray(input?.messages)
    ? input.messages.map(sanitizeConversationMessage).slice(-maxMessagesPerConversation)
    : [];
  const title = compactConversationText(input?.title).slice(0, maxConversationTitleLength);

  return {
    id: typeof input?.id === "string" && input.id.trim()
      ? input.id.trim().slice(0, 120)
      : `conversation-${crypto.randomUUID()}`,
    title: title || deriveConversationTitle(messages),
    createdAt,
    updatedAt: Number(input?.updatedAt) || createdAt,
    modelId: typeof input?.modelId === "string" ? input.modelId.slice(0, 200) : "",
    systemPrompt: typeof input?.systemPrompt === "string"
      ? input.systemPrompt.slice(0, maxConversationSystemPromptLength)
      : "",
    temperature: clampConversationTemperature(input?.temperature),
    pinned: Boolean(input?.pinned),
    messages
  };
}

function sortConversations(left, right) {
  if (Boolean(left?.pinned) !== Boolean(right?.pinned)) {
    return left?.pinned ? -1 : 1;
  }

  return Number(right?.updatedAt || 0) - Number(left?.updatedAt || 0);
}

function sanitizeUserConversationsState(input) {
  const conversations = Array.isArray(input?.conversations)
    ? input.conversations.map(sanitizeConversationRecord).sort(sortConversations).slice(0, maxStoredConversationsPerUser)
    : [];
  const providedActiveConversationId =
    typeof input?.activeConversationId === "string" ? input.activeConversationId.trim().slice(0, 120) : "";
  const resolvedActiveConversationId =
    conversations.some((conversation) => conversation.id === providedActiveConversationId)
      ? providedActiveConversationId
      : conversations[0]?.id || "";

  return {
    conversations,
    activeConversationId: resolvedActiveConversationId,
    updatedAt: Number(input?.updatedAt) || Date.now()
  };
}

function readConversationsStore() {
  if (!fs.existsSync(conversationsConfigPath)) {
    return {
      users: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  try {
    const raw = fs.readFileSync(conversationsConfigPath, "utf8");
    const parsed = JSON.parse(raw);
    const nextUsers = {};
    const usersNode = parsed?.users && typeof parsed.users === "object" ? parsed.users : {};

    for (const [userId, userState] of Object.entries(usersNode)) {
      const normalizedUserId = String(userId || "").trim();

      if (!normalizedUserId) {
        continue;
      }

      nextUsers[normalizedUserId] = sanitizeUserConversationsState(userState);
    }

    return {
      users: nextUsers,
      createdAt: Number(parsed?.createdAt) || Date.now(),
      updatedAt: Number(parsed?.updatedAt) || Date.now()
    };
  } catch (error) {
    console.warn("Failed to read conversations config:", error);
    return {
      users: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
}

let conversationsStore = readConversationsStore();

function persistConversationsStore() {
  conversationsStore.updatedAt = Date.now();

  fs.writeFileSync(
    conversationsConfigPath,
    JSON.stringify(
      {
        users: conversationsStore.users,
        createdAt: conversationsStore.createdAt,
        updatedAt: conversationsStore.updatedAt
      },
      null,
      2
    ),
    "utf8"
  );
}

function getUserConversationsState(userId) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    return sanitizeUserConversationsState(null);
  }

  if (!conversationsStore.users[normalizedUserId]) {
    conversationsStore.users[normalizedUserId] = sanitizeUserConversationsState(null);
  }

  return sanitizeUserConversationsState(conversationsStore.users[normalizedUserId]);
}

function saveUserConversationsState(userId, payload) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    const userIdError = new Error("Invalid user id");
    userIdError.status = 400;
    throw userIdError;
  }

  const sanitized = sanitizeUserConversationsState(payload);
  conversationsStore.users[normalizedUserId] = {
    ...sanitized,
    updatedAt: Date.now()
  };
  persistConversationsStore();

  return sanitizeUserConversationsState(conversationsStore.users[normalizedUserId]);
}


  return {
    conversationsStore,
    persistConversationsStore,
    getUserConversationsState,
    saveUserConversationsState
  };
}

module.exports = { createConversationsStore };
