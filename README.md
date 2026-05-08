# AI Chat Web

一个基于 `Node.js + Express + 原生前端` 的 AI 对话 Web 项目，内置用户系统、管理员后台、模型配置、会话持久化、公告管理，以及基于 SearXNG 的可选联网搜索能力。

当前版本已经支持图文消息输入：用户可以在发送文本时附带图片，服务端会按 OpenAI 兼容的多模态消息格式组装请求，并保留会话历史中的图片附件。

## 功能概览

- 用户注册、登录、退出登录，基于 Cookie 维护会话
- 普通用户与管理员双角色
- 多会话聊天，登录用户会话持久化到服务端
- 普通回复和 SSE 流式回复
- 管理员可在页面内配置上游模型接口并测试连通性
- 管理员可管理用户与公告
- 可选联网搜索增强，支持 GitHub 链接直连解析和 SearXNG 搜索
- 支持图文消息
- 支持消息级删除
- 支持 Docker Compose 一键部署

## 本次文档重点同步

这次代码更新后，以下行为已经写入文档：

- 聊天输入框支持上传图片
- 单条消息最多上传 `3` 张图片
- 单张图片大小限制为 `2MB`
- 图片会以 `data:image/*` 形式随会话一起保存
- 服务端新增 `EXPRESS_JSON_LIMIT`，默认 `15mb`
- 用户和助手消息都支持在界面中单条删除
- 图片消息支持列表预览与大图预览

## 技术栈

- 服务端：`Node.js 20`、`Express`
- 前端：原生 `HTML / CSS / JavaScript`
- Markdown 渲染：`marked`
- 输出净化：`DOMPurify`
- 配置管理：`dotenv`
- 部署：`Docker`、`Docker Compose`

## 目录结构

```text
.
├─ public/
│  ├─ index.html
│  ├─ styles.css
│  └─ scripts/
│     ├─ app-shell.js
│     ├─ chat-render.js
│     └─ app-actions.js
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

### 3. 配置最小必填项

至少确认以下变量：

- `API_BASE_URL`
- `API_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

本地开发通常建议保持：

- `SESSION_COOKIE_SECURE=false`
- `WEB_SEARCH_DEFAULT_ENABLED=false`
- `EXPRESS_JSON_LIMIT=15mb`

如果本地没有部署 SearXNG，也可以先只验证聊天主流程。

### 4. 启动项目

```bash
npm run dev
```

