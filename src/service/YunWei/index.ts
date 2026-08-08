import { request } from '@/service/request';

/**
 * 全量同步结果。
 */
export interface AdminSyncResult {
  stock_count: number;
  etf_count: number;
  industry_count?: number;
  index_size: number;
}

/**
 * 重建索引结果。
 */
export interface AdminReindexResult {
  index_size: number;
}

/**
 * @description 手动触发全量同步（股票 → ETF → 行业映射 → 重建索引）。
 *
 * @returns 各步骤计数。
 */
export async function postAdminSyncFunc(): Promise<AdminSyncResult> {
  return request<AdminSyncResult>({
    url: '/admin/sync',
    method: 'POST',
  });
}

/**
 * @description 仅重建搜索索引（从 DB 加载，不拉数据源）。
 *
 * @returns 索引大小。
 */
export async function postAdminReindexFunc(): Promise<AdminReindexResult> {
  return request<AdminReindexResult>({
    url: '/admin/reindex',
    method: 'POST',
  });
}
