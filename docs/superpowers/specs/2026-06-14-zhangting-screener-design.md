# 涨停候选筛选器 — 设计文档

- 日期: 2026-06-14
- 项目: scx-gold
- 状态: 已通过设计评审，待实现

## 1. 目标

构建一个单页面 A 股涨停候选筛选工具，从东方财富公开接口拉取实时行情和主力资金流数据，按用户设定的涨幅区间、资金门槛、板块范围过滤，通过重点观察卡片 + 明细表格的形式呈现，并自动生成观察线索标签辅助判断。

非目标：

- 不做个股详情页 / K 线图
- 不做历史回测
- 不做用户系统、收藏、推送
- 不做后端服务

## 2. 技术栈

- React 18 + Vite 5 + TypeScript 5
- 纯前端，零后端
- 样式：原生 CSS + CSS 变量（明/暗主题）
- 测试：Vitest（仅纯函数）
- 部署：静态文件，可放 Vercel / GitHub Pages / 本地

## 3. 数据源

东方财富 push2 接口，免 key、免后端。

### 列表接口

```
https://push2.eastmoney.com/api/qt/clist/get
  ?pn=1&pz=200&po=1&np=1
  &fltt=2
  &invt=2
  &fs=<板块筛选>
  &fields=<字段列表>
```

返回格式为 JSONP（`jQuery_xxx_callback({...})`），前端封装 `jsonpRequest` 工具解析。

### 板块筛选 `fs`

- 主板: `m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23`
- 全部 A 股: 主板 + `m:0+t:81+s:2048`（创业板）+ `m:1+t:23`（北交所相关）

### 字段映射

| 业务字段 | EM 编号 | 说明 |
|---|---|---|
| `code` | f12 | 股票代码 |
| `name` | f14 | 名称 |
| `market` | f13 | 市场（0=深 / 1=沪 / 2=北） |
| `price` | f2 | 最新价 |
| `pctChange` | f3 | 涨跌幅 (%) |
| `turnoverRate` | f8 | 换手率 (%) |
| `amount` | f6 | 成交额（元） |
| `mainNetInflow` | f62 | 主力净流入（元） |
| `mainNetInflowPct` | f184 | 主力净流入占比 (%) |
| `high` | f15 | 日内最高 |
| `low` | f16 | 日内最低 |

### 行业字段

EM clist 接口不直接返回行业。采用前端 hardcode 一份「代码 → 行业」映射（覆盖主板常见个股），命中失败标"未知"。映射表放在 `src/data/industry-map.ts`，可后续扩充。

## 4. 业务模型

### Stock 类型

```ts
interface Stock {
  code: string;
  name: string;
  market: 'sz' | 'sh' | 'bj';
  price: number;
  pctChange: number;
  turnoverRate: number;
  amount: number;
  mainNetInflow: number;
  mainNetInflowPct: number;
  high: number;
  low: number;
  industry: string;
  isST: boolean;
}
```

### FilterState

```ts
interface FilterState {
  boardScope: 'main' | 'all';        // 板块范围
  pctRange: [number, number];        // 涨幅区间，默认 [9.8, 10.2]
  minMainInflow: number;             // 资金门槛（元），默认 0
                                     // 预设: 0, 5e7, 1e8, 3e8
  excludeST: boolean;                // 默认 true
}
```

### SortState

```ts
type SortKey =
  | 'code' | 'name' | 'market' | 'price'
  | 'pctChange' | 'mainNetInflow' | 'amount'
  | 'turnoverRate' | 'clueCount';

type SortOrder = 'asc' | 'desc' | 'none';

interface SortState {
  key: SortKey | null;
  order: SortOrder;
}
```

排序状态同步到 URL query（`?sort=pctChange&order=desc`），刷新页面不丢。

## 5. 观察线索规则

纯函数 `generateClues(stock: Stock): Clue[]`，输入一只股票返回标签数组。

| 标签 | 条件 | 类型 |
|---|---|---|
| `主力大幅流入` | mainNetInflow > 1e8 | 资金 |
| `主力流入` | mainNetInflow > 5e7 | 资金 |
| `主力流出` | mainNetInflow < 0 | 资金 |
| `封涨停` | pctChange ≥ 9.95 且 price ≥ high × 0.999 | 涨停 |
| `接近涨停` | pctChange ≥ 9.5 且 < 9.95 | 涨停 |
| `炸板风险` | high > 0 且 price < high × 0.99 | 涨停 |
| `放量` | turnoverRate > 10 | 量能 |
| `低换手` | turnoverRate < 3 | 量能 |
| `高成交` | amount > 5e8 | 量能 |

> 一只股票可命中多个标签。阈值集中在 `clues.ts` 顶端的常量里，便于后期调参。
>
> 注：上述阈值按主板 10% 涨停设计。切到「全部 A 股」并把涨幅区间调到 19.8–20.2% 时，"封涨停 / 接近涨停" 不会触发——这是预期行为（创业板/科创板的标签规则待后续按板块拆分）。

## 6. 组件结构

