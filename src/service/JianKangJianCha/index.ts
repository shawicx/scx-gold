import { request } from '@/service/request';

/**
 * 存活探针响应。
 */
export interface HealthResult {
  status: string;
  version?: string;
}

/**
 * 就绪探针响应。
 */
export interface HealthReadyResult {
  status: string;
  checks: Record<string, string>;
}

/**
 * @description 存活探针。
 *
 * @returns 存活状态。
 */
export async function getHealthFunc(): Promise<HealthResult> {
  return request<HealthResult>({
    url: '/health',
    method: 'GET',
  });
}

/**
 * @description 就绪探针（检查缓存/DB 等依赖）。
 *
 * @returns 各组件就绪状态。
 */
export async function getHealthReadyFunc(): Promise<HealthReadyResult> {
  return request<HealthReadyResult>({
    url: '/health/ready',
    method: 'GET',
  });
}
