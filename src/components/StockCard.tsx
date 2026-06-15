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
            className={`inline-block w-4 h-4 mr-1 leading-4 text-center text-[12px] rounded-sm text-white align-middle ${MARKET_BG[stock.market]}`}
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
          <dt className="text-[13px] text-text-muted mb-0.5">主力净流入</dt>
          <dd
            ref={inflowRef}
            className={`m-0 text-[15px] font-medium ${stock.mainNetInflow >= 0 ? 'text-up' : 'text-down'}`}
          >
            {formatAmount(stock.mainNetInflow)}
          </dd>
        </div>
        <div>
          <dt className="text-[13px] text-text-muted mb-0.5">成交额</dt>
          <dd className="m-0 text-[15px] font-medium">
            {formatAmount(stock.amount)}
          </dd>
        </div>
        <div>
          <dt className="text-[13px] text-text-muted mb-0.5">换手率</dt>
          <dd className="m-0 text-[15px] font-medium">
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
