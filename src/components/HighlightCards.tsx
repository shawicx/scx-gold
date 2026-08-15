import { useRef } from 'react';
import type { Stock } from '../types';
import { StockCard } from './StockCard';
import { useStaggerIn } from '../hooks/animations/useStaggerIn';
import { useFilters } from '../context/FilterContext';

interface HighlightCardsProps {
  stocks: Stock[];
  /** 点击卡片回调（打开个股详情） */
  onSelect?: (stock: Stock) => void;
}

export function HighlightCards({ stocks, onSelect }: HighlightCardsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { filters } = useFilters();
  useStaggerIn(ref, [filters.boardScope]);

  const top = stocks.slice(0, 6);
  if (top.length === 0) {
    return (
      <section className="block text-center p-10 text-text-muted bg-surface border border-dashed border-border rounded-lg mb-6">
        <p>暂无符合候选条件的股票</p>
      </section>
    );
  }
  return (
    <section
      ref={ref}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6"
    >
      {top.map((s) => (
        <StockCard
          key={`${s.market}-${s.code}`}
          stock={s}
          onClick={onSelect ? () => onSelect(s) : undefined}
        />
      ))}
    </section>
  );
}
