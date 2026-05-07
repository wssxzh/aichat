# AI Chat Web

一个基于 `Node.js + Express + 原生前端` 的 AI 对话 Web 项目。

项目内置了完整的用户体系、管理员后台、模型接口配置、会话持久化、公告管理，以及基于 SearXNG 的可选联网搜索能力。当前版本已经完成服务端与前端的结构化重构，入口保持不变，但代码层次更清晰，便于继续维护和扩展。

## 项目特性

- 支持用户注册、登录、登出和基于 Cookie 的会话鉴权
- 支持普通用户与管理员两种角色
- 支持多会话聊天与登录用户跨设备会话持久化
- 支持普通请求和 SSE 流式对话输出
- 支持管理员在页面内配置模型接口地址与密钥
- 支持管理员管理用户与发布公告
- 支持基于 SearXNG 的联网搜索增强
- 支持 Docker Compose 一键部署

## 技术栈

- 服务端：`Node.js 20`、`Express`
- 前端：原生 `HTML / CSS / JavaScript`
- 配置管理：`dotenv`
- Markdown 渲染：`marked`
- 输出净化：`DOMPurify`
- 容器化：`Docker`、`Docker Compose`

## 当前架构

### 服务端分层

- `server.js`
  根启动入口，只负责启动应用
- `src/server/index.js`
  依赖装配与服务启动
- `src/server/app.js`
  Express 应用创建、静态资源挂载、兜底路由、全局错误处理
- `src/server/config/`
  环境变量与运行参数
- `src/server/routes/`
  API 路由注册
- `src/server/services/`
  认证、聊天、联网搜索、HTTP 请求等业务能力
- `src/server/stores/`
  运行时配置、用户、公告、会话等持久化读写

### 前端分层

- `public/index.html`
  页面入口
- `public/styles.css`
  全局样式
- `public/scripts/app-shell.js`
  页面骨架、状态、基础工具与 UI 外壳逻辑
- `public/scripts/chat-render.js`
  聊天区渲染与消息交互
- `public/scripts/app-actions.js`
  页面动作、请求调用、启动流程

## 目录结构

```text
.
├─ public/
│  ├─ index.html
│  ├─ styles.css
│  ├─ scripts/
│  │  ├─ app-shell.js
│  │  ├─ chat-render.js
│  │  └─ app-actions.js
│  └─ vendor/
├─ searxng/
├─ src/
│  └─ server/
│     ├─ app.js
│     ├─ index.js
│     ├─ config/
│     ├─ routes/
│     ├─ services/
│     └─ stores/
├─ server.js
├─ Dockerfile
├─ docker-compose.yml
├─ .env.example
├─ .env.production.example
├─ README.md
└─ DEPLOYMENT.md
```

## 运行要求

- `Node.js >= 20`
- `npm >= 10`
- 可选：`Docker >= 24`
- 可选：`Docker Compose v2`

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 准备环境变量

PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux / macOS:

```bash
cp .env.example .env
```

### 3. 修改最基本配置

至少确认以下变量：

- `API_BASE_URL`
- `API_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

本地开发通常建议保持：

- `SESSION_COOKIE_SECURE=false`
- `WEB_SEARCH_DEFAULT_ENABLED=false`

如果本地没有部署 SearXNG，也可以继续开发聊天主流程。联网搜索默认关闭，不会影响基本对话功能。

### 4. 启动项目

```bash
npm run dev
```

启动后访问：

- [http://localhost:3000](http://localhost:3000)

### 5. 语法检查

```bash
npm run check
```

### 6. 健康检查

```bash
curl http://127.0.0.1:3000/healthz
```

正常返回示例：

```json
{
  "status": "ok"
}
```

## 运行机制说明

### 用户与管理员

- 项目启动时会根据 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 自动保证默认管理员存在
- 普通用户可以注册并登录
- 管理员可以在页面内完成：
  - 模型接口配置
  - 模型连通性测试
  - 用户管理
  - 公告发布与删除

### 会话持久化

- 未登录用户的会话保存在浏览器本地
- 已登录用户的会话通过服务端接口持久化
- 默认持久化文件：
  - `.runtime-config.json`
  - `.runtime-users.json`
  - `.runtime-announcements.json`
  - `.runtime-conversations.json`

### 联网搜索

项目支持可选联网搜索增强。

工作方式：

1. 前端在发送消息时附带 `webEnabled`
2. 服务端根据配置决定是否启用联网
3. 服务端优先尝试 GitHub 链接直连解析
4. 再通过 SearXNG 拉取搜索结果
5. 对部分页面抓取正文摘要并重排结果
6. 将整理后的上下文注入模型请求

如果联网失败且开启了失败提示，服务端会明确告诉模型“本次未成功联网”，避免伪造来源。

## 环境变量

完整示例请参考：

- [`.env.example`](./.env.example)
- [`.env.production.example`](./.env.production.example)

### 核心变量

| 变量 | 说明 | 本地默认 |
| --- | --- | --- |
| `API_BASE_URL` | 上游模型接口地址 | `https://api.example.com` |
| `API_KEY` | 上游模型接口密钥 | `demo-key-change-me` |
| `ADMIN_USERNAME` | 默认管理员用户名 | `admin` |
| `ADMIN_PASSWORD` | 默认管理员密码 | `demo-admin-password-change-me` |
| `HOST` | 服务监听地址 | `0.0.0.0` |
| `PORT` | 服务监听端口 | `3000` |

