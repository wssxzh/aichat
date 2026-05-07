# Deployment Guide

本文档用于说明如何把当前项目部署到生产环境，以及如何进行升级、备份、恢复和常见故障排查。

文档内容以当前仓库的真实实现为准，包括：

- `Dockerfile`
- `docker-compose.yml`
- `src/server/` 分层服务端结构
- `public/` 静态前端资源
- `searxng/` 内置搜索配置

## 部署目标

部署后你将得到两个核心服务：

1. `ai-chat-web`
   提供 Web 页面、认证、聊天、会话持久化和管理员后台
2. `searxng`
   提供联网搜索能力

默认数据会落在 Docker 命名卷中，不依赖宿主机目录权限。

## 前置条件

- 一台可运行 Docker 的 Linux 服务器
- 已安装 `Docker Engine`
- 已安装 `Docker Compose v2`
- 已准备好可用的上游模型接口：
  - `API_BASE_URL`
  - `API_KEY`
- 建议准备反向代理与 HTTPS 证书

先执行：

```bash
docker --version
docker compose version
```

## 首次部署

### 1. 获取项目代码

```bash
git clone <your-repository-url>
cd aichat-main
```

### 2. 复制生产环境变量模板

```bash
cp .env.production.example .env.production
```

### 3. 修改生产环境变量

至少修改以下内容：

- `API_BASE_URL`
- `API_KEY`
- `ADMIN_PASSWORD`
- `SEARXNG_SECRET`

生产环境建议确认：

- `SESSION_COOKIE_SECURE=true`
- `WEB_SEARCH_SERVER_ENABLED=true`
- `WEB_SEARCH_DEFAULT_ENABLED=false`
- `SEARXNG_BASE_URL=http://searxng:8080`

### 4. 启动服务

```bash
docker compose --env-file .env.production up -d --build
```

### 5. 验证服务状态

```bash
docker compose ps
docker compose logs --tail=200 ai-chat-web
docker compose logs --tail=120 searxng
curl -fsS http://127.0.0.1:3000/healthz
```

只要 `/healthz` 返回 `status: ok`，说明 Web 服务已经正常启动。

## Compose 结构说明

当前 `docker-compose.yml` 包含：

### `ai-chat-web`

- 基于当前项目构建镜像
- 对外暴露 `${PORT:-3000}:3000`
- 挂载数据卷 `aichat-data:/data`
- 依赖 `searxng`
- 内置健康检查
- 使用 `unless-stopped` 自动重启策略

### `searxng`

- 使用官方镜像 `docker.io/searxng/searxng:latest`
- 挂载本仓库中的 `./searxng` 配置目录
- 使用缓存卷 `searxng-cache`
- 使用 `unless-stopped` 自动重启策略

## 推荐生产环境变量

以下是生产最关键的一组变量：

| 变量 | 建议值 |
| --- | --- |
| `API_BASE_URL` | 你的模型服务地址 |
| `API_KEY` | 真实生产密钥 |
| `ADMIN_USERNAME` | 自定义管理员名，或保留 `admin` |
| `ADMIN_PASSWORD` | 强密码，必须替换 |
| `SESSION_COOKIE_SECURE` | `true` |
| `SEARXNG_SECRET` | 高强度随机字符串 |
| `SEARXNG_BASE_URL` | `http://searxng:8080` |
| `RUNTIME_CONFIG_PATH` | `/data/runtime-config.json` |
| `USERS_CONFIG_PATH` | `/data/runtime-users.json` |
| `ANNOUNCEMENTS_CONFIG_PATH` | `/data/runtime-announcements.json` |
| `CONVERSATIONS_CONFIG_PATH` | `/data/runtime-conversations.json` |

如果你需要调整联网搜索行为，也可以配置：

- `SEARXNG_RESULT_COUNT`
- `SEARXNG_TIMEOUT_MS`
- `WEB_SEARCH_MAX_QUERIES`
- `WEB_SEARCH_FETCH_PAGE_COUNT`
- `WEB_SEARCH_PAGE_TIMEOUT_MS`
- `WEB_SEARCH_MIN_SCORE`
- `WEB_SEARCH_FAILURE_NOTICE_ENABLED`

## 数据持久化

### 默认方案

当前 Compose 默认使用 Docker 命名卷：

- `aichat-data:/data`
- `searxng-cache:/var/cache/searxng`

这是推荐方案，因为它：

- 避免宿主机目录权限问题
- 降低 `EACCES` 风险
- 迁移和备份更稳定

### 持久化内容

`/data` 目录下会保存：

- `runtime-config.json`
- `runtime-users.json`
- `runtime-announcements.json`
- `runtime-conversations.json`

