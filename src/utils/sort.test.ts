import { describe, it, expect } from 'vitest';
import { sortStocks } from './sort';
import type { Stock, SortState } from '../types';

const a: Stock = {
  code: '000001', name: 'A', market: 'sz', price: 10,
  pctChange: 9.9, turnoverRate: 5, amount: 1e8,
  mainNetInflow: 1e8, mainNetInflowPct: 5,
  high: 11, low: 9, industry: '银行', isST: false,
};
const b: Stock = {
  code: '600000', name: 'B', market: 'sh', price: 20,
  pctChange: 10.0, turnoverRate: 8, amount: 2e8,
  mainNetInflow: 5e7, mainNetInflowPct: 3,
  high: 22, low: 18, industry: '银行', isST: false,
};
const c: Stock = {
  code: '000002', name: 'C', market: 'sz', price: 5,
  pctChange: 9.5, turnoverRate: 15, amount: 3e8,
  mainNetInflow: -1e7, mainNetInflowPct: -1,
  high: 5.5, low: 4.5, industry: '地产', isST: false,
};
const stocks = [a, b, c];

describe('sortStocks', () => {
  it('returns original order when order is none', () => {
    const state: SortState = { key: 'pctChange', order: 'none' };
    expect(sortStocks(stocks, state)).toEqual(stocks);
  });

  it('returns original order when key is null', () => {
    const state: SortState = { key: null, order: 'desc' };
    expect(sortStocks(stocks, state)).toEqual(stocks);
  });

  it('sorts by pctChange desc', () => {
    const state: SortState = { key: 'pctChange', order: 'desc' };
    const out = sortStocks(stocks, state);
    expect(out.map((s) => s.code)).toEqual(['600000', '000001', '000002']);
  });

  it('sorts by mainNetInflow asc', () => {
    const state: SortState = { key: 'mainNetInflow', order: 'asc' };
    const out = sortStocks(stocks, state);
    expect(out.map((s) => s.code)).toEqual(['000002', '600000', '000001']);
  });

  it('sorts by code asc', () => {
    const state: SortState = { key: 'code', order: 'asc' };
    const out = sortStocks(stocks, state);
    expect(out.map((s) => s.code)).toEqual(['000001', '000002', '600000']);
  });

  it('sorts by name desc', () => {
    const state: SortState = { key: 'name', order: 'desc' };
    const out = sortStocks(stocks, state);
    expect(out.map((s) => s.code)).toEqual(['000002', '600000', '000001']);
  });

  it('does not mutate the input array', () => {
    const state: SortState = { key: 'price', order: 'asc' };
    const before = [...stocks];
    sortStocks(stocks, state);
    expect(stocks).toEqual(before);
  });
});
