import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./eastmoney', () => ({
  jsonpRequest: vi.fn(),
}));

import { jsonpRequest } from './eastmoney';
import { fetchStocks } from './stocks';
import type { Stock } from '../types';

const mockedJsonp = vi.mocked(jsonpRequest);

describe('fetchStocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns mapped stocks for valid response', async () => {
    mockedJsonp.mockResolvedValueOnce({
      data: {
        diff: [
          {
            f2: 11.0, f3: 10.0, f6: 5e8, f8: 8.5,
            f12: '000001', f13: 0, f14: '平安银行',
            f15: 11.0, f16: 10.0, f62: 1e8, f184: 5.2,
          },
          {
            f2: 22.0, f3: 10.0, f6: 3e8, f8: 5,
            f12: '600000', f13: 1, f14: '浦发银行',
            f15: 22.0, f16: 20.0, f62: 5e7, f184: 2.1,
          },
        ],
      },
    } as any);

    const result = await fetchStocks({ boardScope: 'main' });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual<Stock>({
      code: '000001',
      name: '平安银行',
      market: 'sz',
      price: 11.0,
      pctChange: 10.0,
      turnoverRate: 8.5,
      amount: 5e8,
      mainNetInflow: 1e8,
      mainNetInflowPct: 5.2,
      high: 11.0,
      low: 10.0,
      industry: '银行',
      isST: false,
    });
    expect(result[1].market).toBe('sh');
    expect(result[1].industry).toBe('银行');
  });

  it('maps Bj market code (2) to bj', async () => {
    mockedJsonp.mockResolvedValueOnce({
      data: {
        diff: [
          {
            f2: 10, f3: 5, f6: 1e7, f8: 1, f12: '430047',
            f13: 2, f14: 'N 玖瑞', f15: 10, f16: 9,
            f62: 0, f184: 0,
          },
        ],
      },
    } as any);
    const result = await fetchStocks({ boardScope: 'all' });
    expect(result[0].market).toBe('bj');
    expect(result[0].industry).toBe('未知');
  });

  it('marks ST stocks when name contains ST', async () => {
    mockedJsonp.mockResolvedValueOnce({
      data: {
        diff: [
          {
            f2: 5, f3: 5, f6: 1e7, f8: 1, f12: '000001',
            f13: 0, f14: 'ST 测试', f15: 5, f16: 4,
            f62: 0, f184: 0,
          },
        ],
      },
    } as any);
    const result = await fetchStocks({ boardScope: 'main' });
    expect(result[0].isST).toBe(true);
  });

  it('skips rows missing code or name', async () => {
    mockedJsonp.mockResolvedValueOnce({
      data: {
        diff: [
          { f2: 5, f3: 5, f12: '', f13: 0, f14: 'X' },
          { f2: 5, f3: 5, f12: '000001', f13: 0, f14: '' },
          { f2: 5, f3: 5, f12: '000002', f13: 0, f14: 'OK' },
        ],
      },
    } as any);
    const result = await fetchStocks({ boardScope: 'main' });
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('000002');
  });

  it('returns empty array when response missing data', async () => {
    mockedJsonp.mockResolvedValueOnce({} as any);
    const result = await fetchStocks({ boardScope: 'main' });
    expect(result).toEqual([]);
  });

  it('passes boardScope=main uses main fs param', async () => {
    mockedJsonp.mockResolvedValueOnce({ data: { diff: [] } } as any);
    await fetchStocks({ boardScope: 'main' });
    const url = mockedJsonp.mock.calls[0][0];
    expect(url).toContain('m%3A0%2Bt%3A6'); // fs param URL-encoded
  });

  it('passes boardScope=all includes chuangyeboard', async () => {
    mockedJsonp.mockResolvedValueOnce({ data: { diff: [] } } as any);
    await fetchStocks({ boardScope: 'all' });
    const url = mockedJsonp.mock.calls[0][0];
    expect(url).toContain('s%3A2048');
  });
});
