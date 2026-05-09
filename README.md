# AI Chat

一个基于 `Node.js + Express + 原生前端` 的 AI 对话与图片生成项目，内置用户系统、管理员后台、多接口模型配置、会话持久化、公告管理，以及可选的联网搜索能力。

项目当前的设计重点有三件事：

- 尽量保持部署简单，不依赖数据库即可运行
- 让管理员可以在页面内直接维护模型接口配置
- 同时支持聊天、图文消息和图片生成

## 功能概览

- 用户注册、登录、退出登录，使用 Cookie 维持会话
- 普通用户与管理员双角色
- 多会话聊天，登录用户的会话持久化到服务端
- 聊天支持普通响应与 SSE 流式响应
- 支持图文消息输入
- 支持图片生成
- 管理员可在模型中心维护多个上游 API 接口
- 接口支持启用/禁用，测试连通性时只测试启用接口
- 管理员可管理用户与公告
- 可选联网搜索增强，支持 GitHub 仓库直连解析和 SearXNG 搜索

## 当前行为说明

### 聊天

- 发送消息前需要登录
- 支持文字消息、带图片的消息，以及只发送图片
- 单条消息最多上传 `3` 张图片
- 单张图片最大 `2MB`
- 图片会以 `data:image/*` 的形式跟随会话一起保存

### 图片生成

- 图片生成页未登录也可以查看
- 真正点击“生成图片”时需要登录
- 可从当前启用接口中识别可用的生图模型
- 生图模型按“接口来源 + 模型 ID”区分，不会再强制切回默认模型
- 图片结果目前不会落盘到本地文件
  - 上游如果返回远程 URL，前端直接使用远程 URL 展示
  - 上游如果返回 `b64_json`，服务端会转成 `data URL` 后返回前端
- 图片生成结果只保存在当前前端运行期的账户隔离会话里，不写入服务端会话文件

### 模型中心

- 仅管理员可进入
- 支持多个 API 接口卡片
- 每个接口都可以单独设置：
  - 接口名称
  - `API Base URL`
  - `API Key`
  - 是否启用
- `API Base URL` 必须填写到版本层，例如：
  - `https://example.com/v1`
  - `https://example.com/v3`

## 技术栈

- 服务端：`Node.js 20`、`Express`
- 前端：原生 `HTML / CSS / JavaScript`
- Markdown 渲染：`marked`
- HTML 清洗：`DOMPurify`
- 配置加载：`dotenv`
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
│     ├─ app-actions.js
│     └─ app-overrides.js
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

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

Linux / macOS：

```bash
cp .env.example .env
```

### 3. 最少需要确认的配置

至少确认以下变量：

- `API_BASE_URL`
- `API_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

注意：

- `API_BASE_URL` 必须带版本层，例如 `https://api.example.com/v1`
- 本地如果使用 HTTP，请保持 `SESSION_COOKIE_SECURE=false`
- 本地图文消息建议保留 `EXPRESS_JSON_LIMIT=15mb`

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

示例返回：

```json
{
  "status": "ok",
  "timestamp": "2026-05-09T00:00:00.000Z",
  "uptimeSeconds": 12
}
```

## 配置说明

完整配置模板见：

- [`.env.example`](./.env.example)
- [`.env.production.example`](./.env.production.example)

下面只列最常用、最关键的配置项。

### 上游模型接口

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `API_BASE_URL` | 默认上游接口地址，必须写到版本层 | `https://api.example.com/v1` |
| `API_KEY` | 默认上游接口密钥 | `demo-key-change-me` |

说明：

- 这两个变量只用于初始化默认接口
- 真正运行后，管理员可以在模型中心里维护多个接口

### 管理员与安全

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `ADMIN_USERNAME` | 默认管理员用户名 | `admin` |
| `ADMIN_PASSWORD` | 默认管理员密码 | `demo-admin-password-change-me` |
| `SESSION_TTL_MS` | 登录会话有效期，单位毫秒 | `28800000` |
| `SESSION_COOKIE_SECURE` | 是否只在 HTTPS 下发送 Cookie | 本地常用 `false`，生产建议 `true` |

### HTTP 与请求体

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `HOST` | 服务监听地址 | `0.0.0.0` |
| `PORT` | 服务监听端口 | `3000` |
| `EXPRESS_JSON_LIMIT` | JSON 请求体大小限制 | `15mb` |

