"use strict";

const crypto = require("crypto");
const path = require("path");
const mammoth = require("mammoth");
const xlsx = require("xlsx");
const { PDFParse } = require("pdf-parse");

function createWorkspaceSearchService(options) {
  const {
    workspacesStore,
    maxWorkspaceFilesPerConversation,
    maxWorkspaceFileSizeBytes,
    workspaceChunkSize,
    workspaceChunkOverlap,
    workspaceMaxChunksPerFile,
    workspaceSearchResultCount,
    workspaceContextMaxLength
  } = options;

  const allowedExtensions = new Set([
    ".txt",
    ".md",
    ".markdown",
    ".pdf",
    ".docx",
    ".csv",
    ".xlsx",
    ".xls",
    ".json"
  ]);

  function compactText(value) {
    return String(value || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\u0000/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  function truncateText(value, maxLength) {
    const normalized = compactText(value);

    if (!normalized) {
      return "";
    }

    if (normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, maxLength)}...`;
  }

  function containsCjk(value) {
    return /[\u3400-\u9fff]/.test(String(value || ""));
  }

  function looksLikeMojibake(value) {
    return /[ÃÂÅÆÇÐÑØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(String(value || ""));
  }

  function normalizeWorkspaceFileName(value, fallback = "未命名文件") {
    const normalized = String(value || "").trim().replace(/[\u0000-\u001f]+/g, "");

    if (!normalized) {
      return fallback;
    }

    let decoded = normalized;

    try {
      decoded = Buffer.from(normalized, "latin1").toString("utf8").trim() || normalized;
    } catch (error) {
      decoded = normalized;
    }

    if (decoded !== normalized) {
      if (containsCjk(decoded) && !containsCjk(normalized)) {
        return decoded;
      }

      if (looksLikeMojibake(normalized) && !looksLikeMojibake(decoded)) {
        return decoded;
      }
    }

    return normalized;
  }

  function toPublicWorkspaceFile(file) {
    return {
      id: file.id,
      name: normalizeWorkspaceFileName(file.name),
      mimeType: file.mimeType,
      size: file.size,
      extension: file.extension,
      uploadedAt: file.uploadedAt,
      chunkCount: file.chunkCount,
      characterCount: file.characterCount
    };
  }

  function sanitizeConversationId(value) {
    return String(value || "").trim().slice(0, 120);
  }

  function detectExtension(fileName = "", mimeType = "") {
    const rawExtension = path.extname(String(fileName || "")).toLowerCase();

    if (allowedExtensions.has(rawExtension)) {
      return rawExtension;
    }

    if (mimeType === "application/json" || mimeType === "text/json") {
      return ".json";
    }

    if (mimeType === "text/plain") {
      return ".txt";
    }

    if (mimeType === "text/markdown") {
      return ".md";
    }

    if (mimeType === "application/pdf") {
      return ".pdf";
    }

    if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return ".docx";
    }

    if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return ".xlsx";
    }

    if (mimeType === "application/vnd.ms-excel") {
      return ".xls";
    }

    if (mimeType === "text/csv") {
      return ".csv";
    }

    return rawExtension;
  }

  async function extractPdfText(buffer) {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      return compactText(result?.text || "");
    } finally {
      await parser.destroy();
    }
  }

  async function extractDocxText(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return compactText(result?.value || "");
  }

  function extractSpreadsheetText(buffer) {
    const workbook = xlsx.read(buffer, { type: "buffer" });

    return compactText(
      workbook.SheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const csv = xlsx.utils.sheet_to_csv(sheet, { blankrows: false });
        const text = compactText(csv);

        if (!text) {
          return "";
        }

        return `# ${sheetName}\n${text}`;
      })
        .filter(Boolean)
        .join("\n\n")
    );
  }

  function extractJsonText(buffer) {
    const raw = buffer.toString("utf8");

    try {
      return compactText(JSON.stringify(JSON.parse(raw), null, 2));
    } catch (error) {
      return compactText(raw);
    }
  }

  async function extractTextFromBuffer({ buffer, extension }) {
    switch (extension) {
      case ".txt":
      case ".md":
      case ".markdown":
      case ".csv":
        return compactText(buffer.toString("utf8"));
      case ".json":
        return extractJsonText(buffer);
      case ".pdf":
        return extractPdfText(buffer);
      case ".docx":
        return extractDocxText(buffer);
      case ".xlsx":
      case ".xls":
        return extractSpreadsheetText(buffer);
      default:
        return "";
    }
  }

  function splitTextIntoChunks(text) {
    const normalized = compactText(text);

    if (!normalized) {
      return [];
    }

    const chunks = [];
    const step = Math.max(120, workspaceChunkSize - workspaceChunkOverlap);
    let start = 0;

    while (start < normalized.length && chunks.length < workspaceMaxChunksPerFile) {
      const end = Math.min(normalized.length, start + workspaceChunkSize);
      const chunkText = normalized.slice(start, end).trim();

      if (chunkText) {
        chunks.push({
          characterStart: start,
          characterEnd: end,
          text: chunkText
        });
      }

      if (end >= normalized.length) {
        break;
      }

      start += step;
    }

    return chunks;
  }

  function tokenizeQuery(value) {
    const matches = compactText(value).toLowerCase().match(/[\u4e00-\u9fff]{1,4}|[a-z0-9_.-]{2,}/g) || [];
    return [...new Set(matches)].slice(0, 12);
  }

  function countOccurrences(haystack, needle) {
    if (!haystack || !needle) {
      return 0;
    }

    let count = 0;
    let offset = 0;

    while (offset < haystack.length) {
      const nextIndex = haystack.indexOf(needle, offset);

      if (nextIndex === -1) {
        break;
      }

      count += 1;
      offset = nextIndex + needle.length;
    }

    return count;
  }

  function computeWorkspaceChunkScore(query, tokens, chunk) {
    const normalizedQuery = compactText(query).toLowerCase();
    const haystack = `${chunk.fileName || ""}\n${chunk.text || ""}`.toLowerCase();
    let score = 0;

    if (normalizedQuery && haystack.includes(normalizedQuery)) {
      score += 3;
    }

    for (const token of tokens) {
      const tokenHits = countOccurrences(haystack, token);

      if (!tokenHits) {
        continue;
      }

      score += Math.min(4, tokenHits) * 0.85;

      if (String(chunk.fileName || "").toLowerCase().includes(token)) {
        score += 1.25;
      }
    }

    if (chunk.ordinal === 0) {
      score += 0.08;
    }

    return score;
  }

  function buildWorkspaceContextMessage(query, hits) {
    const sourceText = hits
      .map((item, index) => {
        return [
          `[W${index + 1}] 文件: ${normalizeWorkspaceFileName(item.fileName)}`,
          item.extension ? `类型: ${item.extension}` : "",
          `片段: ${truncateText(item.text, 900)}`
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    const content = [
      "以下是当前对话工作区文件中检索命中的内容，请优先基于这些文件回答用户问题。",
      `用户当前问题: ${query}`,
      "",
      sourceText,
      "",
      "回答要求:",
      "1. 优先引用工作区文件内容回答；",
      "2. 如果文件中找不到足够依据，请明确说明；",
      "3. 回答正文尽量使用 [W1][W2] 这样的编号标注证据来源；",
      "4. 不要把未命中的文件内容当作已知事实。"
    ].join("\n");

    return {
      role: "system",
      content: content.length > workspaceContextMaxLength
        ? content.slice(0, workspaceContextMaxLength)
        : content
    };
  }

  function extractTextFromMessageContent(content) {
    if (typeof content === "string") {
      return compactText(content);
    }

    if (!Array.isArray(content)) {
      return "";
    }

    return compactText(
      content
        .map((part) => {
          if (part?.type === "text" && typeof part.text === "string") {
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

      const query = extractTextFromMessageContent(message?.content);

      if (query) {
        return query.slice(0, 500);
      }
    }

    return "";
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

  async function saveWorkspaceFile(userId, conversationId, file) {
    const originalName = normalizeWorkspaceFileName(file?.originalname || "workspace-file").slice(0, 240);
    const mimeType = String(file?.mimetype || "application/octet-stream").slice(0, 120);
    const buffer = Buffer.isBuffer(file?.buffer) ? file.buffer : Buffer.alloc(0);
    const extension = detectExtension(originalName, mimeType);

    if (!buffer.length) {
      throw new Error("上传文件内容为空。");
    }

    if (!allowedExtensions.has(extension)) {
      throw new Error(`暂不支持解析 ${extension || "该"} 文件类型。`);
    }

    if (buffer.length > maxWorkspaceFileSizeBytes) {
      throw new Error("文件体积超出当前工作区上传限制。");
    }

    const extractedText = await extractTextFromBuffer({ buffer, extension });

    if (!extractedText) {
      throw new Error("未能从该文件中提取可检索文本。");
    }

    const chunks = splitTextIntoChunks(extractedText);

    if (!chunks.length) {
      throw new Error("文件内容过少，未生成可检索片段。");
    }

    const fileId = `workspace-file-${crypto.randomUUID()}`;
    const safeBaseName = path.basename(originalName, path.extname(originalName))
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "file";
    const fileRecord = {
      id: fileId,
      name: originalName,
      mimeType,
      size: buffer.length,
      extension,
      uploadedAt: Date.now(),
      storedName: `${fileId}-${safeBaseName}${extension}`,
      contentHash: crypto.createHash("sha256").update(buffer).digest("hex"),
      chunkCount: chunks.length,
      characterCount: extractedText.length
    };
    const storedFile = await workspacesStore.writeWorkspaceFileBuffer(
      userId,
      conversationId,
      fileRecord,
      buffer
    );
    const currentIndex = await workspacesStore.readWorkspaceIndex(userId, conversationId);
    const nextFiles = [...currentIndex.files, storedFile];
    const nextChunks = [
      ...currentIndex.chunks,
      ...chunks.map((chunk, index) => ({
        id: `workspace-chunk-${crypto.randomUUID()}`,
        fileId,
        fileName: storedFile.name,
        ordinal: index,
        characterStart: chunk.characterStart,
        characterEnd: chunk.characterEnd,
        preview: truncateText(chunk.text, 180),
        text: chunk.text
      }))
    ];

    await workspacesStore.writeWorkspaceIndex(userId, conversationId, {
      ...currentIndex,
      files: nextFiles,
      chunks: nextChunks
    });

    return toPublicWorkspaceFile(storedFile);
  }

  async function uploadWorkspaceFiles(userId, conversationId, files = []) {
    const workspaceId = sanitizeConversationId(conversationId);
    const currentFiles = await workspacesStore.listWorkspaceFiles(userId, workspaceId);
    let remainingSlots = Math.max(0, maxWorkspaceFilesPerConversation - currentFiles.length);
    const uploaded = [];
    const failed = [];

    for (const file of files) {
      if (remainingSlots <= 0) {
        failed.push({
          name: normalizeWorkspaceFileName(file?.originalname || "未命名文件"),
          message: `当前对话最多只支持 ${maxWorkspaceFilesPerConversation} 个工作区文件。`
        });
        continue;
      }

      try {
        uploaded.push(await saveWorkspaceFile(userId, workspaceId, file));
        remainingSlots -= 1;
      } catch (error) {
        failed.push({
          name: normalizeWorkspaceFileName(file?.originalname || "未命名文件"),
          message: error.message || "文件处理失败。"
        });
      }
    }

    return {
      uploaded,
      failed,
      files: await listWorkspaceFiles(userId, workspaceId)
    };
  }

  async function listWorkspaceFiles(userId, conversationId) {
    const files = await workspacesStore.listWorkspaceFiles(userId, sanitizeConversationId(conversationId));
    return files.map(toPublicWorkspaceFile);
  }

  async function deleteWorkspaceFile(userId, conversationId, fileId) {
    const removedFile = await workspacesStore.deleteWorkspaceFile(
      userId,
      sanitizeConversationId(conversationId),
      String(fileId || "").trim()
    );

    return removedFile ? toPublicWorkspaceFile(removedFile) : null;
  }

  async function searchWorkspaceChunks(userId, conversationId, query) {
    const workspaceId = sanitizeConversationId(conversationId);
    const index = await workspacesStore.readWorkspaceIndex(userId, workspaceId);

    if (!index.files.length || !index.chunks.length) {
      return [];
    }

    const tokens = tokenizeQuery(query);
    const perFileCount = new Map();

    return index.chunks
      .map((chunk) => ({
        ...chunk,
        extension:
          index.files.find((file) => file.id === chunk.fileId)?.extension || "",
        _score: computeWorkspaceChunkScore(query, tokens, chunk)
      }))
      .filter((chunk) => chunk._score > 0)
      .sort((left, right) => right._score - left._score)
      .filter((chunk) => {
        const currentCount = perFileCount.get(chunk.fileId) || 0;

        if (currentCount >= 3) {
          return false;
        }

        perFileCount.set(chunk.fileId, currentCount + 1);
        return true;
      })
      .slice(0, workspaceSearchResultCount);
  }

  async function enrichPayloadWithWorkspaceContext(payload, requestBody, currentUser) {
    const conversationId = sanitizeConversationId(requestBody?.conversationId);

    if (!conversationId || !currentUser?.id) {
      return payload;
    }

    const query = extractLatestUserQuery(payload?.messages);

    if (!query) {
      return payload;
    }

    try {
      const hits = await searchWorkspaceChunks(currentUser.id, conversationId, query);

      if (!hits.length) {
        return payload;
      }

      return {
        ...payload,
        messages: injectSystemMessageBeforeLatestUser(
          payload.messages,
          buildWorkspaceContextMessage(query, hits)
        )
      };
    } catch (error) {
      console.warn("Workspace retrieval failed:", {
        conversationId,
        userId: currentUser.id,
        detail: error.message || String(error)
      });

      return payload;
    }
  }

  return {
    listWorkspaceFiles,
    uploadWorkspaceFiles,
    deleteWorkspaceFile,
    enrichPayloadWithWorkspaceContext
  };
}

module.exports = { createWorkspaceSearchService };
