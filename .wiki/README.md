# scx-gold Wiki

A 股涨停候选筛选器 + ETF 支撑位分析 + 黄金行情 的前端单页应用（React 18 + Vite 5 + TypeScript + Tailwind v4）。

本仓库**仅含前端**。后端为独立服务 `scx-stock-api`（FastAPI），通过 `/api/v1/*`、`/admin/*`、`/health` 提供数据，前端在开发期由 Vite proxy、生产期由 nginx 反代转发。股票涨停列表因依赖主力资金/行业字段，仍走东方财富公开 JSONP 直连。

## 阅读路径

- **新人快速上手** → [`01-overview/project-overview.md`](01-overview/project-overview.md) → [`02-getting-started/local-development.md`](02-getting-started/local-development.md)
- **理解架构** → [`01-overview/architecture.md`](01-overview/architecture.md) → [`03-codebase/data-flow.md`](03-codebase/data-flow.md)
- **理解业务** → [`04-business/`](04-business/) 各页面
- **对接接口** → [`05-api/api-overview.md`](05-api/api-overview.md) → [`05-api/backend-endpoints.md`](05-api/backend-endpoints.md)
- **部署运维** → [`06-deployment/ci-cd.md`](06-deployment/ci-cd.md)

## 目录导航

| 目录 | 内容 |
| ---- | ---- |
| [01-overview](01-overview/project-overview.md) | 项目定位与整体架构 |
| [02-getting-started](02-getting-started/prerequisites.md) | 环境准备、本地开发、配置 |
| [03-codebase](03-codebase/repository-structure.md) | 源码结构、数据流、状态管理 |
| [04-business](04-business/screener.md) | 三大业务域（筛选器 / ETF 分析 / 黄金） |
| [05-api](05-api/api-overview.md) | 前后端通信、后端接口清单、东方财富 JSONP |
| [06-deployment](06-deployment/docker-nginx.md) | Docker + nginx + CI/CD |
| [99-reference](99-reference/glossary.md) | 术语表 |

## 技术栈速览

| 维度 | 选型 |
| ---- | ---- |
| 框架 | React 18 + react-router-dom 7 |
| 构建 | Vite 5 |
| 语言 | TypeScript 5（strict） |
| 样式 | Tailwind CSS v4（`@theme inline` 映射 CSS 变量，明/暗主题） |
| 动画 | GSAP + `@gsap/react` |
| HTTP | axios（封装于 `src/service/request.ts`） |
| API 代码生成 | `@scxfe/api-tool`（从 Apifox OpenAPI 生成 `src/service/`） |
| 测试 | Vitest + Testing Library + jsdom |
| 包管理 | pnpm 11（workspace） |
| 部署 | Docker（nginx:alpine）→ 阿里云 ACR → ECS（host 网络，6900 端口） |

## 相关文档

- 设计文档：`docs/superpowers/specs/`（已 gitignore，仅本地保留）
  - `2026-06-14-zhangting-screener-design.md` — 涨停筛选器原始设计
  - `2026-07-26-service-migration-design.md` — 后端 service 层迁移设计
  - `2026-06-15-tailwind-gsap-design.md` — Tailwind v4 + GSAP 改造设计
- README：`/README.md`（极简，仅 dev/test 命令）

> 注：设计文档目录 `docs/superpowers` 在 `.gitignore` 中，Wiki 中仅作参考引用，不复制内容。