分别对应：

- 运行时模型配置
- 用户数据
- 公告数据
- 登录用户会话数据

## 部署后检查清单

上线后建议依次确认：

- `/healthz` 返回正常
- 管理员可以登录
- 管理页面可以加载模型列表
- 普通用户可以注册和登录
- 普通聊天接口正常
- 流式聊天接口正常
- 公告发布与删除正常
- 登录用户跨刷新后会话仍存在
- 如果启用了联网搜索，`/api/web-search/status` 返回 `connected: true`

## 升级流程

```bash
git pull
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d
docker compose ps
docker compose logs --tail=200 ai-chat-web
```

升级完成后建议做一次最小回归：

- 管理员登录
- 模型连通性测试
- 普通聊天
- 流式聊天
- 联网搜索测试

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

## 从宿主机目录挂载迁移到命名卷

如果你之前使用过 `./data:/data` 这种 bind mount，并且希望切换到当前默认命名卷方案，可以按下面操作：

### 1. 停掉旧容器

```bash
docker compose --env-file .env.production down --remove-orphans
```

### 2. 创建并导入数据

```bash
docker volume create aichat_aichat-data
docker run --rm -v "$(pwd)/data:/from" -v aichat_aichat-data:/to alpine sh -c 'cp -a /from/. /to/ || true'
```

### 3. 用新配置重启

```bash
docker compose --env-file .env.production up -d --build --force-recreate
```

## 反向代理建议

生产环境建议通过 Nginx、Traefik 或类似组件对外暴露服务。

建议规则：

- 对外只开放 `80/443`
- 应用容器只在内网暴露
- 对 `/api/chat/stream` 禁用代理缓冲
- 正确透传 `Host`、`X-Forwarded-*`、Cookie 相关头
- 开启 HTTPS

如果站点通过 HTTPS 对外访问，请确保：

```env
SESSION_COOKIE_SECURE=true
```

否则登录态可能异常。

## SearXNG 联网搜索验证

### 验证 Web 服务到 SearXNG 的链路

需要先登录并携带 Cookie：

```bash
curl -b "<cookie>" "http://127.0.0.1:3000/api/web-search/status?q=openai"
```

期望返回：

- `enabled: true`
- `connected: true`

### 容器内部直接验证 SearXNG

```bash
docker compose exec ai-chat-web \
node -e "fetch('http://searxng:8080/search?q=openai&format=json').then(r=>r.text()).then(t=>console.log(t.slice(0,300)))"
```

### 验证 GitHub 链接直连解析

```bash
curl -b "<cookie>" "http://127.0.0.1:3000/api/web-search/status?q=https://github.com/wssxzh/aichat"
```

如果返回结果中的样本来源含 `github-api`，说明直连解析已经生效。

## 常见故障排查

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

### 2. 模型列表加载失败

优先检查：

- `API_BASE_URL`
- `API_KEY`
- 管理页内的“连通性测试”
- 容器是否能访问上游模型接口

### 3. 登录后立即失效

重点检查：

- 是否通过 HTTPS 对外访问
- `SESSION_COOKIE_SECURE` 是否与访问方式匹配
- 反向代理是否透传 Cookie 相关头

### 4. 出现 `EACCES: permission denied, open '/data/...'`

处理建议：

- 优先使用默认命名卷方案
- 如果必须使用 bind mount，请先在宿主机调整目录权限

示例：

```bash
mkdir -p data
chown -R 1000:1000 data
chmod -R u+rwX,g+rwX data
```

### 5. 联网搜索不可用

依次检查：

- `WEB_SEARCH_SERVER_ENABLED=true`
- `SEARXNG_BASE_URL=http://searxng:8080`
- `searxng` 容器已启动
- `/api/web-search/status` 是否返回具体错误信息
- `ai-chat-web` 日志中是否有 `SearXNG web search failed`

### 6. 宿主机访问 `127.0.0.1:8080` 不是 SearXNG

这通常不代表 Compose 内部链路有问题。

更可靠的判断方式是直接在容器内执行：

```bash
docker compose exec ai-chat-web \
node -e "fetch('http://searxng:8080/search?q=openai&format=json').then(r=>r.text()).then(t=>console.log(t.slice(0,300)))"
```

## 运维建议

- 定期备份 `aichat-data` 数据卷
- 定期轮换：
  - `API_KEY`
  - `ADMIN_PASSWORD`
  - `SEARXNG_SECRET`
- 保留最近几次部署版本，方便快速回滚
- 监控：
  - `docker compose ps`
  - `/healthz`
  - `ai-chat-web` 日志
  - `searxng` 日志

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
