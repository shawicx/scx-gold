import type { Stock } from '../types';
import { StockCard } from './StockCard';

interface HighlightCardsProps {
  stocks: Stock[];
}

export function HighlightCards({ stocks }: HighlightCardsProps) {
  const top = stocks.slice(0, 6);
  if (top.length === 0) {
    return (
      <section className="highlight-cards highlight-cards--empty">
        <p>暂无符合候选条件的股票</p>
      </section>
    );
  }
  return (
    <section className="highlight-cards">
      {top.map((s) => (
        <StockCard key={`${s.market}-${s.code}`} stock={s} />
      ))}
    </section>
  );
}
