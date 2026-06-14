import type { BoardScope, Market, Stock } from '../types';
import { lookupIndustry } from '../data/industry-map';
import { jsonpRequest } from './eastmoney';

const EM_FIELDS = 'f2,f3,f6,f8,f12,f13,f14,f15,f16,f62,f184';
const BOARD_FS: Record<BoardScope, string> = {
  main: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
  all: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048',
};

interface EmRow {
  f2: number; f3: number; f6: number; f8: number;
  f12: string; f13: number; f14: string;
  f15: number; f16: number; f62: number; f184: number;
}

interface EmResponse {
  data?: { diff?: EmRow[] };
}

export interface FetchStocksParams {
  boardScope: BoardScope;
  pageSize?: number;
}

export async function fetchStocks({
  boardScope,
  pageSize = 200,
}: FetchStocksParams): Promise<Stock[]> {
  const fs = BOARD_FS[boardScope];
  const url =
    `https://push2.eastmoney.com/api/qt/clist/get` +
    `?pn=1&pz=${pageSize}&po=1&np=1&fltt=2&invt=2` +
    `&fs=${encodeURIComponent(fs)}` +
    `&fields=${EM_FIELDS}`;
  const res = await jsonpRequest<EmResponse>(url);
  const rows = res?.data?.diff ?? [];
  return rows.map(rowToStock).filter((s): s is Stock => s !== null);
}

function rowToStock(row: EmRow): Stock | null {
  if (!row.f12 || !row.f14) return null;
  const market = marketCode(row.f13);
  return {
    code: row.f12,
    name: row.f14,
    market,
    price: row.f2 ?? 0,
    pctChange: row.f3 ?? 0,
    turnoverRate: row.f8 ?? 0,
    amount: row.f6 ?? 0,
    mainNetInflow: row.f62 ?? 0,
    mainNetInflowPct: row.f184 ?? 0,
    high: row.f15 ?? 0,
    low: row.f16 ?? 0,
    industry: lookupIndustry(row.f12) ?? '未知',
    isST: row.f14.includes('ST'),
  };
}

function marketCode(n: number): Market {
  if (n === 1) return 'sh';
  if (n === 0) return 'sz';
  return 'bj';
}
