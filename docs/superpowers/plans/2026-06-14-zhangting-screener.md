# 涨停候选筛选器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page A-share limit-up candidate screening tool that pulls data from East Money public API and surfaces filtered stocks via highlight cards and a sortable detail table.

**Architecture:** Pure frontend React + Vite + TypeScript SPA. East Money JSONP endpoint for data, two React Contexts (Filter/Theme) for global state, custom hooks for data fetching + polling + sorting, plain CSS with CSS variables for theming.

**Tech Stack:** React 18, Vite 5, TypeScript 5, Vitest 1, plain CSS.

Reference design: `docs/superpowers/specs/2026-06-14-zhangting-screener-design.md`.

---

## File Structure

```
scx-gold/
├── index.html                       # Vite entry
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts                   # Vite + Vitest config
├── .gitignore
├── README.md
├── src/
│   ├── main.tsx                     # React mount
│   ├── App.tsx                      # Top-level layout
│   ├── types.ts                     # Stock, FilterState, SortState, Clue
│   ├── api/
│   │   ├── eastmoney.ts             # JSONP wrapper
│   │   └── stocks.ts                # fetchStocks + field mapping
│   ├── context/
│   │   ├── ThemeContext.tsx         # dark/light + localStorage
│   │   └── FilterContext.tsx        # filter state + setter
│   ├── hooks/
│   │   ├── useTradingHours.ts       # isTradingTime()
│   │   ├── useScreener.ts           # fetch + 30s poll + state
│   │   └── useSort.ts               # 3-state sort (asc/desc/none)
│   ├── utils/
│   │   ├── format.ts                # formatMoney, formatPct, formatAmount
│   │   ├── clues.ts                 # generateClues(stock)
│   │   └── sort.ts                  # sortStocks(stocks, state)
│   ├── data/
│   │   └── industry-map.ts          # code → industry lookup
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── LastUpdated.tsx
│   │   ├── Banner.tsx               # error/warning banner
│   │   ├── FilterBar.tsx
│   │   ├── HighlightCards.tsx
│   │   ├── StockCard.tsx
│   │   ├── StockTable.tsx
│   │   ├── SortableTh.tsx
│   │   └── ClueTag.tsx
│   └── styles/
│       ├── theme.css                # CSS variables + reset
│       └── App.css                  # Layout + component styles
└── tests set up co-located: `*.test.ts(x)` next to source
```

---

## Task 1: Scaffold Vite + React + TS + Vitest

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `.gitignore`, `README.md`
- Create: `src/main.tsx`, `src/App.tsx` (placeholder)

- [ ] **Step 1: Initialize pnpm project + install deps**

Run from `/Users/scx/Documents/code/scx-gold`:

```bash
pnpm init
pnpm add react@18 react-dom@18
pnpm add -D vite@5 @vitejs/plugin-react@4 typescript@5 @types/react@18 @types/react-dom@18 vitest@1 @vitest/ui jsdom
```

- [ ] **Step 2: Write `package.json` scripts**

Overwrite `package.json` scripts section:

```json
{
  "name": "scx-gold",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "packageManager": "pnpm@11.0.9",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "node"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Write `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
});
```

- [ ] **Step 6: Write `index.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>涨停候选筛选器</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Write `.gitignore`**

```
node_modules
dist
dist-ssr
*.local
.DS_Store
.remember/
.vscode/
```

- [ ] **Step 8: Write `src/main.tsx` placeholder**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/theme.css';
import './styles/App.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 9: Write `src/App.tsx` placeholder**

```tsx
export function App() {
  return <div className="app">scx-gold</div>;
}
```

- [ ] **Step 10: Write `README.md`**

```markdown
# scx-gold

A-share limit-up candidate screening tool. Live data from East Money public JSONP endpoints.

## Dev

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Test

\`\`\`bash
pnpm test
\`\`\`
```

- [ ] **Step 11: Verify scaffold builds and runs**

Run: `pnpm dev` then `Ctrl-C` after Vite prints the local URL.
Expected: no errors, Vite prints `Local: http://localhost:5173/`.

Run: `pnpm test` (will be no tests yet).
Expected: Vitest prints `No test files found` or `0 tests`.

