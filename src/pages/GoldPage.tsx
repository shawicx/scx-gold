/**
 * @description 黄金行情页面，展示国内主要黄金品种的实时行情。
 *
 * 品种：沪金主连 AU0（上期所期货）、上金所现货 Au99.99、纽约金跟踪 NYAuTN06。
 * 全部人民币计价（CNY/克）。
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { Banner } from '@/components/Banner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getApiV1MarketGoldFunc } from '@/service';
import type { GoldQuote } from '@/service/types';
import { formatAmount } from '@/utils/format';

const CATEGORY_LABEL: Record<string, string> = {
  futures_shfe: '上期所期货',
  spot_sge: '上金所现货',
  comex_proxy: '纽约金跟踪',
};

/** 单品种卡片 */
function GoldCard({ quote }: { quote: GoldQuote }) {
  const isUp = (quote.change_pct ?? 0) >= 0;
  const priceColor = quote.change_pct === null ? 'text-text' : isUp ? 'text-up' : 'text-down';

  return (
    <div className="bg-surface border border-border rounded-lg p-5 shadow-[var(--shadow)]">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-base font-semibold">{quote.name}</span>
          <span className="ml-2 text-xs text-text-muted">{quote.code}</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-text-secondary">
          {CATEGORY_LABEL[quote.category] || quote.category}
        </span>
      </div>

      {/* 现价 + 涨跌幅 */}
      <div className="flex items-baseline gap-3 mb-4 pb-4 border-b border-border">
        <span className={`text-3xl font-bold ${priceColor}`}>
          {quote.price !== null ? quote.price.toFixed(2) : '--'}
        </span>
        {quote.change_pct !== null && (
          <span className={`text-sm font-medium ${priceColor}`}>
            {isUp ? '+' : ''}
            {quote.change_pct.toFixed(2)}%
          </span>
        )}
        {quote.change !== null && quote.change_pct !== null && (
          <span className={`text-xs ${priceColor}`}>
            {isUp ? '+' : ''}
            {quote.change.toFixed(2)}
          </span>
        )}
      </div>

      {/* 行情详情 */}
      <dl className="grid grid-cols-3 gap-3 m-0">
        <div>
          <dt className="text-xs text-text-muted mb-0.5">今开</dt>
          <dd className="m-0 text-sm font-medium">
            {quote.open !== null ? quote.open.toFixed(2) : '--'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted mb-0.5">最高</dt>
          <dd className="m-0 text-sm font-medium text-up">
            {quote.high !== null ? quote.high.toFixed(2) : '--'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted mb-0.5">最低</dt>
          <dd className="m-0 text-sm font-medium text-down">
            {quote.low !== null ? quote.low.toFixed(2) : '--'}
          </dd>
        </div>
        {quote.prev_close !== null && (
          <div>
            <dt className="text-xs text-text-muted mb-0.5">昨收</dt>
            <dd className="m-0 text-sm font-medium">
              {quote.prev_close.toFixed(2)}
            </dd>
          </div>
        )}
        {quote.prev_settlement !== null && (
          <div>
            <dt className="text-xs text-text-muted mb-0.5">前结算</dt>
            <dd className="m-0 text-sm font-medium">
              {quote.prev_settlement.toFixed(2)}
            </dd>
          </div>
        )}
        {quote.position !== null && (
          <div>
            <dt className="text-xs text-text-muted mb-0.5">持仓量</dt>
            <dd className="m-0 text-sm font-medium">
              {formatAmount(quote.position)}
            </dd>
          </div>
        )}
        {quote.volume !== null && (
          <div>
            <dt className="text-xs text-text-muted mb-0.5">成交量</dt>
            <dd className="m-0 text-sm font-medium">
              {formatAmount(quote.volume)}
            </dd>
          </div>
        )}
      </dl>

      {/* 更新时间 */}
      {quote.timestamp && (
        <p className="mt-3 text-xs text-text-muted m-0">
          更新时间：{quote.timestamp}
        </p>
      )}
    </div>
  );
}

export function GoldPage() {
  const [quotes, setQuotes] = useState<GoldQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const data = await getApiV1MarketGoldFunc();
      setQuotes(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取行情失败');
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="max-w-[2560px] mx-auto px-5 pt-4 pb-10">
      {/* 页头 */}
      <header className="flex justify-between items-center pb-3 mb-4 border-b border-border">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold m-0 mb-1">黄金行情</h1>
          <p className="text-xs text-text-muted m-0">
            {lastUpdated
              ? `最后更新：${lastUpdated.toLocaleTimeString('zh-CN')}`
              : loading
                ? '加载中…'
                : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm hover:bg-surface-hover disabled:opacity-50 transition-colors"
          >
            {loading ? '刷新中…' : '刷新'}
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* 错误提示 */}
      {error && (
        <Banner type="error" message={`获取行情失败：${error}`} onAction={load} actionLabel="重试" />
      )}

      {/* 口径说明 */}
      <p className="text-xs text-text-muted mb-4 m-0">
        全部人民币计价（CNY/克）。AU0=沪金主连（上期所期货连续合约），Au99.99=上海黄金交易所现货，NYAuTN06=上金所纽约金跟踪合约。
      </p>

      {/* 品种卡片 */}
      {loading && quotes.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-lg p-5 h-64 animate-pulse"
            />
          ))}
        </div>
      ) : quotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quotes.map((q) => (
            <GoldCard key={q.code} quote={q} />
          ))}
        </div>
      ) : (
        !error && (
          <div className="bg-surface border border-border rounded-lg p-8 text-center">
            <p className="text-text-secondary m-0">暂无行情数据</p>
          </div>
        )
      )}
    </div>
  );
}
