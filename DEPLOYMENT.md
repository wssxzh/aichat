# Deployment Guide

本文档用于生产环境部署、升级、回滚、迁移和排障。

## 1. 前置条件

- 一台可访问 Docker 的 Linux 服务器
- 已安装 Docker Engine 与 Compose v2
- 已准备上游模型接口信息：
  - `API_BASE_URL`
  - `API_KEY`
- 已准备业务域名（推荐）与 HTTPS 证书（推荐）

建议先确认：

```bash
docker --version
docker compose version
```

## 2. 首次生产部署

1. 拉取代码

```bash
git clone https://github.com/wssxzh/aichat.git
cd aichat
```

2. 准备生产配置

```bash
cp .env.production.example .env.production
```

3. 编辑 `.env.production`，至少修改以下变量

- `API_BASE_URL`
- `API_KEY`
- `ADMIN_PASSWORD`
- `SESSION_COOKIE_SECURE=true`（若外部访问走 HTTPS）

4. 启动服务

```bash
docker compose --env-file .env.production up -d --build
```

5. 验证部署

```bash
docker compose ps
docker compose logs --tail=200 ai-chat-web
curl -fsS http://127.0.0.1:3000/healthz
```

## 3. 配置说明（生产重点）

- 端口映射：默认 `${PORT:-3000}:3000`
- 容器健康检查：自动访问 `/healthz`
- 数据卷：默认 `aichat-data:/data`
- 自动重启策略：`unless-stopped`

## 4. 数据持久化设计

### 4.1 默认方案（推荐）

`docker-compose.yml` 使用 Docker 命名卷：

- `aichat-data:/data`

优点：

- 不依赖宿主机目录权限
- 降低 `EACCES` 风险
- 迁移与备份更可控

### 4.2 持久化内容

容器内 `/data` 下会保存：

- `runtime-config.json`（运行时模型配置）
- `runtime-users.json`（用户信息）
- `runtime-announcements.json`（公告信息）

## 5. 从旧版 bind mount 迁移

如果旧版本使用 `./data:/data`，推荐迁移到命名卷。

### 5.1 停止旧容器

```bash
cd ~/aichat
docker compose --env-file .env.production down --remove-orphans
```

### 5.2 创建并灌入命名卷数据（如需要保留历史数据）

```bash
docker volume create aichat_aichat-data
docker run --rm -v "$(pwd)/data:/from" -v aichat_aichat-data:/to alpine sh -c 'cp -a /from/. /to/ || true'
```

### 5.3 重新启动新配置

```bash
docker compose --env-file .env.production up -d --build --force-recreate
```

### 5.4 验证

```bash
docker compose ps
docker compose logs --tail=200 ai-chat-web
```

## 6. 升级流程（无停机最小化）

```bash
cd ~/aichat
git pull
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d
docker compose ps
docker compose logs --tail=200 ai-chat-web
```

建议每次升级后执行：

- 管理员登录
- 模型连通性测试
- 聊天流式接口测试

## 7. 回滚流程

1. 查看最近提交

```bash
git log --oneline -n 10
```

2. 切回目标版本并重启

```bash
git checkout <commit-id>
docker compose --env-file .env.production up -d --build --force-recreate
```

3. 验证健康状态与核心功能

```bash
curl -fsS http://127.0.0.1:3000/healthz
docker compose logs --tail=200 ai-chat-web
```

## 8. 备份与恢复

### 8.1 备份命名卷

```bash
mkdir -p ~/backup/aichat

docker run --rm \
  -v aichat_aichat-data:/data \
  -v ~/backup/aichat:/backup \
  alpine sh -c 'cd /data && tar czf /backup/aichat-data-$(date +%F-%H%M%S).tar.gz .'
```

### 8.2 恢复命名卷

```bash
# 停服务
docker compose --env-file .env.production down

# 清空并恢复

docker run --rm \
  -v aichat_aichat-data:/data \
  -v ~/backup/aichat:/backup \
  alpine sh -c 'rm -rf /data/* && tar xzf /backup/<backup-file>.tar.gz -C /data'

# 启动
docker compose --env-file .env.production up -d
```

## 9. 常见故障排查

### 9.1 容器反复重启

```bash
docker compose ps
docker compose logs --tail=300 ai-chat-web
```

重点看：

- 环境变量缺失
- API 连接失败
- 文件权限异常

### 9.2 配置解析失败

```bash
docker compose --env-file .env.production config
```

若报 YAML 错误，先检查 `docker-compose.yml` 的 `healthcheck.test` 是否保持字符串格式。

### 9.3 出现 `EACCES: permission denied, open '/data/...'`

处理建议：

- 使用当前默认命名卷配置（首选）
- 若强制用 bind mount，先执行：

```bash
mkdir -p data
chown -R 1000:1000 data
chmod -R u+rwX,g+rwX data
```

### 9.4 模型列表加载失败

- 确认 `API_BASE_URL`、`API_KEY` 正确
- 通过管理页“连通性测试”验证上游
- 检查服务器是否能访问上游接口

### 9.5 登录后马上失效

- 生产 HTTPS 场景需 `SESSION_COOKIE_SECURE=true`
- 检查反向代理是否透传 Cookie 相关头

## 10. 反向代理建议（Nginx）

- 对外仅开放 80/443
- 应用容器端口只在内网暴露
- 对 `/api/chat/stream` 关闭代理缓冲，保持长连接
- 配置 TLS 并启用 HSTS（按业务策略）

## 11. 运维巡检建议

建议至少每日检查一次：

- `docker compose ps`
- `docker compose logs --tail=200 ai-chat-web`
- `/healthz` 可用性
- 备份任务是否执行成功

## 12. 参考命令速查

```bash
# 启动
docker compose --env-file .env.production up -d --build

# 停止
docker compose --env-file .env.production down

# 重启单服务
docker compose --env-file .env.production restart ai-chat-web

# 查看配置展开结果
docker compose --env-file .env.production config

# 查看健康状态
docker inspect --format='{{json .State.Health}}' ai-chat-web
```
## 会话数据落盘

新增环境变量：

- `CONVERSATIONS_CONFIG_PATH`：会话持久化文件路径（建议生产设置为 `/data/runtime-conversations.json`）。
- `MAX_STORED_CONVERSATIONS_PER_USER`：每个用户最大保留会话数（默认 120）。

应用通过 `GET/PUT /api/conversations` 保存登录用户的会话，支持跨设备同步。


## 13. SearXNG Integration

The compose file now includes a built-in `searxng` service and wires AI Chat to it by default.

Key variables in `.env.production`:
- `SEARXNG_BASE_URL=http://searxng:8080`
- `SEARXNG_SEARCH_PATH=/search`
- `SEARXNG_RESULT_COUNT=5`
- `SEARXNG_TIMEOUT_MS=12000`
- `WEB_SEARCH_SERVER_ENABLED=true`
- `WEB_SEARCH_DEFAULT_ENABLED=false`

Bring up services:
```bash
docker compose --env-file .env.production up -d --build
```

Check SearXNG container:
```bash
docker compose ps searxng
docker compose logs --tail=100 searxng
```

Verify local SearXNG API:
```bash
curl "http://127.0.0.1:8080/search?q=openai&format=json"
```
