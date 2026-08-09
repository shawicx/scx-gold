/**
 * @description 支撑位分析 hook，管理手动触发分析的状态（loading/error/result）。
 *
 * 调用后端 POST /api/v1/analysis/run?dry_run=true，传入关注列表代码，
 * 返回结构化分析结果。
 */

import { useState, useCallback, useRef } from 'react';
import { postApiV1AnalysisRunFunc } from '@/service';
import { ApiError } from '@/service/request';
import type { AnalysisResult } from '@/service/types';

interface AnalysisState {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  run: () => Promise<void>;
}

export function useAnalysis(codes: string[]): AnalysisState {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const run = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const data = await postApiV1AnalysisRunFunc({
        dry_run: true,
        codes: codes.length > 0 ? codes.join(',') : undefined,
      });
      setResult(data);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : '分析失败';
      setError(msg);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [codes]);

  return { result, loading, error, run };
}
