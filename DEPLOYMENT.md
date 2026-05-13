# 部署说明

本文档按当前仓库的 `Dockerfile`、`docker-compose.yml` 和后端环境变量实现编写，适用于把项目部署到生产环境或长期运行环境。

默认部署包含两个服务：

1. `ai-chat-web`
2. `searxng`

## 部署目标

部署完成后，你将得到：

- 一个可登录、可多会话聊天的 Web 应用
- 管理员可维护多上游 API 配置
- 登录用户可使用图片生成
- 登录用户可上传工作区文件做检索增强
- 公告发布与用户管理后台
- 由 Docker 命名卷持久化的会话、用户、公告、运行配置和工作区文件
- 可选的 SearXNG 联网搜索能力

## 前置条件

- 一台可运行 Docker 的 Linux 主机
- 已安装 `Docker Engine`
- 已安装 `Docker Compose v2`
- 一个可用的 OpenAI 兼容接口
- 建议准备反向代理和 HTTPS

先确认环境：

```bash
docker --version
docker compose version
```

## Compose 结构

### `ai-chat-web`

- 基于当前仓库构建镜像
- 默认暴露 `${PORT:-3000}:3000`
- 通过 `aichat-data:/data` 持久化运行时数据
- 自带 `/healthz` 健康检查
- 重启策略为 `unless-stopped`

### `searxng`

- 使用官方镜像 `docker.io/searxng/searxng:latest`
- 挂载仓库内的 `./searxng` 配置目录
- 使用 `searxng-cache` 作为缓存卷
- 重启策略为 `unless-stopped`

## 数据持久化设计

当前 `docker-compose.yml` 默认使用两个命名卷：

- `aichat-data:/data`
- `searxng-cache:/var/cache/searxng`

其中 `aichat-data` 会保存：

- `/data/runtime-config.json`
- `/data/runtime-users.json`
- `/data/runtime-announcements.json`
- `/data/runtime-conversations.json`
- `/data/workspaces/`

说明：

- 用户、会话、公告和 API 配置都在 `/data` 内持久化
- 工作区文件和索引也放在 `/data/workspaces`
- 图片生成结果不写入 `/data`，它们只保存在前端会话状态里

## 首次部署

### 1. 获取代码

```bash
git clone <your-repository-url>
cd aichat-main
```

### 2. 准备生产环境变量

```bash
cp .env.production.example .env.production
```

### 3. 修改关键配置

上线前至少要替换：

- `API_BASE_URL`
- `API_KEY`
- `ADMIN_PASSWORD`
- `SEARXNG_SECRET`

同时重点确认：

```env
API_BASE_URL=https://your-provider.example.com/v1
SESSION_COOKIE_SECURE=true
SEARXNG_BASE_URL=http://searxng:8080
RUNTIME_CONFIG_PATH=/data/runtime-config.json
USERS_CONFIG_PATH=/data/runtime-users.json
ANNOUNCEMENTS_CONFIG_PATH=/data/runtime-announcements.json
CONVERSATIONS_CONFIG_PATH=/data/runtime-conversations.json
WORKSPACES_ROOT_DIR=/data/workspaces
```

注意：

- `API_BASE_URL` 必须带版本层，例如 `/v1`
- 如果你不准备启用联网搜索，可以把 `WEB_SEARCH_SERVER_ENABLED=false`
- 如果你打算放宽文件上传和工作区文件限制，请同时调整应用和反向代理

### 4. 启动服务

```bash
docker compose --env-file .env.production up -d --build
```

### 5. 检查容器状态

```bash
docker compose ps
docker compose logs --tail=200 ai-chat-web
docker compose logs --tail=120 searxng
```

### 6. 健康检查

```bash
curl -fsS http://127.0.0.1:3000/healthz
```

期望返回包含：

```json
{
  "status": "ok"
}
```

## 上线后建议检查

建议至少验证以下项目：

- `/healthz` 正常
- 管理员账号可登录
- 模型列表可以加载
- 管理员可保存并测试接口配置
- 普通用户可注册和登录
- 普通聊天可用
- 流式聊天可用
- 图片生成可用
- 公告发布与查看可用
- 对话刷新后仍能保留
- 工作区文件可上传、可删除、可参与回答
- 如果启用了联网搜索，`/api/web-search/status` 返回 `connected: true`

## 生产环境推荐配置

