/**
 * @description 个股详情抽屉（右侧滑出）：点击筛选器股票行/卡片时展示个股基础信息与实时行情。
 *
 * 数据来自 useStockDetail（后端 /api/v1/stock/{code}）；
 * 后端详情不含量能与资金字段，由前端 Stock（筛选器已有数据）兜底展示换手率/主力净流入。
 * 底部操作区：加入/移出关注（WatchlistContext，全局共享）、携带 code 跳转分析页。
 * 支持 loading / error（重试）/ 正常三态，ESC 或点击遮罩关闭。
 */

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Stock } from '../types';
import { useWatchlist } from '@/context/WatchlistContext';
import { useStockDetail } from '@/hooks/useStockDetail';
import { formatAmount, formatPct, formatPrice } from '@/utils/format';

interface StockDetailDrawerProps {
  /** 是否打开 */
  open: boolean;
  /** 当前查看的股票（null 时关闭；前端数据用于标题与字段兜底） */
  stock: Stock | null;
  /** 关闭回调 */
  onClose: () => void;
}

const MARKET_LABEL: Record<Stock['market'], string> = {
  sh: '沪市',
  sz: '深市',
  bj: '北交所',
};

/**
 * @description 成交量格式化（单位：手，按万/亿缩放）。
 *
 * @param value 成交量（手）。
 * @returns 格式化字符串。
 */
function formatVolume(value: number): string {
  if (!Number.isFinite(value)) return '--';
  const abs = Math.abs(value);
  if (abs >= 1e8) return `${(abs / 1e8).toFixed(2)}亿手`;
  if (abs >= 1e4) return `${(abs / 1e4).toFixed(2)}万手`;
  return `${value}手`;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-border last:border-b-0">
      <dt className="text-xs text-text-muted shrink-0 mr-3">{label}</dt>
      <dd className="m-0 text-sm text-text text-right">{children}</dd>
    </div>
  );
}

export function StockDetailDrawer({ open, stock, onClose }: StockDetailDrawerProps) {
  const { detail, loading, error, refresh } = useStockDetail(
    open ? stock?.code ?? null : null,
  );
  const { has, add, remove } = useWatchlist();
  const navigate = useNavigate();
  const isWatched = stock ? has(stock.code) : false;

  /**
   * @description 切换关注状态：已关注则移出，未关注则加入（乐观更新由 Context 处理）。
   */
  const handleToggleWatch = () => {
    if (!stock) return;
    if (isWatched) remove(stock.code);
    else add(stock.code, stock.name);
  };

  /**
   * @description 携带个股代码跳转分析页并关闭抽屉。
   */
  const handleGoAnalysis = () => {
    if (!stock) return;
    onClose();
    navigate(`/etf-analysis?code=${stock.code}`);
  };

  // ESC 键关闭
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open || !stock) return null;

  const quote = detail?.quote;
  const info = detail?.info;
  const isUp = (quote?.change_pct ?? stock.pctChange) >= 0;
  const market = info?.market ?? stock.market;
  const industry = info?.industry ?? stock.industry ?? '未知';

  return (
    <>
      {/* 半透明遮罩层 */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* 抽屉面板 */}
      <div
        className="fixed top-0 right-0 z-50 h-full w-full sm:w-96 bg-bg border-l border-border shadow-2xl flex flex-col"
        style={{
          transform: 'translateX(0)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold m-0 truncate">{stock.name}</h2>
            <span className="text-xs text-text-muted">{stock.code}</span>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text shrink-0 ml-3"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* 内容区（滚动） */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-surface rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-error m-0 mb-3">{error}</p>
              <button
                onClick={refresh}
                className="px-3 py-1.5 bg-accent text-white rounded text-sm"
              >
                重试
              </button>
            </div>
          )}

          {!loading && !error && (
            <div>
              {/* 行情摘要 */}
              <div className="flex items-baseline gap-2.5 mb-4">
                <span className={`text-2xl font-bold ${isUp ? 'text-up' : 'text-down'}`}>
                  {formatPrice(quote?.price ?? stock.price)}
                </span>
                {quote?.change != null && (
                  <span className={`text-sm font-medium ${isUp ? 'text-up' : 'text-down'}`}>
                    {quote.change >= 0 ? '+' : ''}
                    {formatPrice(quote.change)}
                  </span>
                )}
                <span className={`text-sm font-medium ${isUp ? 'text-up' : 'text-down'}`}>
                  {isUp ? '+' : ''}
                  {formatPct(quote?.change_pct ?? stock.pctChange)}
                </span>
              </div>

              <dl className="m-0">
                <Row label="市场">{MARKET_LABEL[market as Stock['market']] ?? market}</Row>
                <Row label="行业">{industry}</Row>
                <Row label="今开">{formatPrice(quote?.open ?? 0)}</Row>
                <Row label="最高">{formatPrice(quote?.high ?? stock.high)}</Row>
                <Row label="最低">{formatPrice(quote?.low ?? stock.low)}</Row>
                <Row label="昨收">{formatPrice(quote?.prev_close ?? 0)}</Row>
                <Row label="成交量">{formatVolume(quote?.volume ?? 0)}</Row>
                <Row label="成交额">{formatAmount(quote?.amount ?? stock.amount)}</Row>
                <Row label="换手率">{formatPct(stock.turnoverRate)}</Row>
                <Row label="主力净流入">
                  <span className={stock.mainNetInflow >= 0 ? 'text-up' : 'text-down'}>
                    {formatAmount(stock.mainNetInflow)}
                  </span>
                </Row>
              </dl>

              {detail?.fetched_at && (
                <p className="text-xs text-text-muted mt-4 text-right m-0">
                  更新于 {detail.fetched_at}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 底部操作区：关注 + 去分析 */}
        <div className="flex gap-2 px-5 py-3 border-t border-border shrink-0">
          <button
            onClick={handleToggleWatch}
            className={`flex-1 px-3 py-2 rounded text-sm border transition-colors ${
              isWatched
                ? 'border-border text-text-muted hover:text-text'
                : 'border-accent text-accent hover:bg-accent hover:text-white'
            }`}
          >
            {isWatched ? '★ 移出关注' : '☆ 加入关注'}
          </button>
          <button
            onClick={handleGoAnalysis}
            className="flex-1 px-3 py-2 bg-accent text-white border-none rounded text-sm hover:opacity-90"
          >
            去分析
          </button>
        </div>
      </div>
    </>
  );
}
