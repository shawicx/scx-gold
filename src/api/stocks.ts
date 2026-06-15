import type { BoardScope, Market, Stock } from '../types';
import { lookupIndustry } from '../data/industry-map';
import { jsonpRequest } from './eastmoney';

const EM_FIELDS = 'f2,f3,f6,f8,f12,f13,f14,f15,f16,f62,f184';
const BOARD_FS: Record<BoardScope, string> = {
  // 主板：深圳主板 (000/001/002) + 上海主板 (600/601/603)
  main: 'm:0+t:6,m:1+t:2',
  // 全部 A 股：主板 + 创业板 (300/301) + 科创板 (688) + 北交所 (430/83/87)
  all: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048',
};

type EmValue = number | string | null | undefined;

interface EmRow {
  f2: EmValue; f3: EmValue; f6: EmValue; f8: EmValue;
  f12: EmValue; f13: EmValue; f14: EmValue;
  f15: EmValue; f16: EmValue; f62: EmValue; f184: EmValue;
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
    `?pn=1&pz=${pageSize}&po=1&np=1&fltt=2&invt=2&fid=f3` +
    `&fs=${encodeURIComponent(fs)}` +
    `&fields=${EM_FIELDS}`;
  const res = await jsonpRequest<EmResponse>(url);
  const rows = res?.data?.diff ?? [];
  return rows.map(rowToStock).filter((s): s is Stock => s !== null);
}

function toNumber(v: EmValue): number {
  return typeof v === 'number' ? v : 0;
}

function toString(v: EmValue): string {
  return typeof v === 'string' ? v : '';
}

function rowToStock(row: EmRow): Stock | null {
  const code = toString(row.f12);
  const name = toString(row.f14);
  if (!code || !name) return null;
  if (typeof row.f2 !== 'number') return null; // skip suspended/delisted ("-")
  const market = marketCode(typeof row.f13 === 'number' ? row.f13 : -1);
  return {
    code,
    name,
    market,
    price: toNumber(row.f2),
    pctChange: toNumber(row.f3),
    turnoverRate: toNumber(row.f8),
    amount: toNumber(row.f6),
    mainNetInflow: toNumber(row.f62),
    mainNetInflowPct: toNumber(row.f184),
    high: toNumber(row.f15),
    low: toNumber(row.f16),
    industry: lookupIndustry(code) ?? '未知',
    isST: name.includes('ST'),
  };
}

function marketCode(n: number): Market {
  if (n === 1) return 'sh';
  if (n === 0) return 'sz';
  return 'bj';
}