| 变量 | 建议值 |
| --- | --- |
| `API_BASE_URL` | 真实接口地址，并且带 `/v1` 或其他版本层 |
| `API_KEY` | 真实生产密钥 |
| `ADMIN_USERNAME` | 自定义管理员用户名 |
| `ADMIN_PASSWORD` | 强密码，必须替换 |
| `SESSION_COOKIE_SECURE` | `true` |
| `SEARXNG_SECRET` | 足够长的随机字符串 |
| `SEARXNG_BASE_URL` | `http://searxng:8080` |
| `RUNTIME_CONFIG_PATH` | `/data/runtime-config.json` |
| `USERS_CONFIG_PATH` | `/data/runtime-users.json` |
| `ANNOUNCEMENTS_CONFIG_PATH` | `/data/runtime-announcements.json` |
| `CONVERSATIONS_CONFIG_PATH` | `/data/runtime-conversations.json` |
| `WORKSPACES_ROOT_DIR` | `/data/workspaces` |
| `EXPRESS_JSON_LIMIT` | `15mb` 起步 |

如果需要调优联网搜索，可继续调整：

- `WEB_SEARCH_MAX_QUERIES`
- `WEB_SEARCH_FETCH_PAGE_COUNT`
- `WEB_SEARCH_PAGE_TIMEOUT_MS`
- `WEB_SEARCH_MIN_SCORE`
- `SEARXNG_RESULT_COUNT`
- `SEARXNG_TIMEOUT_MS`
- `SEARXNG_SNIPPET_MAX_LENGTH`
- `SEARXNG_CONTEXT_MAX_LENGTH`

如果需要调优工作区检索，可继续调整：

- `MAX_WORKSPACE_FILES_PER_CONVERSATION`
- `MAX_WORKSPACE_FILES_PER_REQUEST`
- `MAX_WORKSPACE_FILE_SIZE_BYTES`
- `WORKSPACE_CHUNK_SIZE`
- `WORKSPACE_CHUNK_OVERLAP`
- `WORKSPACE_MAX_CHUNKS_PER_FILE`
- `WORKSPACE_SEARCH_RESULT_COUNT`
- `WORKSPACE_CONTEXT_MAX_LENGTH`

## 工作区与请求体注意事项

当前默认限制如下：

- 聊天图片附件：单条消息最多 `3` 张，单张默认 `2MB`
- 工作区文件：单对话最多 `20` 个，单次最多上传 `5` 个，单文件默认 `10MB`

生产环境部署时，除了应用本身，还要检查：

- `EXPRESS_JSON_LIMIT` 是否足够
- 反向代理是否允许至少 `15mb` 的请求体
- `/data/runtime-conversations.json` 与 `/data/workspaces` 是否会增长过快
- WAF / CDN 是否会拦截 `data:image/*`

如果你计划提高上传或检索规模，不要只改一个地方，至少要同步检查：

- 应用层限制
- 反向代理请求体限制
- 持久化磁盘空间
- 备份策略

## 升级流程

```bash
git pull
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d
docker compose ps
docker compose logs --tail=200 ai-chat-web
```

升级完成后建议做一轮最小回归：

- 管理员登录
- 模型连通性测试
- 普通聊天
- 流式聊天
- 图片生成
- 工作区上传
- 联网搜索

## 回滚流程

### 1. 查看最近版本

```bash
git log --oneline -n 10
```

### 2. 切换到目标版本

```bash
git checkout <commit-id>
```

### 3. 重新部署

```bash
docker compose --env-file .env.production up -d --build --force-recreate
```

### 4. 验证

```bash
curl -fsS http://127.0.0.1:3000/healthz
docker compose logs --tail=200 ai-chat-web
```

## 备份与恢复

### 备份 `aichat-data`

```bash
mkdir -p ~/backup/aichat

docker run --rm \
  -v aichat_aichat-data:/data \
  -v ~/backup/aichat:/backup \
  alpine sh -c 'cd /data && tar czf /backup/aichat-data-$(date +%F-%H%M%S).tar.gz .'
```

### 恢复 `aichat-data`

先停服务：

```bash
docker compose --env-file .env.production down
```

再恢复备份：

```bash
docker run --rm \
  -v aichat_aichat-data:/data \
  -v ~/backup/aichat:/backup \
  alpine sh -c 'rm -rf /data/* && tar xzf /backup/<backup-file>.tar.gz -C /data'
```

最后重新启动：

```bash
docker compose --env-file .env.production up -d
```

## 从宿主机目录迁移到命名卷

如果你之前用的是宿主机目录挂载，现在想切回当前仓库默认的命名卷方案：

### 1. 停止旧服务

```bash
docker compose --env-file .env.production down --remove-orphans
```

### 2. 创建卷并复制数据

