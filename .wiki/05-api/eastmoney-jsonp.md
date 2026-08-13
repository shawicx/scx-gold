# 东方财富 JSONP 直连

涨停筛选器股票列表的数据通道之一。前端直连东方财富公开接口，免 key、免后端。

> **现状说明**：`useScreener` 当前已迁移到后端 `/api/v1/stock/list`（经 `stockListAdapter.ts`）。本页描述的 `src/api/stocks.ts` 东方财富直连是历史实现，代码保留但**未被主链路使用**。后端若补齐 `main_net_inflow`/`industry` 字段后可彻底移除。

## 为什么保留 JSONP 通道

来源：`docs/superpowers/specs/2026-07-26-service-migration-design.md` §1

后端 `/api/v1/stock/list` 的 `StockListItem` **不含** `main_net_inflow`（主力净流入）、`main_net_inflow_pct`（主力净流入占比）、`industry`（行业）。而涨停筛选器的筛选条件与线索标签**重度依赖**这些字段：

- `FilterState.minMainInflow`（主力资金门槛筛选）
- `generateClues()` 的「主力大幅流入/流出」「封涨停」等标签

故股票列表迁移推迟到第二期（后端补字段后）。

> 注：当前 `stockListAdapter.ts` 已在后端接口基础上做适配，但后端是否已补齐上述字段**待确认**。若已补齐，则 `src/api/` 可删除。

## 接口

```text
https://push2.eastmoney.com/api/qt/clist/get
  ?pn=1&pz=200&po=1&np=1
  &fltt=2
  &invt=2
  &fs=<板块筛选>
  &fields=<字段列表>
```

返回 JSONP 格式（`callback({...})`），由 `src/api/eastmoney.ts` 的 `jsonpRequest` 解析。

## JSONP 封装（`src/api/eastmoney.ts`）

`jsonpRequest<T>(url, options)`：

1. 生成唯一回调函数名 `__jsonp_cb_<timestamp>_<random>`
2. 挂到 `window` 上，URL 拼接 `?cb=<回调名>`
3. 创建 `<script>` 标签发起请求
4. 超时（默认 10s）/ 网络错误 / 成功 → cleanup（移除 script、删 window 回调）
5. 返回 `Promise<T>`

## 板块筛选（fs）

来源：`src/api/stocks.ts:6-11`

| BoardScope | fs 值 | 含义 |
| ---- | ---- | ---- |
| `main` | `m:0+t:6,m:1+t:2` | 主板（深圳主板 000/001/002 + 上海主板 600/601/603） |
| `all` | `m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048` | 全部 A 股（主板 + 创业板 300/301 + 科创板 688 + 北交所） |

## 字段映射

来源：`src/api/stocks.ts:5`（`EM_FIELDS`）与 `rowToStock()`

| 业务字段 | EM 编号 | 前端 Stock 字段 |
| ---- | ---- | ---- |
| 代码 | f12 | `code` |
| 名称 | f14 | `name` |
| 市场 | f13 | `market`（0=sz, 1=sh, 其他=bj） |
| 最新价 | f2 | `price` |
| 涨跌幅 | f3 | `pctChange` |
| 换手率 | f8 | `turnoverRate` |
| 成交额 | f6 | `amount` |
| 主力净流入 | f62 | `mainNetInflow` |
| 主力净流入占比 | f184 | `mainNetInflowPct` |
| 最高 | f15 | `high` |
| 最低 | f16 | `low` |

行业字段（`industry`）东方财富列表接口不提供，由 `src/data/industry-map.ts` 静态映射兜底（仅覆盖少量常见成分股）。

## 数据处理

- 停牌/退市股票（`f2` 非 number，显示「-」）会被 `rowToStock` 过滤掉
- 无效 code/name 的行被过滤
- `isST` 由 `name.includes('ST')` 推断

## 第二期迁移后

若后端 `/api/v1/stock/list` 补齐 `main_net_inflow`/`main_net_inflow_pct`/`industry`：

1. `stockListAdapter.ts` 已就位（snake_case→Stock 适配 + market 归一化 + 分页拉满）
2. 删除 `src/api/stocks.ts`、`src/api/eastmoney.ts` 及其测试
3. `useScreener` 完全走后端 service 层

> 来源：`docs/superpowers/specs/2026-07-26-service-migration-design.md` §7

## 相关代码

- `src/api/eastmoney.ts` — JSONP 封装
- `src/api/stocks.ts` — 字段映射 + 板块筛选
- `src/data/industry-map.ts` — 行业静态映射
- `src/service/stockListAdapter.ts` — 后端适配器（迁移后替代上述）

## 相关

- [前后端通信总览](api-overview.md)
- [涨停候选筛选器](../04-business/screener.md)
- [数据流](../03-codebase/data-flow.md)
