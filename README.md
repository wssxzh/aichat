# AI Chat

一个基于 `Node.js + Express + 原生前端` 的多用户 AI 对话应用，支持多上游 API、图片生成、会话持久化、公告管理、工作区文件检索增强，以及可选的联网搜索。

这份文档按当前仓库实现重写，内容以 `src/server`、`public/scripts`、`.env.example` 和 `docker-compose.yml` 的现状为准。

## 项目概览

- 普通用户可注册、登录、创建多会话并进行 AI 对话
- 管理员可维护多个 API 接口、测试连通性、管理用户、发布公告
- 会话支持图片附件输入，并支持 SSE 流式回复
- 图片生成能力来自当前启用接口中识别到的生图模型
- 每个对话都可以上传独立的工作区文件，回答时会先做文件检索增强
- 可选接入 SearXNG 做联网搜索，也支持对 GitHub 仓库链接直连解析
- 后端不依赖数据库，运行时数据默认落盘到 JSON 文件

## 当前功能

### 用户侧

- 用户注册、登录、退出登录
- 多会话聊天，支持会话标题自动生成、固定、删除
- 聊天消息支持最多 3 张图片附件
- 图片附件单张默认不超过 `2MB`
- 对话支持系统提示词和 `temperature`
- 支持普通请求和 `/api/chat/stream` 流式请求
- 登录后可使用图片生成页
- 登录后可为当前对话上传工作区文件并参与回答

### 管理侧

- 自动创建默认管理员账号
- 管理多个上游 API 配置
- 启用/禁用单个接口
- 测试全部已启用接口的模型可用性
- 管理用户角色、密码、禁用状态
- 发布和删除公告

### 联网与检索

- Web Search 开关可由前端单独控制
- 支持 SearXNG 搜索结果聚合
- 查询中包含 GitHub 仓库链接时，会优先调用 GitHub API 获取仓库信息和 README 摘要
- 搜索结果会在请求模型前注入为系统上下文
- 工作区文件会在请求模型前做检索命中，再注入为系统上下文

## 角色与权限

| 功能 | 游客 | 普通用户 | 管理员 |
| --- | --- | --- | --- |
| 查看首页与模型列表 | 支持 | 支持 | 支持 |
| 注册 / 登录 | 支持 | 支持 | 支持 |
| AI 对话 | 不支持 | 支持 | 支持 |
| 图片生成 | 不支持 | 支持 | 支持 |
| 工作区文件上传 / 删除 | 不支持 | 支持 | 支持 |
| 查看最新公告 | 不支持 | 支持 | 支持 |
| 模型中心 | 不支持 | 不支持 | 支持 |
| 用户管理 | 不支持 | 不支持 | 支持 |
| 公告发布 | 不支持 | 不支持 | 支持 |

补充说明：

- 游客可以先浏览界面和模型列表，但不能真正发起聊天或生图请求
- 所有聊天、生图、工作区、公告接口都要求登录
- 管理接口全部要求管理员权限

## 技术栈

- 后端：`Node.js 20`、`Express`
- 前端：原生 `HTML / CSS / JavaScript`
- Markdown 渲染：`marked`
- HTML 清洗：`DOMPurify`
- 文件解析：`pdf-parse`、`mammoth`、`xlsx`
- 文件上传：`multer`
- 配置加载：`dotenv`
- 部署：`Docker`、`Docker Compose`

## 目录结构

```text
.
├─ public/
│  ├─ index.html
│  ├─ styles.css
│  ├─ scripts/
│  │  ├─ app-shell.js
│  │  ├─ app-actions.js
│  │  ├─ app-overrides.js
│  │  └─ chat-render.js
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
├─ data/
│  └─ workspaces/           # 本地默认工作区目录
├─ server.js
├─ Dockerfile
├─ docker-compose.yml
├─ .env.example
├─ .env.production.example
├─ README.md
└─ DEPLOYMENT.md
```

