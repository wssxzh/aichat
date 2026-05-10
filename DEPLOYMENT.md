# 部署说明

本文档说明如何将当前项目部署到生产环境，并覆盖以下场景：

- 首次上线
- 日常升级
- 数据备份与恢复
- 常见故障排查

本文档以仓库当前实现为准，默认部署两个服务：

1. `ai-chat-web`
2. `searxng`

## 部署目标

部署完成后，你通常会得到以下能力：

- Web 对话界面
- 用户注册、登录与管理员后台
- 多接口模型配置
- 聊天与图片生成
- 会话持久化
- 工作区文件上传与检索增强
- 联网搜索增强

## 前置条件

- 一台可运行 Docker 的 Linux 服务器
- 已安装 `Docker Engine`
- 已安装 `Docker Compose v2`
- 已准备可用的 OpenAI 兼容接口
  - `API_BASE_URL`
  - `API_KEY`
- 建议准备反向代理和 HTTPS 证书

先确认环境：

```bash
docker --version
docker compose version
```

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

上线前至少要替换以下变量：

- `API_BASE_URL`
- `API_KEY`
- `ADMIN_PASSWORD`
- `SEARXNG_SECRET`

注意：

- `API_BASE_URL` 必须写到版本层，例如 `https://api.example.com/v1`
- 如果外部通过 HTTPS 访问，保持 `SESSION_COOKIE_SECURE=true`

建议重点确认：

- `SEARXNG_BASE_URL=http://searxng:8080`
- `WEB_SEARCH_SERVER_ENABLED=true`
- `WEB_SEARCH_DEFAULT_ENABLED=false`
- `EXPRESS_JSON_LIMIT=15mb`

### 4. 启动服务

```bash
docker compose --env-file .env.production up -d --build
```

### 5. 验证状态

```bash
docker compose ps
docker compose logs --tail=200 ai-chat-web
docker compose logs --tail=120 searxng
curl -fsS http://127.0.0.1:3000/healthz
```

如果 `/healthz` 返回 `status: ok`，说明 Web 服务已启动成功。

## Compose 结构说明

### `ai-chat-web`

- 基于当前仓库构建镜像
- 默认暴露 `${PORT:-3000}:3000`
- 挂载数据卷 `aichat-data:/data`
- 依赖 `searxng`
- 自带 `/healthz` 健康检查
- 使用 `unless-stopped` 自动重启

### `searxng`

- 使用官方镜像 `docker.io/searxng/searxng:latest`
- 挂载仓库内的 `./searxng` 配置目录
- 使用缓存卷 `searxng-cache`
- 使用 `unless-stopped` 自动重启

## 生产环境推荐配置

下面这组变量最重要：

| 变量 | 建议值 |
| --- | --- |
| `API_BASE_URL` | 你的真实模型接口地址，且带版本层 |
| `API_KEY` | 真实生产密钥 |
| `ADMIN_USERNAME` | 自定义管理员用户名，或保留 `admin` |
| `ADMIN_PASSWORD` | 强密码，必须替换 |
| `SESSION_COOKIE_SECURE` | `true` |
| `SEARXNG_SECRET` | 足够长的随机字符串 |
| `SEARXNG_BASE_URL` | `http://searxng:8080` |
| `EXPRESS_JSON_LIMIT` | `15mb` 起步，按图文消息规模调整 |
| `RUNTIME_CONFIG_PATH` | `/data/runtime-config.json` |
| `USERS_CONFIG_PATH` | `/data/runtime-users.json` |
| `ANNOUNCEMENTS_CONFIG_PATH` | `/data/runtime-announcements.json` |
| `CONVERSATIONS_CONFIG_PATH` | `/data/runtime-conversations.json` |
| `WORKSPACES_ROOT_DIR` | `/data/workspaces` |

如果需要调优联网搜索，可继续配置：

- `SEARXNG_RESULT_COUNT`
- `SEARXNG_TIMEOUT_MS`
- `WEB_SEARCH_MAX_QUERIES`
- `WEB_SEARCH_FETCH_PAGE_COUNT`
- `WEB_SEARCH_PAGE_TIMEOUT_MS`
- `WEB_SEARCH_MIN_SCORE`
- `WEB_SEARCH_FAILURE_NOTICE_ENABLED`

如果需要调优工作区文件功能，可继续配置：

