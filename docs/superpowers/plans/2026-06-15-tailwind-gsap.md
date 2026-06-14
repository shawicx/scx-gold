# Tailwind + GSAP 改造 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在已完成的涨停候选筛选器基础上，全量迁移到 Tailwind CSS v4，并加入 GSAP 动画（卡片错峰入场、Flip 表格排序、数值闪烁、Banner slide-in）。

**Architecture:** Tailwind v4 通过 `@tailwindcss/vite` 插件接入，用 `@theme inline` 把现有 CSS 变量桥接到 Tailwind 颜色系统，主题切换逻辑不变。GSAP 通过 4 个自定义 hook 集成到对应组件。删除 App.css 和 theme.css，新建单一入口 index.css。

**Tech Stack:** Tailwind CSS v4 + @tailwindcss/vite, GSAP v3 + Flip plugin, @gsap/react

Reference design: `docs/superpowers/specs/2026-06-15-tailwind-gsap-design.md`

---

## File Structure

**新增：**
- `src/styles/index.css` — Tailwind 入口 + @theme inline + 主题变量
- `src/hooks/animations/useStaggerIn.ts` — 卡片错峰入场
- `src/hooks/animations/useFlipSort.ts` — 表格 Flip 排序
- `src/hooks/animations/useNumberFlash.ts` — 数值变化闪烁
- `src/hooks/animations/useBannerSlide.ts` — Banner slide-in

**修改：**
- `package.json` — 添加 tailwindcss、@tailwindcss/vite、gsap、@gsap/react
- `vite.config.ts` — 注册 tailwindcss 插件
- `src/main.tsx` — 切换 import 到 index.css
- `src/App.tsx` — 类名迁移
- `src/components/Header.tsx` — 类名迁移
- `src/components/ThemeToggle.tsx` — 类名迁移
- `src/components/LastUpdated.tsx` — 类名迁移
- `src/components/ClueTag.tsx` — 类名迁移
- `src/components/SortableTh.tsx` — 类名迁移
- `src/components/Banner.tsx` — 类名迁移 + useBannerSlide
- `src/components/FilterBar.tsx` — 类名迁移
- `src/components/HighlightCards.tsx` — 类名迁移 + useStaggerIn
- `src/components/StockCard.tsx` — 类名迁移 + useNumberFlash × 3
- `src/components/StockTable.tsx` — 类名迁移 + useFlipSort

**删除：**
- `src/styles/App.css`
- `src/styles/theme.css`

---

## Task 1: Install dependencies + Vite config + index.css

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Modify: `vite.config.ts`
- Create: `src/styles/index.css`

- [ ] **Step 1: Install deps**

```bash
pnpm add -D tailwindcss @tailwindcss/vite
pnpm add gsap @gsap/react
```

- [ ] **Step 2: Update `vite.config.ts`**

Overwrite entire file:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
});
```

- [ ] **Step 3: Write `src/styles/index.css`**

```css
@import "tailwindcss";

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-hover: var(--surface-hover);
  --color-border: var(--border);
  --color-text: var(--text);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-up: var(--up);
  --color-down: var(--down);
  --color-accent: var(--accent);
  --color-warning: var(--warning);
  --color-error: var(--error);
}

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

html,
body,
#root {
  height: 100%;
}

