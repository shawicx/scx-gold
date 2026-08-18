# CI/CD

GitHub Actions 工作流 `.github/workflows/deploy.yml`，实现「测试 → 构建镜像 → 推送 ACR → SSH 部署 ECS」全链路。

## 触发条件

| 事件 | 执行范围 |
| ---- | ---- |
| `push` 到 `main` | test → build&push → deploy（完整链路） |
| `pull_request` 到 `main` | 仅 test（不部署） |
| `workflow_dispatch` | 完整链路（手动触发） |

并发控制：`concurrency` group `cicd-scx-gold-${{ github.ref }}`，`cancel-in-progress: true`（同分支新提交取消旧运行）。

> 来源：`.github/workflows/deploy.yml:1-37`

## Job 依赖链

```text
test (push + PR)
  └─ build-and-push (仅 push main / workflow_dispatch)
      └─ deploy
```

## Job 1：test（`ubuntu-latest`）

1. Checkout
2. `oven-sh/setup-bun@v2` 安装 bun 1.3.14
3. `actions/setup-node@v4` Node 22
4. `bun install --frozen-lockfile`
5. `bun run test`（Vitest）
6. `bun run build`（tsc + vite build，验证类型与构建）

> 来源：`.github/workflows/deploy.yml:43-69`

## Job 2：build-and-push

1. `docker build -t scx-gold:latest .`（多阶段构建，见 [docker-nginx.md](docker-nginx.md)）
2. 登录阿里云 ACR（`ACR_REGISTRY` / `ACR_USERNAME` / `ACR_PASSWORD`）
3. 打两个 tag 并推送：
   - `<registry>/<namespace>/scx-gold:latest`
   - `<registry>/<namespace>/scx-gold:sha-<7位commit>`

> 来源：`.github/workflows/deploy.yml:73-103`

## Job 3：deploy（SSH 到 ECS）

用 `appleboy/ssh-action@v1` 登录 ECS 执行：

1. 登录 ACR
2. `docker pull <image>:latest`
3. 停止并删除旧容器 `scx-gold`（`stop_and_rm`）
4. `docker run -d --name scx-gold --network host --restart=always -m 128m <image>`
5. `docker image prune -f`（清理悬空镜像）
6. **健康检查**：轮询 `http://localhost:6900`，每 5s 一次，最多 6 次（30s）
   - HTTP 200 → 通过，打印运行中容器状态，退出
   - 超时 → 打印容器状态 + 最近 80 行日志，`exit 1` 失败

> 来源：`.github/workflows/deploy.yml:108-176`

## 依赖的 GitHub Secrets

与后端仓库 `scx-stock-api` 共用：

| Secret | 用途 |
| ---- | ---- |
| `ACR_REGISTRY` | 阿里云 ACR 注册地址 |
| `ACR_NAMESPACE` | ACR 命名空间 |
| `ACR_USERNAME` / `ACR_PASSWORD` | ACR 登录凭证 |
| `ECS_HOST` | ECS 主机地址 |
| `ECS_USER` | SSH 用户 |
| `ECS_SSH_KEY` | SSH 私钥 |

## 部署后验证

健康检查通过后，工作流输出运行中的 `scx-gold` 容器状态（`docker ps`）。应用访问入口为 ECS 的 `6900` 端口。

## 相关

- [Docker + Nginx](docker-nginx.md)
- [环境前置](../02-getting-started/prerequisites.md)
