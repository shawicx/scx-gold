/**
 * @description 后端 StockListItem（snake_case）→ 前端 Stock（camelCase）适配器。
 *
 * 职责：
 * - snake_case → camelCase 字段映射
 * - market 字符串归一化（后端 "上证"/"深证"/"创业板"/"北交所"/"ETF" → 前端 "sh"/"sz"/"bj"）
 * - code 去市场前缀归一化（后端列表返回 "sz300209" → 前端 "300209"；详情等接口与涨停阈值只认纯数字代码）
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
 * @description 去掉股票代码的市场前缀，统一为纯数字代码。
 *
 * 后端列表接口返回的代码带市场前缀（如 "sz300209"、"sh600519"），
 * 而个股详情等路径参数接口与前端涨停阈值判断（getBoardLimit）只认纯数字代码。
 *
 * @param code 后端返回的股票代码（可能带 sh/sz/bj 前缀）。
 * @returns 纯数字股票代码（对无前缀代码幂等）。
 *
 * @example
 * stripMarketPrefix('sz300209'); // '300209'
 * stripMarketPrefix('600519');   // '600519'
 */
function stripMarketPrefix(code: string): string {
  return code.replace(/^(sh|sz|bj)/i, '');
}

/**
 * 把单个后端 StockListItem 转为前端 Stock。
 *
 * @param item 后端行情条目。
 * @returns 前端 Stock 对象。
 */
export function adaptStockListItem(item: StockListItem): Stock {
  return {
    code: stripMarketPrefix(item.code),
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
 * 从后端拉取股票行情（增量分页 + 提前终止），返回前端 Stock[]。
 *
 * 策略：按 change_pct 降序分页拉取，遇到涨幅明显低于涨停阈值（9.5%）
 * 的股票就停止——涨停候选股一定排在最前面，无需拉完全市场 5500 条。
 * 这样通常只需 1-3 页（100-300 条），将请求时间从 30s 降到 3-5s。
 *
 * @param boardScope 板块范围（主板/全部 A 股），映射为后端 market 参数。
 * @returns Stock 列表（涨停候选 + 少量缓冲）。
 */
export async function fetchAllStocks(boardScope: BoardScope): Promise<Stock[]> {
  const { getApiV1StockListFunc } = await import('@/service/GeGu');

  // 后端的"全部"已包含全部 A 股（上证+深证+创业板+科创板+北交所）
  const market = '全部';

  // 涨停筛选下限：低于此涨幅的股票一定不是涨停候选，停止拉取
  // 用 9.5% 而非 9.8%，留一点缓冲（接近涨停的也展示）
  const STOP_THRESHOLD = 9.5;

  const PAGE_SIZE = 100;
  const MAX_PAGES = 10; // 安全阀：最多拉 10 页（1000 条）
  let page = 1;
  const allItems: StockListItem[] = [];

  for (page = 1; page <= MAX_PAGES; page += 1) {
    const data = await getApiV1StockListFunc({
      market,
      type: 'stock',
      sort_by: 'change_pct',
      descending: true,
      page,
      page_size: PAGE_SIZE,
    });

    if (data.items.length === 0) break;
    allItems.push(...data.items);

    // 提前终止：本页最后一条（涨幅最低的一条）已低于阈值，无需再拉
    const lastItem = data.items[data.items.length - 1];
    const lastPct = lastItem.change_pct ?? -Infinity;
    if (lastPct < STOP_THRESHOLD) break;
  }

  // boardScope="main" 时只保留主板（上证 6 开头非 688 + 深证 0 开头）
  if (boardScope === 'main') {
    return allItems
      .filter((item) => {
        const code = stripMarketPrefix(item.code);
        return (code.startsWith('6') && !code.startsWith('688'))
          || code.startsWith('0');
      })
      .map(adaptStockListItem);
  }

  return allItems.map(adaptStockListItem);
}
