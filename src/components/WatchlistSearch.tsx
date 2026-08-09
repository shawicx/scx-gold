/**
 * @description 关注搜索框，复用后端 /api/v1/search 接口。
 *
 * 输入关键词（代码/简称/拼音）→ 展示下拉结果 → 点击添加关注。
 */

import { useEffect, useRef, useState } from 'react';
import { getApiV1SearchFunc } from '@/service';
import { ApiError } from '@/service/request';
import type { SearchResult } from '@/service/types';
import { useWatchlist } from '@/context/WatchlistContext';

export function WatchlistSearch() {
  const { add, has } = useWatchlist();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 防抖搜索
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await getApiV1SearchFunc({ q, limit: 10 });
        setResults(data);
        setOpen(true);
      } catch (e) {
        setResults([]);
        // 搜索接口失败静默处理（可能是索引未构建）
        if (e instanceof ApiError) {
          console.warn('搜索失败:', e.message);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // 点击外部关闭下拉
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="搜索代码/简称/拼音…"
        className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
          搜索中…
        </span>
      )}

      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-md shadow-[var(--shadow)] max-h-72 overflow-auto">
          {results.map((r) => {
            const added = has(r.code);
            return (
              <li
                key={`${r.code}-${r.type}`}
                className="flex items-center justify-between px-3 py-2 hover:bg-surface-hover cursor-default"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-surface-hover text-text-muted shrink-0">
                    {r.type === 'etf' ? 'ETF' : '股'}
                  </span>
                  <span className="text-sm font-medium truncate">{r.name}</span>
                  <span className="text-xs text-text-muted shrink-0">
                    {r.code}
                  </span>
                </div>
                <button
                  disabled={added}
                  onClick={() => {
                    add({ code: r.code, name: r.name });
                    setQuery('');
                    setResults([]);
                    setOpen(false);
                  }}
                  className={`ml-2 text-xs px-2 py-1 rounded shrink-0 transition-colors ${
                    added
                      ? 'text-text-muted cursor-not-allowed'
                      : 'text-accent hover:bg-accent hover:text-white border border-accent'
                  }`}
                >
                  {added ? '已关注' : '+ 关注'}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {open && !loading && results.length === 0 && query.trim() && (
        <div className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-md shadow-[var(--shadow)] px-3 py-2 text-sm text-text-muted">
          无匹配结果
        </div>
      )}
    </div>
  );
}
