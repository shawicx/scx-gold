# ============================================================
# scx-gold Dockerfile（多阶段构建）
# 阶段 1：Node 22 + pnpm 构建静态文件
# 阶段 2：nginx 托管 dist/ 并反向代理 API
# ============================================================

# ---------- 阶段 1：构建 ----------
FROM node:22-alpine AS builder

# 启用 corepack 并激活 pnpm 11.0.9（与 packageManager 字段一致）
RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

WORKDIR /app

# 先复制依赖清单，利用 Docker 层缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# 复制源码并构建
COPY . .
RUN pnpm run build

# ---------- 阶段 2：nginx 运行时 ----------
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置（静态托管 + API 反向代理）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 6900

CMD ["nginx", "-g", "daemon off;"]