## 上游接口要求

当前应用默认对接 OpenAI 兼容接口，至少需要：

- `GET /models`
- `POST /chat/completions`

如果要使用图片生成，还需要：

- `POST /images/generations`

注意：

- `API_BASE_URL` 必须写到版本层，例如 `https://api.example.com/v1`
- 图片模型不是单独配置的，而是从 `/models` 返回的模型列表里按名称和描述做能力识别
- 当启用多个 API 时，前端会自动记录 `sourceApiId`，以避免同名模型串线

## 本地开发

### 1. 环境要求

- `Node.js >= 20`
- `npm >= 10`
- 可选：`Docker >= 24`
- 可选：`Docker Compose v2`

### 2. 安装依赖

```bash
npm install
```

### 3. 准备环境变量

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

Linux / macOS：

```bash
cp .env.example .env
```

至少确认以下变量：

- `API_BASE_URL`
- `API_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

如果你本地没有运行 SearXNG，又暂时不需要联网搜索，建议把：

```env
WEB_SEARCH_SERVER_ENABLED=false
```

### 4. 启动项目

```bash
npm run dev
```

默认地址：

- [http://localhost:3000](http://localhost:3000)

### 5. 健康检查

```bash
curl http://127.0.0.1:3000/healthz
```

期望返回：

```json
{
  "status": "ok",
  "timestamp": "2026-05-13T00:00:00.000Z",
  "uptimeSeconds": 12
}
```

## 当前实现说明

### 1. 多 API 配置

- 运行时配置保存在 `RUNTIME_CONFIG_PATH`
- 当前版本支持维护多个 API 接口
- 模型中心里的多接口编辑器由前端脚本动态渲染，不是静态写死在 `index.html`
- 只有启用中的接口会参与模型拉取、聊天和图片生成
- 如果启用了多个接口，前端会把 `modelId + sourceApiId` 一起保存到会话

### 2. 聊天

- 真正发送消息前必须登录
- 聊天接口为 `POST /api/chat` 和 `POST /api/chat/stream`
- 流式接口会原样透传上游 SSE 数据
- 前端允许只发图片、只发文字，或图文混发
- 服务端会校验消息结构和附件 URL 格式

### 3. 图片生成

- 只有登录用户可使用
- 生图模型来自 `/api/models` 返回结果中的能力识别
- 返回远程图片 URL 时前端直接展示
- 返回 `b64_json` 时后端会转成 `data URL`
- 生图结果只保存在当前浏览器会话对应的前端状态中，不写入后端持久化文件

### 4. 工作区文件检索

每个对话都可以挂载自己的工作区文件，当前支持：

- `.txt`
- `.md`
- `.markdown`
- `.pdf`
- `.docx`
- `.csv`
- `.xlsx`
- `.xls`
- `.json`

默认限制：

- 每个对话最多 `20` 个工作区文件
- 单次上传最多 `5` 个文件
- 单个文件最大 `10MB`

检索流程：

1. 上传时先解析文本并切块
2. 索引写入当前对话工作区目录的 `index.json`
3. 用户发送消息时，对最后一条用户问题做关键词匹配
4. 命中的文件片段会作为系统消息插入到最新用户消息之前

默认检索参数：

- 切块大小：`1100`
- 切块重叠：`180`
- 单文件最多索引块：`80`
- 单次最多注入 `6` 个命中片段

### 5. 联网搜索

- 服务端总开关由 `WEB_SEARCH_SERVER_ENABLED` 控制
- 前端默认开关由 `WEB_SEARCH_DEFAULT_ENABLED` 控制
- 启用 Web 后，系统会优先尝试：
  - GitHub 仓库链接直连解析
  - SearXNG 查询
  - 可选页面正文抓取补全文本
- 搜索失败时，如果 `WEB_SEARCH_FAILURE_NOTICE_ENABLED=true`，会明确告诉模型“本次未成功联网”

### 6. 用户与公告

- 默认管理员在启动时自动确保存在
- 用户名支持中文、字母、数字、下划线、中划线，长度 `3-24`
- 密码长度要求 `6-64`
- 系统会强制保留至少一个可用管理员账号
- 不能禁用或删除当前登录账号
- 登录用户只会读取最新一条公告作为弹窗提示

## 数据持久化

### 本地开发默认文件

- `.runtime-config.json`
- `.runtime-users.json`
- `.runtime-announcements.json`
- `.runtime-conversations.json`
- `data/workspaces/`

### Docker / 生产环境推荐路径

- `/data/runtime-config.json`
- `/data/runtime-users.json`
- `/data/runtime-announcements.json`
- `/data/runtime-conversations.json`
- `/data/workspaces/`

### 持久化行为

- 登录用户的会话历史保存在 `CONVERSATIONS_CONFIG_PATH`
- 游客会话只保存在浏览器本地
- 工作区文件与索引保存在 `WORKSPACES_ROOT_DIR`
- 公告保存在 `ANNOUNCEMENTS_CONFIG_PATH`
- 用户列表保存在 `USERS_CONFIG_PATH`
- 运行时 API 配置保存在 `RUNTIME_CONFIG_PATH`

## 常用环境变量

完整模板请看：

- [`.env.example`](./.env.example)
- [`.env.production.example`](./.env.production.example)

### 上游模型接口

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `API_BASE_URL` | 默认上游接口地址，必须带版本层 | `https://api.example.com/v1` |
| `API_KEY` | 默认上游接口密钥 | `demo-key-change-me` |

