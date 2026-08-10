/**
 * @description 黄金行情 service，对应后端 GET /api/v1/market/gold。
 */

import { request } from '@/service/request';
import type { GoldQuote } from '@/service/types';

/**
 * @description 获取黄金品种实时行情（沪金主连 + 上金所现货 + 纽约金跟踪）。
 *
 * @returns GoldQuote 列表。
 */
export async function getApiV1MarketGoldFunc(): Promise<GoldQuote[]> {
  return request<GoldQuote[]>({
    url: '/api/v1/market/gold',
    method: 'GET',
  });
}
