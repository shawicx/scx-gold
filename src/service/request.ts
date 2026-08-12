/**
 * @description 后端统一请求封装：路径参数替换、统一响应解包、业务码校验、错误归一化。
 *
 * 设计要点：
 * - 不设 baseURL，靠 Vite dev proxy / 部署反代转发（保持相对路径 /api/v1/...）。
 * - pathParams：URL 中 {key} 占位符替换，避免路径参数被当 query 发送。
 * - 解包统一响应：后端返回 { code, message, data }，code===0 时返回裸 data。
 * - code!==0 或 HTTP 非 2xx 时抛 ApiError，调用方统一 catch。
 */

import type { AxiosRequestConfig, Method } from 'axios';
import axios, { isAxiosError } from 'axios';

export interface RequestConfig extends AxiosRequestConfig {
  url: string;
  method: Method;
  /** URL 路径参数，替换 {key} 占位符 */
  pathParams?: Record<string, string | number>;
}

/** 超时时间（毫秒）
 * 全量同步等长耗时操作已改为异步任务模式（提交后轮询），
 * 此超时仅覆盖普通请求与重建索引等秒级操作。
 */
const TIMEOUT = 120 * 1000;

/**
 * @description 后端业务错误（code !== 0 或 HTTP 非 2xx）。
 */
export class ApiError extends Error {
  /** HTTP 状态码（业务码错误时为 200） */
  readonly status: number;
  /** 后端业务码（HTTP 错误时为 0） */
  readonly code: number;

  constructor(message: string, status: number = 0, code: number = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * @description 发送请求并解包统一响应。
 *
 * 流程：路径参数替换 → axios 发请求 → HTTP 错误归一化为 ApiError →
 *      校验 code===0 → 返回裸 data。
 *
 * @param config 请求配置（含 url / method / pathParams / params / data 等）。
 * @returns 后端统一响应中的 data 字段（已解包）。
 * @throws {ApiError} 业务码非 0 或 HTTP/网络错误。
 *
 * @example
 * const data = await request<StockListData>({ url: '/api/v1/stock/list', method: 'GET', params: { page: 1 } });
 */
export async function request<T = unknown>(config: RequestConfig): Promise<T> {
  // 1. 路径参数替换
  let url = config.url;
  if (config.pathParams) {
    for (const [key, value] of Object.entries(config.pathParams)) {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    }
  }

  try {
    const response = await axios({
      ...config,
      url,
      timeout: TIMEOUT,
      headers: {
        ...config.headers,
        // 注入授权码头（从 localStorage 读，避免循环依赖 AuthContext）
        ...(typeof window !== 'undefined'
          ? (() => {
              const token = window.localStorage.getItem('scx-gold.access-token');
              return token ? { 'X-Access-Token': token } : {};
            })()
          : {}),
      },
    });

    // 2. 解包统一响应 { code, message, data }
    const body = response.data;
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0) {
        return body.data as T;
      }
      // 业务码非 0
      throw new ApiError(
        body.message || `业务错误 (code=${body.code})`,
        response.status,
        body.code,
      );
    }

    // 非统一响应格式（如第三方接口），直接返回
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (isAxiosError(error)) {
      // 401：授权码无效或过期，清除 token 触发重新认证
      if (error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('scx-gold.access-token');
        }
      }
      // 尝试提取后端统一格式的错误信息
      const body = error.response?.data;
      if (body && typeof body === 'object' && 'message' in body) {
        throw new ApiError(
          String(body.message),
          error.response?.status ?? 0,
          (body as { code?: number }).code ?? 0,
        );
      }
      throw new ApiError(
        error.message || '网络请求失败',
        error.response?.status ?? 0,
      );
    }
    // 未知错误
    throw new ApiError(
      error instanceof Error ? error.message : '未知错误',
    );
  }
}
