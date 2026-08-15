/**
 * @description 个股详情 hook：按代码拉取后端 /api/v1/stock/{code} 详情。
 *
 * code 变化或 refresh 时重新拉取；用 cancelled 标记丢弃过期请求的结果（竞态防护）。
 * 详情仅含基础信息 + 实时行情（无 K 线/资金流分时），量能与资金字段由前端 Stock 兜底展示。
 */

import { useCallback, useEffect, useState } from 'react';
import { getApiV1StockByCodeFunc } from '@/service';
import { ApiError } from '@/service/request';
import type { StockDetail } from '@/service/types';

interface StockDetailState {
  /** 后端个股详情（null 表示未加载） */
  detail: StockDetail | null;
  /** 是否正在请求 */
  loading: boolean;
  /** 错误信息（null 表示无错误） */
  error: string | null;
  /** 手动重新拉取 */
  refresh: () => void;
}

export function useStockDetail(code: string | null): StockDetailState {
  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    // code 变化或 refresh 时重置并重新拉取
    setDetail(null);
    setError(null);
    if (!code) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await getApiV1StockByCodeFunc(code);
        if (!cancelled) setDetail(data);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof ApiError
              ? e.message
              : e instanceof Error
                ? e.message
                : '加载详情失败',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, version]);

  return { detail, loading, error, refresh };
}