- `MAX_WORKSPACE_FILES_PER_CONVERSATION`
- `MAX_WORKSPACE_FILE_SIZE_BYTES`
- `WORKSPACE_CHUNK_SIZE`
- `WORKSPACE_CHUNK_OVERLAP`
- `WORKSPACE_SEARCH_RESULT_COUNT`
- `WORKSPACE_CONTEXT_MAX_LENGTH`

## 图片与请求体注意事项

当前项目默认支持图文消息，限制如下：

- 单条消息最多 `3` 张图片
- 单张图片最大 `2MB`

虽然这些限制已经能控制大部分请求体，但生产环境仍需检查：

- `EXPRESS_JSON_LIMIT` 是否足够
- 反向代理是否允许至少 `15mb` 的请求体
- CDN / WAF 是否会拦截 `data:image/*`
- `/data/runtime-conversations.json` 是否会随聊天历史增长过快

如果计划放宽图片限制，不要只改前端，还要同步调整：

- 应用层限制
- `EXPRESS_JSON_LIMIT`
- 反向代理的请求体限制
- 磁盘容量与备份策略

## 工作区文件注意事项

工作区文件功能会占用磁盘空间，需要注意：

- 文件存储位置：`/data/workspaces/`
- 每个对话最多 `20` 个文件
- 单个文件最大 `10MB`
- 支持的格式：`.txt`、`.md`、`.pdf`、`.docx`、`.csv`、`.xlsx`、`.xls`、`.json`
- 删除对话时会自动清理关联的工作区文件

生产环境建议：

- 定期监控 `/data/workspaces/` 目录大小
- 根据用户量和使用频率规划磁盘容量
- 备份时需要包含 `workspaces` 目录

## 数据持久化

### 默认卷

当前 `docker-compose.yml` 默认使用两个命名卷：

- `aichat-data:/data`
- `searxng-cache:/var/cache/searxng`

这是推荐方案，因为它比宿主机目录绑定更省心，也更不容易踩权限问题。

### `/data` 中保存的内容

- `runtime-config.json`
- `runtime-users.json`
- `runtime-announcements.json`
- `runtime-conversations.json`
- `workspaces/`（工作区文件目录）

说明：

- 聊天会话、用户、公告和接口配置都会保存在这里
- 工作区文件按用户和对话隔离存储
- 图片生成结果不会作为本地文件写入 `/data`

## 上线后检查清单

建议至少确认以下项目：

- `/healthz` 正常
- 管理员可以登录
- 模型列表可以加载
- 模型中心可以看到已保存的接口配置
- 连通性测试只测试启用接口
- 普通用户可以注册、登录
- 聊天接口可用
- 流式聊天可用
- 图片生成可用
- 工作区文件上传可用
- 工作区文件检索增强可用
- 公告管理可用
- 登录用户刷新页面后会话仍在
- 如果启用了联网搜索，`/api/web-search/status` 返回 `connected: true`

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
- 工作区文件上传
- 工作区文件检索
- 联网搜索

## 回滚流程

### 1. 查看最近版本

```bash
git log --oneline -n 10
```

### 2. 切回目标版本

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

### 备份数据卷

```bash
mkdir -p ~/backup/aichat

docker run --rm \
  -v aichat_aichat-data:/data \
  -v ~/backup/aichat:/backup \
  alpine sh -c 'cd /data && tar czf /backup/aichat-data-$(date +%F-%H%M%S).tar.gz .'
```

### 恢复数据卷

先停止服务：

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

如果之前使用过 `./data:/data` 这类目录挂载，现在想迁移到命名卷，可以按下面步骤处理。

### 1. 停止旧服务

```bash
docker compose --env-file .env.production down --remove-orphans
```

### 2. 创建卷并导入数据

```bash
docker volume create aichat_aichat-data
docker run --rm -v "$(pwd)/data:/from" -v aichat_aichat-data:/to alpine sh -c 'cp -a /from/. /to/ || true'
```

### 3. 重新启动

```bash
docker compose --env-file .env.production up -d --build --force-recreate
```

## 反向代理建议

生产环境建议通过 Nginx、Traefik 或类似组件对外暴露服务。

建议规则：

