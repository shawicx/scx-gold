# Tailwind + GSAP 改造设计文档

- 日期: 2026-06-15
- 项目: scx-gold
- 状态: 已通过设计评审，待实现
- 关联前置设计: `docs/superpowers/specs/2026-06-14-zhangting-screener-design.md`

## 1. 目标

在已完成的涨停候选筛选器基础上：

1. **Tailwind CSS v4 全量迁移** —— 删除 `App.css`，所有组件改用 Tailwind 工具类。保留主题切换逻辑（CSS 变量 + `data-theme`）。
2. **GSAP 动画** —— 四个目标动画：
   - 重点卡片错峰入场（仅首次加载和板块切换时触发）
   - 表格行 Flip 平滑重排（排序变化时）
   - 价格 / 涨跌幅 / 主力净流入数值变化时背景闪烁（涨红跌绿）
   - Banner 从上方 slide-in

## 非目标

- 不引入 SplitText、ScrollTrigger 等 GSAP 其它插件
- 不为 GSAP hooks 写单测（DOM 动画难以单测，jsdom + gsap mocking 收益低）
- 不改业务逻辑（数据源、筛选规则、排序规则、观察线索全部保持不变）
- 不改组件结构和 props 接口

## 2. 技术栈

- **Tailwind CSS v4**（CSS-first 配置，无 `tailwind.config.js`）
- `@tailwindcss/vite` —— Vite 插件，替代 PostCSS 链
- **GSAP v3** + Flip 插件（2024-05 之后全免费）
- `@gsap/react` —— 提供 `useGSAP` 上下文管理（自动 cleanup）

## 3. 架构

### 文件结构

```
src/
├── styles/
│   └── index.css              # 唯一 CSS 入口（@import tailwind + @theme inline + :root + [data-theme])
├── hooks/
│   └── animations/
│       ├── useStaggerIn.ts
│       ├── useFlipSort.ts
│       ├── useNumberFlash.ts
│       └── useBannerSlide.ts
└── components/                # 9 个组件全部用 Tailwind 类名重写
```

**删除**：
- `src/styles/App.css`
- `src/styles/theme.css`

**新增 / 修改**：见第 8 节文件清单。

### Tailwind 与主题变量整合

`src/styles/index.css` 的核心思路：

```css
@import "tailwindcss";

/* 桥接：让 Tailwind 生成的工具类引用 CSS 变量 */
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

/* 主题变量原样保留 —— 切 data-theme 即可，无需 dark: 变体 */
:root,
[data-theme='light'] {
  --bg: #fafafa;
  --surface: #ffffff;
  /* ... 其余沿用原 theme.css ... */
}

[data-theme='dark'] {
  --bg: #0f0f0f;
  --surface: #1a1a1a;
  /* ... */
}
```

**为什么用 `@theme inline` 而不是 `dark:` 变体**：

- 现有架构用 `[data-theme]` 切换 CSS 变量值，逻辑成熟
- `@theme inline` 让 Tailwind 生成 `bg-bg`、`text-up`、`border-border` 等工具类引用 `var(--bg)`
- 变量随 data-theme 切换，工具类自动跟随
- 零运行时开销，无需为每个色值写两套类名（`bg-bg dark:bg-bg-dark`）

**使用示例**：

```tsx
// 之前
<div className="stock-card">

// 之后
<div className="bg-surface border border-border rounded-lg p-3 shadow-[var(--shadow)]">
```

阴影使用 Tailwind 任意值语法 `shadow-[var(--shadow)]`，因为阴影值不是颜色，不进 `@theme`。

### 响应式映射

原 CSS 是 desktop-first。Tailwind 默认 mobile-first，需要倒过来。

| 原 CSS | Tailwind |
|---|---|
| 默认 desktop | `lg:` 前缀（≥1024px） |
| `@media (max-width: 1024px)` 改平板 | 默认 + `lg:` |
| `@media (max-width: 768px)` 改手机 | 默认 + `md:` + `lg:` |

示例（`HighlightCards`）：

```tsx
// 三列桌面、两列平板、单列手机
<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
```

表格隐藏列：

- `.stock-table__hide-mobile` → `hidden md:table-cell`
- `.stock-table__hide-tablet` → `hidden lg:table-cell`

