/**
 * @description 关注列表 Context，数据源为后端 DB（/api/v1/watchlist）。
 *
 * 页面加载时从后端拉取关注列表，增删时同步到后端。
 * localStorage 作为离线缓存兜底（后端不可达时）。
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  deleteApiV1WatchlistByCodeFunc,
  getApiV1WatchlistFunc,
  postApiV1WatchlistFunc,
  putApiV1WatchlistFunc,
} from '@/service';
import type { WatchlistItemData } from '@/service/types';

const STORAGE_KEY = 'scx-gold.watchlist';

/** 无默认关注列表——用户自行添加 */

interface WatchlistContextValue {
  items: WatchlistItemData[];
  loading: boolean;
  add: (code: string, name?: string) => Promise<void>;
  remove: (code: string) => Promise<void>;
  has: (code: string) => boolean;
  clear: () => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

/** 从 localStorage 读取缓存（后端不可达时兜底） */
function loadCached(): WatchlistItemData[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WatchlistItemData[]>(loadCached);
  const [loading, setLoading] = useState(true);

  // 启动时从后端加载
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getApiV1WatchlistFunc();
        if (!cancelled) {
          setItems(data);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      } catch {
        // 后端不可达：用 localStorage 缓存
        if (!cancelled) {
          setItems(loadCached());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((list: WatchlistItemData[]) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, []);

  const add = useCallback(
    async (code: string, name?: string) => {
      if (items.some((it) => it.code === code)) return;
      // 乐观更新
      const optimistic: WatchlistItemData = {
        code,
        name: name || code,
        sort_order: items.length,
      };
      const next = [...items, optimistic];
      setItems(next);
      persist(next);
      try {
        const result = await postApiV1WatchlistFunc(code, name);
        // 用后端返回的补全名称更新
        setItems((prev) =>
          prev.map((it) =>
            it.code === code ? { ...it, name: result.name || it.name } : it,
          ),
        );
      } catch {
        // 同步失败保持乐观状态（下次加载会纠正）
      }
    },
    [items, persist],
  );

  const remove = useCallback(
    async (code: string) => {
      const next = items.filter((it) => it.code !== code);
      setItems(next);
      persist(next);
      try {
        await deleteApiV1WatchlistByCodeFunc(code);
      } catch {
        // 同步失败保持乐观状态
      }
    },
    [items, persist],
  );

  const has = useCallback(
    (code: string) => items.some((it) => it.code === code),
    [items],
  );

  const clear = useCallback(async () => {
    setItems([]);
    window.localStorage.removeItem(STORAGE_KEY);
    // 用整体替换传空列表清空后端（比逐个删除更可靠）
    try {
      await putApiV1WatchlistFunc([]);
    } catch {
      // 同步失败保持乐观状态
    }
  }, []);

  return (
    <WatchlistContext.Provider value={{ items, loading, add, remove, has, clear }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider');
  return ctx;
}
