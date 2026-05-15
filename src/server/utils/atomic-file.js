"use strict";

const fs = require("fs");
const path = require("path");

async function ensureParentDirectory(filePath) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
}

async function removeIfExists(filePath) {
  try {
    await fs.promises.rm(filePath, { force: true });
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

async function writeFileAtomic(filePath, content, options) {
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  await ensureParentDirectory(filePath);

  try {
    await fs.promises.writeFile(tempPath, content, options);
    await fs.promises.rename(tempPath, filePath);
  } catch (error) {
    await removeIfExists(tempPath);
    throw error;
  }
}

function createQueuedTaskRunner(task) {
  let queue = Promise.resolve();

  return function runQueuedTask(...args) {
    const nextRun = queue.catch(() => {}).then(() => task(...args));
    queue = nextRun;
    return nextRun;
  };
}

module.exports = {
  createQueuedTaskRunner,
  ensureParentDirectory,
  writeFileAtomic
};
