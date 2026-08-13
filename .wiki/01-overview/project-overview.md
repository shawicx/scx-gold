# 项目总览

scx-gold 是一个 A 股行情分析前端单页应用，围绕「涨停候选筛选」核心场景，扩展出 ETF 支撑位分析、黄金行情、应用配置三大辅助能力。

## 项目是什么

面向个人投资者的轻量级行情工具，主打**盘中实时**筛选接近涨停的 A 股候选股，并辅以主力资金、换手率、成交额等维度生成「观察线索」标签，帮助快速判断。非交易时段展示最近一次快照。

## 四大页面（路由）

| 路由 | 页面 | 文件 | 能力 |
| ---- | ---- | ---- | ---- |
| `/` | 涨停候选筛选器 | `src/pages/ScreenerPage.tsx` | 实时筛选涨停候选股，线索标签，高亮卡片 + 明细表格 |
| `/etf-analysis` | ETF 支撑位分析 | `src/pages/EtfAnalysisPage.tsx` | 关注列表 → 触发 AI 支撑位分析 → 报告卡片/表格 + 历史 |
| `/gold` | 黄金行情 | `src/pages/GoldPage.tsx` | 国内主要黄金品种实时行情（沪金/上金所/纽约金跟踪） |
| `/settings` | 应用配置 | `src/pages/SettingsPage.tsx` | LLM/SMTP 配置 + 全量同步/重建索引运维操作 |

路由与 Provider 嵌套定义于 `src/App.tsx`。

## 核心特征

1. **双数据源**：
   - 股票涨停列表 → 东方财富公开 JSONP（前端直连，含主力资金/行业字段）
   - 其余（指数/板块/搜索/关注/分析/黄金/配置/认证/运维）→ 后端 `scx-stock-api`
   - 详见 [05-api/api-overview.md](../05-api/api-overview.md)

2. **盘中轮询**：交易时段（北京时间 09:15–11:30、13:00–15:30）每 30s 自动刷新，非交易时段停止轮询并提示「显示最近一次快照」。

3. **授权码认证**：未认证时全屏 `AuthModal` 拦截；授权码由后端生成 16 位随机码并发送到邮箱，前端校验后存 `localStorage`，每次请求注入 `X-Access-Token` 头。

4. **明/暗主题**：CSS 变量 + `data-theme` 属性切换，`localStorage` 持久化，默认跟随系统。

5. **零本地数据库**：前端无任何 DB/持久化层；关注列表存后端 DB，`localStorage` 仅作离线兜底缓存。

## 非目标（项目边界）

来源：`docs/superpowers/specs/2026-06-14-zhangting-screener-design.md`

- 不做个股详情页 / K 线图
- 不做历史回测
- 不做用户系统（仅授权码门禁，无多用户体系）
- 前端不做后端服务（后端是独立仓库 `scx-stock-api`）

## 相关

- [架构](architecture.md)
- [本地开发](../02-getting-started/local-development.md)
- [源码结构](../03-codebase/repository-structure.md)
