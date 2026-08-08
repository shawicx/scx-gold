import { request } from '@/service/request';
import type { StockDetail, StockListData } from '@/service/types';

// ---------------------------------------------------------------------------
// 请求参数类型
// ---------------------------------------------------------------------------

/**
 * 股票列表请求参数。
 */
export interface GetApiV1StockListRequestType {
  /** 市场板块筛选 */
  market?: string;
  /** 证券类型：stock/etf/all */
  type?: string;
  /** 排序字段 */
  sort_by?: string;
  /** 是否降序 */
  descending?: boolean;
  /** 页码（从 1 起） */
  page?: number;
  /** 每页条数（1~100） */
  page_size?: number;
}

// ---------------------------------------------------------------------------
// 接口函数
// ---------------------------------------------------------------------------

/**
 * @description 获取个股详情。
 *
 * @param code 股票代码。
 * @returns 个股详情（基础信息 + 实时行情聚合）。
 */
export async function getApiV1StockByCodeFunc(
  code: string,
): Promise<StockDetail> {
  return request<StockDetail>({
    url: '/api/v1/stock/{code}',
    method: 'GET',
    pathParams: { code },
  });
}

/**
 * @description 获取股票/ETF 行情列表（含主力资金、行业）。
 *
 * @param params 查询参数（市场/类型/排序/分页）。
 * @returns 分页行情数据。
 */
export async function getApiV1StockListFunc(
  params?: GetApiV1StockListRequestType,
): Promise<StockListData> {
  return request<StockListData>({
    url: '/api/v1/stock/list',
    method: 'GET',
    params,
  });
}
