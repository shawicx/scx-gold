# 后端接口清单

后端 `scx-stock-api`（FastAPI）的接口，前端封装于 `src/service/` 各模块。所有业务接口走统一响应 `{ code, message, data }`（详见 [api-overview.md](api-overview.md)）。

> 以下接口路径、参数、返回类型均来自 `src/service/*/index.ts` 与 `src/service/types/models.ts` 的真实代码。

## 个股（GeGu）

`src/service/GeGu/index.ts`

| 方法 | 路径 | 函数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/api/v1/stock/list` | `getApiV1StockListFunc(params)` | 股票/ETF 行情分页列表 |
| GET | `/api/v1/stock/{code}` | `getApiV1StockByCodeFunc(code)` | 个股详情（基础信息 + 实时行情，筛选器详情抽屉在用） |

**列表参数** `GetApiV1StockListRequestType`：`market`（市场）、`type`（stock/etf/all）、`sort_by`、`descending`、`page`（从 1 起）、`page_size`（1-100）。

**列表返回** `StockListData`：`{ items: StockListItem[], total, page, page_size }`。单页 ≤100，字段 `StockListItem`（snake_case，含 price/change_pct/amount/turnover_rate/main_net_inflow/industry 等）。

> 当前涨停筛选器通过 `stockListAdapter.ts` 调用此接口（已从东方财富迁移），采用提前终止分页策略。

## 板块（BanKuai）

`src/service/BanKuai/index.ts`

| 方法 | 路径 | 函数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/api/v1/sector/list` | `getApiV1SectorListFunc(params)` | 行业板块涨跌排行 |
| GET | `/api/v1/sector/{name}` | `getApiV1SectorByNameFunc(name)` | 板块详情（含成分股） |

**排行参数**：`sort_by`（change_pct/turnover_rate/total_market_cap）、`descending`、`limit`。返回 `SectorQuote[]`。
**详情参数**：`name` 为东方财富行业板块名（如「小金属」）。返回 `SectorDetail`（含 `constituents`）。

## 大盘（DaPan）

`src/service/DaPan/index.ts`

| 方法 | 路径 | 函数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/api/v1/market/index` | `getApiV1MarketIndexFunc()` | 主要大盘指数（白名单） |
| GET | `/api/v1/market/index/all` | `getApiV1MarketIndexAllFunc(params)` | 全部指数（按分组） |

返回 `IndexQuote[]`。`/all` 参数 `group`：沪深重要指数/上证系列/深证系列/指数成份/中证系列。

## 黄金（Gold）

`src/service/Gold/index.ts`

| 方法 | 路径 | 函数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/api/v1/market/gold` | `getApiV1MarketGoldFunc()` | 黄金品种实时行情 |

返回 `GoldQuote[]`（沪金主连 + 上金所现货 + 纽约金跟踪）。

## 搜索（SouSuo）

`src/service/SouSuo/index.ts`

| 方法 | 路径 | 函数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/api/v1/search` | `getApiV1SearchFunc(params)` | 搜索股票/ETF/指数（代码/简称/拼音） |
| GET | `/api/v1/search/index-size` | `getApiV1SearchIndexSizeFunc()` | 搜索索引大小（运维用） |

**搜索参数**：`q`（关键词）、`limit`。返回 `SearchResult[]`（按 score 降序）。

## 关注列表（Watchlist）

`src/service/Watchlist/index.ts`

| 方法 | 路径 | 函数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/api/v1/watchlist` | `getApiV1WatchlistFunc()` | 获取关注列表 |
| POST | `/api/v1/watchlist` | `postApiV1WatchlistFunc(code, name?)` | 添加关注 |
| DELETE | `/api/v1/watchlist/{code}` | `deleteApiV1WatchlistByCodeFunc(code)` | 移除关注 |
| PUT | `/api/v1/watchlist` | `putApiV1WatchlistFunc(items)` | 整体替换关注列表 |

条目类型 `WatchlistItemData`：`{ code, name, sort_order }`。存后端 DB。

## 分析（FenXi）