```bash
docker volume create aichat_aichat-data
docker run --rm -v "$(pwd)/data:/from" -v aichat_aichat-data:/to alpine sh -c 'cp -a /from/. /to/ || true'
```

### 3. 重新启动

```bash
docker compose --env-file .env.production up -d --build --force-recreate
```

## 反向代理建议

生产环境建议通过 Nginx、Traefik 或同类组件对外暴露服务。

至少考虑以下规则：

- 对外只开放 `80/443`
- 应用容器仅在内网暴露
- 对 `/api/chat/stream` 关闭代理缓冲
- 正确转发 `Host`、`X-Forwarded-*` 和 Cookie 相关头
- 启用 HTTPS
- 放宽请求体限制以兼容图片附件和工作区上传

以 Nginx 为例，至少建议：

```nginx
client_max_body_size 15m;
proxy_read_timeout 300s;
```

如果启用了流式聊天，还应对 `/api/chat/stream` 关闭缓冲，例如：

```nginx
proxy_buffering off;
```

如果站点通过 HTTPS 对外访问，请确保：

```env
SESSION_COOKIE_SECURE=true
```

## 联网搜索验证

### 验证应用到 SearXNG 的链路

登录后携带 Cookie：

```bash
curl -b "<cookie>" "http://127.0.0.1:3000/api/web-search/status?q=openai"
```

期望结果：

- `enabled: true`
- `connected: true`

### 在容器内直接验证 SearXNG

```bash
docker compose exec ai-chat-web \
node -e "fetch('http://searxng:8080/search?q=openai&format=json').then(r=>r.text()).then(t=>console.log(t.slice(0,300)))"
```

### 验证 GitHub 仓库链接直连解析

```bash
curl -b "<cookie>" "http://127.0.0.1:3000/api/web-search/status?q=https://github.com/wssxzh/aichat"
```

如果返回样本来源中包含 `github-api`，说明直连解析已经生效。

## 常见问题排查

### 1. 容器反复重启

先看状态和日志：

```bash
docker compose ps
docker compose logs --tail=300 ai-chat-web
docker compose logs --tail=200 searxng
```

常见原因：

- 环境变量缺失
- `API_BASE_URL` 没有写到版本层
- `API_KEY` 不可用
- `SEARXNG_SECRET` 未正确设置
- `/data` 不可写
- 请求体限制过小导致图文或文件上传失败

### 2. 模型列表加载失败

优先检查：

- `API_BASE_URL`
- `API_KEY`
- 管理员页里的“测试连通性”
- 容器是否能访问上游接口

### 3. 登录后立刻失效

重点检查：

- 是否通过 HTTPS 对外访问
- `SESSION_COOKIE_SECURE` 是否与访问方式匹配
- 反向代理是否正确转发 Cookie 相关头

### 4. 工作区文件不持久

确认以下设置：

- `WORKSPACES_ROOT_DIR=/data/workspaces`
- `aichat-data:/data` 已正常挂载
- 容器内 `/data/workspaces` 可写

### 5. 图文消息或工作区文件上传失败

依次检查：

- `EXPRESS_JSON_LIMIT` 是否足够
- 反向代理请求体限制是否足够
- 聊天图片是否超过 `3` 张或单张超过 `2MB`
- 工作区文件是否超过数量、大小或格式限制

### 6. 联网搜索不可用

依次检查：

- `WEB_SEARCH_SERVER_ENABLED=true`
- `SEARXNG_BASE_URL=http://searxng:8080`
- `searxng` 容器已启动
- `/api/web-search/status` 返回的错误细节
- `ai-chat-web` 日志中是否有 `SearXNG web search failed`

## 运维建议

- 定期备份 `aichat-data`
- 定期轮换：
  - `API_KEY`
  - `ADMIN_PASSWORD`
  - `SEARXNG_SECRET`
- 保留最近几次部署版本，便于快速回滚
- 重点监控：
  - `docker compose ps`
  - `/healthz`
  - `ai-chat-web` 日志
  - `searxng` 日志
  - `/data/runtime-conversations.json` 体积
  - `/data/workspaces` 增长情况

## 命令速查

```bash
# 启动或重建
docker compose --env-file .env.production up -d --build

# 停止服务
docker compose --env-file .env.production down

# 重启 Web 服务
docker compose --env-file .env.production restart ai-chat-web

# 查看展开后的 Compose 配置
docker compose --env-file .env.production config

# 查看 Web 日志
docker compose --env-file .env.production logs -f ai-chat-web

# 查看 SearXNG 日志
docker compose --env-file .env.production logs -f searxng
```
