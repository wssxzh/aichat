"use strict";

const path = require("path");
const express = require("express");
const { registerApiRoutes } = require("./routes/register-api-routes");

function createApp(dependencies) {
  const app = express();
  const publicIndexPath = path.join(dependencies.env.publicDir, "index.html");

  app.use(express.json({ limit: dependencies.env.expressJsonLimit }));
  app.use(express.static(dependencies.env.publicDir));

  registerApiRoutes(app, dependencies);

  app.use("/api/*", (request, response) => {
    response.status(404).json({ error: "请求失败", detail: "接口不存在。" });
  });

  app.get("*", (request, response) => {
    response.sendFile(publicIndexPath);
  });

  app.use((error, request, response, next) => {
    const status =
      error?.name === "MulterError"
        ? 400
        : (Number(error.status) || 500);
    let detail = error.detail || error.message || "服务器内部异常。";

    if (error?.code === "LIMIT_FILE_SIZE") {
      detail = "上传文件过大。";
    } else if (error?.code === "LIMIT_FILE_COUNT") {
      detail = "单次上传文件数量超出限制。";
    } else if (error?.code === "LIMIT_UNEXPECTED_FILE") {
      detail = "上传字段无效。";
    }

    console.error(error);
    response.status(status).json({
      error: "请求失败",
      detail
    });
  });

  return app;
}

module.exports = { createApp };
