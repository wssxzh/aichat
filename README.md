# AI Chat Web

一个基于 `Node.js + Express + 原生前端` 的 AI 对话项目，包含登录鉴权、管理员配置中心、公告管理、模型列表与流式聊天。

## 核心能力

- 用户登录/注册与会话管理（HttpOnly Cookie）
- 管理员配置上游 `API_BASE_URL` / `API_KEY`
- 管理员用户管理（增删改角色）
- 公告系统（管理员发布、用户侧展示）
- 普通回复与 SSE 流式回复
- Docker / Docker Compose 一键部署

## 运行要求

- Node.js `>=20`
- npm `>=10`
- Docker（可选，用于容器部署）

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 复制环境变量模板

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

3. 启动服务

```bash
npm run dev
```

4. 打开页面

- [http://localhost:3000](http://localhost:3000)

5. 健康检查

```bash
curl http://localhost:3000/healthz
```

## 环境变量

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `API_BASE_URL` | `https://api.example.com` | 上游模型 API 地址 |
| `API_KEY` | `demo-key-change-me` | 上游模型 API Key |
| `ADMIN_USERNAME` | `admin` | 默认管理员账号 |
| `ADMIN_PASSWORD` | `demo-admin-password-change-me` | 默认管理员密码（生产必须修改） |
| `SESSION_TTL_MS` | `28800000` | 登录会话有效期（毫秒） |
| `SESSION_COOKIE_SECURE` | `false` | 是否仅在 HTTPS 下发送会话 Cookie |
| `RUNTIME_CONFIG_PATH` | `.runtime-config.json` | 运行时模型配置存储文件 |
| `USERS_CONFIG_PATH` | `.runtime-users.json` | 用户存储文件 |
| `ANNOUNCEMENTS_CONFIG_PATH` | `.runtime-announcements.json` | 公告存储文件 |
| `MAX_STORED_ANNOUNCEMENTS` | `80` | 最大保留公告数量 |
| `HOST` | `0.0.0.0` | 监听地址 |
| `PORT` | `3000` | 服务端口 |

## 部署

### Docker Compose（推荐）

1. 复制生产环境模板并修改敏感值

```bash
cp .env.production.example .env.production
```

2. 启动

```bash
docker compose --env-file .env.production up -d --build
```

3. 查看状态与日志

```bash
docker compose ps
docker compose logs -f ai-chat-web
```

4. 健康检查

```bash
curl http://localhost:3000/healthz
```

更多部署细节见：[DEPLOYMENT.md](./DEPLOYMENT.md)

### Docker 命令方式

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

## API 概览

- 认证：`/api/auth/*`
- 聊天：`/api/chat`、`/api/chat/stream`
- 模型：`/api/models`
- 公告：`/api/announcements`
- 管理员：`/api/admin/*`
- 健康检查：`/healthz`

## 上传 Git 前检查清单

- 确认 `.env`、`.runtime-*.json`、`data/` 未被提交
- 确认 `ADMIN_PASSWORD`、`API_KEY` 未写入仓库文件
- 执行 `npm run check` 确认语法通过
- 如使用 Docker，执行 `docker compose config` 确认配置可解析

可参考命令：

```bash
git init
git add .
git status
```

确认无敏感文件后再提交。
