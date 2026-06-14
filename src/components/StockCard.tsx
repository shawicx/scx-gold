import type { Stock } from '../types';
import { generateClues } from '../utils/clues';
import { formatAmount, formatPct, formatPrice } from '../utils/format';
import { ClueTag } from './ClueTag';

const MARKET_LABEL: Record<Stock['market'], string> = {
  sh: '沪',
  sz: '深',
  bj: '北',
};

export function StockCard({ stock }: { stock: Stock }) {
  const clues = generateClues(stock);
  const isUp = stock.pctChange >= 0;

  return (
    <div className="stock-card">
      <div className="stock-card__header">
        <div className="stock-card__name">
          <span className={`stock-card__market market--${stock.market}`}>
            {MARKET_LABEL[stock.market]}
          </span>
          {stock.name}
        </div>
        <div className="stock-card__code">{stock.code}</div>
      </div>

      <div className="stock-card__price-row">
        <span className={`stock-card__price ${isUp ? 'text-up' : 'text-down'}`}>
          {formatPrice(stock.price)}
        </span>
        <span className={`stock-card__pct ${isUp ? 'text-up' : 'text-down'}`}>
          {isUp ? '+' : ''}
          {formatPct(stock.pctChange)}
        </span>
      </div>

      <dl className="stock-card__stats">
        <div className="stock-card__stat">
          <dt>主力净流入</dt>
          <dd className={stock.mainNetInflow >= 0 ? 'text-up' : 'text-down'}>
            {formatAmount(stock.mainNetInflow)}
          </dd>
        </div>
        <div className="stock-card__stat">
          <dt>成交额</dt>
          <dd>{formatAmount(stock.amount)}</dd>
        </div>
        <div className="stock-card__stat">
          <dt>换手率</dt>
          <dd>{formatPct(stock.turnoverRate)}</dd>
        </div>
      </dl>

      {clues.length > 0 && (
        <div className="stock-card__clues">
          {clues.map((c) => (
            <ClueTag key={c.label} clue={c} />
          ))}
        </div>
      )}
    </div>
  );
}
