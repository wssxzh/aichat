"use strict";

const fs = require("fs");
const crypto = require("crypto");
const { createQueuedTaskRunner, writeFileAtomic } = require("../utils/atomic-file");

function createAnnouncementsStore(options) {
  const { announcementsConfigPath, maxStoredAnnouncements, normalizeUsername } = options;

function normalizeAnnouncementTitle(value) {
  return String(value || "").trim();
}

function validateAnnouncementTitle(value) {
  const title = normalizeAnnouncementTitle(value);

  if (title.length > 120) {
    const titleError = new Error("公告标题不能超过 120 个字符。");
    titleError.status = 400;
    throw titleError;
  }

  return title;
}

function validateAnnouncementContent(value) {
  const content = String(value || "").trim();

  if (!content) {
    const contentError = new Error("公告内容不能为空。");
    contentError.status = 400;
    throw contentError;
  }

  if (content.length > 4000) {
    const contentLengthError = new Error("公告内容不能超过 4000 个字符。");
    contentLengthError.status = 400;
    throw contentLengthError;
  }

  return content;
}

function sanitizeLoadedAnnouncement(input) {
  const id = String(input?.id || "").trim();
  const content = String(input?.content || "").trim();

  if (!id || !content) {
    return null;
  }

  const createdAt = Number(input?.createdAt) || Date.now();
  const updatedAt = Number(input?.updatedAt) || createdAt;
  const title = normalizeAnnouncementTitle(input?.title).slice(0, 120);

  return {
    id,
    title,
    content: content.slice(0, 4000),
    authorId: String(input?.authorId || "").trim(),
    authorName: normalizeUsername(input?.authorName || ""),
    createdAt,
    updatedAt
  };
}

function sortAnnouncements(left, right) {
  return Number(right.updatedAt || right.createdAt || 0) - Number(left.updatedAt || left.createdAt || 0);
}

function readAnnouncementsStore() {
  if (!fs.existsSync(announcementsConfigPath)) {
    return {
      announcements: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  try {
    const raw = fs.readFileSync(announcementsConfigPath, "utf8");
    const parsed = JSON.parse(raw);
    const announcements = Array.isArray(parsed?.announcements)
      ? parsed.announcements.map(sanitizeLoadedAnnouncement).filter(Boolean)
      : [];

    announcements.sort(sortAnnouncements);

    return {
      announcements: announcements.slice(0, maxStoredAnnouncements),
      createdAt: Number(parsed?.createdAt) || Date.now(),
      updatedAt: Number(parsed?.updatedAt) || Date.now()
    };
  } catch (error) {
    console.warn("Failed to read announcements config:", error);
    return {
      announcements: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
}

let announcementsStore = readAnnouncementsStore();

function buildAnnouncementsStoreSnapshot() {
  return {
    announcements: announcementsStore.announcements,
    createdAt: announcementsStore.createdAt,
    updatedAt: announcementsStore.updatedAt
  };
}

const persistAnnouncementsStoreQueued = createQueuedTaskRunner(async (snapshot) => {
  await writeFileAtomic(announcementsConfigPath, JSON.stringify(snapshot, null, 2), "utf8");
});

async function persistAnnouncementsStore() {
  announcementsStore.updatedAt = Date.now();
  announcementsStore.announcements = announcementsStore.announcements
    .filter(Boolean)
    .sort(sortAnnouncements)
    .slice(0, maxStoredAnnouncements);
  await persistAnnouncementsStoreQueued(buildAnnouncementsStoreSnapshot());
}

function toPublicAnnouncement(announcement) {
  if (!announcement) {
    return null;
  }

  return {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    authorId: announcement.authorId || null,
    authorName: announcement.authorName || null,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt
  };
}

function listAnnouncements(limit) {
  const sortedAnnouncements = announcementsStore.announcements
    .filter(Boolean)
    .sort(sortAnnouncements);

  if (!Number.isFinite(Number(limit))) {
    return sortedAnnouncements;
  }

  return sortedAnnouncements.slice(0, Math.max(1, Math.floor(Number(limit))));
}

function createStoredAnnouncement({ title, content, author }) {
  const now = Date.now();
  const announcement = {
    id: `announcement-${crypto.randomUUID()}`,
    title: validateAnnouncementTitle(title),
    content: validateAnnouncementContent(content),
    authorId: String(author?.id || "").trim(),
    authorName: normalizeUsername(author?.username || ""),
    createdAt: now,
    updatedAt: now
  };

  announcementsStore.announcements.unshift(announcement);

  return announcement;
}

function removeStoredAnnouncement(announcementId) {
  const id = String(announcementId || "").trim();

  if (!id) {
    return null;
  }

  const targetIndex = announcementsStore.announcements.findIndex((item) => item.id === id);

  if (targetIndex < 0) {
    return null;
  }

  const [removed] = announcementsStore.announcements.splice(targetIndex, 1);

  return removed;
}


  return {
    announcementsStore,
    persistAnnouncementsStore,
    listAnnouncements,
    toPublicAnnouncement,
    createStoredAnnouncement,
    removeStoredAnnouncement
  };
}

module.exports = { createAnnouncementsStore };