### HTTP 与会话

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `HOST` | 服务监听地址 | `0.0.0.0` |
| `PORT` | 服务端口 | `3000` |
| `EXPRESS_JSON_LIMIT` | JSON 请求体大小限制 | `15mb` |
| `SESSION_TTL_MS` | 登录会话有效期 | `28800000` |
| `SESSION_COOKIE_SECURE` | 是否仅在 HTTPS 下发送 Cookie | 本地常用 `false`，生产建议 `true` |
| `ADMIN_USERNAME` | 默认管理员用户名 | `admin` |
| `ADMIN_PASSWORD` | 默认管理员密码 | `demo-admin-password-change-me` |

### 运行时数据与会话存储

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `RUNTIME_CONFIG_PATH` | 运行时 API 配置文件 | 本地 `.runtime-config.json` |
| `USERS_CONFIG_PATH` | 用户数据文件 | 本地 `.runtime-users.json` |
| `ANNOUNCEMENTS_CONFIG_PATH` | 公告数据文件 | 本地 `.runtime-announcements.json` |
| `CONVERSATIONS_CONFIG_PATH` | 会话数据文件 | 本地 `.runtime-conversations.json` |
| `WORKSPACES_ROOT_DIR` | 工作区根目录 | 本地 `data/workspaces` |
| `MAX_STORED_ANNOUNCEMENTS` | 最多保留公告数 | `80` |
| `MAX_STORED_CONVERSATIONS_PER_USER` | 每个用户最多保留对话数 | `120` |
| `MAX_MESSAGES_PER_CONVERSATION` | 单对话最多消息数 | `320` |
| `MAX_CONVERSATION_MESSAGE_LENGTH` | 单条消息文本长度上限 | `12000` |
| `MAX_CONVERSATION_SYSTEM_PROMPT_LENGTH` | 系统提示词长度上限 | `6000` |

