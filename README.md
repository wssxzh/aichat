# AI Chat Web

一个基于 `Node.js + Express + 原生前端` 的 AI 对话应用，支持用户登录注册、管理员配置模型 API、公告管理、多会话聊天和 SSE 流式输出。

本项目既可本地开发，也可通过 Docker Compose 快速部署到生产环境。

## 1. 功能概览

- 用户认证：注册、登录、注销、会话鉴权
- 权限模型：普通用户 + 管理员
- 管理后台能力：
  - 配置 `API_BASE_URL` / `API_KEY`
  - 测试模型接口连通性
  - 管理用户（创建、禁用、角色变更、删除）
  - 发布与删除公告
- 对话能力：
  - 普通响应 `/api/chat`
  - 流式响应 `/api/chat/stream`
- 运维能力：
  - 健康检查 `/healthz`
  - Docker 健康探针
  - 持久化运行数据

## 2. 技术栈与目录结构

- 后端：Node.js 20 + Express
- 前端：原生 HTML/CSS/JS
- 配置管理：`dotenv`
- 容器化：Docker + Docker Compose

目录结构：

```text
.
├─ public/                    # 前端静态资源
├─ server.js                  # 应用主入口
├─ Dockerfile                 # 镜像构建文件
├─ docker-compose.yml         # 容器编排配置
├─ .env.example               # 本地开发环境变量示例
├─ .env.production.example    # 生产环境变量示例
├─ DEPLOYMENT.md              # 生产部署手册
└─ README.md
```

## 3. 运行环境要求

- Node.js `>= 20`
- npm `>= 10`
- Docker `>= 24`（推荐）
- Docker Compose v2（`docker compose`）

## 4. 本地开发快速开始

1. 安装依赖

```bash
npm install
```

2. 复制环境变量模板

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

3. 按需修改 `.env`（至少改 `API_BASE_URL` 和 `API_KEY`）

4. 启动服务

```bash
npm run dev
```

5. 访问应用

