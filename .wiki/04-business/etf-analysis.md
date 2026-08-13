# ETF 支撑位分析

业务域，路由 `/etf-analysis`，文件 `src/pages/EtfAnalysisPage.tsx`。对关注列表中的 ETF/股票做技术指标支撑位计算 + AI 解读。

## 业务目标

用户维护一个关注列表（ETF 或股票），系统逐标的拉取 K 线、计算支撑/压力位（MA20/MA60/BOLL 等）、调用 LLM 生成自然语言解读，产出分析报告。支持手动触发与历史回看。

## 核心流程

```text
EtfAnalysisPage
  ├─ 启动：useWatchlist() 读取关注列表
  ├─ 初始化：getApiV1AnalysisLatestFunc(codes) 从 DB 读最新报告（不重算）
  ├─ 用户点「开始分析」：
  │    └─ useAnalysis.run()
  │         └─ postApiV1AnalysisRunFunc({ dry_run: true, codes })
  │              后端：逐标的 K 线 → 计算支撑位 → AI 解读
  │              返回：AnalysisResult { analyzed, success, failed, reports[] }
  └─ 结果展示：卡片网格 / 汇总表格（Tab 切换）
       └─ 单卡点「历史」→ HistoryDrawer 抽屉
            └─ getApiV1AnalysisHistoryFunc(code) 读历史报告
```

> `dry_run: true` 表示只分析不发邮件。`dry_run: false` 时后端会渲染邮件并通过 SMTP 发送（见 `src/service/FenXi/index.ts:14-16`）。

## 关注列表（Watchlist）

- 数据存后端 DB（`/api/v1/watchlist` CRUD），localStorage 兜底
- 增删走乐观更新（详见 [03-codebase/state-management.md](../03-codebase/state-management.md#watchlistcontext)）
- 搜索添加：`WatchlistSearch` 调 `/api/v1/search`（代码/简称/拼音）
- 无默认列表，用户自行添加

## 分析报告结构（AnalysisReport）

来源：`src/service/types/models.ts:189-204`

| 字段 | 说明 |
| ---- | ---- |
| `code` / `name` | 标的 |
| `trade_date` | 交易日 |
| `close` / `change_pct` | 收盘价 / 涨跌幅 |
| `support_1` / `support_2` | 两个支撑位（`SupportLevel`） |
| `resistance_1` | 压力位 |
| `trend` | 趋势判断 |
| `ma20` / `ma60` | 均线值 |
| `summary` | AI 解读摘要 |
| `ok` / `error` | 是否成功 / 错误信息 |

支撑位（`SupportLevel`）：`price`（价位）+ `sources`（命中来源，如 MA20/BOLL 下轨/20 日低点）+ `distance_pct`（距现价百分比）+ `strength`（强/中/弱）。

## 前置配置

ETF 分析依赖 LLM，需先在「设置」页（`/settings`）配置：

- LLM 提供商（DeepSeek / 智谱 GLM）
- API Key / Base URL / Model
- 建议点「测试连接」验证

未配置时分析会失败（后端 LLM 调用报错）。

## UI 布局

左右分栏（大屏）/ 上下堆叠（小屏）：

- **左/上**：关注列表（`Watchlist` + `WatchlistSearch`）
- **右/下**：
  - 操作栏：「开始分析」按钮 + 卡片/表格视图切换
  - 汇总信息：共 N 只 / 成功 / 失败 / 耗时
  - 结果：`AnalysisReportCard`（卡片）或 `AnalysisTable`（表格）
  - 历史：`HistoryDrawer`（抽屉）

## 相关代码

- 页面：`src/pages/EtfAnalysisPage.tsx`
- 状态：`src/hooks/useAnalysis.ts`、`src/context/WatchlistContext.tsx`
- 服务：`src/service/FenXi/index.ts`、`src/service/Watchlist/index.ts`、`src/service/SouSuo/index.ts`
- 组件：`AnalysisReportCard.tsx`、`AnalysisTable.tsx`、`HistoryDrawer.tsx`、`Watchlist.tsx`、`WatchlistSearch.tsx`
- 类型：`src/service/types/models.ts`（`AnalysisReport` / `AnalysisResult` / `SupportLevel`）

## 相关

- [状态管理 - WatchlistContext](../03-codebase/state-management.md#watchlistcontext)
- [后端接口 - 分析](../05-api/backend-endpoints.md#分析-fenxi)
- [配置 - LLM](../02-getting-started/configuration.md#llm-配置用于-etf-支撑位-ai-解读)