- [ ] **Step 12: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json tsconfig.node.json vite.config.ts index.html .gitignore README.md src/main.tsx src/App.tsx src/styles/theme.css src/styles/App.css
git commit -m "chore: scaffold Vite + React + TS + Vitest project"
```

---

## Task 2: CSS theme variables and base styles

**Files:**
- Create: `src/styles/theme.css`
- Create: `src/styles/App.css`

- [ ] **Step 1: Write `src/styles/theme.css`**

```css
:root,
[data-theme='light'] {
  --bg: #fafafa;
  --surface: #ffffff;
  --surface-hover: #f5f5f5;
  --text: #1a1a1a;
  --text-secondary: #666666;
  --text-muted: #999999;
  --border: #e5e5e5;
  --up: #ef4444;
  --down: #10b981;
  --accent: #2563eb;
  --warning: #f59e0b;
  --error: #ef4444;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

[data-theme='dark'] {
  --bg: #0f0f0f;
  --surface: #1a1a1a;
  --surface-hover: #242424;
  --text: #f5f5f5;
  --text-secondary: #b3b3b3;
  --text-muted: #888888;
  --border: #2a2a2a;
  --up: #f87171;
  --down: #34d399;
  --accent: #60a5fa;
  --warning: #fbbf24;
  --error: #f87171;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

button {
  font-family: inherit;
  cursor: pointer;
}
```

- [ ] **Step 2: Write `src/styles/App.css` (initial, layout-only)**

```css
.app {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/theme.css src/styles/App.css
git commit -m "feat: add CSS theme variables and base styles"
```

---

## Task 3: Type definitions

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write `src/types.ts`**

```ts
export type Market = 'sh' | 'sz' | 'bj';

export interface Stock {
  code: string;
  name: string;
  market: Market;
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

export type BoardScope = 'main' | 'all';

export interface FilterState {
  boardScope: BoardScope;
  pctRange: [number, number];
  minMainInflow: number;
  excludeST: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  boardScope: 'main',
  pctRange: [9.8, 10.2],
  minMainInflow: 0,
  excludeST: true,
};

export const INFLOW_PRESETS: { label: string; value: number }[] = [
  { label: '不限', value: 0 },
  { label: '> 5000万', value: 5e7 },
  { label: '> 1亿', value: 1e8 },
  { label: '> 3亿', value: 3e8 },
];

export type SortKey =
  | 'code'
  | 'name'
  | 'market'
  | 'price'
  | 'pctChange'
  | 'mainNetInflow'
  | 'amount'
  | 'turnoverRate'
  | 'clueCount';

export type SortOrder = 'asc' | 'desc' | 'none';

export interface SortState {
  key: SortKey | null;
  order: SortOrder;
}

export type ClueType = 'fund' | 'limit' | 'volume';

export interface Clue {
  label: string;
  type: ClueType;
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add core type definitions"
```

---

## Task 4: Format utils (TDD)

**Files:**
- Create: `src/utils/format.ts`
- Test: `src/utils/format.test.ts`

- [ ] **Step 1: Write failing tests `src/utils/format.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { formatMoney, formatAmount, formatPct, formatPrice } from './format';

describe('formatMoney', () => {
  it('formats values under 1万 as plain yuan', () => {
    expect(formatMoney(5000)).toBe('5000');
    expect(formatMoney(9999)).toBe('9999');
  });

  it('formats values between 1万 and 1亿 in 万', () => {
    expect(formatMoney(10000)).toBe('1.00万');
    expect(formatMoney(50000000)).toBe('5000.00万');
  });

  it('formats values >= 1亿 in 亿', () => {
    expect(formatMoney(100000000)).toBe('1.00亿');
    expect(formatMoney(123000000)).toBe('1.23亿');
  });

  it('handles negative values', () => {
    expect(formatMoney(-50000000)).toBe('-5000.00万');
    expect(formatMoney(-200000000)).toBe('-2.00亿');
  });

  it('handles zero', () => {
    expect(formatMoney(0)).toBe('0');
  });

  it('handles non-finite', () => {
    expect(formatMoney(NaN)).toBe('--');
    expect(formatMoney(Infinity)).toBe('--');
  });
});

describe('formatAmount', () => {
  it('returns formatted money with 万/亿 unit', () => {
    expect(formatAmount(100000000)).toBe('1.00亿');
    expect(formatAmount(50000000)).toBe('5000.00万');
  });
});

describe('formatPct', () => {
  it('formats with two decimals and % suffix', () => {
    expect(formatPct(9.87)).toBe('9.87%');
    expect(formatPct(-3.4)).toBe('-3.40%');
  });

  it('handles non-finite', () => {
    expect(formatPct(NaN)).toBe('--');
  });
});

describe('formatPrice', () => {
  it('formats price with two decimals', () => {
    expect(formatPrice(10.5)).toBe('10.50');
    expect(formatPrice(100)).toBe('100.00');
  });

  it('handles non-finite', () => {
    expect(formatPrice(NaN)).toBe('--');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run src/utils/format.test.ts`
Expected: FAIL with "Cannot find module './format'".

- [ ] **Step 3: Write `src/utils/format.ts`**

```ts
export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return '--';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e8) return `${sign}${(abs / 1e8).toFixed(2)}亿`;
  if (abs >= 1e4) return `${sign}${(abs / 1e4).toFixed(2)}万`;
  return `${value}`;
}

export function formatAmount(value: number): string {
  return formatMoney(value);
}

export function formatPct(value: number): string {
  if (!Number.isFinite(value)) return '--';
  return `${value.toFixed(2)}%`;
}

export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '--';
  return value.toFixed(2);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run src/utils/format.test.ts`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/format.ts src/utils/format.test.ts
git commit -m "feat: add money/pct/price formatters with tests"
```

---

## Task 5: Clue generation (TDD)

**Files:**
- Create: `src/utils/clues.ts`
- Test: `src/utils/clues.test.ts`

- [ ] **Step 1: Write failing tests `src/utils/clues.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { generateClues } from './clues';
import type { Stock } from '../types';

const base: Stock = {
  code: '000001',
  name: '测试',
  market: 'sz',
  price: 10,
  pctChange: 0,
  turnoverRate: 5,
  amount: 1e8,
  mainNetInflow: 0,
  mainNetInflowPct: 0,
  high: 10,
  low: 9,
  industry: '未知',
  isST: false,
};

describe('generateClues', () => {
  it('returns 主力大幅流入 when inflow > 1e8', () => {
    const clues = generateClues({ ...base, mainNetInflow: 1.5e8 });
    expect(clues.map((c) => c.label)).toContain('主力大幅流入');
    expect(clues.map((c) => c.label)).not.toContain('主力流入');
  });

  it('returns 主力流入 when inflow > 5e7 (but not > 1e8)', () => {
    const clues = generateClues({ ...base, mainNetInflow: 6e7 });
    expect(clues.map((c) => c.label)).toContain('主力流入');
    expect(clues.map((c) => c.label)).not.toContain('主力大幅流入');
  });

  it('returns 主力流出 when inflow < 0', () => {
    const clues = generateClues({ ...base, mainNetInflow: -1 });
    expect(clues.map((c) => c.label)).toContain('主力流出');
  });

  it('returns 封涨停 when pctChange >= 9.95 and price near high', () => {
    const clues = generateClues({
      ...base,
      pctChange: 10,
      price: 11,
      high: 11,
    });
    expect(clues.map((c) => c.label)).toContain('封涨停');
  });

  it('returns 接近涨停 when pctChange in [9.5, 9.95)', () => {
    const clues = generateClues({ ...base, pctChange: 9.7 });
    expect(clues.map((c) => c.label)).toContain('接近涨停');
  });

  it('returns 炸板风险 when price < high * 0.99', () => {
    const clues = generateClues({
      ...base,
      pctChange: 9,
      price: 10,
      high: 10.5,
    });
    expect(clues.map((c) => c.label)).toContain('炸板风险');
  });

  it('does not return 炸板风险 when high is 0 (missing data)', () => {
    const clues = generateClues({ ...base, high: 0, price: 10 });
    expect(clues.map((c) => c.label)).not.toContain('炸板风险');
  });

  it('returns 放量 when turnoverRate > 10', () => {
    const clues = generateClues({ ...base, turnoverRate: 15 });
    expect(clues.map((c) => c.label)).toContain('放量');
  });

  it('returns 低换手 when turnoverRate < 3', () => {
    const clues = generateClues({ ...base, turnoverRate: 2 });
    expect(clues.map((c) => c.label)).toContain('低换手');
  });

  it('returns 高成交 when amount > 5e8', () => {
    const clues = generateClues({ ...base, amount: 6e8 });
    expect(clues.map((c) => c.label)).toContain('高成交');
  });

  it('returns multiple clues when many conditions hit', () => {
    const clues = generateClues({
      ...base,
      mainNetInflow: 1.5e8,
      pctChange: 10,
      price: 11,
      high: 11,
      turnoverRate: 15,
      amount: 6e8,
    });
    expect(clues.length).toBeGreaterThanOrEqual(4);
  });

  it('returns empty array when nothing matches', () => {
    const clues = generateClues({
      ...base,
      mainNetInflow: 0,
      pctChange: 5,
      turnoverRate: 5,
      amount: 1e8,
      price: 10,
      high: 10,
    });
    expect(clues).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run src/utils/clues.test.ts`
Expected: FAIL "Cannot find module './clues'".

- [ ] **Step 3: Write `src/utils/clues.ts`**

```ts
import type { Clue, Stock } from '../types';

const THRESHOLDS = {
  mainInflowLarge: 1e8,
  mainInflowMedium: 5e7,
  limitSealed: 9.95,
  limitNear: 9.5,
  gapFromHigh: 0.99,
  highTurnover: 10,
  lowTurnover: 3,
  largeAmount: 5e8,
};

export function generateClues(stock: Stock): Clue[] {
  const clues: Clue[] = [];

  if (stock.mainNetInflow > THRESHOLDS.mainInflowLarge) {
    clues.push({ label: '主力大幅流入', type: 'fund' });
  } else if (stock.mainNetInflow > THRESHOLDS.mainInflowMedium) {
    clues.push({ label: '主力流入', type: 'fund' });
  } else if (stock.mainNetInflow < 0) {
    clues.push({ label: '主力流出', type: 'fund' });
  }

  if (stock.pctChange >= THRESHOLDS.limitSealed &&
      stock.high > 0 &&
      stock.price >= stock.high * 0.999) {
    clues.push({ label: '封涨停', type: 'limit' });
  } else if (stock.pctChange >= THRESHOLDS.limitNear &&
             stock.pctChange < THRESHOLDS.limitSealed) {
    clues.push({ label: '接近涨停', type: 'limit' });
  }

  if (stock.high > 0 && stock.price < stock.high * THRESHOLDS.gapFromHigh) {
    clues.push({ label: '炸板风险', type: 'limit' });
  }

  if (stock.turnoverRate > THRESHOLDS.highTurnover) {
    clues.push({ label: '放量', type: 'volume' });
  } else if (stock.turnoverRate > 0 && stock.turnoverRate < THRESHOLDS.lowTurnover) {
    clues.push({ label: '低换手', type: 'volume' });
  }

  if (stock.amount > THRESHOLDS.largeAmount) {
    clues.push({ label: '高成交', type: 'volume' });
  }

  return clues;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run src/utils/clues.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/clues.ts src/utils/clues.test.ts
git commit -m "feat: add observation clue generator with tests"
```

---

## Task 6: Sort utils (TDD)

**Files:**
- Create: `src/utils/sort.ts`
- Test: `src/utils/sort.test.ts`

- [ ] **Step 1: Write failing tests `src/utils/sort.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { sortStocks } from './sort';
import type { Stock, SortState } from '../types';

const a: Stock = {
  code: '000001', name: 'A', market: 'sz', price: 10,
  pctChange: 9.9, turnoverRate: 5, amount: 1e8,
  mainNetInflow: 1e8, mainNetInflowPct: 5,
  high: 11, low: 9, industry: '银行', isST: false,
};
const b: Stock = {
  code: '600000', name: 'B', market: 'sh', price: 20,
  pctChange: 10.0, turnoverRate: 8, amount: 2e8,
  mainNetInflow: 5e7, mainNetInflowPct: 3,
  high: 22, low: 18, industry: '银行', isST: false,
};
const c: Stock = {
  code: '000002', name: 'C', market: 'sz', price: 5,
  pctChange: 9.5, turnoverRate: 15, amount: 3e8,
  mainNetInflow: -1e7, mainNetInflowPct: -1,
  high: 5.5, low: 4.5, industry: '地产', isST: false,
};
const stocks = [a, b, c];

describe('sortStocks', () => {
  it('returns original order when order is none', () => {
    const state: SortState = { key: 'pctChange', order: 'none' };
    expect(sortStocks(stocks, state)).toEqual(stocks);
  });

  it('returns original order when key is null', () => {
    const state: SortState = { key: null, order: 'desc' };
    expect(sortStocks(stocks, state)).toEqual(stocks);
  });

  it('sorts by pctChange desc', () => {
    const state: SortState = { key: 'pctChange', order: 'desc' };
    const out = sortStocks(stocks, state);
    expect(out.map((s) => s.code)).toEqual(['600000', '000001', '000002']);
  });

  it('sorts by mainNetInflow asc', () => {
    const state: SortState = { key: 'mainNetInflow', order: 'asc' };
    const out = sortStocks(stocks, state);
    expect(out.map((s) => s.code)).toEqual(['000002', '600000', '000001']);
  });

  it('sorts by code asc', () => {
    const state: SortState = { key: 'code', order: 'asc' };
    const out = sortStocks(stocks, state);
    expect(out.map((s) => s.code)).toEqual(['000001', '000002', '600000']);
  });

  it('sorts by name desc', () => {
    const state: SortState = { key: 'name', order: 'desc' };
    const out = sortStocks(stocks, state);
    expect(out.map((s) => s.code)).toEqual(['000002', '600000', '000001']);
  });

  it('does not mutate the input array', () => {
    const state: SortState = { key: 'price', order: 'asc' };
    const before = [...stocks];
    sortStocks(stocks, state);
    expect(stocks).toEqual(before);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run src/utils/sort.test.ts`
Expected: FAIL "Cannot find module './sort'".

- [ ] **Step 3: Write `src/utils/sort.ts`**

```ts
import type { SortState, Stock } from '../types';
import { generateClues } from './clues';

export function sortStocks(stocks: Stock[], state: SortState): Stock[] {
  if (state.order === 'none' || state.key === null) {
    return stocks;
  }

  const dir = state.order === 'asc' ? 1 : -1;
  const clueCache = new Map<Stock, number>();
  const getClueCount = (s: Stock): number => {
    if (!clueCache.has(s)) clueCache.set(s, generateClues(s).length);
    return clueCache.get(s)!;
  };

  const getValue = (s: Stock): number | string => {
    switch (state.key) {
      case 'code': return s.code;
      case 'name': return s.name;
      case 'market': return s.market;
      case 'price': return s.price;
      case 'pctChange': return s.pctChange;
      case 'mainNetInflow': return s.mainNetInflow;
      case 'amount': return s.amount;
      case 'turnoverRate': return s.turnoverRate;
      case 'clueCount': return getClueCount(s);
    }
  };

  return [...stocks].sort((x, y) => {
    const vx = getValue(x);
    const vy = getValue(y);
    if (typeof vx === 'string' && typeof vy === 'string') {
      return vx.localeCompare(vy, 'zh') * dir;
    }
    return ((vx as number) - (vy as number)) * dir;
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run src/utils/sort.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/sort.ts src/utils/sort.test.ts
git commit -m "feat: add multi-key stock sorter with tests"
```

---

## Task 7: Industry map data

**Files:**
- Create: `src/data/industry-map.ts`

- [ ] **Step 1: Write `src/data/industry-map.ts`**

```ts
const INDUSTRY_MAP: Record<string, string> = {
  '000001': '银行',
  '000002': '房地产',
  '000063': '通信设备',
  '000333': '家电',
  '000651': '家电',
  '000858': '白酒',
  '002007': '生物制品',
  '002230': '安防设备',
  '002415': '安防设备',
  '002594': '汽车',
  '300015': '医疗器械',
  '300059': '证券',
  '300750': '电池',
  '600000': '银行',
  '600036': '银行',
  '600104': '汽车',
  '600276': '化学制药',
  '600309': '化工',
  '600406': '电力设备',
  '600519': '白酒',
  '600887': '乳品',
  '601012': '光伏',
  '601138': '消费电子',
  '601318': '保险',
  '601398': '银行',
  '601888': '旅游',
};

export function lookupIndustry(code: string): string | undefined {
  return INDUSTRY_MAP[code];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/industry-map.ts
git commit -m "feat: add common A-share industry mapping"
```

---

## Task 8: East Money JSONP wrapper

**Files:**
- Create: `src/api/eastmoney.ts`
- Test: `src/api/eastmoney.test.ts`

- [ ] **Step 1: Write failing tests `src/api/eastmoney.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { jsonpRequest } from './eastmoney';

describe('jsonpRequest', () => {
  let originalWindow: Window;
  let scripts: HTMLScriptElement[];
  let scriptOnload: (el: HTMLScriptElement) => void;

  beforeEach(() => {
    originalWindow = window;
    scripts = [];
    scriptOnload = () => {};
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag);
      if (tag === 'script') {
        scripts.push(el as HTMLScriptElement);
        Object.defineProperty(el, 'src', {
          set(value: string) {
            (el as any)._src = value;
            setTimeout(() => scriptOnload(el as HTMLScriptElement), 0);
          },
          get() {
            return (el as any)._src;
          },
        });
      }
      return el;
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => {
      return node;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves with data when callback fires', async () => {
    const promise = jsonpRequest<{ hello: string }>('https://example.com/api');
    await new Promise((r) => setTimeout(r, 0));

    expect(scripts.length).toBe(1);
    const src = scripts[0].src as string;
    expect(src).toContain('https://example.com/api');
    expect(src).toMatch(/cb=__jsonp_cb_\d+_\d+/);

    const cbName = (src.match(/cb=([^&]+)/) || [])[1];
    const cb = (window as any)[cbName] as (data: { hello: string }) => void;
    cb({ hello: 'world' });

    await expect(promise).resolves.toEqual({ hello: 'world' });
  });

  it('rejects on timeout', async () => {
    vi.useFakeTimers();
    try {
      const promise = jsonpRequest('https://example.com/api', { timeout: 100 });
      vi.advanceTimersByTime(200);
      await expect(promise).rejects.toThrow('JSONP timeout');
    } finally {
      vi.useRealTimers();
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run src/api/eastmoney.test.ts`
Expected: FAIL "Cannot find module './eastmoney'".

- [ ] **Step 3: Write `src/api/eastmoney.ts`**

```ts
interface JsonpOptions {
  timeout?: number;
  callbackParam?: string;
}

export function jsonpRequest<T>(
  url: string,
  options: JsonpOptions = {},
): Promise<T> {
  const { timeout = 10000, callbackParam = 'cb' } = options;
  return new Promise<T>((resolve, reject) => {
    const cbName = `__jsonp_cb_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const script = document.createElement('script');
    let finished = false;

    const timeoutId = window.setTimeout(() => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error(`JSONP timeout after ${timeout}ms`));
    }, timeout);

    function cleanup() {
      window.clearTimeout(timeoutId);
      delete (window as any)[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    (window as any)[cbName] = (data: T) => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error('JSONP network error'));
    };

    const sep = url.includes('?') ? '&' : '?';
    script.src = `${url}${sep}${callbackParam}=${cbName}`;
    document.body.appendChild(script);
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run src/api/eastmoney.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/eastmoney.ts src/api/eastmoney.test.ts
git commit -m "feat: add JSONP request wrapper with tests"
```

---

## Task 9: Stocks API and field mapping (TDD)

**Files:**
- Create: `src/api/stocks.ts`
- Test: `src/api/stocks.test.ts`

- [ ] **Step 1: Write failing tests `src/api/stocks.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { fetchStocks } from './stocks';
import type { Stock } from '../types';

vi.mock('./eastmoney', () => ({
  jsonpRequest: vi.fn(),
}));

import { jsonpRequest } from './eastmoney';
const mockedJsonp = vi.mocked(jsonpRequest);

describe('fetchStocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns mapped stocks for valid response', async () => {
    mockedJsonp.mockResolvedValueOnce({
      data: {
        diff: [
          {
            f2: 11.0, f3: 10.0, f6: 5e8, f8: 8.5,
            f12: '000001', f13: 0, f14: '平安银行',
            f15: 11.0, f16: 10.0, f62: 1e8, f184: 5.2,
          },
          {
            f2: 22.0, f3: 10.0, f6: 3e8, f8: 5,
            f12: '600000', f13: 1, f14: '浦发银行',
            f15: 22.0, f16: 20.0, f62: 5e7, f184: 2.1,
          },
        ],
      },
    } as any);

    const result = await fetchStocks({ boardScope: 'main' });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual<Stock>({
      code: '000001',
      name: '平安银行',
      market: 'sz',
      price: 11.0,
      pctChange: 10.0,
      turnoverRate: 8.5,
      amount: 5e8,
      mainNetInflow: 1e8,
      mainNetInflowPct: 5.2,
      high: 11.0,
      low: 10.0,
      industry: '银行',
      isST: false,
    });
    expect(result[1].market).toBe('sh');
    expect(result[1].industry).toBe('银行');
  });

  it('maps BJ market code (2) to bj', async () => {
    mockedJsonp.mockResolvedValueOnce({
      data: {
        diff: [
          {
            f2: 10, f3: 5, f6: 1e7, f8: 1, f12: '430047',
            f13: 2, f14: 'N 玖瑞', f15: 10, f16: 9,
            f62: 0, f184: 0,
          },
        ],
      },
    } as any);
    const result = await fetchStocks({ boardScope: 'all' });
    expect(result[0].market).toBe('bj');
    expect(result[0].industry).toBe('未知');
  });

  it('marks ST stocks when name contains ST', async () => {
    mockedJsonp.mockResolvedValueOnce({
      data: {
        diff: [
          {
            f2: 5, f3: 5, f6: 1e7, f8: 1, f12: '000001',
            f13: 0, f14: 'ST 测试', f15: 5, f16: 4,
            f62: 0, f184: 0,
          },
        ],
      },
    } as any);
    const result = await fetchStocks({ boardScope: 'main' });
    expect(result[0].isST).toBe(true);
  });

  it('skips rows missing code or name', async () => {
    mockedJsonp.mockResolvedValueOnce({
      data: {
        diff: [
          { f2: 5, f3: 5, f12: '', f13: 0, f14: 'X' },
          { f2: 5, f3: 5, f12: '000001', f13: 0, f14: '' },
          { f2: 5, f3: 5, f12: '000002', f13: 0, f14: 'OK' },
        ],
      },
    } as any);
    const result = await fetchStocks({ boardScope: 'main' });
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('000002');
  });

  it('returns empty array when response missing data', async () => {
    mockedJsonp.mockResolvedValueOnce({} as any);
    const result = await fetchStocks({ boardScope: 'main' });
    expect(result).toEqual([]);
  });

  it('passes boardScope=main uses main fs param', async () => {
    mockedJsonp.mockResolvedValueOnce({ data: { diff: [] } } as any);
    await fetchStocks({ boardScope: 'main' });
    const url = mockedJsonp.mock.calls[0][0];
    expect(url).toContain('m%3A0%2Bt%3A6'); // fs param URL-encoded
  });

  it('passes boardScope=all includes chuangyeboard', async () => {
    mockedJsonp.mockResolvedValueOnce({ data: { diff: [] } } as any);
    await fetchStocks({ boardScope: 'all' });
    const url = mockedJsonp.mock.calls[0][0];
    expect(url).toContain('s%3A2048');
  });
});

import { beforeEach } from 'vitest';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run src/api/stocks.test.ts`
Expected: FAIL "Cannot find module './stocks'".

- [ ] **Step 3: Write `src/api/stocks.ts`**

```ts
import type { BoardScope, Market, Stock } from '../types';
import { lookupIndustry } from '../data/industry-map';
import { jsonpRequest } from './eastmoney';

const EM_FIELDS = 'f2,f3,f6,f8,f12,f13,f14,f15,f16,f62,f184';
const BOARD_FS: Record<BoardScope, string> = {
  main: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
  all: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048',
};

interface EmRow {
  f2: number; f3: number; f6: number; f8: number;
  f12: string; f13: number; f14: string;
  f15: number; f16: number; f62: number; f184: number;
}

interface EmResponse {
  data?: { diff?: EmRow[] };
}

export interface FetchStocksParams {
  boardScope: BoardScope;
  pageSize?: number;
}

export async function fetchStocks({
  boardScope,
  pageSize = 200,
}: FetchStocksParams): Promise<Stock[]> {
  const fs = BOARD_FS[boardScope];
  const url =
    `https://push2.eastmoney.com/api/qt/clist/get` +
    `?pn=1&pz=${pageSize}&po=1&np=1&fltt=2&invt=2` +
    `&fs=${encodeURIComponent(fs)}` +
    `&fields=${EM_FIELDS}`;
  const res = await jsonpRequest<EmResponse>(url);
  const rows = res?.data?.diff ?? [];
  return rows.map(rowToStock).filter((s): s is Stock => s !== null);
}

function rowToStock(row: EmRow): Stock | null {
  if (!row.f12 || !row.f14) return null;
  const market = marketCode(row.f13);
  return {
    code: row.f12,
    name: row.f14,
    market,
    price: row.f2 ?? 0,
    pctChange: row.f3 ?? 0,
    turnoverRate: row.f8 ?? 0,
    amount: row.f6 ?? 0,
    mainNetInflow: row.f62 ?? 0,
    mainNetInflowPct: row.f184 ?? 0,
    high: row.f15 ?? 0,
    low: row.f16 ?? 0,
    industry: lookupIndustry(row.f12) ?? '未知',
    isST: row.f14.includes('ST'),
  };
}

function marketCode(n: number): Market {
  if (n === 1) return 'sh';
  if (n === 0) return 'sz';
  return 'bj';
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run src/api/stocks.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/stocks.ts src/api/stocks.test.ts
git commit -m "feat: add stocks API with East Money field mapping"
```

---

## Task 10: useTradingHours hook (TDD)

**Files:**
- Create: `src/hooks/useTradingHours.ts`
- Test: `src/hooks/useTradingHours.test.ts`

- [ ] **Step 1: Write failing tests `src/hooks/useTradingHours.test.ts`**

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTradingHours } from './useTradingHours';

vi.mock('@testing-library/react', async () => {
  const actual = await vi.importActual('@testing-library/react');
  return { ...actual };
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTradingHours', () => {
  it('returns true during morning session (10:30 Mon)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:30:00+08:00'));
    const { result } = renderHook(() => useTradingHours());
    expect(result.current).toBe(true);
  });

  it('returns true during afternoon session (14:00 Mon)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T14:00:00+08:00'));
    const { result } = renderHook(() => useTradingHours());
    expect(result.current).toBe(true);
  });

  it('returns false during lunch break (12:00 Mon)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00+08:00'));
    const { result } = renderHook(() => useTradingHours());
    expect(result.current).toBe(false);
  });

  it('returns false before open (09:00 Mon)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T09:00:00+08:00'));
    const { result } = renderHook(() => useTradingHours());
    expect(result.current).toBe(false);
  });

  it('returns false after close (16:00 Mon)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T16:00:00+08:00'));
    const { result } = renderHook(() => useTradingHours());
    expect(result.current).toBe(false);
  });

  it('returns false on Saturday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-13T10:30:00+08:00')); // Sat
    const { result } = renderHook(() => useTradingHours());
    expect(result.current).toBe(false);
  });

  it('returns false on Sunday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T10:30:00+08:00')); // Sun
    const { result } = renderHook(() => useTradingHours());
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 2: Install @testing-library/react**

```bash
pnpm add -D @testing-library/react
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm exec vitest run src/hooks/useTradingHours.test.ts`
Expected: FAIL "Cannot find module './useTradingHours'".

- [ ] **Step 4: Write `src/hooks/useTradingHours.ts`**

```ts
import { useEffect, useState } from 'react';

export function isTradingTime(now: Date = new Date()): boolean {
  const day = now.getDay();
  if (day === 0 || day === 6) return false;

  const minutes = now.getHours() * 60 + now.getMinutes();
  const morningStart = 9 * 60 + 15;
  const morningEnd = 11 * 60 + 30;
  const afternoonStart = 13 * 60;
  const afternoonEnd = 15 * 60 + 30;

  return (
    (minutes >= morningStart && minutes <= morningEnd) ||
    (minutes >= afternoonStart && minutes <= afternoonEnd)
  );
}

export function useTradingHours(intervalMs = 60_000): boolean {
  const [trading, setTrading] = useState(() => isTradingTime());

  useEffect(() => {
    const id = window.setInterval(() => {
      setTrading(isTradingTime());
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return trading;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm exec vitest run src/hooks/useTradingHours.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useTradingHours.ts src/hooks/useTradingHours.test.ts package.json pnpm-lock.yaml
git commit -m "feat: add useTradingHours hook with tests"
```

---

## Task 11: ThemeContext

**Files:**
- Create: `src/context/ThemeContext.tsx`

- [ ] **Step 1: Write `src/context/ThemeContext.tsx`**

```tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'scx-gold.theme';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/context/ThemeContext.tsx
git commit -m "feat: add ThemeContext with localStorage persistence"
```

---

## Task 12: FilterContext

**Files:**
- Create: `src/context/FilterContext.tsx`

- [ ] **Step 1: Write `src/context/FilterContext.tsx`**

```tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  DEFAULT_FILTERS,
  type BoardScope,
  type FilterState,
} from '../types';

interface FilterContextValue {
  filters: FilterState;
  setBoardScope: (scope: BoardScope) => void;
  setPctRange: (range: [number, number]) => void;
  setMinMainInflow: (value: number) => void;
  toggleExcludeST: () => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const setBoardScope = (scope: BoardScope) =>
    setFilters((prev) => ({ ...prev, boardScope: scope }));

  const setPctRange = (range: [number, number]) =>
    setFilters((prev) => ({ ...prev, pctRange: range }));

  const setMinMainInflow = (value: number) =>
    setFilters((prev) => ({ ...prev, minMainInflow: value }));

  const toggleExcludeST = () =>
    setFilters((prev) => ({ ...prev, excludeST: !prev.excludeST }));

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  return (
    <FilterContext.Provider
      value={{
        filters,
        setBoardScope,
        setPctRange,
        setMinMainInflow,
        toggleExcludeST,
        resetFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used inside FilterProvider');
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/context/FilterContext.tsx
git commit -m "feat: add FilterContext for filter state management"
```

---

## Task 13: useSort hook

**Files:**
- Create: `src/hooks/useSort.ts`

- [ ] **Step 1: Write `src/hooks/useSort.ts`**

```ts
import { useCallback, useEffect, useState } from 'react';
import type { SortKey, SortOrder } from '../types';

export interface SortState {
  key: SortKey | null;
  order: SortOrder;
}

export function useSort(): {
  state: SortState;
  toggle: (key: SortKey) => void;
  reset: () => void;
} {
  const [state, setState] = useState<SortState>(() => readFromUrl());

  useEffect(() => {
    writeToUrl(state);
  }, [state]);

  const toggle = useCallback((key: SortKey) => {
    setState((prev) => {
      if (prev.key !== key) return { key, order: 'desc' };
      const nextOrder: SortOrder =
        prev.order === 'desc' ? 'asc' : prev.order === 'asc' ? 'none' : 'desc';
      return { key: nextOrder === 'none' ? null : key, order: nextOrder };
    });
  }, []);

  const reset = useCallback(() => setState({ key: null, order: 'none' }), []);

  return { state, toggle, reset };
}

function readFromUrl(): SortState {
  if (typeof window === 'undefined') return { key: null, order: 'none' };
  const params = new URLSearchParams(window.location.search);
  const key = params.get('sort') as SortKey | null;
  const order = (params.get('order') as SortOrder | null) ?? 'none';
  if (!key) return { key: null, order: 'none' };
  return { key, order };
}

function writeToUrl(state: SortState) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (state.key && state.order !== 'none') {
    url.searchParams.set('sort', state.key);
    url.searchParams.set('order', state.order);
  } else {
    url.searchParams.delete('sort');
    url.searchParams.delete('order');
  }
  window.history.replaceState(null, '', url.toString());
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useSort.ts
git commit -m "feat: add useSort hook with URL sync"
```

---

## Task 14: useScreener hook

**Files:**
- Create: `src/hooks/useScreener.ts`

- [ ] **Step 1: Write `src/hooks/useScreener.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchStocks } from '../api/stocks';
import type { FilterState, Stock } from '../types';

interface ScreenerState {
  stocks: Stock[];
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  isStale: boolean;
  refresh: () => Promise<void>;
}

const POLL_INTERVAL = 30_000;

export function useScreener(
  filters: FilterState,
  isTrading: boolean,
): ScreenerState {
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const stocks = await fetchStocks({ boardScope: filters.boardScope });
      setAllStocks(stocks);
      setLastUpdated(new Date());
      setIsStale(false);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setIsStale(true);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [filters.boardScope]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isTrading) return;
    const id = window.setInterval(load, POLL_INTERVAL);
    return () => window.clearInterval(id);
  }, [isTrading, load]);

  const filtered = filterStocks(allStocks, filters);

  return {
    stocks: filtered,
    loading,
    error,
    lastUpdated,
    isStale,
    refresh: load,
  };
}

function filterStocks(stocks: Stock[], filters: FilterState): Stock[] {
  const [minPct, maxPct] = filters.pctRange;
  return stocks.filter((s) => {
    if (s.pctChange < minPct || s.pctChange > maxPct) return false;
    if (s.mainNetInflow < filters.minMainInflow) return false;
    if (filters.excludeST && s.isST) return false;
    return true;
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useScreener.ts
git commit -m "feat: add useScreener hook for data fetching and filtering"
```

---

## Task 15: Small UI components — ClueTag, Banner, ThemeToggle, LastUpdated

**Files:**
- Create: `src/components/ClueTag.tsx`
- Create: `src/components/Banner.tsx`
- Create: `src/components/ThemeToggle.tsx`
- Create: `src/components/LastUpdated.tsx`

- [ ] **Step 1: Write `src/components/ClueTag.tsx`**

```tsx
import type { Clue } from '../types';

const TYPE_CLASS: Record<Clue['type'], string> = {
  fund: 'clue-tag--fund',
  limit: 'clue-tag--limit',
  volume: 'clue-tag--volume',
};

export function ClueTag({ clue }: { clue: Clue }) {
  return (
    <span className={`clue-tag ${TYPE_CLASS[clue.type]}`}>{clue.label}</span>
  );
}
```

- [ ] **Step 2: Write `src/components/Banner.tsx`**

```tsx
interface BannerProps {
  type: 'error' | 'warning';
  message: string;
  onAction?: () => void;
  actionLabel?: string;
}

export function Banner({ type, message, onAction, actionLabel }: BannerProps) {
  return (
    <div className={`banner banner--${type}`}>
      <span className="banner__msg">{message}</span>
      {onAction && actionLabel && (
        <button className="banner__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write `src/components/ThemeToggle.tsx`**

```tsx
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="切换主题"
      title={theme === 'light' ? '切换到深色' : '切换到浅色'}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

- [ ] **Step 4: Write `src/components/LastUpdated.tsx`**

```tsx
interface LastUpdatedProps {
  lastUpdated: Date | null;
  isStale: boolean;
  loading: boolean;
}

export function LastUpdated({
  lastUpdated,
  isStale,
  loading,
}: LastUpdatedProps) {
  if (loading && !lastUpdated) return <span className="last-updated">加载中…</span>;
  if (!lastUpdated) return <span className="last-updated">未加载</span>;
  const time = lastUpdated.toLocaleTimeString('zh-CN', { hour12: false });
  return (
    <span className={`last-updated ${isStale ? 'last-updated--stale' : ''}`}>
      最后更新 {time}
      {isStale ? '（数据延迟）' : ''}
    </span>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ClueTag.tsx src/components/Banner.tsx src/components/ThemeToggle.tsx src/components/LastUpdated.tsx
git commit -m "feat: add ClueTag, Banner, ThemeToggle, LastUpdated components"
```

---

## Task 16: StockCard component

**Files:**
- Create: `src/components/StockCard.tsx`

- [ ] **Step 1: Write `src/components/StockCard.tsx`**

```tsx
import type { Stock } from '../types';
import { generateClues } from '../utils/clues';
import { formatAmount, formatPct, formatPrice } from '../utils/format';
import { ClueTag } from './ClueTag';

const MARKET_LABEL: Record<Stock['market'], string> = {
  sh: '沪',
  sz: '深',
  bj: '北',
};

export function StockCard({ stock }: { stock: Stock }) {
  const clues = generateClues(stock);
  const isUp = stock.pctChange >= 0;

  return (
    <div className="stock-card">
      <div className="stock-card__header">
        <div className="stock-card__name">
          <span className={`stock-card__market market--${stock.market}`}>
            {MARKET_LABEL[stock.market]}
          </span>
          {stock.name}
        </div>
        <div className="stock-card__code">{stock.code}</div>
      </div>

      <div className="stock-card__price-row">
        <span className={`stock-card__price ${isUp ? 'text-up' : 'text-down'}`}>
          {formatPrice(stock.price)}
        </span>
        <span className={`stock-card__pct ${isUp ? 'text-up' : 'text-down'}`}>
          {isUp ? '+' : ''}
          {formatPct(stock.pctChange)}
        </span>
      </div>

      <dl className="stock-card__stats">
        <div className="stock-card__stat">
          <dt>主力净流入</dt>
          <dd className={stock.mainNetInflow >= 0 ? 'text-up' : 'text-down'}>
            {formatAmount(stock.mainNetInflow)}
          </dd>
        </div>
        <div className="stock-card__stat">
          <dt>成交额</dt>
          <dd>{formatAmount(stock.amount)}</dd>
        </div>
        <div className="stock-card__stat">
          <dt>换手率</dt>
          <dd>{formatPct(stock.turnoverRate)}</dd>
        </div>
      </dl>

      {clues.length > 0 && (
        <div className="stock-card__clues">
          {clues.map((c) => (
            <ClueTag key={c.label} clue={c} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StockCard.tsx
git commit -m "feat: add StockCard component"
```

---

## Task 17: HighlightCards component

**Files:**
- Create: `src/components/HighlightCards.tsx`

- [ ] **Step 1: Write `src/components/HighlightCards.tsx`**

```tsx
import type { Stock } from '../types';
import { StockCard } from './StockCard';

interface HighlightCardsProps {
  stocks: Stock[];
}

export function HighlightCards({ stocks }: HighlightCardsProps) {
  const top = stocks.slice(0, 6);
  if (top.length === 0) {
    return (
      <section className="highlight-cards highlight-cards--empty">
        <p>暂无符合候选条件的股票</p>
      </section>
    );
  }
  return (
    <section className="highlight-cards">
      {top.map((s) => (
        <StockCard key={`${s.market}-${s.code}`} stock={s} />
      ))}
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HighlightCards.tsx
git commit -m "feat: add HighlightCards for top-6 showcase"
```

---

## Task 18: SortableTh + StockTable

**Files:**
- Create: `src/components/SortableTh.tsx`
- Create: `src/components/StockTable.tsx`

- [ ] **Step 1: Write `src/components/SortableTh.tsx`**

```tsx
import type { SortKey, SortOrder } from '../types';

interface SortableThProps {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey | null;
  currentOrder: SortOrder;
  onSort: (key: SortKey) => void;
}

export function SortableTh({
  label,
  sortKey,
  currentKey,
  currentOrder,
  onSort,
}: SortableThProps) {
  const isActive = currentKey === sortKey;
  const arrow = !isActive
    ? ''
    : currentOrder === 'asc'
      ? ' ↑'
      : currentOrder === 'desc'
        ? ' ↓'
        : '';
  return (
    <th
      className={`sortable-th ${isActive ? 'sortable-th--active' : ''}`}
      onClick={() => onSort(sortKey)}
    >
      {label}
      <span className="sortable-th__arrow">{arrow}</span>
    </th>
  );
}
```

- [ ] **Step 2: Write `src/components/StockTable.tsx`**

```tsx
import type { SortKey, Stock } from '../types';
import { generateClues } from '../utils/clues';
import { formatAmount, formatPct, formatPrice } from '../utils/format';
import { sortStocks } from '../utils/sort';
import type { SortState } from '../hooks/useSort';
import { SortableTh } from './SortableTh';
import { ClueTag } from './ClueTag';

interface StockTableProps {
  stocks: Stock[];
  sort: SortState;
  onSort: (key: SortKey) => void;
}

const MARKET_LABEL: Record<Stock['market'], string> = {
  sh: '沪',
  sz: '深',
  bj: '北',
};

export function StockTable({ stocks, sort, onSort }: StockTableProps) {
  const sorted = sortStocks(stocks, sort);

  return (
    <section className="stock-table-wrap">
      <table className="stock-table">
        <thead>
          <tr>
            <SortableTh label="代码" sortKey="code" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <SortableTh label="名称" sortKey="name" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <SortableTh label="市场" sortKey="market" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <th className="stock-table__hide-mobile">行业</th>
            <SortableTh label="最新价" sortKey="price" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <SortableTh label="涨跌幅" sortKey="pctChange" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <SortableTh label="主力净流入" sortKey="mainNetInflow" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <th className="stock-table__hide-tablet">成交额</th>
            <th className="stock-table__hide-tablet">换手率</th>
            <SortableTh label="线索" sortKey="clueCount" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => {
            const clues = generateClues(s);
            const isUp = s.pctChange >= 0;
            return (
              <tr key={`${s.market}-${s.code}`}>
                <td>{s.code}</td>
                <td className={s.isST ? 'text-st' : ''}>{s.name}</td>
                <td>{MARKET_LABEL[s.market]}</td>
                <td className="stock-table__hide-mobile">{s.industry}</td>
                <td>{formatPrice(s.price)}</td>
                <td className={isUp ? 'text-up' : 'text-down'}>
                  {isUp ? '+' : ''}
                  {formatPct(s.pctChange)}
                </td>
                <td className={s.mainNetInflow >= 0 ? 'text-up' : 'text-down'}>
                  {formatAmount(s.mainNetInflow)}
                </td>
                <td className="stock-table__hide-tablet">{formatAmount(s.amount)}</td>
                <td className="stock-table__hide-tablet">{formatPct(s.turnoverRate)}</td>
                <td>
                  <div className="stock-table__clues">
                    {clues.map((c) => (
                      <ClueTag key={c.label} clue={c} />
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <p className="stock-table__empty">没有匹配的股票</p>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SortableTh.tsx src/components/StockTable.tsx
git commit -m "feat: add SortableTh and StockTable components"
```

---

## Task 19: FilterBar component

**Files:**
- Create: `src/components/FilterBar.tsx`

- [ ] **Step 1: Write `src/components/FilterBar.tsx`**

```tsx
import { useFilters } from '../context/FilterContext';
import { INFLOW_PRESETS, type BoardScope } from '../types';

interface FilterBarProps {
  onRefresh: () => void;
  loading: boolean;
  isTrading: boolean;
}

export function FilterBar({ onRefresh, loading, isTrading }: FilterBarProps) {
  const {
    filters,
    setBoardScope,
    setPctRange,
    setMinMainInflow,
    toggleExcludeST,
  } = useFilters();

  const handlePctChange = (idx: 0 | 1, raw: string) => {
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    const next: [number, number] = [...filters.pctRange];
    next[idx] = value;
    setPctRange(next);
  };

  return (
    <section className="filter-bar">
      <div className="filter-bar__group">
        <span className="filter-bar__label">板块</span>
        <div className="seg-control">
          {(['main', 'all'] as BoardScope[]).map((scope) => (
            <button
              key={scope}
              className={`seg-control__btn ${filters.boardScope === scope ? 'seg-control__btn--active' : ''}`}
              onClick={() => setBoardScope(scope)}
            >
              {scope === 'main' ? '主板' : '全部 A 股'}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-bar__group">
        <span className="filter-bar__label">涨幅区间</span>
        <input
          type="number"
          step="0.1"
          className="filter-bar__num"
          value={filters.pctRange[0]}
          onChange={(e) => handlePctChange(0, e.target.value)}
        />
        <span className="filter-bar__sep">~</span>
        <input
          type="number"
          step="0.1"
          className="filter-bar__num"
          value={filters.pctRange[1]}
          onChange={(e) => handlePctChange(1, e.target.value)}
        />
        <span className="filter-bar__suffix">%</span>
      </div>

      <div className="filter-bar__group">
        <span className="filter-bar__label">主力资金</span>
        <select
          className="filter-bar__select"
          value={filters.minMainInflow}
          onChange={(e) => setMinMainInflow(Number(e.target.value))}
        >
          {INFLOW_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-bar__group">
        <label className="filter-bar__check">
          <input
            type="checkbox"
            checked={filters.excludeST}
            onChange={toggleExcludeST}
          />
          排除 ST
        </label>
      </div>

      <div className="filter-bar__group filter-bar__group--right">
        {isTrading && (
          <span className="filter-bar__status filter-bar__status--trading">
            交易中
          </span>
        )}
        <button
          className="filter-bar__refresh"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? '刷新中…' : '刷新'}
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FilterBar.tsx
git commit -m "feat: add FilterBar with board/pct/inflow/ST controls"
```

---

## Task 20: Header and App wiring

**Files:**
- Create: `src/components/Header.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write `src/components/Header.tsx`**

```tsx
import type { ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { LastUpdated } from './LastUpdated';

interface HeaderProps {
  lastUpdated: Date | null;
  isStale: boolean;
  loading: boolean;
  children?: ReactNode;
}

export function Header({ lastUpdated, isStale, loading, children }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__left">
        <h1 className="app-header__title">涨停候选筛选器</h1>
        <LastUpdated
          lastUpdated={lastUpdated}
          isStale={isStale}
          loading={loading}
        />
      </div>
      <div className="app-header__right">
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Rewrite `src/App.tsx`**

```tsx
import { Banner } from './components/Banner';
import { FilterBar } from './components/FilterBar';
import { Header } from './components/Header';
import { HighlightCards } from './components/HighlightCards';
import { StockTable } from './components/StockTable';
import { FilterProvider, useFilters } from './context/FilterContext';
import { ThemeProvider } from './context/ThemeContext';
import { useScreener } from './hooks/useScreener';
import { useSort } from './hooks/useSort';
import { useTradingHours } from './hooks/useTradingHours';

function AppInner() {
  const { filters } = useFilters();
  const isTrading = useTradingHours();
  const screener = useScreener(filters, isTrading);
  const sort = useSort();

  return (
    <div className="app">
      <Header
        lastUpdated={screener.lastUpdated}
        isStale={screener.isStale}
        loading={screener.loading}
      />

      {screener.error && (
        <Banner
          type="error"
          message={`获取行情失败：${screener.error.message}`}
          onAction={screener.refresh}
          actionLabel="重试"
        />
      )}

      {!isTrading && screener.lastUpdated && !screener.error && (
        <Banner
          type="warning"
          message="当前非交易时段，显示最近一次快照"
        />
      )}

      <FilterBar
        onRefresh={screener.refresh}
        loading={screener.loading}
        isTrading={isTrading}
      />

      <HighlightCards stocks={screener.stocks} />

      <StockTable
        stocks={screener.stocks}
        sort={sort.state}
        onSort={sort.toggle}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <FilterProvider>
        <AppInner />
      </FilterProvider>
    </ThemeProvider>
  );
}
```

- [ ] **Step 3: Verify TS compiles**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.tsx src/App.tsx
git commit -m "feat: wire Header and App with all providers and components"
```

---

## Task 21: Layout and component styles

**Files:**
- Modify: `src/styles/App.css`

- [ ] **Step 1: Replace `src/styles/App.css` with full styles**

```css
.app {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 20px 40px;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.app-header__title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.app-header__left {
  display: flex;
  flex-direction: column;
}

.app-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.last-updated {
  font-size: 12px;
  color: var(--text-muted);
}

.last-updated--stale {
  color: var(--warning);
}

.theme-toggle {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 14px;
}

.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 13px;
}

.banner--error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
  border: 1px solid var(--error);
}

.banner--warning {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
  border: 1px solid var(--warning);
}

.banner__action {
  background: transparent;
  border: 1px solid currentColor;
  color: inherit;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 16px;
}

.filter-bar__group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-bar__group--right {
  margin-left: auto;
}

.filter-bar__label {
  font-size: 12px;
  color: var(--text-secondary);
}

.filter-bar__num {
  width: 60px;
  padding: 4px 6px;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 13px;
}

.filter-bar__select {
  padding: 4px 8px;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 13px;
}

.filter-bar__check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  cursor: pointer;
}

.filter-bar__refresh {
  padding: 6px 14px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
}

.filter-bar__refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.filter-bar__status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.filter-bar__status--trading {
  background: rgba(16, 185, 129, 0.15);
  color: var(--down);
}

.seg-control {
  display: inline-flex;
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.seg-control__btn {
  background: var(--surface);
  color: var(--text);
  border: none;
  padding: 4px 10px;
  font-size: 13px;
  border-right: 1px solid var(--border);
}

.seg-control__btn:last-child {
  border-right: none;
}

.seg-control__btn--active {
  background: var(--accent);
  color: white;
}

.highlight-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.highlight-cards--empty {
  display: block;
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: 8px;
}

.stock-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  box-shadow: var(--shadow);
}

.stock-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stock-card__name {
  font-weight: 600;
  font-size: 14px;
}

.stock-card__code {
  font-size: 12px;
  color: var(--text-muted);
}

.stock-card__market {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 4px;
  line-height: 16px;
  text-align: center;
  font-size: 10px;
  border-radius: 3px;
  color: white;
}

.market--sh { background: #d4380d; }
.market--sz { background: #cf1322; }
.market--bj { background: #722ed1; }

.stock-card__price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.stock-card__price {
  font-size: 24px;
  font-weight: 700;
}

.stock-card__pct {
  font-size: 14px;
  font-weight: 500;
}

.stock-card__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 0 0 10px 0;
}

.stock-card__stat dt {
  font-size: 11px;
  color: var(--text-muted);
  margin: 0 0 2px 0;
}

.stock-card__stat dd {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
}

.stock-card__clues {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.clue-tag {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 3px;
  background: var(--surface-hover);
  color: var(--text-secondary);
}

.clue-tag--fund { background: rgba(37, 99, 235, 0.12); color: var(--accent); }
.clue-tag--limit { background: rgba(239, 68, 68, 0.12); color: var(--up); }
.clue-tag--volume { background: rgba(245, 158, 11, 0.15); color: var(--warning); }

.stock-table-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow-x: auto;
}

.stock-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.stock-table th,
.stock-table td {
  padding: 8px 10px;
  text-align: right;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.stock-table th:first-child,
.stock-table td:first-child,
.stock-table th:nth-child(2),
.stock-table td:nth-child(2),
.stock-table th:nth-child(3),
.stock-table td:nth-child(3) {
  text-align: left;
}

.stock-table thead th {
  background: var(--surface-hover);
  font-weight: 600;
  color: var(--text-secondary);
  position: sticky;
  top: 0;
}

.sortable-th {
  cursor: pointer;
  user-select: none;
}

.sortable-th:hover {
  color: var(--accent);
}

.sortable-th--active {
  color: var(--accent);
}

.sortable-th__arrow {
  display: inline-block;
  min-width: 12px;
}

.stock-table tbody tr:hover {
  background: var(--surface-hover);
}

.stock-table__clues {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  justify-content: flex-end;
}

.stock-table__empty {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
}

.text-up { color: var(--up); }
.text-down { color: var(--down); }
.text-st { color: var(--text-muted); font-style: italic; }

@media (max-width: 1024px) {
  .highlight-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .stock-table__hide-tablet {
    display: none;
  }
}

@media (max-width: 768px) {
  .app {
    padding: 12px;
  }

  .app-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .app-header__right {
    width: 100%;
    justify-content: space-between;
  }

  .filter-bar {
    gap: 10px;
  }

  .filter-bar__group--right {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }

  .highlight-cards {
    grid-template-columns: 1fr;
  }

  .stock-table__hide-mobile {
    display: none;
  }

  .stock-table th,
  .stock-table td {
    padding: 6px 8px;
    font-size: 12px;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/App.css
git commit -m "feat: add layout, component, and responsive styles"
```

---

## Task 22: Manual smoke test and final integration

**Files:**
- None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests pass (format, clues, sort, eastmoney, stocks, useTradingHours).

- [ ] **Step 2: Run TS check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run production build**

Run: `pnpm build`
Expected: `dist/` directory created, no errors.

- [ ] **Step 4: Manual smoke test in browser**

Run: `pnpm dev`
Open the printed URL in a browser.

Verify:
1. Page loads without console errors
2. Theme toggle switches between light/dark, persists on reload
3. Filter bar shows: 主板/全部, 涨幅 9.8~10.2%, 资金 不限, 排除 ST
4. Switching to 全部 A 股 triggers a reload
5. Adjusting pct range filters the table
6. Highlight cards show up to 6 stocks
7. Stock table shows all matching stocks with correct columns
8. Clicking column headers cycles sort asc → desc → none
9. Sort state persists in URL on reload
10. Resize window to mobile width: cards stack 1 column, table hides columns

- [ ] **Step 5: Commit any fixes**

If smoke test surfaced issues, fix and commit:

```bash
git add -A
git commit -m "fix: address smoke test findings"
```

- [ ] **Step 6: Final commit (if needed)**

If nothing changed in step 5, this is a no-op. Otherwise nothing further to commit.

---

## Self-Review

**Spec coverage:**
- 涨停候选筛选 (9.8–10.2%): Task 3 (types), Task 14 (useScreener filtering) ✓
- 主力资金过滤 (>0/5e7/1e8/3e8): Task 3 (INFLOW_PRESETS), Task 14, Task 19 (FilterBar) ✓
- 板块范围切换: Task 9 (stocks API fs), Task 12 (FilterContext), Task 19 ✓
- 重点观察卡片 (前 6): Task 16 + Task 17 ✓
- 明细表格 (完整字段): Task 18 ✓
- 表格排序 (多字段): Task 6, Task 13, Task 18 ✓
- 观察线索生成: Task 5 ✓
- 明暗主题 + localStorage: Task 2 (CSS), Task 11 (Context), Task 15 (ThemeToggle) ✓
- 响应式布局: Task 21 (media queries) ✓

**Placeholder scan:** No TBD/TODO. Every code step has actual code.

**Type consistency:**
- `Stock` interface matches across types.ts, stocks.ts, clues.ts, format tests, components ✓
- `FilterState` fields (boardScope, pctRange, minMainInflow, excludeST) match across types.ts, FilterContext, useScreener, FilterBar ✓
- `SortState` from useSort.ts matches StockTable prop and sortStocks input ✓
- `Clue.label` and `Clue.type` consistent across types.ts, clues.ts, ClueTag.tsx ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-14-zhangting-screener.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
