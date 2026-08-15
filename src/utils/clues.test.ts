import { describe, it, expect } from 'vitest';
import { generateClues, getBoardLimit } from './clues';
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

describe('getBoardLimit', () => {
  it('returns 20 for 创业板 (300/301)', () => {
    expect(getBoardLimit('300750')).toBe(20);
    expect(getBoardLimit('301001')).toBe(20);
  });

  it('returns 20 for 科创板 (688/689)', () => {
    expect(getBoardLimit('688001')).toBe(20);
    expect(getBoardLimit('689009')).toBe(20);
  });

  it('returns 10 for 主板 (60x / 00x)', () => {
    expect(getBoardLimit('600000')).toBe(10);
    expect(getBoardLimit('000001')).toBe(10);
    expect(getBoardLimit('002001')).toBe(10);
  });

  it('returns 30 for 北交所 (4xx / 8xx / 920)', () => {
    expect(getBoardLimit('830001')).toBe(30);
    expect(getBoardLimit('430001')).toBe(30);
    expect(getBoardLimit('920001')).toBe(30);
  });

  it('returns 5 for 主板 ST', () => {
    expect(getBoardLimit('600000', true)).toBe(5);
  });
});

describe('generateClues - 按板块涨跌停幅度拆分', () => {
  it('returns 封涨停 for 创业板 20% 板 at ~20%', () => {
    const clues = generateClues({
      ...base,
      code: '300750',
      pctChange: 20,
      price: 12,
      high: 12,
    });
    expect(clues.map((c) => c.label)).toContain('封涨停');
  });

  it('returns 接近涨停 for 科创板 20% 板 at ~19.7%', () => {
    const clues = generateClues({
      ...base,
      code: '688001',
      pctChange: 19.7,
      price: 11.97,
      high: 12,
    });
    expect(clues.map((c) => c.label)).toContain('接近涨停');
  });

  it('does not fire 涨停 clues for 20% 板 at 10% (主板阈值不适用)', () => {
    const clues = generateClues({
      ...base,
      code: '300750',
      pctChange: 10,
      price: 11,
      high: 11,
    });
    expect(clues.map((c) => c.label)).not.toContain('封涨停');
    expect(clues.map((c) => c.label)).not.toContain('接近涨停');
  });

  it('returns 封涨停 for 主板 ST 5% 板 at ~5%', () => {
    const clues = generateClues({
      ...base,
      code: '600000',
      isST: true,
      pctChange: 5,
      price: 10.5,
      high: 10.5,
    });
    expect(clues.map((c) => c.label)).toContain('封涨停');
  });

  it('returns 接近涨停 for 主板 ST 5% 板 at ~4.6%', () => {
    const clues = generateClues({
      ...base,
      code: '600000',
      isST: true,
      pctChange: 4.6,
      price: 10.46,
      high: 10.5,
    });
    expect(clues.map((c) => c.label)).toContain('接近涨停');
  });

  it('returns 封涨停 for 北交所 30% 板 at ~30%', () => {
    const clues = generateClues({
      ...base,
      code: '830001',
      pctChange: 30,
      price: 13,
      high: 13,
    });
    expect(clues.map((c) => c.label)).toContain('封涨停');
  });

  it('returns 接近涨停 for 北交所 30% 板 at ~29.8%', () => {
    const clues = generateClues({
      ...base,
      code: '830001',
      pctChange: 29.8,
      price: 12.98,
      high: 13,
    });
    expect(clues.map((c) => c.label)).toContain('接近涨停');
  });
});
