/**
 * @description 关注列表 Context，localStorage 持久化。
 *
 * 与后端 V1 配置文件驱动策略匹配：前端管理关注列表，分析时后端读自身配置。
 * 数据结构：{ code: string; name: string }[]
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

/** 关注条目 */
export interface WatchlistItem {
  /** 证券代码 */
  code: string;
  /** 简称 */
  name: string;
}

const STORAGE_KEY = 'scx-gold.watchlist';

/** 首次使用时的默认关注列表（常见宽基/行业 ETF） */
const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { code: '510300', name: '沪深300ETF' },
  { code: '159915', name: '创业板ETF' },
  { code: '512100', name: '中证1000ETF' },
];

interface WatchlistContextValue {
  /** 关注列表 */
  items: WatchlistItem[];
  /** 添加关注（已存在则忽略） */
  add: (item: WatchlistItem) => void;
  /** 移除关注 */
  remove: (code: string) => void;
  /** 是否已关注 */
  has: (code: string) => boolean;
  /** 清空关注列表 */
  clear: () => void;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

/** 从 localStorage 读取关注列表，无则用默认列表 */
function loadItems(): WatchlistItem[] {
  if (typeof window === 'undefined') return DEFAULT_WATCHLIST;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_WATCHLIST;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_WATCHLIST;
    return parsed.filter(
      (it): it is WatchlistItem =>
        typeof it?.code === 'string' && typeof it?.name === 'string',
    );
  } catch {
    return DEFAULT_WATCHLIST;
  }
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WatchlistItem[]>(loadItems);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((item: WatchlistItem) => {
    setItems((prev) =>
      prev.some((it) => it.code === item.code) ? prev : [...prev, item],
    );
  }, []);

  const remove = useCallback((code: string) => {
    setItems((prev) => prev.filter((it) => it.code !== code));
  }, []);

  const has = useCallback(
    (code: string) => items.some((it) => it.code === code),
    [items],
  );

  const clear = useCallback(() => setItems([]), []);

  return (
    <WatchlistContext.Provider value={{ items, add, remove, has, clear }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider');
  return ctx;
}