```
App
├── ThemeProvider                    # Context: 主题
├── FilterProvider                   # Context: 筛选条件
├── Header
│   ├── Title
│   ├── ThemeToggle
│   └── LastUpdated                  # 最后刷新时间 + 状态指示
├── FilterBar
│   ├── BoardScopeToggle             # 主板 / 全部 A 股
│   ├── PctRangeInput                # 两个数字输入框
│   ├── MainInflowSelect             # 下拉选择资金门槛
│   ├── ExcludeSTCheckbox
│   └── RefreshButton                # 手动刷新
├── HighlightCards                   # 前 6 个重点观察
│   └── StockCard × 6
└── StockTable                       # 完整明细
    └── SortableTh × N
```

## 7. Hooks

### `useScreener()`

主数据 hook，封装：

- 数据拉取（基于当前 FilterState）
- 30s 自动轮询（仅交易时段）
- loading / error / data 状态
- 最近一次成功结果缓存（请求失败时降级展示）
- `refresh()` 手动触发方法

返回：

```ts
{
  stocks: Stock[];           // 已经过滤、未排序
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  isStale: boolean;          // true 表示当前展示的是降级数据
  refresh: () => Promise<void>;
}
```

### `useTradingHours()`

判断当前是否在 A 股交易时段（周一至周五 9:15–11:30, 13:00–15:30，节假日不查）。返回 `boolean`。

### `useSort(sortKey, defaultOrder)`

通用三态排序 hook（`asc → desc → none → asc`）。

## 8. 主题

CSS 变量定义两套，根元素切换 `data-theme`：

```css
:root, [data-theme="light"] {
  --bg: #fafafa;
  --surface: #ffffff;
  --text: #1a1a1a;
  --text-secondary: #666;
  --border: #e5e5e5;
  --up: #ef4444;          /* A 股涨用红 */
  --down: #10b981;        /* A 股跌用绿 */
  --accent: #2563eb;
}

[data-theme="dark"] {
  --bg: #0f0f0f;
  --surface: #1a1a1a;
  --text: #f5f5f5;
  --text-secondary: #999;
  --border: #2a2a2a;
  --up: #f87171;
  --down: #34d399;
  --accent: #60a5fa;
}
```

- 切换按钮在 Header 右上角，sun/moon 图标（SVG inline）
- localStorage key: `scx-gold.theme`
- 首次加载顺序：localStorage > `prefers-color-scheme` > 默认 light

## 9. 响应式

| 断点 | 卡片布局 | 表格列 |
|---|---|---|
| ≥ 1024px（桌面） | 3 列 2 行（6 张） | 全部 |
| 768–1024px（平板） | 2 列 3 行 | 隐藏 industry |
| < 768px（移动） | 1 列 | 仅 code, name, price, pctChange, mainNetInflow |

## 10. 错误处理

| 场景 | 表现 |
|---|---|
| 请求失败 | 顶部红色 banner：「获取行情失败，点此重试」 |
| 非交易时段 | 顶部黄色 banner：「当前非交易时段，显示最近一次快照」 |
| JSONP 静默失败（限流） | 沿用上次成功结果，`isStale=true`，表格角标提示「数据延迟」 |
| 网络断开 | 同请求失败处理 |
| 字段缺失（如 high 为 0） | 跳过对应标签生成，不影响展示 |

## 11. 测试

仅纯函数 + hook 单测，UI 不写测试（避免过度工程）：

- `utils/clues.test.ts`：覆盖每条规则的正/反例 + 多标签组合
- `utils/format.test.ts`：万/亿格式化、百分比、空值
- `utils/sort.test.ts`：三态切换、稳定排序
- `hooks/useTradingHours.test.ts`：mock Date，覆盖交易时段内外、周末、午休
- `api/stocks.test.ts`：mock JSONP，验证字段映射

## 12. 文件清单

```
scx-gold/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
├── README.md
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types.ts
│   ├── api/
│   │   ├── eastmoney.ts
│   │   └── stocks.ts
│   ├── context/
│   │   ├── FilterContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/
│   │   ├── useScreener.ts
│   │   ├── useTradingHours.ts
│   │   └── useSort.ts
│   ├── utils/
│   │   ├── clues.ts
│   │   ├── format.ts
│   │   └── sort.ts
│   ├── data/
│   │   └── industry-map.ts
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── LastUpdated.tsx
│   │   ├── FilterBar.tsx
│   │   ├── HighlightCards.tsx
│   │   ├── StockCard.tsx
│   │   ├── StockTable.tsx
│   │   ├── SortableTh.tsx
│   │   ├── ClueTag.tsx
│   │   └── Banner.tsx
│   └── styles/
│       ├── theme.css
│       └── App.css
└── docs/superpowers/specs/
    └── 2026-06-14-zhangting-screener-design.md
```

## 13. 后续可扩展（不在本期范围）

- 单股点击 → 详情侧栏（K 线 + 主力资金流分时图）
- 自定义观察列表 + 持久化
- 涨停板封单量监控
- 多接口对比（新浪/腾讯）做容灾
