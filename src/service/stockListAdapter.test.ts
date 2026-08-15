/**
 * @description stockListAdapter 适配器单元测试。
 *
 * 覆盖：
 * - code 去市场前缀归一化（sz300209 → 300209，纯数字幂等）
 * - market 中文字符串归一化
 * - null 字段兜底为默认值
 * - isST 按名称判断
 */

import { describe, it, expect } from 'vitest';
import { adaptStockListItem } from './stockListAdapter';
import type { StockListItem } from '@/service/types';

const item: StockListItem = {
  code: 'sz300209',
  name: '行云科技',
  market: '创业板',
  price: 12.34,
  change: 1.11,
  change_pct: 9.9,
  amount: 1.2e8,
  volume: 9.9e6,
  turnover_rate: 5.5,
  high: 12.5,
  low: 11.1,
  open: 11.5,
  prev_close: 11.23,
  main_net_inflow: 2.3e7,
  main_net_inflow_pct: 1.2,
  industry: '计算机',
};

describe('adaptStockListItem - code 归一化', () => {
  it('去掉市场前缀：sz300209 → 300209', () => {
    expect(adaptStockListItem(item).code).toBe('300209');
  });

  it('去掉沪市前缀：sh600519 → 600519', () => {
    expect(adaptStockListItem({ ...item, code: 'sh600519' }).code).toBe('600519');
  });

  it('对纯数字代码幂等：300209 → 300209', () => {
    expect(adaptStockListItem({ ...item, code: '300209' }).code).toBe('300209');
  });
});

describe('adaptStockListItem - 字段映射', () => {
  it('market 归一化：创业板 → sz', () => {
    expect(adaptStockListItem(item).market).toBe('sz');
  });

  it('market 归一化：上证 → sh', () => {
    expect(adaptStockListItem({ ...item, market: '上证' }).market).toBe('sh');
  });

  it('snake_case → camelCase 映射', () => {
    const stock = adaptStockListItem(item);
    expect(stock.pctChange).toBe(9.9);
    expect(stock.mainNetInflow).toBe(2.3e7);
    expect(stock.turnoverRate).toBe(5.5);
    expect(stock.industry).toBe('计算机');
  });

  it('null 字段兜底为默认值', () => {
    const stock = adaptStockListItem({
      ...item,
      price: null,
      change_pct: null,
      main_net_inflow: null,
      industry: null,
    });
    expect(stock.price).toBe(0);
    expect(stock.pctChange).toBe(0);
    expect(stock.mainNetInflow).toBe(0);
    expect(stock.industry).toBe('未知');
  });

  it('isST 按名称判断', () => {
    expect(adaptStockListItem(item).isST).toBe(false);
    expect(adaptStockListItem({ ...item, name: 'ST行云' }).isST).toBe(true);
  });
});
