# 源码结构

入口 `src/main.tsx` → `src/App.tsx`。源码按职责分目录，无嵌套过深。

## 目录树

```text
src/
├── main.tsx                  # ReactDOM 入口，挂载 StrictMode + App
├── App.tsx                   # 路由编排 + Provider 嵌套 + AuthModal
├── types.ts                  # 前端核心类型（Stock / FilterState / Clue / SortState）
│
├── pages/                    # 页面组件（路由级）
│   ├── ScreenerPage.tsx      #   涨停筛选器（/）
│   ├── EtfAnalysisPage.tsx   #   ETF 支撑位分析（/etf-analysis）
│   ├── GoldPage.tsx          #   黄金行情（/gold）
│   └── SettingsPage.tsx      #   应用配置（/settings）
│
├── components/               # 可复用 UI 组件
│   ├── NavBar.tsx            #   顶部导航（NavLink 路由切换 + 退出）
│   ├── Header.tsx            #   筛选器页头（最后更新时间 + 状态）
│   ├── FilterBar.tsx         #   筛选条件栏
│   ├── HighlightCards.tsx    #   重点观察卡片
│   ├── StockTable.tsx        #   股票明细表格
│   ├── StockCard.tsx         #   单股卡片
│   ├── SortableTh.tsx        #   可排序表头
│   ├── ClueTag.tsx           #   线索标签
│   ├── Banner.tsx            #   通知横幅（error/warning）
│   ├── LastUpdated.tsx       #   最后更新时间
│   ├── ThemeToggle.tsx       #   明暗主题切换按钮
│   ├── AuthModal.tsx         #   授权码认证弹窗
│   ├── Watchlist.tsx         #   关注列表（管理 + 展示）
│   ├── WatchlistSearch.tsx   #   关注列表搜索添加
│   ├── AnalysisReportCard.tsx#   分析报告卡片
│   ├── AnalysisTable.tsx     #   分析报告表格
│   ├── AnalysisHistoryItem.tsx#  历史报告条目
│   └── HistoryDrawer.tsx     #   历史分析抽屉
│
├── context/                  # React Context（全局状态）
│   ├── AuthContext.tsx       #   授权码认证
│   ├── ThemeContext.tsx      #   明暗主题
│   ├── WatchlistContext.tsx  #   关注列表（后端 DB + localStorage 兜底）
│   └── FilterContext.tsx     #   筛选条件（页面级）
│
├── hooks/                    # 自定义 hooks
│   ├── useScreener.ts        #   股票行情拉取 + 筛选 + 交易时段轮询
│   ├── useAnalysis.ts        #   支撑位分析触发
│   ├── useTradingHours.ts    #   交易时段判定（北京时间）
│   ├── useSort.ts            #   多列排序状态
│   └── animations/           #   GSAP 动画 hooks
│       ├── useBannerSlide.ts
│       ├── useFlipSort.ts
│       ├── useNumberFlash.ts
│       └── useStaggerIn.ts
│
├── service/                  # 后端 API 层（@scxfe/api-tool 生成 + 手改）
│   ├── request.ts            #   统一请求封装（核心）
│   ├── stockListAdapter.ts   #   后端 StockListItem → 前端 Stock 适配
│   ├── index.ts              #   统一导出
│   ├── types/                #   后端领域模型（手写真实类型）
│   │   ├── models.ts         #     StockListItem / IndexQuote / AnalysisReport ...
│   │   ├── ApiResponse.ts    #     统一响应包装
│   │   └── ...
│   └── <模块>/index.ts       #   按业务域分组：GeGu/BanKuai/DaPan/SouSuo/
│                             #   FenXi/Watchlist/Settings/Gold/Auth/YunWei/JianKangJianCha
│
├── api/                      # 东方财富 JSONP 直连（仅涨停列表用）
│   ├── eastmoney.ts          #   JSONP 封装
│   └── stocks.ts             #   字段映射 + 板块筛选
│
├── utils/                    # 纯函数工具
│   ├── clues.ts              #   线索标签生成规则
│   ├── format.ts             #   数字/金额/百分比格式化
│   ├── sort.ts               #   排序比较器
│   └── analysis-style.ts     #   分析报告样式辅助
│
├── data/
│   └── industry-map.ts       #   股票代码 → 行业 静态映射（东方财富列表无行业时的兜底）
│
└── styles/
    └── index.css             #   Tailwind v4 入口 + CSS 变量主题
```

## 关键文件职责

### 入口

- **`main.tsx`**：`ReactDOM.createRoot` 挂载，包 `React.StrictMode`，引入全局 CSS。
- **`App.tsx`**：路由表（4 条 `Route`）+ Provider 嵌套（Theme → Auth → Watchlist）+ `AuthModal` 条件渲染。

### 核心类型（`types.ts`）

- `Stock` — 前端统一的股票模型（camelCase，字段不可空）
- `FilterState` / `DEFAULT_FILTERS` — 筛选状态与默认值（涨幅区间默认 `[9.8, 10.2]`，排除 ST）
- `Clue` / `ClueType` — 线索标签（fund 资金 / limit 涨停 / volume 量能）
- `SortState` / `SortKey` — 表格排序

> 后端类型（snake_case）在 `src/service/types/models.ts`，与 `types.ts` 的前端类型通过 `stockListAdapter.ts` 桥接。

### 数据层分工

| 场景 | 数据源 | 入口文件 |
| ---- | ---- | ---- |
| 涨停筛选器股票列表 | 东方财富 JSONP | `src/api/stocks.ts` → `fetchStocks()` |
| 指数/板块/搜索/关注/分析/黄金/配置/认证/运维 | 后端 `scx-stock-api` | `src/service/<模块>/index.ts` |

> 虽然后端也有 `/api/v1/stock/list`，但因缺主力资金/行业字段，涨停列表暂不迁移（见 `stockListAdapter.ts` 与设计文档 §7）。

## 命名约定

- 组件文件 PascalCase（`StockTable.tsx`）
- hooks 以 `use` 开头（`useScreener.ts`）
- service 模块用拼音业务域名（`GeGu` 个股 / `BanKuai` 板块 / `DaPan` 大盘 / `SouSuo` 搜索 / `FenXi` 分析 / `YunWei` 运维 / `JianKangJianCha` 健康检查），由代码生成器产出，保持与生成结果一致
- 测试文件与源文件同目录，`.test.ts` 后缀

## 相关

- [数据流](data-flow.md)
- [状态管理](state-management.md)
- [架构](../01-overview/architecture.md)
