"use strict";

const fs = require("fs");
const path = require("path");
const { ensureParentDirectory, writeFileAtomic } = require("../utils/atomic-file");

function createWorkspacesStore(options) {
  const {
    workspacesRootDir,
    maxWorkspaceFilesPerConversation
  } = options;

  function sanitizePathSegment(value, fallback) {
    const normalized = String(value || "")
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return (normalized || fallback).slice(0, 120);
  }

  function getUserDir(userId) {
    return path.join(workspacesRootDir, sanitizePathSegment(userId, "user"));
  }

  function getConversationDir(userId, conversationId) {
    return path.join(
      getUserDir(userId),
      sanitizePathSegment(conversationId, "conversation")
    );
  }

  function getFilesDir(userId, conversationId) {
    return path.join(getConversationDir(userId, conversationId), "files");
  }

  function getWorkspaceIndexPath(userId, conversationId) {
    return path.join(getConversationDir(userId, conversationId), "index.json");
  }

  function createEmptyWorkspaceIndex(userId, conversationId) {
    const now = Date.now();

    return {
      userId: String(userId || ""),
      conversationId: String(conversationId || ""),
      files: [],
      chunks: [],
      createdAt: now,
      updatedAt: now
    };
  }

  function normalizeWorkspaceFile(input) {
    return {
      id: typeof input?.id === "string" ? input.id.slice(0, 120) : "",
      name: typeof input?.name === "string" ? input.name.slice(0, 240) : "",
      mimeType: typeof input?.mimeType === "string" ? input.mimeType.slice(0, 120) : "application/octet-stream",
      size: Math.max(0, Number(input?.size) || 0),
      extension: typeof input?.extension === "string" ? input.extension.slice(0, 20) : "",
      uploadedAt: Number(input?.uploadedAt) || Date.now(),
      storedName: typeof input?.storedName === "string" ? input.storedName.slice(0, 260) : "",
      contentHash: typeof input?.contentHash === "string" ? input.contentHash.slice(0, 120) : "",
      chunkCount: Math.max(0, Number(input?.chunkCount) || 0),
      characterCount: Math.max(0, Number(input?.characterCount) || 0)
    };
  }

  function normalizeWorkspaceChunk(input) {
    return {
      id: typeof input?.id === "string" ? input.id.slice(0, 120) : "",
      fileId: typeof input?.fileId === "string" ? input.fileId.slice(0, 120) : "",
      fileName: typeof input?.fileName === "string" ? input.fileName.slice(0, 240) : "",
      ordinal: Math.max(0, Number(input?.ordinal) || 0),
      characterStart: Math.max(0, Number(input?.characterStart) || 0),
      characterEnd: Math.max(0, Number(input?.characterEnd) || 0),
      preview: typeof input?.preview === "string" ? input.preview : "",
      text: typeof input?.text === "string" ? input.text : ""
    };
  }

  function normalizeWorkspaceIndex(userId, conversationId, input) {
    const fallback = createEmptyWorkspaceIndex(userId, conversationId);

    return {
      userId: typeof input?.userId === "string" ? input.userId : fallback.userId,
      conversationId:
        typeof input?.conversationId === "string" ? input.conversationId : fallback.conversationId,
      files: Array.isArray(input?.files) ? input.files.map(normalizeWorkspaceFile).filter((item) => item.id) : [],
      chunks: Array.isArray(input?.chunks) ? input.chunks.map(normalizeWorkspaceChunk).filter((item) => item.id) : [],
      createdAt: Number(input?.createdAt) || fallback.createdAt,
      updatedAt: Number(input?.updatedAt) || Date.now()
    };
  }

  async function pathExists(targetPath) {
    try {
      await fs.promises.access(targetPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async function ensureDirectory(targetPath) {
    await fs.promises.mkdir(targetPath, { recursive: true });
    return targetPath;
  }

  async function readWorkspaceIndex(userId, conversationId) {
    const indexPath = getWorkspaceIndexPath(userId, conversationId);

    if (!(await pathExists(indexPath))) {
      return createEmptyWorkspaceIndex(userId, conversationId);
    }

    try {
      const raw = await fs.promises.readFile(indexPath, "utf8");
      const parsed = JSON.parse(raw);
      return normalizeWorkspaceIndex(userId, conversationId, parsed);
    } catch (error) {
      console.warn("Failed to read workspace index:", error);
      return createEmptyWorkspaceIndex(userId, conversationId);
    }
  }

  async function writeWorkspaceIndex(userId, conversationId, input) {
    const conversationDir = getConversationDir(userId, conversationId);
    await ensureDirectory(conversationDir);
    await ensureDirectory(getFilesDir(userId, conversationId));
    const nextIndex = normalizeWorkspaceIndex(userId, conversationId, input);
    nextIndex.updatedAt = Date.now();

    await writeFileAtomic(
      path.join(conversationDir, "index.json"),
      JSON.stringify(nextIndex, null, 2),
      "utf8"
    );

    return nextIndex;
  }

  async function listWorkspaceFiles(userId, conversationId) {
    const index = await readWorkspaceIndex(userId, conversationId);

    return index.files
      .slice()
      .sort((left, right) => Number(right.uploadedAt || 0) - Number(left.uploadedAt || 0));
  }

  function getWorkspaceFilePath(userId, conversationId, storedName) {
    return path.join(getFilesDir(userId, conversationId), storedName);
  }

  async function writeWorkspaceFileBuffer(userId, conversationId, fileRecord, buffer) {
    await ensureDirectory(getFilesDir(userId, conversationId));
    const normalizedFile = normalizeWorkspaceFile(fileRecord);
    const storedName = normalizedFile.storedName || `${normalizedFile.id}${normalizedFile.extension || ""}`;
    const filePath = getWorkspaceFilePath(userId, conversationId, storedName);

    await writeFileAtomic(filePath, buffer);

    return {
      ...normalizedFile,
      storedName
    };
  }

  async function removeWorkspaceFileAsset(userId, conversationId, storedName) {
    if (!storedName) {
      return;
    }

    await fs.promises.rm(getWorkspaceFilePath(userId, conversationId, storedName), { force: true });
  }

  async function cleanupWorkspaceArtifacts(userId, conversationId) {
    const conversationDir = getConversationDir(userId, conversationId);

    if (await pathExists(conversationDir)) {
      await fs.promises.rm(conversationDir, { recursive: true, force: true });
    }
  }

  async function deleteWorkspaceFile(userId, conversationId, fileId) {
    const currentIndex = await readWorkspaceIndex(userId, conversationId);
    const targetFile = currentIndex.files.find((item) => item.id === String(fileId || ""));

    if (!targetFile) {
      return null;
    }

    await removeWorkspaceFileAsset(userId, conversationId, targetFile.storedName);

    const nextIndex = await writeWorkspaceIndex(userId, conversationId, {
      ...currentIndex,
      files: currentIndex.files.filter((item) => item.id !== targetFile.id),
      chunks: currentIndex.chunks.filter((item) => item.fileId !== targetFile.id)
    });

    if (!nextIndex.files.length) {
      await cleanupWorkspaceArtifacts(userId, conversationId);
    }

    return targetFile;
  }

  async function deleteWorkspace(userId, conversationId) {
    await cleanupWorkspaceArtifacts(userId, conversationId);
  }

  async function deleteUserWorkspaceData(userId) {
    const userDir = getUserDir(userId);

    if (await pathExists(userDir)) {
      await fs.promises.rm(userDir, { recursive: true, force: true });
    }
  }

  async function pruneUserWorkspaces(userId, allowedConversationIds = []) {
    const userDir = getUserDir(userId);

    if (!(await pathExists(userDir))) {
      return;
    }

    const allowed = new Set(
      allowedConversationIds.map((item) => sanitizePathSegment(item, "conversation")).filter(Boolean)
    );
    const entries = await fs.promises.readdir(userDir, { withFileTypes: true });

    await Promise.all(entries.map(async (entry) => {
      if (!entry.isDirectory() || allowed.has(entry.name)) {
        return;
      }

      await fs.promises.rm(path.join(userDir, entry.name), { recursive: true, force: true });
    }));
  }

  fs.mkdirSync(workspacesRootDir, { recursive: true });

  return {
    maxWorkspaceFilesPerConversation,
    readWorkspaceIndex,
    writeWorkspaceIndex,
    listWorkspaceFiles,
    writeWorkspaceFileBuffer,
    deleteWorkspaceFile,
    deleteWorkspace,
    deleteUserWorkspaceData,
    pruneUserWorkspaces
  };
}

module.exports = { createWorkspacesStore };
