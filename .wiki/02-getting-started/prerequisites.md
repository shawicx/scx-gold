# 环境前置

## 前端运行环境

| 依赖 | 版本 | 说明 |
| ---- | ---- | ---- |
| Node.js | 22 | Dockerfile 与 CI 均用 `node:22-alpine` / `setup-node@v4` node 22 |
| pnpm | 11.0.9 | `packageManager` 字段锁定；CI 用 `pnpm/action-setup@v4` 激活 |
| 浏览器 | 现代浏览器 | SPA，依赖 ES2020 + Tailwind v4 |

> `pnpm-workspace.yaml` 声明本目录为 workspace 根（`packages: [.]`），并允许 esbuild 原生构建（`allowBuilds.esbuild: true`）。

## 后端依赖（联调必需）

前端大部分数据来自后端 `scx-stock-api`（独立仓库）。本地开发需先启动后端：

- 后端监听 `http://localhost:8000`（dev proxy 目标，见 `vite.config.ts:16`）
- 后端需连通其数据库（关注列表、分析报告、配置等持久化在后端 DB）
- 后端需配置东方财富/上金所等数据源（指数、板块、黄金、全量同步）

> 后端仓库与启动方式**待确认**（不在本仓库内）。仅涨停筛选器主列表不依赖后端（走东方财富 JSONP），可独立运行。

## 可选依赖

- LLM 提供商账号（DeepSeek / 智谱 GLM）—— 用于 ETF 支撑位 AI 解读，在「设置」页配置
- SMTP 账号 —— 用于分析报告邮件推送与授权码发送，在「设置」页配置

## 验证安装

```bash
pnpm install   # 安装依赖
pnpm dev       # 启动开发服务器（默认 Vite 端口 5173）
```

打开浏览器访问开发服务器地址，应能看到涨停筛选器页面。

## 相关

- [本地开发](local-development.md)
- [配置](configuration.md)