默认访问地址：

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
  "status": "ok",
  "timestamp": "2026-05-08T00:00:00.000Z",
  "uptimeSeconds": 12
}
```

## 图文消息说明

当前前后端已经支持多模态消息拼装，行为如下：

- 用户消息可以只发文字、只发图片，或文字加图片一起发
- 前端上传按钮支持一次选择多张图片
- 每条消息最多 `3` 张图片
- 单张图片最大 `2MB`
- 发送时，用户消息会被转换为 OpenAI 兼容格式：
  - 文本部分：`{ type: "text", text: "..." }`
  - 图片部分：`{ type: "image_url", image_url: { url, detail: "auto" } }`
- 服务端会校验消息结构，只接受文本或合法图片 URL / `data:image/*`
- 为避免请求体过小导致失败，服务端 JSON Body 限制改为可配置的 `EXPRESS_JSON_LIMIT`

如果你计划允许更大的图片、更多图片或更长历史会话，需要同步调整：

- 前端上传限制
- `EXPRESS_JSON_LIMIT`
- 会话持久化体积
- 反向代理的请求体大小限制

## 会话与数据持久化

### 默认数据文件

本地开发默认写入项目根目录：

- `.runtime-config.json`
- `.runtime-users.json`
- `.runtime-announcements.json`
- `.runtime-conversations.json`

生产环境默认写入 `/data` 卷：

- `/data/runtime-config.json`
- `/data/runtime-users.json`
- `/data/runtime-announcements.json`
- `/data/runtime-conversations.json`

### 会话规则

- 未登录用户的聊天状态保存在浏览器本地
- 登录用户的会话通过服务端接口持久化
- 会话标题会优先取第一条用户消息
- 如果第一条消息只有图片，没有文本，会自动命名为“图片对话”

## 联网搜索说明

项目支持可选联网搜索增强，流程如下：

1. 前端发送消息时附带 `webEnabled`
2. 服务端根据运行时配置判断是否开启联网
3. 优先尝试解析 GitHub 仓库链接
4. 不足部分再通过 SearXNG 拉取搜索结果
5. 对部分结果抓取正文并重排
6. 将整理后的上下文注入模型请求

如果联网失败且开启了失败提示，服务端会向模型显式注入“本次未成功联网”的提示，避免伪造来源。

## 环境变量

完整模板见：

- [`.env.example`](./.env.example)
- [`.env.production.example`](./.env.production.example)

### 核心变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `API_BASE_URL` | 上游 OpenAI 兼容接口地址 | `https://api.example.com` |
| `API_KEY` | 上游接口密钥 | `demo-key-change-me` |
| `ADMIN_USERNAME` | 默认管理员用户名 | `admin` |
| `ADMIN_PASSWORD` | 默认管理员密码 | `demo-admin-password-change-me` |
| `HOST` | 服务监听地址 | `0.0.0.0` |
| `PORT` | 服务监听端口 | `3000` |
| `EXPRESS_JSON_LIMIT` | JSON 请求体大小限制 | `15mb` |

### 会话与安全

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `SESSION_TTL_MS` | 登录会话有效期，单位毫秒 | `28800000` |
| `SESSION_COOKIE_SECURE` | 是否仅在 HTTPS 下发送 Cookie | 本地常用 `false`，生产建议 `true` |

### 持久化

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `RUNTIME_CONFIG_PATH` | 运行时模型配置文件 | `.runtime-config.json` |
| `USERS_CONFIG_PATH` | 用户数据文件 | `.runtime-users.json` |
| `ANNOUNCEMENTS_CONFIG_PATH` | 公告数据文件 | `.runtime-announcements.json` |
| `CONVERSATIONS_CONFIG_PATH` | 会话数据文件 | `.runtime-conversations.json` |
| `MAX_STORED_ANNOUNCEMENTS` | 最大公告保留数 | `80` |
| `MAX_STORED_CONVERSATIONS_PER_USER` | 每个用户最大会话数 | `120` |

### 联网搜索

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `WEB_SEARCH_SERVER_ENABLED` | 服务端联网总开关 | `true` |
| `WEB_SEARCH_DEFAULT_ENABLED` | 前端首次加载时的默认联网状态 | `false` |
| `WEB_SEARCH_DIRECT_URL_ENABLED` | 是否启用 GitHub 链接直连解析 | `true` |
| `WEB_SEARCH_MAX_QUERIES` | 单次最多派生多少搜索查询 | `3` |
| `WEB_SEARCH_FETCH_PAGE_COUNT` | 最多抓取多少个结果正文 | `3` |
| `WEB_SEARCH_PAGE_TIMEOUT_MS` | 单页正文抓取超时 | `8000` |
| `WEB_SEARCH_MIN_SCORE` | 结果筛选最低分 | `0.12` |
| `WEB_SEARCH_FAILURE_NOTICE_ENABLED` | 联网失败时是否注入显式提示 | `true` |

### SearXNG

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `SEARXNG_BASE_URL` | SearXNG 服务地址 | `http://127.0.0.1:8080` |
| `SEARXNG_FALLBACK_BASE_URL` | 备用 SearXNG 地址 | 空 |
| `SEARXNG_SEARCH_PATH` | 搜索路径 | `/search` |
| `SEARXNG_RESULT_COUNT` | 单次使用的最大结果数 | `5` |
| `SEARXNG_TIMEOUT_MS` | 搜索请求超时 | `12000` |
| `SEARXNG_USER_AGENT` | 搜索和页面抓取时使用的 User-Agent | 内置默认值 |
| `SEARXNG_LANGUAGE` | 语言参数 | 空 |
| `SEARXNG_SAFESEARCH` | 安全搜索参数 | 空 |
| `SEARXNG_INSTANCE_NAME` | Compose 中 SearXNG 实例名 | `aichat-searxng` |
| `SEARXNG_PUBLIC_BASE_URL` | SearXNG 对外公开地址 | `http://localhost:8080/` |
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

- 除 `GET /api/config`、`GET /healthz` 和认证入口外，主要聊天能力依赖登录态
- 管理员接口统一位于 `/api/admin/*`

## Docker 快速部署

如果你想直接使用容器运行：

```bash
cp .env.production.example .env.production
docker compose --env-file .env.production up -d --build
```

更完整的生产部署、升级、备份与排障说明见：

- [DEPLOYMENT.md](./DEPLOYMENT.md)

## 开发建议

- 不要提交 `.env`、运行时数据文件和真实密钥
- 生产环境务必修改 `API_KEY`、`ADMIN_PASSWORD`、`SEARXNG_SECRET`
- 如果启用了 HTTPS，请确保 `SESSION_COOKIE_SECURE=true`
- 如果准备上线图文消息，记得同步检查反向代理的请求体限制

## 文档索引

- 项目概览与本地开发：[`README.md`](./README.md)
- 生产部署与运维：[`DEPLOYMENT.md`](./DEPLOYMENT.md)
