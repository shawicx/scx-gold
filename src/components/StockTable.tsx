import type { SortKey, Stock } from '../types';
import { generateClues } from '../utils/clues';
import { formatAmount, formatPct, formatPrice } from '../utils/format';
import { sortStocks } from '../utils/sort';
import type { SortState } from '../hooks/useSort';
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

export function StockTable({ stocks, sort, onSort }: StockTableProps) {
  const sorted = sortStocks(stocks, sort);

  return (
    <section className="stock-table-wrap">
      <table className="stock-table">
        <thead>
          <tr>
            <SortableTh label="代码" sortKey="code" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <SortableTh label="名称" sortKey="name" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <SortableTh label="市场" sortKey="market" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <th className="stock-table__hide-mobile">行业</th>
            <SortableTh label="最新价" sortKey="price" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <SortableTh label="涨跌幅" sortKey="pctChange" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <SortableTh label="主力净流入" sortKey="mainNetInflow" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
            <th className="stock-table__hide-tablet">成交额</th>
            <th className="stock-table__hide-tablet">换手率</th>
            <SortableTh label="线索" sortKey="clueCount" currentKey={sort.key} currentOrder={sort.order} onSort={onSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => {
            const clues = generateClues(s);
            const isUp = s.pctChange >= 0;
            return (
              <tr key={`${s.market}-${s.code}`}>
                <td>{s.code}</td>
                <td className={s.isST ? 'text-st' : ''}>{s.name}</td>
                <td>{MARKET_LABEL[s.market]}</td>
                <td className="stock-table__hide-mobile">{s.industry}</td>
                <td>{formatPrice(s.price)}</td>
                <td className={isUp ? 'text-up' : 'text-down'}>
                  {isUp ? '+' : ''}
                  {formatPct(s.pctChange)}
                </td>
                <td className={s.mainNetInflow >= 0 ? 'text-up' : 'text-down'}>
                  {formatAmount(s.mainNetInflow)}
                </td>
                <td className="stock-table__hide-tablet">{formatAmount(s.amount)}</td>
                <td className="stock-table__hide-tablet">{formatPct(s.turnoverRate)}</td>
                <td>
                  <div className="stock-table__clues">
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
        <p className="stock-table__empty">没有匹配的股票</p>
      )}
    </section>
  );
}
