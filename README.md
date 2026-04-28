# AI Chat Web

一个基于 `Node.js + Express + 原生前端` 的 AI 对话项目，内置登录鉴权、管理员配置、公告管理、模型列表和流式聊天。

## 运行要求

- Node.js >= 20
- npm >= 10
- Docker + Docker Compose（推荐）

## 快速开始

```bash
npm install
cp .env.example .env
npm run dev
```

访问：[http://localhost:3000](http://localhost:3000)

健康检查：

```bash
curl http://localhost:3000/healthz
```

## 环境变量

参考 [`.env.example`](./.env.example) 与 [`.env.production.example`](./.env.production.example)。

关键变量：

- `API_BASE_URL`
- `API_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SESSION_COOKIE_SECURE`
- `RUNTIME_CONFIG_PATH`
- `USERS_CONFIG_PATH`
- `ANNOUNCEMENTS_CONFIG_PATH`

## Docker 部署（推荐）

```bash
cp .env.production.example .env.production
docker compose --env-file .env.production up -d --build
```

查看状态：

```bash
docker compose ps
docker compose logs -f ai-chat-web
```

## 为什么这版不会再踩权限坑

当前 `docker-compose.yml` 默认使用 **Docker 命名卷**：

- `aichat-data:/data`

这避免了宿主机 `./data` 目录属主不一致导致的 `EACCES: permission denied`。

## 旧环境迁移（你当前服务器建议执行）

```bash
cd ~/aichat
git pull
docker compose --env-file .env.production down --remove-orphans
docker volume rm aichat_aichat-data 2>/dev/null || true
docker compose --env-file .env.production up -d --build
docker compose ps
docker compose logs -f ai-chat-web
```

## 如必须使用宿主机目录挂载（不推荐）

将卷改回 `./data:/data` 时，请先修权限：

```bash
mkdir -p data
chown -R 1000:1000 data
chmod -R u+rwX,g+rwX data
```

## 常用脚本

```bash
npm run dev
npm run start
npm run check
npm run docker:build
npm run docker:up
npm run docker:logs
npm run docker:down
```