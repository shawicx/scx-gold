/**
 * @description 关注列表 service，对应后端 /api/v1/watchlist CRUD。
 */

import { request } from '@/service/request';
import type { WatchlistItemData } from '@/service/types';

/**
 * @description 获取关注列表。
 *
 * @returns 关注列表条目数组。
 */
export async function getApiV1WatchlistFunc(): Promise<WatchlistItemData[]> {
  return request<WatchlistItemData[]>({
    url: '/api/v1/watchlist',
    method: 'GET',
  });
}

/**
 * @description 添加关注。
 *
 * @param code 证券代码。
 * @param name 简称（可选，后端会从 stock 表补全）。
 * @returns 添加结果（含补全后的 name）。
 */
export async function postApiV1WatchlistFunc(
  code: string,
  name?: string,
): Promise<{ code: string; name: string }> {
  return request<{ code: string; name: string }>({
    url: '/api/v1/watchlist',
    method: 'POST',
    data: { code, name: name || '' },
  });
}

/**
 * @description 移除关注。
 *
 * @param code 证券代码。
 * @returns 删除条数。
 */
export async function deleteApiV1WatchlistByCodeFunc(
  code: string,
): Promise<{ deleted: number }> {
  return request<{ deleted: number }>({
    url: '/api/v1/watchlist/{code}',
    method: 'DELETE',
    pathParams: { code },
  });
}

/**
 * @description 整体替换关注列表。
 *
 * @param items 关注列表条目数组。
 * @returns 写入条数。
 */
export async function putApiV1WatchlistFunc(
  items: WatchlistItemData[],
): Promise<{ count: number }> {
  return request<{ count: number }>({
    url: '/api/v1/watchlist',
    method: 'PUT',
    data: { items },
  });
}
