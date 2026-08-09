/**
 * @description 关注列表面板：搜索框 + 关注标的列表（可删除）。
 */

import { useWatchlist } from '@/context/WatchlistContext';
import { WatchlistSearch } from './WatchlistSearch';

export function Watchlist() {
  const { items, remove, clear } = useWatchlist();

  return (
    <div className="bg-surface border border-border rounded-lg p-4 shadow-[var(--shadow)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold m-0">
          关注列表
          <span className="ml-2 text-sm font-normal text-text-muted">
            {items.length} 只
          </span>
        </h2>
        {items.length > 0 && (
          <button
            onClick={clear}
            className="text-xs text-text-muted hover:text-error transition-colors"
          >
            清空
          </button>
        )}
      </div>

      <div className="mb-3">
        <WatchlistSearch />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6 m-0">
          还没有关注的标的
          <br />
          在上方搜索框添加 ETF 或股票
        </p>
      ) : (
        <ul className="space-y-1.5 m-0 p-0 list-none">
          {items.map((item) => (
            <li
              key={item.code}
              className="flex items-center justify-between px-3 py-2 rounded-md bg-surface-hover group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium truncate">{item.name}</span>
                <span className="text-xs text-text-muted shrink-0">
                  {item.code}
                </span>
              </div>
              <button
                onClick={() => remove(item.code)}
                className="ml-2 text-text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-all shrink-0"
                aria-label={`移除 ${item.name}`}
                title="移除"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-text-muted leading-relaxed m-0">
        提示：分析时后端读取自身配置的关注列表（SCX_WATCHLIST），需与后端 .env 保持一致。
      </p>
    </div>
  );
}
