export type Market = 'sh' | 'sz' | 'bj';

export interface Stock {
  code: string;
  name: string;
  market: Market;
  price: number;
  pctChange: number;
  turnoverRate: number;
  amount: number;
  mainNetInflow: number;
  mainNetInflowPct: number;
  high: number;
  low: number;
  industry: string;
  isST: boolean;
}

export type BoardScope = 'main' | 'all';

export interface FilterState {
  boardScope: BoardScope;
  pctRange: [number, number];
  minMainInflow: number;
  excludeST: boolean;
  /** 行业板块筛选（来自板块排行联动）；undefined 表示不按板块过滤 */
  sector?: string;
}

export const DEFAULT_FILTERS: FilterState = {
  boardScope: 'main',
  pctRange: [9.8, 10.2],
  minMainInflow: 0,
  excludeST: true,
};

export const INFLOW_PRESETS: { label: string; value: number }[] = [
  { label: '不限', value: 0 },
  { label: '> 5000万', value: 5e7 },
  { label: '> 1亿', value: 1e8 },
  { label: '> 3亿', value: 3e8 },
];

export type SortKey =
  | 'code'
  | 'name'
  | 'market'
  | 'price'
  | 'pctChange'
  | 'mainNetInflow'
  | 'amount'
  | 'turnoverRate'
  | 'clueCount';

export type SortOrder = 'asc' | 'desc' | 'none';

export interface SortState {
  key: SortKey | null;
  order: SortOrder;
}

export type ClueType = 'fund' | 'limit' | 'volume';

export interface Clue {
  label: string;
  type: ClueType;
}