`src/service/FenXi/index.ts`

| 方法 | 路径 | 函数 | 说明 |
| ---- | ---- | ---- | ---- |
| POST | `/api/v1/analysis/run` | `postApiV1AnalysisRunFunc(params)` | 手动触发支撑位分析 |
| GET | `/api/v1/analysis/latest` | `getApiV1AnalysisLatestFunc(codes?)` | 获取最新分析报告（不重算） |
| GET | `/api/v1/analysis/history` | `getApiV1AnalysisHistoryFunc(code, limit?)` | 获取某标的历史报告 |

**触发参数** `PostApiV1AnalysisRunRequestType`：
- `dry_run`：`true` 只分析不发邮件，`false` 渲染邮件并发送
- `codes`：指定代码（逗号分隔）；不传则读后端 `SCX_WATCHLIST` 配置

返回 `AnalysisResult`（含 `reports: AnalysisReport[]`）。详见 [04-business/etf-analysis.md](../04-business/etf-analysis.md)。

## 应用配置（Settings）

`src/service/Settings/index.ts`

| 方法 | 路径 | 函数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/api/v1/settings` | `getApiV1SettingsFunc()` | 获取配置（敏感字段脱敏） |
| PUT | `/api/v1/settings` | `putApiV1SettingsFunc(body)` | 批量更新配置 |
| POST | `/api/v1/settings/test-llm` | `postApiV1SettingsTestLlmFunc()` | 测试 LLM 连接 |
| POST | `/api/v1/settings/test-smtp` | `postApiV1SettingsTestSmtpFunc()` | 测试 SMTP 发信 |

配置类型 `AppSettings`：LLM（provider/api_key/base_url/model/timeout）+ SMTP（host/port/user/password/from_name/use_ssl）+ `notify_emails`。详见 [02-getting-started/configuration.md](../02-getting-started/configuration.md#运行期配置应用内设置页)。

## 认证（Auth）

`src/service/Auth/index.ts`

| 方法 | 路径 | 函数 | 说明 |
| ---- | ---- | ---- | ---- |
| POST | `/api/v1/auth/request-code` | `postApiV1AuthRequestCodeFunc()` | 生成 16 位授权码并发邮箱 |
| POST | `/api/v1/auth/verify` | `postApiV1AuthVerifyFunc(code)` | 验证授权码 |
| POST | `/api/v1/auth/logout` | `postApiV1AuthLogoutFunc(code)` | 退出（停用授权码） |

返回 `RequestCodeResult { sent, message }` / `VerifyResult { valid, message? }`。

## 运维（YunWei）

`src/service/YunWei/index.ts`（`/admin` 前缀）

| 方法 | 路径 | 函数 | 说明 |
| ---- | ---- | ---- | ---- |
| POST | `/admin/sync` | `postAdminSyncFunc()` | 提交全量同步异步任务，返回 task_id |
| POST | `/admin/reindex` | `postAdminReindexFunc()` | 重建搜索索引（秒级） |
| GET | `/admin/task/{task_id}` | `getAdminTaskFunc(taskId)` | 查询后台任务状态与进度 |

任务状态 `AdminTaskStatus`：`pending` / `running` / `done` / `failed`。全量同步为异步任务模式（提交后轮询进度），串行执行（股票→ETF→行业→索引）。

> 调用方：`SettingsPage` 的「全量同步」按钮，每 3s 轮询任务状态。

## 健康检查（JianKangJianCha）

`src/service/JianKangJianCha/index.ts`（`/health` 前缀）

| 方法 | 路径 | 函数 | 说明 |
| ---- | ---- | ---- | ---- |
| GET | `/health` | `getHealthFunc()` | 存活探针 |
| GET | `/health/ready` | `getHealthReadyFunc()` | 就绪探针（检查缓存/DB 等依赖） |

> 注意：`/health` 不走统一响应格式（直接返回 `{ status, ... }`）。

## 相关

- [前后端通信总览](api-overview.md)
- [东方财富 JSONP](eastmoney-jsonp.md)
- [数据流](../03-codebase/data-flow.md)
