# 涨停候选筛选器

核心业务域，路由 `/`，文件 `src/pages/ScreenerPage.tsx`。盘中实时筛选接近涨停的 A 股，辅助短线决策。

## 业务目标

从全市场 A 股中，按涨幅区间（默认 9.8%–10.2%）、主力资金门槛、板块范围筛选出涨停候选股，并通过线索标签高亮关键信号。

## 筛选条件（FilterState）

来源：`src/types.ts:21-33`

| 条件 | 默认值 | 说明 |
| ---- | ---- | ---- |
| `boardScope` | `'main'`（主板） | `main` = 主板（沪 6 开头非 688 + 深 0 开头）；`all` = 全部 A 股 |
| `pctRange` | `[9.8, 10.2]` | 涨幅区间（%） |
| `minMainInflow` | `0`（不限） | 主力净流入下限，预设：5000万 / 1亿 / 3亿 |
| `excludeST` | `true` | 排除 ST 股 |

资金门槛预设（`INFLOW_PRESETS`）：不限 / >5000万 / >1亿 / >3亿。

## 数据来源

- **当前实现**：后端 `/api/v1/stock/list`（已迁移），通过 `stockListAdapter.ts` 适配
- 拉取策略：按 `change_pct` 降序分页，涨幅低于 9.5% 提前终止（详见 [03-codebase/data-flow.md](../03-codebase/data-flow.md)）
- 历史实现：东方财富 JSONP 直连（`src/api/stocks.ts`，保留未用）

## 线索标签（Clue）

来源：`src/utils/clues.ts`。每只股票根据指标自动生成标签，辅助判断。

| 标签 | 类型 | 触发条件 |
| ---- | ---- | ---- |
| 主力大幅流入 | fund | 主力净流入 > 1 亿 |
| 主力流入 | fund | 主力净流入 > 5000 万 |
| 主力流出 | fund | 主力净流入 < 0 |
| 封涨停 | limit | 涨幅 ≥ 9.95% 且现价 ≥ 最高价 × 0.999 |
| 接近涨停 | limit | 涨幅 9.5%–9.95% |
| 炸板风险 | limit | 现价 < 最高价 × 0.99（冲高回落） |
| 放量 | volume | 换手率 > 10% |
| 低换手 | volume | 换手率 0–3% |
| 高成交 | volume | 成交额 > 5 亿 |

类型分类：`fund`（资金）/ `limit`（涨停）/ `volume`（量能），对应不同标签配色。

## 实时性

- 交易时段（北京时间 09:15–11:30、13:00–15:30）：每 30s 自动刷新
- 非交易时段：停止轮询，展示最近一次快照 + 「当前非交易时段」提示
- 判定来源：`useTradingHours`（`src/hooks/useTradingHours.ts`）

## UI 结构

```text
ScreenerPage
  ├─ Header          最后更新时间 + 状态（stale/loading）
  ├─ Banner          错误/警告横幅（失败重试 / 非交易时段提示）
  ├─ FilterBar       筛选条件栏（板块/涨幅/资金/ST）+ 手动刷新
  ├─ HighlightCards  重点观察卡片（线索最丰富的几只）
  └─ StockTable      明细表格（多列排序，SortableTh）
```

组件：`src/components/Header.tsx`、`FilterBar.tsx`、`HighlightCards.tsx`、`StockTable.tsx`、`ClueTag.tsx`、`SortableTh.tsx`。

## 排序

`useSort`（`src/hooks/useSort.ts`）支持多列排序，可排序字段（`SortKey`）：`code`/`name`/`market`/`price`/`pctChange`/`mainNetInflow`/`amount`/`turnoverRate`/`clueCount`。排序状态三态：`asc`/`desc`/`none`。

## 相关代码

- 页面：`src/pages/ScreenerPage.tsx`
- 状态：`src/hooks/useScreener.ts`、`src/context/FilterContext.tsx`
- 数据：`src/service/stockListAdapter.ts`
- 线索：`src/utils/clues.ts`
- 类型：`src/types.ts`（`Stock` / `FilterState` / `Clue`）

## 相关

- [数据流](../03-codebase/data-flow.md)
- [后端接口 - 个股](../05-api/backend-endpoints.md#个股-gegu)
