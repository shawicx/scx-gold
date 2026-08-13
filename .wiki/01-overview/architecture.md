# 架构

scx-gold 是一个纯前端 SPA，分层清晰：UI 层（pages/components）→ 状态层（context/hooks）→ 数据层（service/api）。

## 分层总览

```text
┌─────────────────────────────────────────────────────────┐
│  UI 层  src/pages/*.tsx  +  src/components/*.tsx         │
├─────────────────────────────────────────────────────────┤
│  状态层  src/context/*Provider  +  src/hooks/*           │
│         （Auth / Theme / Watchlist / Filter）            │
├─────────────────────────────────────────────────────────┤
│  数据层                                                   │
│   ├─ src/service/*  → 后端 scx-stock-api（axios 封装）   │
│   └─ src/api/*      → 东方财富 JSONP（直连）             │
├─────────────────────────────────────────────────────────┤
│  工具层  src/utils/*  +  src/data/industry-map.ts        │
└─────────────────────────────────────────────────────────┘
```

## 入口与 Provider 嵌套

入口 `src/main.tsx` → `src/App.tsx`。Provider 嵌套顺序（外→内）：

```text
ThemeProvider
  └─ AuthProvider              ← 提供 isAuthenticated，控制 AuthModal
      └─ WatchlistProvider     ← 关注列表（后端 DB + localStorage 兜底）
          └─ AppInner
              ├─ BrowserRouter + NavBar
              ├─ Routes（4 个页面）
              └─ AuthModal（未认证时覆盖）
```

`FilterProvider` 仅在 `ScreenerPage` 内部局部提供（筛选状态不需全局共享）。

> 来源：`src/App.tsx:46-56`

## 双数据源

### 1. 后端 `scx-stock-api`（主数据源）

- 开发：Vite proxy 把 `/api`、`/admin`、`/health` 转发到 `http://localhost:8000`（`vite.config.ts:13-28`）
- 生产：nginx 反代到 `127.0.0.1:3800`（`nginx.conf:26-35`，host 网络同机部署）
- 统一响应 `{ code, message, data }`，`code===0` 成功，由 `src/service/request.ts` 解包
- 代码由 `@scxfe/api-tool` 从 Apifox OpenAPI 生成（`api-power.config.ts`），手写真实类型于 `src/service/types/models.ts`

### 2. 东方财富 JSONP（股票涨停列表）

- 前端直连 `https://push2.eastmoney.com/api/qt/clist/get`，免 key
- 仅用于涨停筛选器主列表（依赖主力资金 `f62`、行业等字段，后端暂未补齐）
- `src/api/eastmoney.ts` 封装 JSONP；`src/api/stocks.ts` 做字段映射
- 详见 [05-api/eastmoney-jsonp.md](../05-api/eastmoney-jsonp.md)

> 第二期迁移计划：后端补齐 `main_net_inflow`/`industry` 后，股票列表也迁到后端 service 层（见 `docs/superpowers/specs/2026-07-26-service-migration-design.md` §7）。

## 认证流

```text
用户访问 → useAuth().isAuthenticated?
  ├─ 是 → 正常渲染页面（每次请求自动注入 X-Access-Token 头）
  └─ 否 → AuthModal 覆盖
            ├─ 点「获取授权码」→ POST /api/v1/auth/request-code（后端生成 16 位码发邮箱）
            ├─ 输入码 → POST /api/v1/auth/verify → valid 则 authenticate(token) 存 localStorage
            └─ 401 时 request.ts 自动清 token → 回到未认证态
```

> 来源：`src/context/AuthContext.tsx`、`src/components/AuthModal.tsx`、`src/service/request.ts:104-109`

## 状态管理

本项目**不使用 Redux / Zustand**，全部用 React Context + 自定义 hooks：

| Context | 职责 | 持久化 |
| ---- | ---- | ---- |
| `AuthContext` | 授权码 token、isAuthenticated | `localStorage` `scx-gold.access-token` |
| `ThemeContext` | 明/暗主题 | `localStorage` `scx-gold.theme` |
| `WatchlistContext` | 关注列表（后端 DB 为主） | 后端 DB + `localStorage` `scx-gold.watchlist` 兜底 |
| `FilterContext` | 涨停筛选条件（板块/涨幅区间/资金门槛/排除 ST） | 无（页面级，刷新重置） |

详见 [03-codebase/state-management.md](../03-codebase/state-management.md)。

## 样式架构

- Tailwind CSS v4，通过 `@tailwindcss/vite` 插件集成
- `src/styles/index.css` 用 `@theme inline` 把 CSS 变量映射为 Tailwind 颜色 token（如 `--color-up` → `text-up`）
- 明/暗主题靠 `:root` / `[data-theme='dark']` 切换 CSS 变量值，`ThemeContext` 设置 `document.documentElement.dataset.theme`
- **配色约定**（A 股惯例）：红涨绿跌 —— `--up`（红）= 涨，`--down`（绿）= 跌

> 来源：`src/styles/index.css:1-49`

## 相关

- [项目总览](project-overview.md)
- [数据流](../03-codebase/data-flow.md)
- [前后端通信](../05-api/api-overview.md)
