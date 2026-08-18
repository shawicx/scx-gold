# Docker + Nginx 部署

scx-gold 构建为静态文件，由 nginx 托管并反向代理 API 到后端。

## 多阶段 Dockerfile（`Dockerfile`）

### 阶段 1：构建（`oven/bun:1-alpine`）

1. 先复制 `package.json` + `bun.lock`，`bun install --frozen-lockfile`（利用层缓存）
2. 复制源码，`bun run build`（`tsc` 类型检查 + `vite build`）→ 产出 `dist/`

### 阶段 2：运行时（`nginx:alpine`）

1. 复制构建产物 `dist/` → `/usr/share/nginx/html`
2. 复制 `nginx.conf` → `/etc/nginx/conf.d/default.conf`
3. 暴露端口 `6900`
4. 启动命令 `nginx -g "daemon off;"`

> 来源：`Dockerfile:1-34`

## nginx 配置（`nginx.conf`）

监听 `6900`，职责：

| location | 作用 |
| ---- | ---- |
| `/` | `try_files $uri $uri/ /index.html`（SPA history 路由 fallback） |
| `/api/` | 反代 `http://127.0.0.1:3800`（后端 stock-api，host 网络同机） |
| `/health` | 反代 `http://127.0.0.1:3800`（健康检查） |
| `/admin/` | 反代 `http://127.0.0.1:3800`（运维端点） |
| `~* \.(js\|css\|png\|...)` | 静态资源永久缓存（`expires 1y` + `immutable`，hash 化文件名） |

**关键超时**：`/api/` 的 `proxy_read_timeout 120s` / `proxy_send_timeout 120s`（后端拉取全市场行情可能 30-60s，多源 fallback）。

> 来源：`nginx.conf:1-55`

## 网络拓扑

```text
ECS 主机（host 网络）
  ├─ nginx 容器（scx-gold，端口 6900）
  │    ├─ 静态托管 dist/
  │    └─ 反代 /api /admin /health → 127.0.0.1:3800
  └─ 后端容器（scx-stock-api，端口 3800）
       └─ 连接其数据库
```

容器以 `--network host` 运行，nginx 与后端通过 `127.0.0.1` 通信（同机部署）。内存限制 `128m`。

## .dockerignore

排除 `node_modules`、`dist`、`.git`、`.github`、`.remember`、`.env*`、`docs` 等，避免污染构建上下文。

## 相关

- [CI/CD](ci-cd.md)
- [前后端通信总览](../05-api/api-overview.md)
- [本地开发](../02-getting-started/local-development.md)
