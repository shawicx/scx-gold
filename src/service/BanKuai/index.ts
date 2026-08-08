import { request } from '@/service/request';
import type { SectorDetail, SectorQuote } from '@/service/types';

/**
 * 板块涨跌排行请求参数。
 */
export interface GetApiV1SectorListRequestType {
  /** 排序字段：change_pct/turnover_rate/total_market_cap */
  sort_by?: string;
  /** 是否降序 */
  descending?: boolean;
  /** 最大返回数 */
  limit?: number;
}

/**
 * @description 获取行业板块涨跌排行。
 *
 * @param params 查询参数（排序/限制）。
 * @returns 板块行情列表。
 */
export async function getApiV1SectorListFunc(
  params?: GetApiV1SectorListRequestType,
): Promise<SectorQuote[]> {
  return request<SectorQuote[]>({
    url: '/api/v1/sector/list',
    method: 'GET',
    params,
  });
}

/**
 * @description 获取板块详情（含成分股）。
 *
 * @param name 板块名称（东方财富行业板块名，如 "小金属"）。
 * @returns 板块详情。
 */
export async function getApiV1SectorByNameFunc(
  name: string,
): Promise<SectorDetail> {
  return request<SectorDetail>({
    url: '/api/v1/sector/{name}',
    method: 'GET',
    pathParams: { name },
  });
}