### 工作区检索

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `MAX_WORKSPACE_FILES_PER_CONVERSATION` | 单对话最多文件数 | `20` |
| `MAX_WORKSPACE_FILES_PER_REQUEST` | 单次上传最多文件数 | `5` |
| `MAX_WORKSPACE_FILE_SIZE_BYTES` | 单文件大小上限 | `10485760` |
| `WORKSPACE_CHUNK_SIZE` | 文本切块大小 | `1100` |
| `WORKSPACE_CHUNK_OVERLAP` | 切块重叠长度 | `180` |
| `WORKSPACE_MAX_CHUNKS_PER_FILE` | 单文件最多切块数 | `80` |
| `WORKSPACE_SEARCH_RESULT_COUNT` | 单次最多注入命中片段数 | `6` |
| `WORKSPACE_CONTEXT_MAX_LENGTH` | 注入模型的工作区上下文上限 | `8000` |

### 联网搜索与 SearXNG

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `WEB_SEARCH_SERVER_ENABLED` | 服务端联网搜索总开关 | `true` |
| `WEB_SEARCH_DEFAULT_ENABLED` | 前端首次加载时的默认开关 | `false` |
| `WEB_SEARCH_DIRECT_URL_ENABLED` | 是否启用 GitHub 链接直连解析 | `true` |
| `WEB_SEARCH_MAX_QUERIES` | 单次最多派生查询数 | `3` |
| `WEB_SEARCH_FETCH_PAGE_COUNT` | 额外抓取正文页数量 | `3` |
| `WEB_SEARCH_PAGE_TIMEOUT_MS` | 页面抓取超时 | `8000` |
| `WEB_SEARCH_MIN_SCORE` | 搜索结果最低得分阈值 | `0.12` |
| `WEB_SEARCH_FAILURE_NOTICE_ENABLED` | 搜索失败时是否向模型显式说明 | `true` |
| `SEARXNG_BASE_URL` | SearXNG 地址 | 本地 `http://127.0.0.1:8080` |
| `SEARXNG_FALLBACK_BASE_URL` | SearXNG 备用地址 | 空 |
| `SEARXNG_SEARCH_PATH` | 搜索路径 | `/search` |
| `SEARXNG_RESULT_COUNT` | 保留结果数量 | `5` |
| `SEARXNG_TIMEOUT_MS` | 搜索超时 | `12000` |
| `SEARXNG_LANGUAGE` | 可选语言参数 | 空 |
| `SEARXNG_SAFESEARCH` | 可选安全搜索参数 | 空 |
| `SEARXNG_USER_AGENT` | 搜索与正文抓取使用的 User-Agent | 内置默认值 |
| `SEARXNG_SNIPPET_MAX_LENGTH` | 搜索摘要最大长度 | `320` |
| `SEARXNG_CONTEXT_MAX_LENGTH` | 注入模型的联网上下文上限 | `7200` |
| `GITHUB_API_BASE_URL` | GitHub API 地址 | `https://api.github.com` |

## API 概览

### 公共接口

- `GET /api/config`
- `GET /api/models`
- `GET /healthz`

### 认证接口

- `GET /api/auth/status`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### 对话与工作区接口

- `GET /api/conversations`
- `PUT /api/conversations`
- `POST /api/chat`
- `POST /api/chat/stream`
- `GET /api/conversations/:conversationId/workspace/files`
- `POST /api/conversations/:conversationId/workspace/files`
- `DELETE /api/conversations/:conversationId/workspace/files/:fileId`

### 图片生成与联网状态

- `POST /api/images/generations`
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

## 开发与上线注意事项

- 不要提交 `.env`、`.env.production` 和真实密钥
- 不要提交运行时数据文件和工作区文件
- 生产环境必须替换：
  - `API_KEY`
  - `ADMIN_PASSWORD`
  - `SEARXNG_SECRET`
- 如果站点通过 HTTPS 对外访问，请确保：
  - `SESSION_COOKIE_SECURE=true`
- 如果你调大了上传限制，请同步检查：
  - `EXPRESS_JSON_LIMIT`
  - 反向代理请求体限制
  - `/data/workspaces` 与会话文件增长速度

## 部署文档

生产部署、升级、备份、回滚与排障说明见：

- [DEPLOYMENT.md](./DEPLOYMENT.md)
