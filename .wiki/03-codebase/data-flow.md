# 数据流

描述前端如何取数、转换、流转到 UI。

## 调用链总览

### 涨停筛选器（后端 service 链路）

```text
ScreenerPage
  └─ useScreener(filters, isTrading)          [src/hooks/useScreener.ts]
      └─ fetchAllStocks(boardScope)           [src/service/stockListAdapter.ts]
          └─ getApiV1StockListFunc(...)       [src/service/GeGu/index.ts]
              └─ request<StockListData>(...)  [src/service/request.ts]
                  └─ axios → /api/v1/stock/list（后端）
          └─ adaptStockListItem()             snake_case → camelCase + market 归一化
      └─ filterStocks(allStocks, filters)     前端二次过滤（涨幅区间/资金/ST）
  └─ generateClues(stock)                     [src/utils/clues.ts] 生成线索标签
```

### 其余页面（后端 service 链路）

```text
页面/Hook
  └─ src/service/<模块>/index.ts              生成的 API 函数
      └─ request<T>(config)                   [src/service/request.ts]
          ├─ 路径参数替换 {code} → 实际值
          ├─ 注入 X-Access-Token 头（从 localStorage 读）
          ├─ axios 发请求（相对路径 /api/v1/...）
          ├─ 解包统一响应 { code, message, data }
          │    ├─ code===0 → 返回 data
          │    └─ code!==0 → 抛 ApiError
          └─ HTTP 401 → 清 token（触发重新认证）
```

## 统一请求封装（`src/service/request.ts`）

核心职责（来源：文件头注释）：

1. **路径参数替换**：`pathParams` 替换 URL 中 `{key}` 占位符，避免被当 query 发送
2. **统一响应解包**：后端返回 `{ code, message, data }`，`code===0` 返回裸 `data`
3. **业务码校验**：`code!==0` 抛 `ApiError(message, status, code)`
4. **错误归一化**：HTTP 非 2xx、网络错误统一为 `ApiError`
5. **认证注入**：从 `localStorage` 读 token 注入 `X-Access-Token`（不依赖 AuthContext，避免循环依赖）
6. **401 自动登出**：HTTP 401 清除 token，触发 AuthModal 重新认证
7. **超时**：120s（全量同步等已改异步任务，此超时覆盖普通请求）

```typescript
// 典型调用
const data = await request<StockListData>({
  url: '/api/v1/stock/list',
  method: 'GET',
  params: { page: 1, page_size: 100 },
});
```

## 数据适配（`stockListAdapter.ts`）

后端 `StockListItem`（snake_case，字段可空）→ 前端 `Stock`（camelCase，字段不可空）：

| 转换 | 说明 |
| ---- | ---- |
| 字段命名 | snake_case → camelCase |
| code 归一化 | 去掉市场前缀（`sz300209`→`300209`），详情等路径参数接口与涨停阈值判断只认纯数字代码 |
| market 归一化 | `"上证"→sh`、`"深证"/"创业板"→sz`、`"北交所"/其他/bj`、`"ETF"→bj`（占位） |
| null → 默认值 | 后端可空字段 → 0 / `'未知'` |
| isST 推断 | `name.includes('ST')` |
| 分页拉满 | 按 `change_pct` 降序分页，遇到涨幅 <9.5% 提前终止（涨停候选一定排在前面） |

**提前终止策略**（`fetchAllStocks`）：后端单页 ≤100，涨停候选股排在最前，拉到涨幅低于 9.5% 即停，通常 1-3 页（100-300 条），把全市场 5500 条的拉取时间从 30s 降到 3-5s。

> 来源：`src/service/stockListAdapter.ts:50-105`

## 交易时段轮询

`useTradingHours`（`src/hooks/useTradingHours.ts`）判定是否在 A 股交易时段（**北京时间**，非宿主本地时区）：

- 早盘 09:15–11:30
- 午盘 13:00–15:30
- 周末非交易

`useScreener` 仅在交易时段每 30s 轮询一次（`POLL_INTERVAL = 30_000`），非交易时段停止轮询但保留最后一次快照。

> 跨时区处理：用 `Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai' })` 强制按北京时间计算，避免 CI/UTC 环境误判。

## 关注列表数据流（乐观更新）

```text
WatchlistContext
  ├─ 启动：getApiV1WatchlistFunc() 从后端加载 → setItems + localStorage 缓存
  │        失败 → 用 localStorage 兜底
  ├─ add(code)：
  │    1. 乐观 setItems（立即 UI 更新）+ localStorage
  │    2. postApiV1WatchlistFunc(code) 同步后端
  │    3. 用后端返回的补全 name 更新
  │    失败 → 保持乐观态（下次加载纠正）
  ├─ remove(code)：乐观删除 + DELETE 后端
  └─ clear()：本地清空 + PUT 空列表到后端
```

> 来源：`src/context/WatchlistContext.tsx`

## 错误处理策略

| 场景 | 表现 |
| ---- | ---- |
| 涨停列表请求失败 | 红色 Banner + 「重试」按钮 + `isStale=true` |
| 指数/板块后端业务错误 | 静默隐藏（设计约定，不打扰主链路） |
| 分析失败 | 红色 Banner + 「重试」 |
| 黄金行情失败 | 红色 Banner + 「重试」 |
| HTTP 401 | 自动清 token → AuthModal 重新认证 |
| 后端不可达（关注列表） | localStorage 兜底缓存 |

> 来源：`docs/superpowers/specs/2026-07-26-service-migration-design.md` §4

## 相关

- [源码结构](repository-structure.md)
- [前后端通信](../05-api/api-overview.md)
- [东方财富 JSONP](../05-api/eastmoney-jsonp.md)
