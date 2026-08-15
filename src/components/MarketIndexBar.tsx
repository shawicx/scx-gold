/**
 * @description 大盘指数条：Header 下方紧凑展示主要指数行情（名称 + 现价 + 涨跌幅）。
 *
 * 数据来自 useMarketIndex；后端业务错误（如 DB 未连）且无数据时静默隐藏整条，
 * 不打扰涨停筛选主链路；有旧数据时仅提示更新失败。移动端横向滚动。
 */

import { useMarketIndex } from '@/hooks/useMarketIndex';
import { formatPct, formatPrice } from '@/utils/format';

interface MarketIndexBarProps {
  /** 是否处于交易时段（决定是否 30s 轮询） */
  isTrading: boolean;
}

export function MarketIndexBar({ isTrading }: MarketIndexBarProps) {
  const { quotes, hasError } = useMarketIndex(isTrading);

  // 无数据（首次加载或后端不可用）时静默隐藏，不占位不报错
  if (quotes.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-lg mb-4 overflow-x-auto">
      <div className="flex items-center gap-0 min-w-max px-3 py-2">
        <span className="text-xs text-text-secondary mr-2 flex-shrink-0">大盘</span>
        {quotes.map((q) => {
          const pct = q.change_pct ?? 0;
          const isUp = pct >= 0;
          return (
            <div
              key={q.code}
              className="flex items-baseline gap-1.5 px-3 border-l border-border"
            >
              <span className="text-[13px] text-text-secondary whitespace-nowrap">
                {q.name}
              </span>
              <span className="text-[13px] font-medium whitespace-nowrap">
                {formatPrice(q.price ?? 0)}
              </span>
              <span
                className={`text-[13px] font-medium whitespace-nowrap ${isUp ? 'text-up' : 'text-down'}`}
              >
                {isUp ? '+' : ''}
                {formatPct(pct)}
              </span>
            </div>
          );
        })}
        {hasError && (
          <span className="text-xs text-text-muted ml-auto flex-shrink-0 pl-3 whitespace-nowrap">
            指数更新失败
          </span>
        )}
      </div>
    </div>
  );
}
