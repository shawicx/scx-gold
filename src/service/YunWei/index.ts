/**
 * @description 运维 service：全量同步（异步任务）、重建索引、任务状态查询。
 */

import { request } from '@/service/request';

/**
 * 全量同步结果（旧版同步返回，保留兼容）。
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
 * 异步任务提交结果。
 */
export interface AdminTaskSubmit {
  task_id: string;
}

/**
 * 任务状态。
 */
export type AdminTaskStatus = 'pending' | 'running' | 'done' | 'failed';

/**
 * 任务状态信息。
 */
export interface AdminTaskInfo {
  task_id: string;
  name: string;
  status: AdminTaskStatus;
  progress: string;
  result: Record<string, number | string> | null;
  error: string;
  created_at: number;
  elapsed: number;
}

/**
 * @description 提交全量同步后台任务，立即返回 task_id。
 *
 * 任务串行执行（股票→ETF→行业→索引），通过 ``getAdminTaskFunc`` 轮询进度。
 *
 * @returns 包含 task_id 的对象。
 */
export async function postAdminSyncFunc(): Promise<AdminTaskSubmit> {
  return request<AdminTaskSubmit>({
    url: '/admin/sync',
    method: 'POST',
  });
}

/**
 * @description 仅重建搜索索引（从 DB 加载，不拉数据源，秒级完成）。
 *
 * @returns 索引大小。
 */
export async function postAdminReindexFunc(): Promise<AdminReindexResult> {
  return request<AdminReindexResult>({
    url: '/admin/reindex',
    method: 'POST',
  });
}

/**
 * @description 查询后台任务状态与进度。
 *
 * @param taskId 任务 ID。
 * @returns 任务状态信息。
 */
export async function getAdminTaskFunc(
  taskId: string,
): Promise<AdminTaskInfo> {
  return request<AdminTaskInfo>({
    url: '/admin/task/{task_id}',
    method: 'GET',
    pathParams: { task_id: taskId },
  });
}