### 持久化

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `RUNTIME_CONFIG_PATH` | 运行时接口配置文件 | `.runtime-config.json` 或 `/data/runtime-config.json` |
| `USERS_CONFIG_PATH` | 用户数据文件 | `.runtime-users.json` 或 `/data/runtime-users.json` |
| `ANNOUNCEMENTS_CONFIG_PATH` | 公告数据文件 | `.runtime-announcements.json` 或 `/data/runtime-announcements.json` |
| `CONVERSATIONS_CONFIG_PATH` | 会话数据文件 | `.runtime-conversations.json` 或 `/data/runtime-conversations.json` |
| `MAX_STORED_ANNOUNCEMENTS` | 最多保留公告数量 | `80` |
| `MAX_STORED_CONVERSATIONS_PER_USER` | 每个用户最多保留会话数量 | `120` |
| `MAX_MESSAGES_PER_CONVERSATION` | 单个会话最多保留消息数 | `320` |

### 联网搜索

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `WEB_SEARCH_SERVER_ENABLED` | 服务端联网搜索总开关 | `true` |
| `WEB_SEARCH_DEFAULT_ENABLED` | 前端首次加载时的默认状态 | `false` |
| `WEB_SEARCH_DIRECT_URL_ENABLED` | 是否启用 GitHub 链接直连解析 | `true` |
| `WEB_SEARCH_MAX_QUERIES` | 单次最多派生查询数 | `3` |
| `WEB_SEARCH_FETCH_PAGE_COUNT` | 最多抓取正文页面数 | `3` |
| `WEB_SEARCH_PAGE_TIMEOUT_MS` | 单页正文抓取超时 | `8000` |
| `WEB_SEARCH_MIN_SCORE` | 搜索结果筛选最低分 | `0.12` |
| `WEB_SEARCH_FAILURE_NOTICE_ENABLED` | 联网失败时是否显式提示模型 | `true` |

### SearXNG

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `SEARXNG_BASE_URL` | 应用访问 SearXNG 的地址 | `http://127.0.0.1:8080` 或容器内 `http://searxng:8080` |
| `SEARXNG_FALLBACK_BASE_URL` | 备用 SearXNG 地址 | 空 |
| `SEARXNG_SEARCH_PATH` | 搜索路径 | `/search` |
| `SEARXNG_RESULT_COUNT` | 单次保留结果数量 | `5` |
| `SEARXNG_TIMEOUT_MS` | 搜索超时 | `12000` |
| `SEARXNG_LANGUAGE` | 可选语言参数 | 空 |
| `SEARXNG_SAFESEARCH` | 可选安全搜索参数 | 空 |
| `SEARXNG_USER_AGENT` | 搜索与抓取页面时使用的 User-Agent | 内置默认值 |
| `GITHUB_API_BASE_URL` | GitHub API 地址 | `https://api.github.com` |

## 数据文件说明

### 本地开发默认文件

- `.runtime-config.json`
- `.runtime-users.json`
- `.runtime-announcements.json`
- `.runtime-conversations.json`

### Docker / 生产环境默认文件

- `/data/runtime-config.json`
- `/data/runtime-users.json`
- `/data/runtime-announcements.json`
- `/data/runtime-conversations.json`

说明：

- 登录用户的聊天会话会写入 `runtime-conversations.json`
- 游客会话保存在浏览器本地
- 图片生成结果不写入这些服务端持久化文件

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

## API 一览

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

### 图片生成接口

- `POST /api/images/generations`

### 模型接口

- `GET /api/models`

### 会话接口

- `GET /api/conversations`
- `PUT /api/conversations`

### 公告接口

- `GET /api/announcements`

### 联网状态接口

- `GET /api/web-search/status`

### 管理员接口

- `GET /api/admin/config`
- `POST /api/admin/config`
- `POST /api/admin/config/test`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/announcements`
- `POST /api/admin/announcements`
- `DELETE /api/admin/announcements/:id`

## 开发与上线注意事项

- 不要提交 `.env`、`.env.production`、运行时数据文件和真实密钥
- 生产环境必须修改：
  - `API_KEY`
  - `ADMIN_PASSWORD`
  - `SEARXNG_SECRET`
- 如果站点通过 HTTPS 对外访问，请确保：
  - `SESSION_COOKIE_SECURE=true`
- 如果计划放宽图片上传限制，请同步检查：
  - 前端限制
  - `EXPRESS_JSON_LIMIT`
  - 反向代理的请求体大小限制
  - 会话持久化文件体积

## 部署文档

生产部署、升级、备份、回滚与排障说明见：

- [DEPLOYMENT.md](./DEPLOYMENT.md)