- 对外只开放 `80/443`
- 应用容器只在内网暴露
- 对 `/api/chat/stream` 关闭代理缓冲
- 正确透传 `Host`、`X-Forwarded-*` 和 Cookie 相关头
- 启用 HTTPS
- 放宽请求体限制以兼容图文消息

以 Nginx 为例，至少要考虑：

```nginx
client_max_body_size 15m;
proxy_read_timeout 300s;
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

### 验证 GitHub 链接直连解析

```bash
curl -b "<cookie>" "http://127.0.0.1:3000/api/web-search/status?q=https://github.com/wssxzh/aichat"
```

如果返回来源里包含 `github-api`，说明直连解析已经生效。

## 工作区文件验证

### 验证文件上传

登录后携带 Cookie，上传一个测试文件：

```bash
curl -b "<cookie>" \
  -X POST \
  -F "files=@/path/to/test.txt" \
  "http://127.0.0.1:3000/api/conversations/test-conversation/workspace/files"
```

期望结果：

- 返回 `201` 状态码
- 响应包含 `uploaded` 数组
- 响应包含 `files` 数组

### 验证文件列表

```bash
curl -b "<cookie>" \
  "http://127.0.0.1:3000/api/conversations/test-conversation/workspace/files"
```

期望结果：

- 返回 `200` 状态码
- 响应包含 `files` 数组

### 验证文件删除

```bash
curl -b "<cookie>" \
  -X DELETE \
  "http://127.0.0.1:3000/api/conversations/test-conversation/workspace/files/<file-id>"
```

期望结果：

- 返回 `200` 状态码
- 响应包含 `message` 字段

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
- `API_BASE_URL` 或 `API_KEY` 不可用
- `API_BASE_URL` 没有写到版本层
- `SEARXNG_SECRET` 未正确设置
- 数据目录权限异常
- 请求体限制过小导致图文消息失败

### 2. 模型列表加载失败

优先检查：

- `API_BASE_URL`
- `API_KEY`
- 管理页里的"测试连通性"
- 容器是否能访问上游接口

### 3. 登录后立刻失效

重点检查：

- 是否通过 HTTPS 对外访问
- `SESSION_COOKIE_SECURE` 是否与访问方式匹配
- 反向代理是否正确透传 Cookie 相关头

### 4. 出现 `EACCES: permission denied, open '/data/...'`

处理建议：

- 优先使用默认命名卷
- 如果必须使用 bind mount，先修正宿主机目录权限

示例：

```bash
mkdir -p data
chown -R 1000:1000 data
chmod -R u+rwX,g+rwX data
```

### 5. 图文消息发送失败

依次检查：

- `EXPRESS_JSON_LIMIT` 是否足够
- 反向代理请求体限制是否足够
- 前端是否上传了超过 `3` 张图片
- 单张图片是否超过 `2MB`
- 会话文件是否异常膨胀

### 6. 联网搜索不可用

依次检查：

- `WEB_SEARCH_SERVER_ENABLED=true`
- `SEARXNG_BASE_URL=http://searxng:8080`
- `searxng` 容器已启动
- `/api/web-search/status` 返回的错误细节
- `ai-chat-web` 日志中是否有 `SearXNG web search failed`

### 7. 工作区文件上传失败

依次检查：

- 文件格式是否支持（`.txt`、`.md`、`.pdf`、`.docx`、`.csv`、`.xlsx`、`.xls`、`.json`）
- 文件大小是否超过 `MAX_WORKSPACE_FILE_SIZE_BYTES`
- 当前对话文件数是否超过 `MAX_WORKSPACE_FILES_PER_CONVERSATION`
- 单次上传文件数是否超过 `MAX_WORKSPACE_FILES_PER_REQUEST`
- `/data/workspaces/` 目录权限是否正确
- 磁盘空间是否充足

### 8. 工作区文件检索不生效

依次检查：

- 文件是否成功上传（`/api/conversations/:id/workspace/files` 返回文件列表）
- 文件是否包含可提取的文本内容
- 对话时是否登录了账号
- 对话 ID 是否正确

## 运维建议

- 定期备份 `aichat-data` 数据卷
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
  - `/data/runtime-conversations.json` 的体积
  - `/data/workspaces/` 目录的体积

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

# 查看 Web 服务日志
docker compose --env-file .env.production logs -f ai-chat-web

# 查看 SearXNG 日志
docker compose --env-file .env.production logs -f searxng
```
