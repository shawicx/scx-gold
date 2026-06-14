import type { SortState, Stock } from '../types';
import { generateClues } from './clues';

export function sortStocks(stocks: Stock[], state: SortState): Stock[] {
  if (state.order === 'none' || state.key === null) {
    return stocks;
  }

  const dir = state.order === 'asc' ? 1 : -1;
  const clueCache = new Map<Stock, number>();
  const getClueCount = (s: Stock): number => {
    if (!clueCache.has(s)) clueCache.set(s, generateClues(s).length);
    return clueCache.get(s)!;
  };

  const getValue = (s: Stock): number | string => {
    switch (state.key) {
      case 'code': return s.code;
      case 'name': return s.name;
      case 'market': return s.market;
      case 'price': return s.price;
      case 'pctChange': return s.pctChange;
      case 'mainNetInflow': return s.mainNetInflow;
      case 'amount': return s.amount;
      case 'turnoverRate': return s.turnoverRate;
      case 'clueCount': return getClueCount(s);
      default: return 0;
    }
  };

  return [...stocks].sort((x, y) => {
    const vx = getValue(x);
    const vy = getValue(y);
    if (typeof vx === 'string' && typeof vy === 'string') {
      return vx.localeCompare(vy, 'zh') * dir;
    }
    return ((vx as number) - (vy as number)) * dir;
  });
}
