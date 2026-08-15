# 前后端通信总览

scx-gold 前端与后端 `scx-stock-api`（独立仓库，FastAPI）通过 HTTP JSON 通信，**单一数据源**（无前端直连的第三方通道）。

## 数据通道

| 通道 | 用途 | 目标 | 前端入口 |
| ---- | ---- | ---- | ---- |
| 后端 service 层 | 股票/指数/板块/搜索/关注/分析/黄金/配置/认证/运维/健康 | dev `localhost:8000` / prod `127.0.0.1:3800` | `src/service/request.ts` |

> 历史通道：东方财富 JSONP 直连（`src/api/`）已随第二期迁移删除（后端补齐主力资金/行业字段后），详见 `docs/superpowers/specs/2026-07-26-service-migration-design.md` §7。

## 后端基地址与转发

前端**不写死 baseURL**，所有请求走相对路径：

| 环境 | 转发方式 | 后端地址 |
| ---- | ---- | ---- |
| 开发 | Vite dev proxy（`vite.config.ts:13-28`） | `http://localhost:8000` |
| 生产 | nginx 反代（`nginx.conf:26-48`） | `http://127.0.0.1:3800`（host 网络同机） |

代理前缀：`/api`、`/admin`、`/health`。

## 统一响应格式

后端所有业务接口返回：

```typescript
{ code: number; message: string; data: T | null }
```

- `code === 0` 成功，`request.ts` 返回裸 `data`
- `code !== 0` 业务错误，抛 `ApiError(message, status, code)`
- 非 `/api` 接口（如 `/health`、第三方）可能不走此格式，`request.ts` 检测到无 `code` 字段时直接返回 body

> 来源：`src/service/request.ts:83-98`、`src/service/types/ApiResponse.ts`

## 认证

- 授权码（16 位）由后端生成并发邮箱（`POST /api/v1/auth/request-code`）
- 前端校验通过后存 `localStorage`（key `scx-gold.access-token`）
- `request.ts` 每次请求自动从 `localStorage` 读 token，注入 `X-Access-Token` 请求头
- HTTP 401 → 自动清 token → AuthModal 重新认证
- 详见 [01-overview/architecture.md#认证流](../01-overview/architecture.md#认证流)

## 错误模型（ApiError）

来源：`src/service/request.ts:30-42`

```typescript
class ApiError extends Error {
  readonly status: number;  // HTTP 状态码（业务码错误时为 200）
  readonly code: number;    // 后端业务码（HTTP 错误时为 0）
}
```

| 场景 | status | code | 表现 |
| ---- | ---- | ---- | ---- |
| 业务码非 0（如 40401 数据不可用） | 200 | 非 0 | 抛 ApiError(message, 200, code) |
| HTTP 非 2xx | 实际 HTTP 码 | 从 body.code 提取或 0 | 抛 ApiError(message, status, code) |
| 网络错误/超时 | 0 | 0 | 抛 ApiError(message, 0, 0) |
| HTTP 401 | 401 | — | 清 token + 抛 ApiError |

## 请求超时

`TIMEOUT = 120 * 1000`（120 秒）。全量同步等长耗时操作已改为异步任务模式（提交 task_id 后轮询），此超时仅覆盖普通秒级请求。

> 来源：`src/service/request.ts:22-25`

## service 层代码生成

`src/service/<模块>/index.ts` 由 `@scxfe/api-tool` 从 Apifox OpenAPI 生成，但存在已知问题（生成器通病），需手改：

- 路径参数 `{code}` 被当 query → 改用 `pathParams`
- `data: null` 类型 → 手写真实返回类型于 `src/service/types/models.ts`
- 多余的 `params` 传参 → 清理

> 生成器重跑会覆盖，需重新手改。详见 `docs/superpowers/specs/2026-07-26-service-migration-design.md` §3.2-3.3。

## 相关

- [后端接口清单](backend-endpoints.md)
- [东方财富 JSONP](eastmoney-jsonp.md)
- [数据流](../03-codebase/data-flow.md)
- [配置 - 代码生成](../02-getting-started/configuration.md#代码生成配置api-powerconfigts)
