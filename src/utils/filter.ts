/**
 * @description 涨停候选筛选纯函数：按涨幅区间、主力资金门槛、排除 ST
 * 与行业板块条件过滤股票列表。
 */

import type { FilterState, Stock } from '../types';

/**
 * @description 按筛选条件过滤股票列表。
 *
 * @param stocks 全量股票列表（已按涨幅降序拉取）。
 * @param filters 筛选条件（pctRange / minMainInflow / excludeST / sector）。
 * @returns Stock[] 满足全部条件的股票，保持原顺序。
 *
 * @example filterStocks(stocks, { ...DEFAULT_FILTERS, sector: '银行' });
 */
export function filterStocks(stocks: Stock[], filters: FilterState): Stock[] {
  const [minPct, maxPct] = filters.pctRange;
  return stocks.filter((s) => {
    if (s.pctChange < minPct || s.pctChange > maxPct) return false;
    if (s.mainNetInflow < filters.minMainInflow) return false;
    if (filters.excludeST && s.isST) return false;
    if (filters.sector && s.industry !== filters.sector) return false;
    return true;
  });
}
