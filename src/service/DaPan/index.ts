import { request } from '@/service/request';
import type { IndexQuote } from '@/service/types';

/**
 * 全部指数请求参数。
 */
export interface GetApiV1MarketIndexAllRequestType {
  /** 指数分组：沪深重要指数/上证系列指数/深证系列指数/指数成份/中证系列指数 */
  group?: string;
}

/**
 * @description 获取主要大盘指数。
 *
 * @returns 主要指数行情列表（上证/深证/创业板等白名单）。
 */
export async function getApiV1MarketIndexFunc(): Promise<IndexQuote[]> {
  return request<IndexQuote[]>({
    url: '/api/v1/market/index',
    method: 'GET',
  });
}

/**
 * @description 获取全部指数（按分组）。
 *
 * @param params 查询参数（可选分组）。
 * @returns 指定分组的全部指数列表。
 */
export async function getApiV1MarketIndexAllFunc(
  params?: GetApiV1MarketIndexAllRequestType,
): Promise<IndexQuote[]> {
  return request<IndexQuote[]>({
    url: '/api/v1/market/index/all',
    method: 'GET',
    params,
  });
}
