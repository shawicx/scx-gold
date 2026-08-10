/**
 * @description 支撑位分析 service，对应后端 POST /api/v1/analysis/run。
 */

import { request } from '@/service/request';
import type { AnalysisReport, AnalysisResult } from '@/service/types';

/**
 * 分析请求参数。
 */
export interface PostApiV1AnalysisRunRequestType {
  /** True 只分析不发邮件，False 渲染邮件并发送 */
  dry_run?: boolean;
  /** 指定分析的代码列表（逗号分隔）；不传则读后端 SCX_WATCHLIST 配置 */
  codes?: string;
}

/**
 * @description 手动触发支撑位分析。
 *
 * 可通过 codes 参数传入前端关注列表（逗号分隔代码），未传则读后端配置。
 * 逐标的拉取 K 线 → 计算支撑位 → AI 解读。
 * dry_run=true 时只返回结果不发邮件。
 *
 * @param params 查询参数（dry_run / codes）。
 * @returns 分析汇总结果（含每只标的的详细 report）。
 */
export async function postApiV1AnalysisRunFunc(
  params?: PostApiV1AnalysisRunRequestType,
): Promise<AnalysisResult> {
  return request<AnalysisResult>({
    url: '/api/v1/analysis/run',
    method: 'POST',
    params,
  });
}

/**
 * @description 获取最新分析报告（从 DB 读取，不触发重算）。
 *
 * @param codes 指定代码（逗号分隔）；不传则返回关注列表的最新报告。
 * @returns AnalysisReport 列表。
 */
export async function getApiV1AnalysisLatestFunc(
  codes?: string,
): Promise<AnalysisReport[]> {
  return request<AnalysisReport[]>({
    url: '/api/v1/analysis/latest',
    method: 'GET',
    params: codes ? { codes } : undefined,
  });
}

/**
 * @description 获取某只标的历史分析报告。
 *
 * @param code 证券代码。
 * @param limit 最大返回数。
 * @returns AnalysisReport 列表（最新在前）。
 */
export async function getApiV1AnalysisHistoryFunc(
  code: string,
  limit?: number,
): Promise<AnalysisReport[]> {
  return request<AnalysisReport[]>({
    url: '/api/v1/analysis/history',
    method: 'GET',
    params: { code, ...(limit ? { limit } : {}) },
  });
}
