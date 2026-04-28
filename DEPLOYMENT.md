# Deployment Guide

## 1. 生产部署步骤

```bash
cd ~/aichat
git pull
cp .env.production.example .env.production
# 编辑 .env.production，至少改 API_BASE_URL / API_KEY / ADMIN_PASSWORD

docker compose --env-file .env.production up -d --build
docker compose ps
docker compose logs -f ai-chat-web
```

## 2. 健康检查

```bash
curl http://127.0.0.1:3000/healthz
```

期望包含：

- `status: ok`

## 3. 数据持久化策略

默认使用 Docker 命名卷：

- `aichat-data:/data`

优点：

- 避免宿主机目录权限不一致
- 避免 `EACCES: permission denied, open '/data/runtime-users.json'`

## 4. 从旧版（bind mount）迁移

如果你之前用的是 `./data:/data`，请执行：

```bash
cd ~/aichat
git pull
docker compose --env-file .env.production down --remove-orphans
# 可选：删除旧命名卷（如果存在）
docker volume rm aichat_aichat-data 2>/dev/null || true

docker compose --env-file .env.production up -d --build
```

## 5. 故障排查

1. 容器反复重启

```bash
docker compose ps
docker compose logs --tail=200 ai-chat-web
```

2. 变量是否生效

```bash
docker compose --env-file .env.production config
```

3. 模型接口不可用

- 检查 `API_BASE_URL` 与 `API_KEY`
- 在管理页执行“连通性测试”

## 6. 可选：继续使用宿主机目录挂载

仅在你明确需要直接访问本地文件时再用 `./data:/data`，并提前修复权限：

```bash
mkdir -p data
chown -R 1000:1000 data
chmod -R u+rwX,g+rwX data
```