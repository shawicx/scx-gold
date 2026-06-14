import { describe, it, expect } from 'vitest';
import { formatMoney, formatAmount, formatPct, formatPrice } from './format';

describe('formatMoney', () => {
  it('formats values under 1万 as plain yuan', () => {
    expect(formatMoney(5000)).toBe('5000');
    expect(formatMoney(9999)).toBe('9999');
  });

  it('formats values between 1万 and 1亿 in 万', () => {
    expect(formatMoney(10000)).toBe('1.00万');
    expect(formatMoney(50000000)).toBe('5000.00万');
  });

  it('formats values >= 1亿 in 亿', () => {
    expect(formatMoney(100000000)).toBe('1.00亿');
    expect(formatMoney(123000000)).toBe('1.23亿');
  });

  it('handles negative values', () => {
    expect(formatMoney(-50000000)).toBe('-5000.00万');
    expect(formatMoney(-200000000)).toBe('-2.00亿');
  });

  it('handles zero', () => {
    expect(formatMoney(0)).toBe('0');
  });

  it('handles non-finite', () => {
    expect(formatMoney(NaN)).toBe('--');
    expect(formatMoney(Infinity)).toBe('--');
  });
});

describe('formatAmount', () => {
  it('returns formatted money with 万/亿 unit', () => {
    expect(formatAmount(100000000)).toBe('1.00亿');
    expect(formatAmount(50000000)).toBe('5000.00万');
  });
});

describe('formatPct', () => {
  it('formats with two decimals and % suffix', () => {
    expect(formatPct(9.87)).toBe('9.87%');
    expect(formatPct(-3.4)).toBe('-3.40%');
  });

  it('handles non-finite', () => {
    expect(formatPct(NaN)).toBe('--');
  });
});

describe('formatPrice', () => {
  it('formats price with two decimals', () => {
    expect(formatPrice(10.5)).toBe('10.50');
    expect(formatPrice(100)).toBe('100.00');
  });

  it('handles non-finite', () => {
    expect(formatPrice(NaN)).toBe('--');
  });
});