注意：`<th>` / `<td>` 的默认 display 是 `table-cell`，`hidden` 覆盖为 `none`，断点处用 `md:table-cell` / `lg:table-cell` 还原。

## 4. GSAP Hooks 设计

### `useStaggerIn(ref, deps, opts)`

**触发条件**：仅首次加载和板块切换时（不每次刷新都重播）。

调用方需要把 deps 设为 `[boardScope]` 或类似，**不**包含股票列表本身。

```ts
import { useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { useRef } from 'react';

interface StaggerOpts {
  duration?: number;
  y?: number;
  stagger?: number;
}

export function useStaggerIn<T extends HTMLElement>(
  ref: React.RefObject<T>,
  deps: React.DependencyList,
  opts: StaggerOpts = {},
) {
  const { duration = 0.35, y = 16, stagger = 0.05 } = opts;
  const firstRun = useRef(true);

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
  }, deps);

  // 首次后标记，避免后续误触（虽然 deps 控制已足够，留作文档语义）
  firstRun.current = false;
}
```

调用方：

```tsx
const { filters } = useFilters();
useStaggerIn(gridRef, [filters.boardScope]);
```

### `useFlipSort(ref, deps)`

**触发条件**：sort 字段变化或 stocks 数量变化时（数据刷新不触发，因为视觉无意义）。

```ts
import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

export function useFlipSort<T extends HTMLElement>(
  ref: React.RefObject<T>,
  deps: React.DependencyList,
) {
  const stateRef = useRef<Flip.FlipState | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;

    const prevState = stateRef.current;
    stateRef.current = Flip.getState(ref.current.children);

    if (!prevState) return; // 首次渲染不动画

    Flip.from(prevState, {
      duration: 0.4,
      absolute: true,
      ease: 'power2.inOut',
    });
  }, deps);
}
```

调用方：

```tsx
const sort = useSort();
useFlipSort(tbodyRef, [sort.state.key, sort.state.order, stocks.length]);
```

注意 deps 包含 `stocks.length`（过滤变化时重排）但**不**包含 stocks 数组本身（数据刷新但顺序不变时不触发）。

### `useNumberFlash(value)`

**触发条件**：每次 value 变化（涨红跌绿）。

```ts
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function useNumberFlash(value: number) {
  const ref = useRef<HTMLElement>(null);
  const prev = useRef(value);

  useEffect(() => {
    if (!ref.current || prev.current === value) return;
    const isUp = value > prev.current;
    prev.current = value;

    const flash = isUp
      ? 'rgba(239, 68, 68, 0.25)'  // 涨红
      : 'rgba(16, 185, 129, 0.25)'; // 跌绿

    gsap.fromTo(
      ref.current,
      { backgroundColor: flash },
      { backgroundColor: 'transparent', duration: 0.9, ease: 'power2.out' },
    );
  }, [value]);

  return ref;
}
```

调用方：

```tsx
function StockCard({ stock }: { stock: Stock }) {
  const priceRef = useNumberFlash(stock.price);
  const pctRef = useNumberFlash(stock.pctChange);
  const inflowRef = useNumberFlash(stock.mainNetInflow);

  return (
    // ...
    <span ref={priceRef as React.RefObject<HTMLSpanElement>}>...</span>
    <span ref={pctRef as React.RefObject<HTMLSpanElement>}>...</span>
    <dd ref={inflowRef as React.RefObject<HTMLDDElement>}>...</dd>
  );
}
```

> Type 注解：`useRef<HTMLElement>` 返回 `RefObject<HTMLElement>`，但 JSX `ref` 期待具体元素类型。可以用泛型让调用方指定，或直接断言。本期用断言（简单），如有重构再改。

### `useBannerSlide(ref)`

**触发条件**：Banner 挂载时（每次出现都 slide-in）。

```ts
import { useLayoutEffect } from 'react';
import { gsap } from 'gsap';

export function useBannerSlide<T extends HTMLElement>(ref: React.RefObject<T>) {
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
  }, []);
}
```

## 5. 组件迁移映射

每个组件的迁移要点：

