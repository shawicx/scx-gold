import { describe, it, expect } from 'vitest';
import { generateClues } from './clues';
import type { Stock } from '../types';

const base: Stock = {
  code: '000001',
  name: '测试',
  market: 'sz',
  price: 10,
  pctChange: 0,
  turnoverRate: 5,
  amount: 1e8,
  mainNetInflow: 0,
  mainNetInflowPct: 0,
  high: 10,
  low: 9,
  industry: '未知',
  isST: false,
};

describe('generateClues', () => {
  it('returns 主力大幅流入 when inflow > 1e8', () => {
    const clues = generateClues({ ...base, mainNetInflow: 1.5e8 });
    expect(clues.map((c) => c.label)).toContain('主力大幅流入');
    expect(clues.map((c) => c.label)).not.toContain('主力流入');
  });

  it('returns 主力流入 when inflow > 5e7 (but not > 1e8)', () => {
    const clues = generateClues({ ...base, mainNetInflow: 6e7 });
    expect(clues.map((c) => c.label)).toContain('主力流入');
    expect(clues.map((c) => c.label)).not.toContain('主力大幅流入');
  });

  it('returns 主力流出 when inflow < 0', () => {
    const clues = generateClues({ ...base, mainNetInflow: -1 });
    expect(clues.map((c) => c.label)).toContain('主力流出');
  });

  it('returns 封涨停 when pctChange >= 9.95 and price near high', () => {
    const clues = generateClues({
      ...base,
      pctChange: 10,
      price: 11,
      high: 11,
    });
    expect(clues.map((c) => c.label)).toContain('封涨停');
  });

  it('returns 接近涨停 when pctChange in [9.5, 9.95)', () => {
    const clues = generateClues({ ...base, pctChange: 9.7 });
    expect(clues.map((c) => c.label)).toContain('接近涨停');
  });

  it('returns 炸板风险 when price < high * 0.99', () => {
    const clues = generateClues({
      ...base,
      pctChange: 9,
      price: 10,
      high: 10.5,
    });
    expect(clues.map((c) => c.label)).toContain('炸板风险');
  });

  it('does not return 炸板风险 when high is 0 (missing data)', () => {
    const clues = generateClues({ ...base, high: 0, price: 10 });
    expect(clues.map((c) => c.label)).not.toContain('炸板风险');
  });

  it('returns 放量 when turnoverRate > 10', () => {
    const clues = generateClues({ ...base, turnoverRate: 15 });
    expect(clues.map((c) => c.label)).toContain('放量');
  });

  it('returns 低换手 when turnoverRate < 3', () => {
    const clues = generateClues({ ...base, turnoverRate: 2 });
    expect(clues.map((c) => c.label)).toContain('低换手');
  });

  it('returns 高成交 when amount > 5e8', () => {
    const clues = generateClues({ ...base, amount: 6e8 });
    expect(clues.map((c) => c.label)).toContain('高成交');
  });

  it('returns multiple clues when many conditions hit', () => {
    const clues = generateClues({
      ...base,
      mainNetInflow: 1.5e8,
      pctChange: 10,
      price: 11,
      high: 11,
      turnoverRate: 15,
      amount: 6e8,
    });
    expect(clues.length).toBeGreaterThanOrEqual(4);
  });

  it('returns empty array when nothing matches', () => {
    const clues = generateClues({
      ...base,
      mainNetInflow: 0,
      pctChange: 5,
      turnoverRate: 5,
      amount: 1e8,
      price: 10,
      high: 10,
    });
    expect(clues).toEqual([]);
  });
});
