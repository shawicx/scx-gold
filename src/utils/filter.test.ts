/**
 * @description filterStocks 纯函数单元测试：涨幅区间、主力资金门槛、
 * 排除 ST 回归用例，以及板块（industry）筛选联动用例。
 */

import { describe, it, expect } from 'vitest';
import { filterStocks } from './filter';
import { DEFAULT_FILTERS, type Stock } from '../types';

const base: Stock = {
  code: '000001',
  name: '测试',
  market: 'sz',
  price: 10,
  pctChange: 10,
  turnoverRate: 5,
  amount: 1e8,
  mainNetInflow: 5e7,
  mainNetInflowPct: 5,
  high: 11,
  low: 9,
  industry: '银行',
  isST: false,
};

describe('filterStocks', () => {
  it('keeps stocks within pct range and inflow threshold by default', () => {
    const stocks = [
      base,
      { ...base, code: '000002', pctChange: 5 },
      // 主力净流出，被默认门槛（>0）排除
      { ...base, code: '000003', mainNetInflow: -1e6 },
    ];
    const result = filterStocks(stocks, DEFAULT_FILTERS);
    expect(result.map((s) => s.code)).toEqual(['000001']);
  });

  it('excludes ST stocks when excludeST is true', () => {
    const stocks = [base, { ...base, code: '000002', isST: true }];
    const result = filterStocks(stocks, DEFAULT_FILTERS);
    expect(result.map((s) => s.code)).toEqual(['000001']);
  });

  it('keeps only stocks whose industry matches the selected sector', () => {
    const stocks = [base, { ...base, code: '000002', industry: '半导体' }];
    const result = filterStocks(stocks, { ...DEFAULT_FILTERS, sector: '银行' });
    expect(result.map((s) => s.code)).toEqual(['000001']);
  });

  it('applies sector filter together with other conditions', () => {
    const stocks = [
      base,
      // 行业匹配但涨幅不满足
      { ...base, code: '000002', industry: '银行', pctChange: 3 },
      // 全部条件满足但行业不匹配
      { ...base, code: '000003', industry: '白酒' },
    ];
    const result = filterStocks(stocks, { ...DEFAULT_FILTERS, sector: '银行' });
    expect(result.map((s) => s.code)).toEqual(['000001']);
  });

  it('does not filter by industry when sector is undefined', () => {
    const stocks = [base, { ...base, code: '000002', industry: '半导体' }];
    const result = filterStocks(stocks, DEFAULT_FILTERS);
    expect(result.map((s) => s.code)).toEqual(['000001', '000002']);
  });

  it('excludes all stocks when sector matches nothing', () => {
    const result = filterStocks([base], { ...DEFAULT_FILTERS, sector: '白酒' });
    expect(result).toEqual([]);
  });
});