### 会话与安全

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `SESSION_TTL_MS` | 登录会话有效期，单位毫秒 | `28800000` |
| `SESSION_COOKIE_SECURE` | 是否只在 HTTPS 下发送会话 Cookie | 本地 `false`，生产建议 `true` |

### 数据持久化

| 变量 | 说明 | 本地默认 |
| --- | --- | --- |
| `RUNTIME_CONFIG_PATH` | 运行时模型配置文件 | `.runtime-config.json` |
| `USERS_CONFIG_PATH` | 用户数据文件 | `.runtime-users.json` |
| `ANNOUNCEMENTS_CONFIG_PATH` | 公告数据文件 | `.runtime-announcements.json` |
| `CONVERSATIONS_CONFIG_PATH` | 会话数据文件 | `.runtime-conversations.json` |
| `MAX_STORED_ANNOUNCEMENTS` | 公告最大保留数量 | `80` |
| `MAX_STORED_CONVERSATIONS_PER_USER` | 每个用户最大会话数 | `120` |

### 联网搜索相关

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `WEB_SEARCH_SERVER_ENABLED` | 服务端联网功能总开关 | `true` |
| `WEB_SEARCH_DEFAULT_ENABLED` | 前端默认是否开启联网 | `false` |
| `WEB_SEARCH_DIRECT_URL_ENABLED` | 是否启用 GitHub 链接直连解析 | `true` |
| `WEB_SEARCH_MAX_QUERIES` | 单次最大搜索变体数 | `3` |
| `WEB_SEARCH_FETCH_PAGE_COUNT` | 抓取正文的最大页面数 | `3` |
| `WEB_SEARCH_PAGE_TIMEOUT_MS` | 页面抓取超时 | `8000` |
| `WEB_SEARCH_MIN_SCORE` | 搜索结果最低筛选分数 | `0.12` |
| `WEB_SEARCH_FAILURE_NOTICE_ENABLED` | 联网失败时是否注入明确提示 | `true` |

### SearXNG 相关

| 变量 | 说明 | 本地默认 |
| --- | --- | --- |
| `SEARXNG_BASE_URL` | SearXNG 服务地址 | `http://127.0.0.1:8080` |
| `SEARXNG_FALLBACK_BASE_URL` | 备用 SearXNG 地址 | 空 |
| `SEARXNG_SEARCH_PATH` | 搜索路径 | `/search` |
| `SEARXNG_RESULT_COUNT` | 每次使用的最大结果数 | `5` |
| `SEARXNG_TIMEOUT_MS` | 搜索请求超时 | `12000` |
| `SEARXNG_USER_AGENT` | 搜索请求的 User-Agent | 已内置 |
| `SEARXNG_LANGUAGE` | 语言参数 | 空 |
| `SEARXNG_SAFESEARCH` | 安全搜索参数 | 空 |
| `SEARXNG_INSTANCE_NAME` | Compose 中 SearXNG 实例名 | `aichat-searxng` |
| `SEARXNG_PUBLIC_BASE_URL` | SearXNG 对外地址 | `http://localhost:8080/` |
| `SEARXNG_SECRET` | SearXNG 密钥 | 必须修改 |
| `GITHUB_API_BASE_URL` | GitHub API 地址 | `https://api.github.com` |

## 常用命令

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

### 公共接口

- `GET /api/config`
- `GET /healthz`

### 认证接口

- `GET /api/auth/status`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### 聊天接口

- `POST /api/chat`
- `POST /api/chat/stream`

### 模型接口

- `GET /api/models`

### 会话接口

- `GET /api/conversations`
- `PUT /api/conversations`

### 公告接口

- `GET /api/announcements`

### 联网状态接口

- `GET /api/web-search/status`

说明：

- 联网状态接口需要登录后访问
- 管理员接口统一位于 `/api/admin/*`

## Docker 快速部署

如果你想直接以容器运行：

```bash
cp .env.production.example .env.production
docker compose --env-file .env.production up -d --build
```

更多生产部署、备份、升级、回滚与排障内容，请看：

- [DEPLOYMENT.md](./DEPLOYMENT.md)

## 开发建议

- 不要把 `.env`、运行时数据文件和真实密钥提交到版本库
- 生产环境务必修改 `API_KEY`、`ADMIN_PASSWORD`、`SEARXNG_SECRET`
- 生产环境建议启用 HTTPS，并设置 `SESSION_COOKIE_SECURE=true`
- 如果后续继续扩展功能，建议把 `register-api-routes.js` 进一步拆成多个领域路由文件

## 文档索引

- 项目总览与本地开发：[`README.md`](./README.md)
- 生产部署与运维：[`DEPLOYMENT.md`](./DEPLOYMENT.md)
