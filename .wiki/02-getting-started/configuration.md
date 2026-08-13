# 配置

scx-gold 的配置分三层：构建期、代码生成期、运行期。

## 1. 构建期配置

### Vite（`vite.config.ts`）

- 插件：`@vitejs/plugin-react`、`@tailwindcss/vite`
- 路径别名：`@` → `./src`
- 开发代理：`/api`、`/admin`、`/health` → `http://localhost:8000`（详见 [local-development.md](local-development.md)）
- 测试：jsdom + globals

### TypeScript（`tsconfig.json`）

- `target: ES2020`、`module: ESNext`、`moduleResolution: bundler`
- `strict` 全开 + `noUnusedLocals/Parameters`
- `jsx: react-jsx`（无需手动 import React）
- `paths: { "@/*": ["./src/*"] }`
- 引用 `tsconfig.node.json`（仅覆盖 `vite.config.ts`）

### Tailwind（`src/styles/index.css`）

v4 写法，`@theme inline` 把 CSS 变量映射为 Tailwind token，明/暗主题用 `:root` 与 `[data-theme='dark']` 覆盖变量值。无独立 `tailwind.config.js`。

## 2. 代码生成配置（`api-power.config.ts`）

`@scxfe/api-tool` 从 Apifox OpenAPI 生成后端 API 调用代码：

| 配置项 | 值 | 说明 |
| ---- | ---- | ---- |
| `source` | Apifox OpenAPI 导出 URL | 后端接口定义来源 |
| `outputDir` | `src/service` | 生成目录 |
| `requestFunctionFilePath` | `src/service/request.ts` | 自定义请求函数位置 |
| `requestFunctionName` | `request` | 函数名 |
| `generateApi` / `generateTypes` | `true` | 同时生成函数与类型 |
| `typesFormat` | `typescript` | 编译期类型（非 zod） |

> **重要取舍**：生成的 `*ResultType.data` 常为 `null`（后端 OpenAPI 把 `data` 声明为 `anyOf:[{}, null]`），真实返回类型**手写**于 `src/service/types/models.ts`。生成器重跑会覆盖 `src/service/*/index.ts`，需重新手改路径参数与类型。详见 `docs/superpowers/specs/2026-07-26-service-migration-design.md` §3.2。

## 3. 运行期配置（应用内「设置」页）

以下配置**存后端 DB**，通过 `/settings` 页面管理，保存后即时生效（无需重启）：

### LLM 配置（用于 ETF 支撑位 AI 解读）

| 字段 | 说明 |
| ---- | ---- |
| `llm_provider` | `deepseek` / `glm` |
| `llm_api_key` | 提供商 API Key（GET 返回脱敏） |
| `llm_base_url` | 如 `https://api.deepseek.com/v1` |
| `llm_model` | 如 `deepseek-chat` |
| `llm_timeout` | 超时 |

支持「测试连接」（`POST /api/v1/settings/test-llm`）。

### SMTP 配置（用于报告邮件推送 + 授权码发送）

| 字段 | 说明 |
| ---- | ---- |
| `smtp_host` / `smtp_port` | 如 `smtp.qq.com:465` |
| `smtp_user` / `smtp_password` | 账号 / 授权码 |
| `smtp_from_name` | 发件人名称 |
| `smtp_use_ssl` | 是否 SSL |
| `notify_emails` | 收件人（逗号分隔） |

支持「发送测试邮件」（`POST /api/v1/settings/test-smtp`）。

> 接口详见 [05-api/backend-endpoints.md](../05-api/backend-endpoints.md)。

## 环境变量

本项目**不使用** `.env` 环境变量（`.gitignore` 忽略 `.env*`）。所有运行期配置走后端 DB 的设置页；构建期配置写死在 `vite.config.ts` / `tsconfig.json`。

CI/CD 所需密钥（ACR/ECS）通过 GitHub Secrets 注入，详见 [06-deployment/ci-cd.md](../06-deployment/ci-cd.md)。

## 相关

- [本地开发](local-development.md)
- [前后端通信](../05-api/api-overview.md)
- [架构 - 样式架构](../01-overview/architecture.md#样式架构)