- [http://localhost:3000](http://localhost:3000)

6. 健康检查

```bash
curl http://127.0.0.1:3000/healthz
```

## 5. 环境变量说明

下表覆盖当前项目常用变量（完整示例见 [`.env.example`](./.env.example) 和 [`.env.production.example`](./.env.production.example)）。

| 变量名 | 默认值 | 是否必改 | 说明 |
| --- | --- | --- | --- |
| `API_BASE_URL` | `https://api.example.com` | 是 | 上游模型接口地址 |
| `API_KEY` | `demo-key-change-me` | 是 | 上游模型接口密钥 |
| `ADMIN_USERNAME` | `admin` | 建议 | 初始管理员用户名 |
| `ADMIN_PASSWORD` | `demo-admin-password-change-me` | 是 | 初始管理员密码，生产必须改 |
| `SESSION_TTL_MS` | `28800000` | 否 | 会话有效期（毫秒），默认 8 小时 |
| `SESSION_COOKIE_SECURE` | `false`/生产建议 `true` | 是（生产） | 是否仅通过 HTTPS 发送会话 Cookie |
| `HOST` | `0.0.0.0` | 否 | 应用监听地址 |
| `PORT` | `3000` | 否 | 应用监听端口 |
| `RUNTIME_CONFIG_PATH` | `.runtime-config.json` 或 `/data/runtime-config.json` | 否 | 运行时模型配置文件 |
| `USERS_CONFIG_PATH` | `.runtime-users.json` 或 `/data/runtime-users.json` | 否 | 用户存储文件 |
| `ANNOUNCEMENTS_CONFIG_PATH` | `.runtime-announcements.json` 或 `/data/runtime-announcements.json` | 否 | 公告存储文件 |
| `MAX_STORED_ANNOUNCEMENTS` | `80` | 否 | 公告最大保留数量 |

## 6. Docker Compose 部署（推荐）

### 6.1 首次部署

```bash
cp .env.production.example .env.production
# 编辑 .env.production，至少修改 API_BASE_URL / API_KEY / ADMIN_PASSWORD

docker compose --env-file .env.production up -d --build
```

### 6.2 查看状态与日志

```bash
docker compose ps
docker compose logs -f ai-chat-web
```

### 6.3 验证服务

```bash
curl -fsS http://127.0.0.1:3000/healthz
```

返回 `status: ok` 即为正常。

## 7. 数据持久化与权限策略

当前默认采用 Docker 命名卷：

- `aichat-data:/data`

这样做的目的：

- 避免宿主机目录绑定带来的 UID/GID 权限冲突
- 避免 `EACCES: permission denied, open '/data/runtime-users.json'`
- 简化迁移和恢复

说明：如你必须使用宿主机路径挂载，请先阅读 [DEPLOYMENT.md](./DEPLOYMENT.md) 里的权限章节。

## 8. 常用命令

```bash
npm run dev
npm run start
npm run check
npm run docker:build
npm run docker:up
npm run docker:logs
npm run docker:down
```

## 9. API 路由概览

- 公共配置：`GET /api/config`
- 认证：
  - `GET /api/auth/status`
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
- 聊天：
  - `POST /api/chat`
  - `POST /api/chat/stream`
- 模型：`GET /api/models`
- 公告：`GET /api/announcements`
- 管理员：`/api/admin/*`
- 健康检查：`GET /healthz`

## 10. 生产上线检查清单

- 已修改生产密钥：`API_KEY`、`ADMIN_PASSWORD`
- `SESSION_COOKIE_SECURE=true`（配合 HTTPS）
- 可访问 `/healthz` 且返回 `status: ok`
- 管理员可以正常登录
- 模型连通性测试通过
- 普通用户可发送对话并获得响应
- `docker compose logs` 无持续报错

## 11. 安全建议

- 不要提交 `.env`、运行时数据文件、密钥相关内容到 Git
- 仅开放必要端口，建议通过 Nginx/Traefik 反代到 80/443
- 定期轮换 `API_KEY` 和管理员密码
- 建议对 `/api` 增加访问日志与告警

## 12. 文档索引

- 生产部署与排障手册：[`DEPLOYMENT.md`](./DEPLOYMENT.md)
## 会话持久化（跨设备）

- 登录用户的会话数据会持久化到服务端接口 `GET/PUT /api/conversations`，不再依赖浏览器 `localStorage`。
- 游客模式（未登录）仍使用本地临时会话。
- 新增环境变量：
  - `CONVERSATIONS_CONFIG_PATH`（默认：`.runtime-conversations.json`）
  - `MAX_STORED_CONVERSATIONS_PER_USER`（默认：`120`）


## 联网搜索（SearXNG）

项目已支持基于 SearXNG 的可选联网对话能力。开启后，后端会先检索网页结果，再把资料注入到对话上下文中发送给模型。

### 功能开关说明

- `WEB_SEARCH_SERVER_ENABLED`：后端总开关，默认 `true`。设为 `false` 时前端不显示联网按钮。
- `WEB_SEARCH_DEFAULT_ENABLED`：前端首次访问的默认状态，默认 `false`。
- 前端发送消息时会携带 `webEnabled`，后端据此决定本次请求是否联网检索。

说明：若浏览器本地已有用户手动切换记录，会优先使用本地记录；没有记录时，采用 `WEB_SEARCH_DEFAULT_ENABLED`。

### SearXNG 关键配置项

- `SEARXNG_BASE_URL`：SearXNG 服务地址。Docker Compose 场景建议 `http://searxng:8080`。
- `SEARXNG_FALLBACK_BASE_URL`：可选回退地址。主地址失败时会尝试该地址。
- `SEARXNG_SEARCH_PATH`：搜索路径，默认 `/search`。
- `SEARXNG_RESULT_COUNT`：每次注入上下文的最大结果条数，默认 `5`。
- `SEARXNG_TIMEOUT_MS`：SearXNG 请求超时（毫秒），默认 `12000`。
- `SEARXNG_USER_AGENT`：后端请求 SearXNG 的 UA 标识。
- `SEARXNG_LANGUAGE`：可选语言参数（留空表示由 SearXNG 默认策略决定）。
- `SEARXNG_SAFESEARCH`：可选安全搜索等级参数。
- `SEARXNG_SECRET`：SearXNG 密钥，必须修改，不能使用默认值。

### 仓库内置配置文件

仓库内已提供 SearXNG 配置目录（`./searxng`）：

- `searxng/settings.yml`
- `searxng/limiter.toml`

其中已包含以下默认策略：

- 开启 JSON 输出（`search.formats` 包含 `json`），用于后端 API 调用。
- 默认移除常见报错引擎（`ahmia`、`torch`、`wikidata`）。
- 默认关闭 limiter（`server.limiter: false`）。

### 快速自检（推荐）

1. 先确认应用侧连通状态（需登录态 Cookie）：

```bash
curl -b "<cookie>" "http://127.0.0.1:3000/api/web-search/status?q=openai"
```

返回 `connected: true` 表示应用到 SearXNG 链路正常。

2. Docker 场景建议用容器内地址验证，避免主机端口冲突误判：

```bash
docker compose exec ai-chat-web \
node -e "fetch('http://searxng:8080/search?q=openai&format=json').then(r=>r.text()).then(t=>console.log(t.slice(0,300)))"
```

提示：如果你在主机上访问 `http://127.0.0.1:8080` 得到的是其它系统页面（而非 SearXNG JSON），通常是端口被其他服务占用，不代表 Compose 内部 `searxng` 不可用。
