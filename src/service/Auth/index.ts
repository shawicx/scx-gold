/**
 * @description 认证 service：请求授权码 + 验证授权码 + 退出。
 */

import { request } from '@/service/request';

/**
 * 请求授权码结果。
 */
export interface RequestCodeResult {
  sent: boolean;
  message: string;
}

/**
 * 验证授权码结果。
 */
export interface VerifyResult {
  valid: boolean;
  message?: string;
}

/**
 * @description 请求生成授权码并发送到邮箱。
 *
 * 后端生成 16 位随机码，发到固定邮箱。
 *
 * @returns 发送结果。
 */
export async function postApiV1AuthRequestCodeFunc(): Promise<RequestCodeResult> {
  return request<RequestCodeResult>({
    url: '/api/v1/auth/request-code',
    method: 'POST',
  });
}

/**
 * @description 验证授权码是否有效。
 *
 * @param code 16 位授权码。
 * @returns 验证结果。
 */
export async function postApiV1AuthVerifyFunc(
  code: string,
): Promise<VerifyResult> {
  return request<VerifyResult>({
    url: '/api/v1/auth/verify',
    method: 'POST',
    data: { code },
  });
}

/**
 * @description 退出登录（停用授权码）。
 *
 * @param code 16 位授权码。
 */
export async function postApiV1AuthLogoutFunc(
  code: string,
): Promise<{ done: boolean }> {
  return request<{ done: boolean }>({
    url: '/api/v1/auth/logout',
    method: 'POST',
    data: { code },
  });
}