| 组件 | 样式迁移 | GSAP |
|---|---|---|
| `src/App.tsx` | `.app` → `max-w-[2560px] mx-auto px-5 pt-4 pb-10` | — |
| `Header.tsx` | `.app-header*` → flex 布局类 | — |
| `ThemeToggle.tsx` | `.theme-toggle` → 按钮 + 边框类 | — |
| `LastUpdated.tsx` | `.last-updated*` → 文字大小 / 颜色类 | — |
| `Banner.tsx` | `.banner*` → flex + 颜色类 | `useBannerSlide` |
| `FilterBar.tsx` | `.filter-bar*` + `.seg-control*` → flex / 输入控件类 | — |
| `HighlightCards.tsx` | `.highlight-cards*` → grid 类 | `useStaggerIn(ref, [boardScope])` |
| `StockCard.tsx` | `.stock-card*` + `.clue-tag*` + `.market--*` → 复合类 | `useNumberFlash` × 3 |
| `StockTable.tsx` + `SortableTh.tsx` | `.stock-table*` + `.sortable-th*` → table 类 | `useFlipSort(tbodyRef, [sort, length])` |
| `ClueTag.tsx` | `.clue-tag--*` → 颜色类（三种 type） | — |

## 6. Tailwind 工具类映射表

主要业务类的对应关系（用于实施时参考）：

| CSS 类 | Tailwind 工具类 |
|---|---|
| `color: var(--text)` | `text-text` |
| `color: var(--text-secondary)` | `text-text-secondary` |
| `color: var(--text-muted)` | `text-text-muted` |
| `color: var(--up)` / `color: var(--down)` | `text-up` / `text-down` |
| `background: var(--surface)` | `bg-surface` |
| `background: var(--bg)` | `bg-bg` |
| `background: var(--accent)` | `bg-accent` |
| `border: 1px solid var(--border)` | `border border-border` |
| `box-shadow: var(--shadow)` | `shadow-[var(--shadow)]` |

半透明色块（如 banner 背景）用任意值：`bg-[rgba(239,68,68,0.1)]`。

## 7. Bundle 影响

| 文件 | 当前 | 预期变化 |
|---|---|---|
| `index.js` | 157 KB | +~80 KB（gsap core + Flip + @gsap/react） |
| `index.css` | 6.6 KB | -3 KB 左右（Tailwind 仅生成用到的类） |

gzip 后 JS 约 +25 KB，可接受。

## 8. 文件改动清单

**新增**：
- `src/styles/index.css`
- `src/hooks/animations/useStaggerIn.ts`
- `src/hooks/animations/useFlipSort.ts`
- `src/hooks/animations/useNumberFlash.ts`
- `src/hooks/animations/useBannerSlide.ts`

**修改**：
- `package.json`（+ tailwindcss, @tailwindcss/vite, gsap, @gsap/react）
- `vite.config.ts`（注册 `@tailwindcss/vite` 插件）
- `src/main.tsx`（import 改为 `./styles/index.css`，去掉 theme.css 和 App.css）
- `src/App.tsx`（仅 `.app` div 类名替换）
- `src/components/Header.tsx`
- `src/components/ThemeToggle.tsx`
- `src/components/LastUpdated.tsx`
- `src/components/Banner.tsx`（+ useBannerSlide）
- `src/components/FilterBar.tsx`
- `src/components/HighlightCards.tsx`（+ useStaggerIn）
- `src/components/StockCard.tsx`（+ useNumberFlash × 3）
- `src/components/StockTable.tsx`（+ useFlipSort）
- `src/components/SortableTh.tsx`
- `src/components/ClueTag.tsx`

**删除**：
- `src/styles/App.css`
- `src/styles/theme.css`

## 9. 测试

- 保留现有 46 个测试（utils + hooks + api 层），不动
- 新增的 4 个 GSAP hook 不写单测
- 组件迁移不改业务逻辑，不需要新测试
- 最终通过浏览器冒烟测试验证视觉效果（详见实现计划 Task 16）

## 10. 后续可扩展（不在本期范围）

- SplitText 等插件（如果未来要做更复杂的文字动画）
- GSAP 单测（如果未来要测试动画时序，需要 jsdom + gsap mocking）
- 加载骨架屏（loading 期间显示 skeleton 而不是空白）
- 主题切换的颜色平滑过渡（CSS transition 即可，不需要 GSAP）
