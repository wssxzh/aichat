# Deployment Guide

本文档说明如何将当前版本部署到生产环境，并覆盖升级、备份、恢复与常见排障流程。

这份部署说明以仓库当前实现为准，尤其同步了本次新增的图文消息能力和 `EXPRESS_JSON_LIMIT` 配置。

## 部署目标

部署完成后，通常会得到两个核心服务：

1. `ai-chat-web`
   提供 Web 页面、登录认证、聊天、会话持久化和管理员后台
2. `searxng`
   提供联网搜索能力

默认数据落在 Docker 命名卷中，不依赖宿主机 bind mount。

## 前置条件

- 一台可运行 Docker 的 Linux 服务器
- 已安装 `Docker Engine`
- 已安装 `Docker Compose v2`
- 已准备可用的上游 OpenAI 兼容接口：
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

### 2. 复制生产环境变量模板

```bash
cp .env.production.example .env.production
```

### 3. 修改生产环境变量

上线前至少要替换：

- `API_BASE_URL`
- `API_KEY`
- `ADMIN_PASSWORD`
- `SEARXNG_SECRET`

建议重点确认：

- `SESSION_COOKIE_SECURE=true`
- `WEB_SEARCH_SERVER_ENABLED=true`
- `WEB_SEARCH_DEFAULT_ENABLED=false`
- `SEARXNG_BASE_URL=http://searxng:8080`
- `EXPRESS_JSON_LIMIT=15mb`

如果你准备让用户发送更多图片、更大图片，或者代理层已有默认请求体限制，请同时规划：

- 应用层 `EXPRESS_JSON_LIMIT`
- Nginx / Traefik / CDN 的请求体限制
- `/data/runtime-conversations.json` 的增长速度

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

健康检查返回 `status: ok` 即表示 Web 服务已正常启动。

## Compose 结构说明

当前 `docker-compose.yml` 包含两个服务。

### `ai-chat-web`

- 基于当前仓库构建镜像
- 对外暴露 `${PORT:-3000}:3000`
- 挂载数据卷 `aichat-data:/data`
- 依赖 `searxng`
- 内置 `/healthz` 健康检查
- 使用 `unless-stopped` 自动重启
- 通过 `EXPRESS_JSON_LIMIT` 控制 JSON 请求体大小

### `searxng`

- 使用官方镜像 `docker.io/searxng/searxng:latest`
- 挂载仓库内的 `./searxng` 配置目录
- 使用缓存卷 `searxng-cache`
- 使用 `unless-stopped` 自动重启

## 推荐生产环境变量

以下是最关键的一组配置：

| 变量 | 推荐值 |
| --- | --- |
| `API_BASE_URL` | 你的模型服务地址 |
| `API_KEY` | 真实生产密钥 |
| `ADMIN_USERNAME` | 自定义管理员名，或保留 `admin` |
| `ADMIN_PASSWORD` | 强密码，必须替换 |
| `SESSION_COOKIE_SECURE` | `true` |
| `SEARXNG_SECRET` | 足够长的随机字符串 |
| `SEARXNG_BASE_URL` | `http://searxng:8080` |
| `EXPRESS_JSON_LIMIT` | `15mb` 起步，按图文消息规模调整 |
| `RUNTIME_CONFIG_PATH` | `/data/runtime-config.json` |
| `USERS_CONFIG_PATH` | `/data/runtime-users.json` |
| `ANNOUNCEMENTS_CONFIG_PATH` | `/data/runtime-announcements.json` |
| `CONVERSATIONS_CONFIG_PATH` | `/data/runtime-conversations.json` |

如需调优联网搜索，还可以配置：

- `SEARXNG_RESULT_COUNT`
- `SEARXNG_TIMEOUT_MS`
- `WEB_SEARCH_MAX_QUERIES`
- `WEB_SEARCH_FETCH_PAGE_COUNT`
- `WEB_SEARCH_PAGE_TIMEOUT_MS`
- `WEB_SEARCH_MIN_SCORE`
- `WEB_SEARCH_FAILURE_NOTICE_ENABLED`

## 图文消息上线注意事项

当前版本的前端默认限制如下：

- 每条消息最多 `3` 张图片
- 单张图片最大 `2MB`

这些限制虽然已经能控制大多数请求体，但生产环境仍需额外检查：

- 反向代理是否允许至少 `15mb` 的请求体
- WAF / CDN 是否会拦截 `data:image/*` 内容
- 持久化会话文件是否会随图片历史快速膨胀
- 备份窗口和恢复时间是否仍可接受

如果你准备放宽前端限制，不要只改前端。还需要一起调整：

- `EXPRESS_JSON_LIMIT`
- 代理层 `client_max_body_size` 或等价配置
- 磁盘容量与备份策略

## 数据持久化

### 默认方案

Compose 默认使用两个命名卷：

- `aichat-data:/data`
- `searxng-cache:/var/cache/searxng`

这是推荐方案，因为它能避免很多宿主机目录权限问题。

### 持久化内容

`/data` 目录下通常保存：

- `runtime-config.json`
- `runtime-users.json`
- `runtime-announcements.json`
- `runtime-conversations.json`

其中 `runtime-conversations.json` 会随着聊天历史和图片附件增长最快，生产环境要重点关注。

## 上线后检查清单

建议至少确认以下项目：

- `/healthz` 正常
- 管理员可登录
- 模型列表可以加载
- 普通用户可注册和登录
- 普通聊天接口正常
- 流式聊天接口正常
- 公告管理正常
- 登录用户刷新页面后会话仍在
- 图文消息可以正常发送
- 只发图片、不发文字时也能成功
- 图片预览功能正常
- 如启用联网搜索，`/api/web-search/status` 返回 `connected: true`

## 升级流程

```bash
git pull
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d
docker compose ps
docker compose logs --tail=200 ai-chat-web
```

升级后建议做一次最小回归：

- 管理员登录
- 模型连通性测试
- 普通聊天
- 流式聊天
- 图文消息发送
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

如果你之前使用过 `./data:/data` 这类 bind mount，现在想切换到默认命名卷，可以这样做：

### 1. 停掉旧服务

```bash
docker compose --env-file .env.production down --remove-orphans
```

### 2. 创建卷并导入数据

```bash
docker volume create aichat_aichat-data
docker run --rm -v "$(pwd)/data:/from" -v aichat_aichat-data:/to alpine sh -c 'cp -a /from/. /to/ || true'
```

### 3. 使用新配置重启

```bash
docker compose --env-file .env.production up -d --build --force-recreate
```

## 反向代理建议

生产环境建议通过 Nginx、Traefik 或类似组件对外暴露服务。

建议规则：

- 对外只开放 `80/443`
- 应用容器仅在内网暴露
- 对 `/api/chat/stream` 关闭代理缓冲
- 正确透传 `Host`、`X-Forwarded-*` 与 Cookie 相关头
- 开启 HTTPS
- 提前放宽请求体限制以兼容图文消息

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

### 验证 Web 服务到 SearXNG 的链路

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

如果样本结果来源包含 `github-api`，说明直连解析已生效。

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
- `SEARXNG_SECRET` 未正确设置
- 数据目录权限异常
- 请求体限制太小导致图文消息失败

### 2. 模型列表加载失败

优先检查：

- `API_BASE_URL`
- `API_KEY`
- 管理页里的“连通性测试”
- 容器是否能访问上游接口

### 3. 登录后立即失效

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

## 命令速查

```bash
# 首次或常规启动
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
