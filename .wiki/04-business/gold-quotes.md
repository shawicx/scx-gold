# 黄金行情

业务域，路由 `/gold`，文件 `src/pages/GoldPage.tsx`。展示国内主要黄金品种的实时行情。

## 业务目标

提供国内黄金品种的实时价格、涨跌、开盘/最高/最低、持仓量、成交量等行情快照，全部人民币计价（CNY/克）。

## 品种口径

来源：`src/pages/GoldPage.tsx:16-20`、`src/pages/GoldPage.tsx:184`

| 分类（category） | 标签 | 品种示例 |
| ---- | ---- | ---- |
| `futures_shfe` | 上期所期货 | 沪金主连 AU0（上期所期货连续合约） |
| `spot_sge` | 上金所现货 | Au99.99（上海黄金交易所现货） |
| `comex_proxy` | 纽约金跟踪 | NYAuTN06（上金所纽约金跟踪合约） |

## 数据来源

- 接口：`GET /api/v1/market/gold`（`src/service/Gold/index.ts`）
- 后端聚合多个黄金品种，返回 `GoldQuote[]`
- 前端无轮询（手动「刷新」按钮触发）

## GoldQuote 结构

来源：`src/service/types/models.ts:154-170`

| 字段 | 说明 |
| ---- | ---- |
| `code` / `name` / `category` | 代码 / 名称 / 分类 |
| `price` / `change` / `change_pct` | 现价 / 涨跌额 / 涨跌幅 |
| `prev_close` / `prev_settlement` | 昨收 / 前结算 |
| `open` / `high` / `low` | 今开 / 最高 / 最低 |
| `volume` / `position` | 成交量 / 持仓量 |
| `timestamp` | 行情时间戳 |

## UI 结构

- 页头：标题 + 最后更新时间 + 刷新按钮 + 主题切换
- 口径说明：解释三个品种的来源与计价单位
- 品种卡片网格（`md:grid-cols-3`）：每张卡片含现价 + 涨跌幅 + 行情详情 `<dl>` + 更新时间

## 相关代码

- 页面：`src/pages/GoldPage.tsx`（含 `GoldCard` 内部组件）
- 服务：`src/service/Gold/index.ts`
- 类型：`src/service/types/models.ts`（`GoldQuote`）

## 相关

- [后端接口 - 黄金](../05-api/backend-endpoints.md#黄金-gold)
- [术语表](../99-reference/glossary.md)
