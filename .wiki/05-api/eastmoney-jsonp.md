# 东方财富 JSONP 直连（已移除）

> **状态：已删除**。本文档仅作历史记录。

涨停筛选器股票列表曾由前端直连东方财富公开接口（`push2.eastmoney.com/api/qt/clist/get`，免 key、免后端）获取，封装于 `src/api/eastmoney.ts`（JSONP）与 `src/api/stocks.ts`（字段映射 + 板块筛选）。

## 移除原因

- 后端 `/api/v1/stock/list` 补齐 `main_net_inflow` / `main_net_inflow_pct` / `industry` 字段后，第二期迁移条件满足（`docs/superpowers/specs/2026-07-26-service-migration-design.md` §7）
- `stockListAdapter.ts` 已就位（snake_case→Stock 适配 + market 归一化 + 分页拉满 + 提前终止）
- 2026-08 清理：删除 `src/api/eastmoney.ts`、`src/api/stocks.ts` 及其测试，一并删除仅被其引用的 `src/data/industry-map.ts`（行业字段现已由后端提供）

## 迁移后现状

```text
useScreener
  └─ fetchAllStocks(boardScope)     [src/service/stockListAdapter.ts]
      └─ getApiV1StockListFunc(...) [src/service/GeGu/index.ts]
          └─ request(...)           [src/service/request.ts]
              └─ axios → /api/v1/stock/list（后端）
```

## 相关

- [前后端通信总览](api-overview.md)
- [涨停候选筛选器](../04-business/screener.md)
- [数据流](../03-codebase/data-flow.md)
