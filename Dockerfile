# ============================================================
# scx-gold Dockerfile（多阶段构建）
# 阶段 1：Bun（oven/bun:1-alpine）构建静态文件
# 阶段 2：nginx 托管 dist/ 并反向代理 API
# ============================================================

# ---------- 阶段 1：构建 ----------
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# 先复制依赖清单，利用 Docker 层缓存
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 复制源码并构建
COPY . .
RUN bun run build

# ---------- 阶段 2：nginx 运行时 ----------
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置（静态托管 + API 反向代理）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 6900

CMD ["nginx", "-g", "daemon off;"]
