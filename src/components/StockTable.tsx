import { useRef } from 'react';
import type { SortKey, Stock } from '../types';
import { generateClues } from '../utils/clues';
import { formatAmount, formatPct, formatPrice } from '../utils/format';
import { sortStocks } from '../utils/sort';
import type { SortState } from '../hooks/useSort';
import { useFlipSort } from '../hooks/animations/useFlipSort';
import { SortableTh } from './SortableTh';
import { ClueTag } from './ClueTag';

interface StockTableProps {
  stocks: Stock[];
  sort: SortState;
  onSort: (key: SortKey) => void;
}

const MARKET_LABEL: Record<Stock['market'], string> = {
  sh: '沪',
  sz: '深',
  bj: '北',
};

const TH_LEFT =
  'px-2.5 py-2 text-left border-b border-border whitespace-nowrap bg-surface-hover font-semibold text-text-secondary sticky top-0';
const TH_RIGHT =
  'px-2.5 py-2 text-right border-b border-border whitespace-nowrap bg-surface-hover font-semibold text-text-secondary sticky top-0';
const TD_LEFT =
  'px-2.5 py-2 text-left border-b border-border whitespace-nowrap';
const TD_RIGHT =
  'px-2.5 py-2 text-right border-b border-border whitespace-nowrap';

export function StockTable({ stocks, sort, onSort }: StockTableProps) {
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const sorted = sortStocks(stocks, sort);
  useFlipSort(tbodyRef, [sort.key, sort.order, stocks.length]);

  return (
    <section className="bg-surface border border-border rounded-lg overflow-x-auto">
      <table className="w-full border-collapse text-sm md:text-[15px]">
        <thead>
          <tr>
            <SortableTh label="代码" sortKey="code" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} align="left" />
            <SortableTh label="名称" sortKey="name" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} align="left" />
            <SortableTh label="市场" sortKey="market" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} align="left" />
            <th className={`hidden md:table-cell ${TH_LEFT}`}>行业</th>
            <SortableTh label="最新价" sortKey="price" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <SortableTh label="涨跌幅" sortKey="pctChange" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <SortableTh label="主力净流入" sortKey="mainNetInflow" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <th className={`hidden lg:table-cell ${TH_RIGHT}`}>成交额</th>
            <th className={`hidden lg:table-cell ${TH_RIGHT}`}>换手率</th>
            <SortableTh label="线索" sortKey="clueCount" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
          </tr>
        </thead>
        <tbody ref={tbodyRef}>
          {sorted.map((s) => {
            const clues = generateClues(s);
            const isUp = s.pctChange >= 0;
            return (
              <tr key={`${s.market}-${s.code}`} className="hover:bg-surface-hover">
                <td className={TD_LEFT}>{s.code}</td>
                <td className={`${TD_LEFT} ${s.isST ? 'text-text-muted italic' : ''}`}>{s.name}</td>
                <td className={TD_LEFT}>{MARKET_LABEL[s.market]}</td>
                <td className={`hidden md:table-cell ${TD_LEFT}`}>{s.industry}</td>
                <td className={TD_RIGHT}>{formatPrice(s.price)}</td>
                <td className={`${TD_RIGHT} ${isUp ? 'text-up' : 'text-down'}`}>
                  {isUp ? '+' : ''}
                  {formatPct(s.pctChange)}
                </td>
                <td className={`${TD_RIGHT} ${s.mainNetInflow >= 0 ? 'text-up' : 'text-down'}`}>
                  {formatAmount(s.mainNetInflow)}
                </td>
                <td className={`hidden lg:table-cell ${TD_RIGHT}`}>{formatAmount(s.amount)}</td>
                <td className={`hidden lg:table-cell ${TD_RIGHT}`}>{formatPct(s.turnoverRate)}</td>
                <td className={TD_RIGHT}>
                  <div className="flex flex-wrap gap-0.5 justify-end">
                    {clues.map((c) => (
                      <ClueTag key={c.label} clue={c} />
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <p className="p-6 text-center text-text-muted">没有匹配的股票</p>
      )}
    </section>
  );
}
