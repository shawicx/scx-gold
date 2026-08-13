# 状态管理

scx-gold 不使用第三方状态库，全部基于 React Context + 自定义 hooks。

## 四个 Context

### AuthContext（`src/context/AuthContext.tsx`）

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `token` | `string \| null` | 当前授权码 |
| `isAuthenticated` | `boolean` | `token !== null` |
| `authenticate(token)` | fn | 认证成功后存 token |
| `logout()` | fn | 清除 token |

- 持久化：`localStorage` key `scx-gold.access-token`
- `App.tsx` 据 `isAuthenticated` 决定是否渲染 `AuthModal`
- request.ts 直接读 `localStorage`（不经过 Context）注入请求头，避免循环依赖

### ThemeContext（`src/context/ThemeContext.tsx`）

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `theme` | `'light' \| 'dark'` | 当前主题 |
| `toggleTheme()` | fn | 切换 |

- 持久化：`localStorage` key `scx-gold.theme`
- 初始化逻辑：localStorage > `prefers-color-scheme: dark` > `'light'`
- 副作用：`document.documentElement.setAttribute('data-theme', theme)` 触发 CSS 变量切换

### WatchlistContext（`src/context/WatchlistContext.tsx`）

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `items` | `WatchlistItemData[]` | 关注列表 |
| `loading` | `boolean` | 初始加载中 |
| `add(code, name?)` | fn | 添加关注（乐观更新 + 后端同步） |
| `remove(code)` | fn | 移除关注 |
| `has(code)` | fn | 是否已关注 |
| `clear()` | fn | 清空 |

- 数据源：后端 DB（`/api/v1/watchlist`）为主
- 兜底：`localStorage` key `scx-gold.watchlist`（后端不可达时）
- 策略：乐观更新（先改 UI + localStorage，再同步后端，失败保持乐观态）
- 无默认关注列表（用户自行添加）

### FilterContext（`src/context/FilterContext.tsx`）

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `filters` | `FilterState` | 当前筛选条件 |
| `setBoardScope(scope)` | fn | 主板/全部 A 股 |
| `setPctRange([min,max])` | fn | 涨幅区间 |
| `setMinMainInflow(v)` | fn | 主力净流入门槛 |
| `toggleExcludeST()` | fn | 切换排除 ST |
| `resetFilters()` | fn | 重置为默认 |

- **页面级**：仅在 `ScreenerPage` 内部提供（`<FilterProvider>` 包裹），不全局共享
- 无持久化（刷新重置）
- 默认值：`boardScope: 'main'`、`pctRange: [9.8, 10.2]`、`excludeST: true`（来源 `types.ts:DEFAULT_FILTERS`）

## hooks 与 Context 的协作

```text
ScreenerPage
  ├─ <FilterProvider>
  │    └─ useFilters()           ← 读/写筛选条件
  │         └─ filters 传给 useScreener
  ├─ useTradingHours()           ← 判定交易时段（无 Context，纯计算）
  ├─ useScreener(filters, isTrading)
  │    └─ 内部管理 stocks/loading/error/lastUpdated/isStale
  └─ useSort()                   ← 表格排序状态（无 Context）

EtfAnalysisPage
  ├─ useWatchlist()              ← 读关注列表（全局 Context）
  ├─ useAnalysis(codes)          ← 触发分析
  └─ getApiV1AnalysisLatestFunc  ← 初始加载 DB 缓存报告
```

## 数据请求 hooks 模式

项目内一致的 hook 设计模式（以 `useScreener` 为代表）：

- 返回 `{ data, loading, error, lastUpdated, isStale, refresh }`
- `inFlight = useRef(false)` 防止并发重复请求
- `useCallback` 包裹 load 函数，依赖明确
- `useEffect` 触发首次加载 + 交易时段轮询

`useAnalysis` 同构：`{ result, loading, error, run }`。

## 相关

- [数据流](data-flow.md)
- [架构 - 状态管理](../01-overview/architecture.md#状态管理)
- [认证流](../01-overview/architecture.md#认证流)
