import { request } from '@/service/request';
import type { SearchResult } from '@/service/types';

/**
 * 搜索请求参数。
 */
export interface GetApiV1SearchRequestType {
  /** 搜索关键词：代码/简称/拼音 */
  q: string;
  /** 最大返回条数 */
  limit?: number;
}

/**
 * @description 搜索股票/ETF/指数（代码/简称/拼音）。
 *
 * @param params 查询参数。
 * @returns 搜索结果列表（按 score 降序）。
 */
export async function getApiV1SearchFunc(
  params: GetApiV1SearchRequestType,
): Promise<SearchResult[]> {
  return request<SearchResult[]>({
    url: '/api/v1/search',
    method: 'GET',
    params,
  });
}

/**
 * @description 获取搜索索引大小（运维用）。
 *
 * @returns 包含 size 字段的对象。
 */
export async function getApiV1SearchIndexSizeFunc(): Promise<{ size: number }> {
  return request<{ size: number }>({
    url: '/api/v1/search/index-size',
    method: 'GET',
  });
}
