# 本地开发

## 常用命令

| 命令 | 作用 | 来源 |
| ---- | ---- | ---- |
| `pnpm install` | 安装依赖（frozen-lockfile 用于 CI） | `package.json` scripts |
| `pnpm dev` | 启动 Vite 开发服务器（HMR） | `vite.config.ts` |
| `pnpm build` | `tsc` 类型检查 + `vite build` 产出 `dist/` | `package.json:9` |
| `pnpm preview` | 预览构建产物 | — |
| `pnpm test` | Vitest 单次运行 | `vitest run` |
| `pnpm test:watch` | Vitest 监听模式 | `vitest` |

## 开发服务器与后端联调

Vite dev server 配置了反向代理（`vite.config.ts:13-28`），把以下前缀转发到后端 `http://localhost:8000`：

| 前缀 | 用途 |
| ---- | ---- |
| `/api` | 后端业务接口 |
| `/admin` | 运维接口（全量同步、重建索引、任务状态） |
| `/health` | 健康检查 |

所有代理均 `changeOrigin: true`。前端代码中所有请求走**相对路径**（如 `/api/v1/stock/list`），不写死 baseURL，由 dev proxy / 生产 nginx 转发。

> 唯一例外：涨停筛选器的股票列表直连东方财富 `push2.eastmoney.com`（JSONP），不走代理。

## 联调后端的前提

1. 后端 `scx-stock-api` 已在 `localhost:8000` 运行
2. 后端 DB 已初始化（关注列表、分析报告、配置表）
3. 首次使用需在「设置」页（`/settings`）执行「全量同步」拉取股票/ETF/行业数据
4. 使用 ETF 分析前需配置 LLM（设置页 → LLM 配置 → 测试连接）

> 后端未启动时：涨停筛选器主列表仍可用（东方财富直连）；其余页面会降级（指数/板块静默隐藏，关注/分析/黄金报错 banner）。

## 测试约定

- **仅纯函数写测试**（设计文档约定：UI 不写测试）
- 现有测试覆盖：
  - `src/utils/clues.test.ts` — 线索标签生成规则
  - `src/utils/format.test.ts` — 数字/金额格式化
  - `src/utils/sort.test.ts` — 多列排序
  - `src/hooks/useTradingHours.test.ts` — 交易时段判定（跨时区）
  - `src/api/eastmoney.test.ts` / `src/api/stocks.test.ts` — 东方财富字段映射
- Vitest 配置：`globals: true`、`environment: 'jsdom'`（`vite.config.ts:29-33`）

## 路径别名

`@/*` → `./src/*`（同时配置于 `tsconfig.json:paths` 与 `vite.config.ts:resolve.alias`），导入一律用 `@/` 前缀。

## 类型检查

`tsconfig.json` 开启 `strict`、`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`。`pnpm build` 会先跑 `tsc`，类型错误会阻断构建。

## 相关

- [环境前置](prerequisites.md)
- [配置](configuration.md)
- [源码结构](../03-codebase/repository-structure.md)
