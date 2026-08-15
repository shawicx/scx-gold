/**
 * @description request.ts 统一请求封装单元测试。
 *
 * 覆盖（对应迁移设计 §5）：
 * - 路径参数 {key} 替换，避免被当 query 发送
 * - 统一响应 { code, message, data } 解包（code===0 返回裸 data）
 * - 业务码非 0 抛 ApiError（status=200, code=业务码）
 * - HTTP 非 2xx / 网络错误归一化为 ApiError
 * - HTTP 401 自动清除 localStorage 中的授权码 token
 * - 请求头自动注入 X-Access-Token
 * - 非统一响应格式直接返回 body
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAxiosInstance, mockIsAxiosError } = vi.hoisted(() => ({
  mockAxiosInstance: vi.fn(),
  mockIsAxiosError: vi.fn(),
}));

vi.mock('axios', () => ({
  default: mockAxiosInstance,
  isAxiosError: mockIsAxiosError,
}));

import { request } from './request';

const TOKEN_KEY = 'scx-gold.access-token';

afterEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

beforeEach(() => {
  // 默认：axios 成功返回，且错误判定为“非 axios 错误”
  mockIsAxiosError.mockReturnValue(false);
});

describe('request', () => {
  it('替换 pathParams 中的 {key} 占位符，且不把路径参数当 query 发送', async () => {
    mockAxiosInstance.mockResolvedValue({ data: { code: 0, data: null } });

    await request({ url: '/api/v1/stock/{code}', method: 'GET', pathParams: { code: '000001' } });

    expect(mockAxiosInstance).toHaveBeenCalledTimes(1);
    const config = mockAxiosInstance.mock.calls[0][0];
    expect(config.url).toBe('/api/v1/stock/000001');
    expect(config.params).toBeUndefined();
  });

  it('code===0 时返回解包后的裸 data', async () => {
    mockAxiosInstance.mockResolvedValue({
      data: { code: 0, message: 'ok', data: { items: [], total: 0 } },
    });

    const result = await request<{ items: unknown[]; total: number }>({
      url: '/api/v1/stock/list',
      method: 'GET',
    });

    expect(result).toEqual({ items: [], total: 0 });
  });

  it('业务码非 0 时抛 ApiError（status=200, code=业务码）', async () => {
    mockAxiosInstance.mockResolvedValue({
      status: 200,
      data: { code: 40401, message: 'data unavailable', data: null },
    });

    await expect(
      request({ url: '/api/v1/market/index', method: 'GET' }),
    ).rejects.toMatchObject({ status: 200, code: 40401, message: 'data unavailable' });
  });

  it('HTTP 非 2xx 时抛 ApiError，并提取后端 message', async () => {
    mockIsAxiosError.mockReturnValue(true);
    mockAxiosInstance.mockRejectedValue({
      isAxiosError: true,
      message: 'Request failed with status code 500',
      response: { status: 500, data: { message: '内部错误', code: 50001 } },
    });

    await expect(
      request({ url: '/api/v1/stock/list', method: 'GET' }),
    ).rejects.toMatchObject({ status: 500, code: 50001, message: '内部错误' });
  });

  it('网络错误（无 response）时抛 ApiError（status=0, code=0）', async () => {
    mockIsAxiosError.mockReturnValue(true);
    mockAxiosInstance.mockRejectedValue({
      isAxiosError: true,
      message: 'Network Error',
    });

    await expect(
      request({ url: '/api/v1/stock/list', method: 'GET' }),
    ).rejects.toMatchObject({ status: 0, code: 0, message: 'Network Error' });
  });

  it('HTTP 401 时清除 localStorage 中的授权码 token', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'some-token');
    mockIsAxiosError.mockReturnValue(true);
    mockAxiosInstance.mockRejectedValue({
      isAxiosError: true,
      message: 'Request failed with status code 401',
      response: { status: 401, data: { message: '未授权' } },
    });

    await expect(
      request({ url: '/api/v1/auth/verify', method: 'POST' }),
    ).rejects.toMatchObject({ status: 401 });

    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('从 localStorage 读取授权码并注入 X-Access-Token 请求头', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'my-token');
    mockAxiosInstance.mockResolvedValue({ data: { code: 0, data: null } });

    await request({ url: '/api/v1/watchlist', method: 'GET' });

    const config = mockAxiosInstance.mock.calls[0][0];
    expect(config.headers['X-Access-Token']).toBe('my-token');
  });

  it('无授权码时不注入 X-Access-Token', async () => {
    mockAxiosInstance.mockResolvedValue({ data: { code: 0, data: null } });

    await request({ url: '/api/v1/watchlist', method: 'GET' });

    const config = mockAxiosInstance.mock.calls[0][0];
    expect(config.headers['X-Access-Token']).toBeUndefined();
  });

  it('非统一响应格式（无 code 字段）时直接返回 body（如 /health）', async () => {
    mockAxiosInstance.mockResolvedValue({ data: { status: 'ok', uptime: 1.5 } });

    const result = await request({ url: '/health', method: 'GET' });

    expect(result).toEqual({ status: 'ok', uptime: 1.5 });
  });

  it('非 axios 的未知错误包装为 ApiError', async () => {
    mockAxiosInstance.mockRejectedValue(new Error('boom'));

    await expect(
      request({ url: '/api/v1/stock/list', method: 'GET' }),
    ).rejects.toMatchObject({ name: 'ApiError', message: 'boom' });
  });
});
