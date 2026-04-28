# Deployment Guide

本文档覆盖该项目从本地测试到生产部署的推荐流程。

## 1. 部署前准备

- 准备 Node.js `>=20`（如需本地运行）
- 准备 Docker 与 Docker Compose（推荐部署方式）
- 准备可用的上游模型 API 信息：`API_BASE_URL`、`API_KEY`

## 2. 生产环境变量

1. 复制模板：

```bash
cp .env.production.example .env.production
```

2. 至少修改以下变量：

- `API_BASE_URL`
- `API_KEY`
- `ADMIN_PASSWORD`
- `SESSION_COOKIE_SECURE=true`（线上 HTTPS 场景）

3. 可按需调整：

- `PORT`：宿主端口
- `SESSION_TTL_MS`：会话过期时间
- `MAX_STORED_ANNOUNCEMENTS`：公告历史保留数量

## 3. Docker Compose 部署（推荐）

启动：

```bash
docker compose --env-file .env.production up -d --build
```

查看运行状态：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f ai-chat-web
```

停止与清理容器：

```bash
docker compose down
```

说明：

- `./data:/data` 用于持久化运行时配置、用户和公告数据。
- 已配置容器健康检查，探针地址为 `/healthz`。

## 4. Docker Run 部署

```bash
docker build -t aichat-web:latest .

docker run -d \
  --name aichat-web \
  -p 3000:3000 \
  --env-file .env.production \
  -v aichat-data:/data \
  --restart unless-stopped \
  aichat-web:latest
```

## 5. 健康检查与验收

健康检查：

```bash
curl http://localhost:3000/healthz
```

期望返回（示例）：

```json
{
  "status": "ok",
  "timestamp": "2026-04-28T03:20:15.000Z",
  "uptimeSeconds": 42
}
```

业务验收建议：

- 管理员登录成功
- 模型配置测试连通成功
- 普通用户可正常发起聊天
- 流式回复可持续输出

## 6. 反向代理建议

当你在 Nginx / Traefik 后部署时：

- 对外仅暴露 80/443，应用端口保持内网访问
- 强制 HTTPS
- 对 `/api/chat/stream` 保持长连接与禁用代理缓冲

## 7. 升级发布流程建议

1. 拉取新代码
2. 执行 `docker compose --env-file .env.production build`
3. 执行 `docker compose --env-file .env.production up -d`
4. 观察 `docker compose ps` 与 `docker compose logs -f`
5. 回归检查登录、模型列表、流式聊天

## 8. 常见问题

1. 容器不断重启
- 优先检查 `.env.production` 是否缺少必填变量。
- 使用 `docker compose logs ai-chat-web` 查看具体报错。

2. 登录后立刻掉线
- 检查 `SESSION_COOKIE_SECURE` 与 HTTPS 配置是否匹配。

3. 无法获取模型列表
- 检查 `API_BASE_URL`、`API_KEY`，并在管理端执行连通性测试。
