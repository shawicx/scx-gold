/**
 * @description 应用配置 service，对应后端 /api/v1/settings。
 */

import { request } from '@/service/request';
import type { AppSettings, LlmTestResult } from '@/service/types';

/**
 * 配置更新请求体（只含需要更新的字段）。
 */
export interface SettingsUpdateRequest {
  llm_provider?: string;
  llm_api_key?: string;
  llm_base_url?: string;
  llm_model?: string;
  llm_timeout?: string;
  smtp_host?: string;
  smtp_port?: string;
  smtp_user?: string;
  smtp_password?: string;
  smtp_from_name?: string;
  smtp_use_ssl?: string;
  notify_emails?: string;
  auth_code_ttl_hours?: string;
}

/**
 * @description 获取当前应用配置（敏感字段脱敏）。
 *
 * @returns 配置字典。
 */
export async function getApiV1SettingsFunc(): Promise<AppSettings> {
  return request<AppSettings>({
    url: '/api/v1/settings',
    method: 'GET',
  });
}

/**
 * @description 批量更新应用配置。
 *
 * @param body 配置更新请求体。
 * @returns 更新条数。
 */
export async function putApiV1SettingsFunc(
  body: SettingsUpdateRequest,
): Promise<{ updated: number }> {
  return request<{ updated: number }>({
    url: '/api/v1/settings',
    method: 'PUT',
    data: body,
  });
}

/**
 * @description 测试 LLM 连接。
 *
 * @returns 测试结果（success / message / reply）。
 */
export async function postApiV1SettingsTestLlmFunc(): Promise<LlmTestResult> {
  return request<LlmTestResult>({
    url: '/api/v1/settings/test-llm',
    method: 'POST',
  });
}

/**
 * @description 测试 SMTP 发信（向配置的收件人发一封测试邮件）。
 *
 * @returns 测试结果（success / message）。
 */
export async function postApiV1SettingsTestSmtpFunc(): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>({
    url: '/api/v1/settings/test-smtp',
    method: 'POST',
  });
}