body {
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

- [ ] **Step 4: Verify build still works (old CSS still active)**

Run: `pnpm build`
Expected: build succeeds, no errors.

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

Run: `pnpm exec vitest run`
Expected: all 46 tests pass.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vite.config.ts src/styles/index.css
git commit -m "feat: install tailwind v4 + gsap, add index.css entry"
```

---

## Task 2: Switch main.tsx import + delete old CSS

**Files:**
- Modify: `src/main.tsx`
- Delete: `src/styles/theme.css`, `src/styles/App.css`

> Note: After this task, the app will look visually broken (no styling on components) until Task 4+ migrates components. This is expected mid-migration state.

- [ ] **Step 1: Update `src/main.tsx`**

Replace the two CSS imports with a single index.css import. Final file:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 2: Delete old CSS files**

```bash
rm src/styles/theme.css src/styles/App.css
```

- [ ] **Step 3: Verify build still works**

Run: `pnpm build`
Expected: build succeeds. Output HTML/CSS/JS files generated.

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

Run: `pnpm exec vitest run`
Expected: all 46 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/main.tsx src/styles/theme.css src/styles/App.css
git commit -m "refactor: switch main.tsx to index.css, remove old CSS"
```

---

## Task 3: Write 4 GSAP animation hooks

**Files:**
- Create: `src/hooks/animations/useStaggerIn.ts`
- Create: `src/hooks/animations/useFlipSort.ts`
- Create: `src/hooks/animations/useNumberFlash.ts`
- Create: `src/hooks/animations/useBannerSlide.ts`

- [ ] **Step 1: Write `src/hooks/animations/useStaggerIn.ts`**

```ts
import { useLayoutEffect, type RefObject, type DependencyList } from 'react';
import { gsap } from 'gsap';

interface StaggerOpts {
  duration?: number;
  y?: number;
  stagger?: number;
}

export function useStaggerIn<T extends HTMLElement>(
  ref: RefObject<T>,
  deps: DependencyList,
  opts: StaggerOpts = {},
) {
  const { duration = 0.35, y = 16, stagger = 0.05 } = opts;

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current!.children, {
        opacity: 0,
        y,
        duration,
        stagger,
        ease: 'power2.out',
      });
    }, ref);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
```

- [ ] **Step 2: Write `src/hooks/animations/useFlipSort.ts`**

```ts
import { useLayoutEffect, useRef, type RefObject, type DependencyList } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

export function useFlipSort<T extends HTMLElement>(
  ref: RefObject<T>,
  deps: DependencyList,
) {
  const stateRef = useRef<ReturnType<typeof Flip.getState> | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;

    const prevState = stateRef.current;
    stateRef.current = Flip.getState(ref.current.children);

    if (!prevState) return;

    Flip.from(prevState, {
      duration: 0.4,
      absolute: true,
      ease: 'power2.inOut',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
```

- [ ] **Step 3: Write `src/hooks/animations/useNumberFlash.ts`**

```ts
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function useNumberFlash<T extends HTMLElement = HTMLSpanElement>(
  value: number,
) {
  const ref = useRef<T>(null);
  const prev = useRef(value);

  useEffect(() => {
    if (!ref.current || prev.current === value) return;
    const isUp = value > prev.current;
    prev.current = value;

    const flash = isUp
      ? 'rgba(239, 68, 68, 0.25)'
      : 'rgba(16, 185, 129, 0.25)';

    gsap.fromTo(
      ref.current,
      { backgroundColor: flash },
      { backgroundColor: 'transparent', duration: 0.9, ease: 'power2.out' },
    );
  }, [value]);

  return ref;
}
```

- [ ] **Step 4: Write `src/hooks/animations/useBannerSlide.ts`**

```ts
import { useLayoutEffect, type RefObject } from 'react';
import { gsap } from 'gsap';

export function useBannerSlide<T extends HTMLElement>(ref: RefObject<T>) {
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        y: -16,
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out',
      });
    }, ref);
    return () => ctx.revert();
  }, [ref]);
}
```

- [ ] **Step 5: Verify tsc clean**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

> If `RefObject` import errors with "has no exported member", use `import type { RefObject } from 'react'` as a separate line. The inline `type` syntax should work in TS 5.

> If `gsap/Flip` module not found, verify pnpm installed `gsap` correctly: `ls node_modules/gsap/Flip.mjs` should exist.

- [ ] **Step 6: Verify tests still pass**

Run: `pnpm exec vitest run`
Expected: 46 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/animations/
git commit -m "feat: add 4 GSAP animation hooks (staggerIn, flipSort, numberFlash, bannerSlide)"
```

---

## Task 4: Migrate small leaf components (App, ThemeToggle, LastUpdated, ClueTag)

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/ThemeToggle.tsx`
- Modify: `src/components/LastUpdated.tsx`
- Modify: `src/components/ClueTag.tsx`

- [ ] **Step 1: Rewrite `src/App.tsx`**

Replace the outer div className. Full file:

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
    <div className="max-w-[2560px] mx-auto px-5 pt-4 pb-10">
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

- [ ] **Step 2: Rewrite `src/components/ThemeToggle.tsx`**

```tsx
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      className="bg-surface border border-border rounded-md px-2.5 py-1.5 text-sm"
      onClick={toggleTheme}
      aria-label="切换主题"
      title={theme === 'light' ? '切换到深色' : '切换到浅色'}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

- [ ] **Step 3: Rewrite `src/components/LastUpdated.tsx`**

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
  if (loading && !lastUpdated)
    return <span className="text-xs text-text-muted">加载中…</span>;
  if (!lastUpdated) return <span className="text-xs text-text-muted">未加载</span>;
  const time = lastUpdated.toLocaleTimeString('zh-CN', { hour12: false });
  return (
    <span className={`text-xs ${isStale ? 'text-warning' : 'text-text-muted'}`}>
      最后更新 {time}
      {isStale ? '（数据延迟）' : ''}
    </span>
  );
}
```

- [ ] **Step 4: Rewrite `src/components/ClueTag.tsx`**

```tsx
import type { Clue } from '../types';

const TYPE_CLASS: Record<Clue['type'], string> = {
  fund: 'bg-[rgba(37,99,235,0.12)] text-accent',
  limit: 'bg-[rgba(239,68,68,0.12)] text-up',
  volume: 'bg-[rgba(245,158,11,0.15)] text-warning',
};

export function ClueTag({ clue }: { clue: Clue }) {
  return (
    <span
      className={`inline-block px-1.5 py-0.5 text-[11px] rounded-sm ${TYPE_CLASS[clue.type]}`}
    >
      {clue.label}
    </span>
  );
}
```

- [ ] **Step 5: Verify tsc + tests + build**

Run: `pnpm exec tsc --noEmit` → expect no errors
Run: `pnpm exec vitest run` → expect 46 tests pass
Run: `pnpm build` → expect success

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/ThemeToggle.tsx src/components/LastUpdated.tsx src/components/ClueTag.tsx
git commit -m "refactor: migrate App, ThemeToggle, LastUpdated, ClueTag to Tailwind"
```

---

## Task 5: Migrate SortableTh + Header

**Files:**
- Modify: `src/components/SortableTh.tsx`
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Rewrite `src/components/SortableTh.tsx`**

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
      className={`px-2.5 py-2 text-right border-b border-border whitespace-nowrap bg-surface-hover font-semibold text-text-secondary sticky top-0 cursor-pointer select-none hover:text-accent ${isActive ? 'text-accent' : ''}`}
      onClick={() => onSort(sortKey)}
    >
      {label}
      <span className="inline-block min-w-[12px]">{arrow}</span>
    </th>
  );
}
```

- [ ] **Step 2: Rewrite `src/components/Header.tsx`**

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
    <header className="flex justify-between items-center pb-3 mb-4 border-b border-border">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold m-0 mb-1">涨停候选筛选器</h1>
        <LastUpdated
          lastUpdated={lastUpdated}
          isStale={isStale}
          loading={loading}
        />
      </div>
      <div className="flex items-center gap-3">
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Verify**

Run: `pnpm exec tsc --noEmit` → no errors
Run: `pnpm exec vitest run` → 46 tests pass
Run: `pnpm build` → success

- [ ] **Step 4: Commit**

```bash
git add src/components/SortableTh.tsx src/components/Header.tsx
git commit -m "refactor: migrate SortableTh and Header to Tailwind"
```

---

## Task 6: Migrate Banner + integrate useBannerSlide

**Files:**
- Modify: `src/components/Banner.tsx`

- [ ] **Step 1: Rewrite `src/components/Banner.tsx`**

```tsx
import { useRef } from 'react';
import { useBannerSlide } from '../hooks/animations/useBannerSlide';

interface BannerProps {
  type: 'error' | 'warning';
  message: string;
  onAction?: () => void;
  actionLabel?: string;
}

const TYPE_CLASS: Record<BannerProps['type'], string> = {
  error: 'bg-[rgba(239,68,68,0.1)] text-error border-error',
  warning: 'bg-[rgba(245,158,11,0.1)] text-warning border-warning',
};

export function Banner({ type, message, onAction, actionLabel }: BannerProps) {
  const ref = useRef<HTMLDivElement>(null);
  useBannerSlide(ref);

  return (
    <div
      ref={ref}
      className={`flex items-center justify-between px-3 py-2 rounded-md mb-3 text-[13px] border ${TYPE_CLASS[type]}`}
    >
      <span>{message}</span>
      {onAction && actionLabel && (
        <button
          className="bg-transparent border border-current text-current px-2.5 py-1 rounded text-xs"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm exec tsc --noEmit` → no errors
Run: `pnpm exec vitest run` → 46 tests pass
Run: `pnpm build` → success

- [ ] **Step 3: Commit**

```bash
git add src/components/Banner.tsx
git commit -m "refactor: migrate Banner to Tailwind + add slide-in animation"
```

---

## Task 7: Migrate FilterBar

**Files:**
- Modify: `src/components/FilterBar.tsx`

- [ ] **Step 1: Rewrite `src/components/FilterBar.tsx`**

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
    <section className="flex flex-wrap items-center gap-4 p-3 bg-surface border border-border rounded-lg mb-4">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-secondary">板块</span>
        <div className="inline-flex border border-border rounded overflow-hidden divide-x divide-border">
          {(['main', 'all'] as BoardScope[]).map((scope) => (
            <button
              key={scope}
              className={`px-2.5 py-1 text-[13px] ${filters.boardScope === scope ? 'bg-accent text-white' : 'bg-surface text-text'}`}
              onClick={() => setBoardScope(scope)}
            >
              {scope === 'main' ? '主板' : '全部 A 股'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-secondary">涨幅区间</span>
        <input
          type="number"
          step="0.1"
          className="w-[60px] px-1.5 py-1 bg-bg text-text border border-border rounded text-[13px]"
          value={filters.pctRange[0]}
          onChange={(e) => handlePctChange(0, e.target.value)}
        />
        <span className="text-text-secondary">~</span>
        <input
          type="number"
          step="0.1"
          className="w-[60px] px-1.5 py-1 bg-bg text-text border border-border rounded text-[13px]"
          value={filters.pctRange[1]}
          onChange={(e) => handlePctChange(1, e.target.value)}
        />
        <span className="text-text-secondary text-xs">%</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-secondary">主力资金</span>
        <select
          className="px-2 py-1 bg-bg text-text border border-border rounded text-[13px]"
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

      <div className="flex items-center gap-1.5">
        <label className="flex items-center gap-1 text-[13px] cursor-pointer">
          <input
            type="checkbox"
            checked={filters.excludeST}
            onChange={toggleExcludeST}
          />
          排除 ST
        </label>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        {isTrading && (
          <span className="text-xs px-2 py-0.5 rounded bg-[rgba(16,185,129,0.15)] text-down">
            交易中
          </span>
        )}
        <button
          className="px-3.5 py-1.5 bg-accent text-white border-none rounded text-[13px] disabled:opacity-60 disabled:cursor-not-allowed"
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

- [ ] **Step 2: Verify**

Run: `pnpm exec tsc --noEmit` → no errors
Run: `pnpm exec vitest run` → 46 tests pass
Run: `pnpm build` → success

- [ ] **Step 3: Commit**

```bash
git add src/components/FilterBar.tsx
git commit -m "refactor: migrate FilterBar to Tailwind"
```

---

## Task 8: Migrate HighlightCards + integrate useStaggerIn

**Files:**
- Modify: `src/components/HighlightCards.tsx`

- [ ] **Step 1: Rewrite `src/components/HighlightCards.tsx`**

```tsx
import { useRef } from 'react';
import type { Stock } from '../types';
import { StockCard } from './StockCard';
import { useStaggerIn } from '../hooks/animations/useStaggerIn';
import { useFilters } from '../context/FilterContext';

interface HighlightCardsProps {
  stocks: Stock[];
}

export function HighlightCards({ stocks }: HighlightCardsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { filters } = useFilters();
  useStaggerIn(ref, [filters.boardScope]);

  const top = stocks.slice(0, 6);
  if (top.length === 0) {
    return (
      <section className="block text-center p-10 text-text-muted bg-surface border border-dashed border-border rounded-lg mb-6">
        <p>暂无符合候选条件的股票</p>
      </section>
    );
  }
  return (
    <section
      ref={ref}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6"
    >
      {top.map((s) => (
        <StockCard key={`${s.market}-${s.code}`} stock={s} />
      ))}
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm exec tsc --noEmit` → no errors
Run: `pnpm exec vitest run` → 46 tests pass
Run: `pnpm build` → success

- [ ] **Step 3: Commit**

```bash
git add src/components/HighlightCards.tsx
git commit -m "refactor: migrate HighlightCards to Tailwind + add stagger-in animation"
```

---

## Task 9: Migrate StockCard + integrate useNumberFlash × 3

**Files:**
- Modify: `src/components/StockCard.tsx`

- [ ] **Step 1: Rewrite `src/components/StockCard.tsx`**

```tsx
import type { Stock } from '../types';
import { generateClues } from '../utils/clues';
import { formatAmount, formatPct, formatPrice } from '../utils/format';
import { ClueTag } from './ClueTag';
import { useNumberFlash } from '../hooks/animations/useNumberFlash';

const MARKET_LABEL: Record<Stock['market'], string> = {
  sh: '沪',
  sz: '深',
  bj: '北',
};

const MARKET_BG: Record<Stock['market'], string> = {
  sh: 'bg-[#d4380d]',
  sz: 'bg-[#cf1322]',
  bj: 'bg-[#722ed1]',
};

export function StockCard({ stock }: { stock: Stock }) {
  const clues = generateClues(stock);
  const isUp = stock.pctChange >= 0;

  const priceRef = useNumberFlash<HTMLSpanElement>(stock.price);
  const pctRef = useNumberFlash<HTMLSpanElement>(stock.pctChange);
  const inflowRef = useNumberFlash<HTMLElement>(stock.mainNetInflow);

  return (
    <div className="bg-surface border border-border rounded-lg p-3 shadow-[var(--shadow)]">
      <div className="flex justify-between items-center mb-2">
        <div className="font-semibold text-sm">
          <span
            className={`inline-block w-4 h-4 mr-1 leading-4 text-center text-[10px] rounded-sm text-white align-middle ${MARKET_BG[stock.market]}`}
          >
            {MARKET_LABEL[stock.market]}
          </span>
          {stock.name}
        </div>
        <div className="text-xs text-text-muted">{stock.code}</div>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span
          ref={priceRef}
          className={`text-2xl font-bold ${isUp ? 'text-up' : 'text-down'}`}
        >
          {formatPrice(stock.price)}
        </span>
        <span
          ref={pctRef}
          className={`text-sm font-medium ${isUp ? 'text-up' : 'text-down'}`}
        >
          {isUp ? '+' : ''}
          {formatPct(stock.pctChange)}
        </span>
      </div>

      <dl className="grid grid-cols-3 gap-2 m-0 mb-2.5">
        <div>
          <dt className="text-[11px] text-text-muted mb-0.5">主力净流入</dt>
          <dd
            ref={inflowRef}
            className={`m-0 text-[13px] font-medium ${stock.mainNetInflow >= 0 ? 'text-up' : 'text-down'}`}
          >
            {formatAmount(stock.mainNetInflow)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-text-muted mb-0.5">成交额</dt>
          <dd className="m-0 text-[13px] font-medium">
            {formatAmount(stock.amount)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-text-muted mb-0.5">换手率</dt>
          <dd className="m-0 text-[13px] font-medium">
            {formatPct(stock.turnoverRate)}
          </dd>
        </div>
      </dl>

      {clues.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {clues.map((c) => (
            <ClueTag key={c.label} clue={c} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm exec tsc --noEmit` → no errors
Run: `pnpm exec vitest run` → 46 tests pass
Run: `pnpm build` → success

- [ ] **Step 3: Commit**

```bash
git add src/components/StockCard.tsx
git commit -m "refactor: migrate StockCard to Tailwind + add number flash on price/pct/inflow"
```

---

## Task 10: Migrate StockTable + integrate useFlipSort

**Files:**
- Modify: `src/components/StockTable.tsx`

- [ ] **Step 1: Rewrite `src/components/StockTable.tsx`**

```tsx
import { useRef } from 'react';
import type { SortKey, Stock } from '../types';
import { generateClues } from '../utils/clues';
import { formatAmount, formatPct, formatPrice } from '../utils/format';
import { sortStocks } from '../utils/sort';
import type { SortState } from '../hooks/useSort';
import { useFlipSort } from '../hooks/animations/useFlipSort';
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

const TH_LEFT =
  'px-2.5 py-2 text-left border-b border-border whitespace-nowrap bg-surface-hover font-semibold text-text-secondary sticky top-0';
const TH_RIGHT =
  'px-2.5 py-2 text-right border-b border-border whitespace-nowrap bg-surface-hover font-semibold text-text-secondary sticky top-0';
const TD_LEFT =
  'px-2.5 py-2 text-left border-b border-border whitespace-nowrap';
const TD_RIGHT =
  'px-2.5 py-2 text-right border-b border-border whitespace-nowrap';

export function StockTable({ stocks, sort, onSort }: StockTableProps) {
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const sorted = sortStocks(stocks, sort);
  useFlipSort(tbodyRef, [sort.key, sort.order, stocks.length]);

  return (
    <section className="bg-surface border border-border rounded-lg overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <SortableTh label="代码" sortKey="code" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <SortableTh label="名称" sortKey="name" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <SortableTh label="市场" sortKey="market" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <th className={`hidden md:table-cell ${TH_LEFT}`}>行业</th>
            <SortableTh label="最新价" sortKey="price" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <SortableTh label="涨跌幅" sortKey="pctChange" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <SortableTh label="主力净流入" sortKey="mainNetInflow" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <th className={`hidden lg:table-cell ${TH_RIGHT}`}>成交额</th>
            <th className={`hidden lg:table-cell ${TH_RIGHT}`}>换手率</th>
            <SortableTh label="线索" sortKey="clueCount" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
          </tr>
        </thead>
        <tbody ref={tbodyRef}>
          {sorted.map((s) => {
            const clues = generateClues(s);
            const isUp = s.pctChange >= 0;
            return (
              <tr key={`${s.market}-${s.code}`} className="hover:bg-surface-hover">
                <td className={TD_LEFT}>{s.code}</td>
                <td className={`${TD_LEFT} ${s.isST ? 'text-text-muted italic' : ''}`}>{s.name}</td>
                <td className={TD_LEFT}>{MARKET_LABEL[s.market]}</td>
                <td className={`hidden md:table-cell ${TD_LEFT}`}>{s.industry}</td>
                <td className={TD_RIGHT}>{formatPrice(s.price)}</td>
                <td className={`${TD_RIGHT} ${isUp ? 'text-up' : 'text-down'}`}>
                  {isUp ? '+' : ''}
                  {formatPct(s.pctChange)}
                </td>
                <td className={`${TD_RIGHT} ${s.mainNetInflow >= 0 ? 'text-up' : 'text-down'}`}>
                  {formatAmount(s.mainNetInflow)}
                </td>
                <td className={`hidden lg:table-cell ${TD_RIGHT}`}>{formatAmount(s.amount)}</td>
                <td className={`hidden lg:table-cell ${TD_RIGHT}`}>{formatPct(s.turnoverRate)}</td>
                <td className={TD_RIGHT}>
                  <div className="flex flex-wrap gap-0.5 justify-end">
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
        <p className="p-6 text-center text-text-muted">没有匹配的股票</p>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm exec tsc --noEmit` → no errors
Run: `pnpm exec vitest run` → 46 tests pass
Run: `pnpm build` → success

- [ ] **Step 3: Commit**

```bash
git add src/components/StockTable.tsx
git commit -m "refactor: migrate StockTable to Tailwind + add Flip sort animation"
```

---

## Task 11: Browser smoke test

**Files:** none (verification only)

- [ ] **Step 1: Run full test suite**

Run: `pnpm exec vitest run`
Expected: 46 tests pass.

- [ ] **Step 2: Run TS check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run production build**

Run: `pnpm build`
Expected: build succeeds. Note the CSS bundle size — should be smaller than before (Tailwind generates only used classes).

- [ ] **Step 4: Start dev server**

```bash
pnpm dev
```

Run in background, wait 3 seconds, capture the URL, then leave it running for interactive testing.

- [ ] **Step 5: Manual browser verification**

Open the URL. Verify:

1. **Layout intact** — page looks correct (not unstyled)
2. **Theme toggle** — clicking 🌙/☀️ switches colors smoothly
3. **HighlightCards stagger-in** — on first load and on boardScope change, cards fade in from below with stagger
4. **Number flash** — when data refreshes (during trading hours), price/pctChange/mainNetInflow cells briefly flash red/green
5. **Flip sort** — clicking sortable table headers smoothly animates row reordering
6. **Banner slide-in** — error/warning banners slide in from above
7. **Responsive** — resize window: cards stack 1→2→3 columns; table hides industry on mobile and amount/turnover on tablet

- [ ] **Step 6: Stop dev server**

Kill the background `pnpm dev` process.

- [ ] **Step 7: Final git status check**

Run: `git status`
Expected: clean working tree.

Run: `git log --oneline -15`
Expected: 11 task commits visible since `b98ab74 docs: bump max-width`.

- [ ] **Step 8: Report findings**

If smoke test surfaced issues, document them. No commit needed for this task unless fixes were applied.

---

## Self-Review

**Spec coverage:**
- Tailwind v4 + @tailwindcss/vite: Task 1 ✓
- @theme inline bridging CSS vars to Tailwind colors: Task 1 ✓
- 4 GSAP hooks: Task 3 ✓
- useStaggerIn integration (boardScope dep): Task 8 ✓
- useFlipSort integration (sort + length deps): Task 10 ✓
- useNumberFlash × 3: Task 9 ✓
- useBannerSlide: Task 6 ✓
- Max-width 2560px: Task 4 (App.tsx) ✓
- Responsive (cards 1/2/3 cols, table hidden cols): Task 8 + Task 10 ✓
- Delete old CSS: Task 2 ✓
- Tests preserved: every task's verification runs `pnpm exec vitest run` ✓

**Placeholder scan:** No TBDs. Every step has actual code or actual commands.

**Type consistency:**
- `useStaggerIn<T>(ref: RefObject<T>, deps, opts)` — Task 3 defines, Task 8 uses with `useRef<HTMLDivElement>` ✓
- `useFlipSort<T>(ref: RefObject<T>, deps)` — Task 3 defines, Task 10 uses with `useRef<HTMLTableSectionElement>` ✓
- `useNumberFlash<T extends HTMLElement = HTMLSpanElement>(value: number)` — Task 3 defines, Task 9 uses with `<HTMLSpanElement>` for span refs and `<HTMLElement>` for dd ref ✓
- `useBannerSlide<T>(ref: RefObject<T>)` — Task 3 defines, Task 6 uses with `useRef<HTMLDivElement>` ✓
- Tailwind color utilities (text-up, bg-surface, border-border, etc.) — all 13 colors defined in @theme inline ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-15-tailwind-gsap.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch fresh subagent per task with two-stage review
2. **Inline Execution** — execute tasks in this session using executing-plans with checkpoints

Which approach?
