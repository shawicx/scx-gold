/**
 * @description 大盘指数行情 hook：交易时段每 30s 轮询主要指数（/api/v1/market/index）。
 *
 * 与 useScreener 的轮询节奏对齐（POLL_INTERVAL = 30s）；
 * 请求失败时不打断主链路，由组件静默降级（隐藏整条 / 保留旧数据）。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiV1MarketIndexFunc } from '@/service';
import type { IndexQuote } from '@/service/types';

const POLL_INTERVAL = 30_000;

interface MarketIndexState {
  /** 指数行情列表 */
  quotes: IndexQuote[];
  /** 是否正在请求 */
  loading: boolean;
  /** 最近一次请求是否失败（失败但已有数据时保留旧数据） */
  hasError: boolean;
  /** 手动刷新 */
  refresh: () => Promise<void>;
}

export function useMarketIndex(isTrading: boolean): MarketIndexState {
  const [quotes, setQuotes] = useState<IndexQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const data = await getApiV1MarketIndexFunc();
      setQuotes(data);
      setHasError(false);
    } catch {
      // 静默失败：不抛给主链路，组件据此隐藏/保留旧数据
      setHasError(true);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isTrading) return;
    const id = window.setInterval(load, POLL_INTERVAL);
    return () => window.clearInterval(id);
  }, [isTrading, load]);

  return { quotes, loading, hasError, refresh: load };
}
