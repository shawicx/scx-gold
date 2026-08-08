/**
 * @description 后端 StockListItem（snake_case）→ 前端 Stock（camelCase）适配器。
 *
 * 职责：
 * - snake_case → camelCase 字段映射
 * - market 字符串归一化（后端 "上证"/"深证"/"创业板"/"北交所"/"ETF" → 前端 "sh"/"sz"/"bj"）
 * - 分页拉满：后端单页 ≤100，前端需要全量数据用于排序/筛选
 * - null → 默认值转换（后端字段可空，前端 Stock 字段不可空）
 */

import type { StockListItem } from '@/service/types';
import type { BoardScope, Market, Stock } from '@/types';

/**
 * 后端市场名 → 前端 Market 归一化。
 */
function normalizeMarket(market: string): Market {
  // 创业板/科创板 归入深证/上证的交易所维度
  if (market === 'ETF') return 'bj'; // ETF 无交易所属性，用 bj 占位
  if (market === '上证') return 'sh';
  if (market === '深证' || market === '创业板') return 'sz';
  return 'bj'; // 北交所/其他
}

/**
 * 把单个后端 StockListItem 转为前端 Stock。
 *
 * @param item 后端行情条目。
 * @returns 前端 Stock 对象。
 */
export function adaptStockListItem(item: StockListItem): Stock {
  return {
    code: item.code,
    name: item.name,
    market: normalizeMarket(item.market),
    price: item.price ?? 0,
    pctChange: item.change_pct ?? 0,
    turnoverRate: item.turnover_rate ?? 0,
    amount: item.amount ?? 0,
    mainNetInflow: item.main_net_inflow ?? 0,
    mainNetInflowPct: item.main_net_inflow_pct ?? 0,
    high: item.high ?? 0,
    low: item.low ?? 0,
    industry: item.industry ?? '未知',
    isST: item.name.includes('ST'),
  };
}

/**
 * 从后端拉取全量股票行情（自动分页拉满），返回前端 Stock[]。
 *
 * 后端单页 ≤100 条，前端筛选器需要全量数据。此函数循环拉取直到
 * 取满 total，然后一次性转为 Stock[]。
 *
 * @param boardScope 板块范围（主板/全部 A 股），映射为后端 market 参数。
 * @returns 全量 Stock 列表。
 */
export async function fetchAllStocks(boardScope: BoardScope): Promise<Stock[]> {
  const { getApiV1StockListFunc } = await import('@/service/GeGu');

  // 后端 market 参数：主板 → "全部"（再按代码前缀在前端无需过滤，
  // 因为前端筛选逻辑依赖完整数据）；全部 A 股 → "全部"
  // 注意：后端的"全部"已包含全部 A 股（上证+深证+创业板+科创板+北交所）
  const market = '全部';

  const PAGE_SIZE = 100;
  let page = 1;
  let total = Infinity;
  const allItems: StockListItem[] = [];

  while (allItems.length < total) {
    const data = await getApiV1StockListFunc({
      market,
      type: 'stock',
      sort_by: 'change_pct',
      descending: true,
      page,
      page_size: PAGE_SIZE,
    });
    allItems.push(...data.items);
    total = data.total;
    // 安全阀：防止异常情况下无限循环
    if (data.items.length === 0) break;
    page += 1;
  }

  // boardScope="main" 时只保留主板（上证 6 开头非 688 + 深证 0 开头）
  if (boardScope === 'main') {
    return allItems
      .filter((item) => {
        const code = item.code;
        return (code.startsWith('6') && !code.startsWith('688'))
          || code.startsWith('0');
      })
      .map(adaptStockListItem);
  }

  return allItems.map(adaptStockListItem);
}
