/**
 * @description 板块涨跌排行 hook：交易时段每 30s 轮询行业板块排行（/api/v1/sector/list）。
 *
 * 按涨跌幅降序取前 50 名；请求失败时不打断主链路，由组件显示占位/保留旧数据。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiV1SectorListFunc } from '@/service';
import type { SectorQuote } from '@/service/types';

const POLL_INTERVAL = 30_000;

interface SectorRankingState {
  /** 板块行情列表（按涨跌幅降序） */
  sectors: SectorQuote[];
  /** 是否正在请求 */
  loading: boolean;
  /** 最近一次请求是否失败（失败但已有数据时保留旧数据） */
  hasError: boolean;
  /** 手动刷新 */
  refresh: () => Promise<void>;
}

export function useSectorRanking(isTrading: boolean): SectorRankingState {
  const [sectors, setSectors] = useState<SectorQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const data = await getApiV1SectorListFunc({
        sort_by: 'change_pct',
        descending: true,
        limit: 50,
      });
      setSectors(data);
      setHasError(false);
    } catch {
      // 静默失败：组件显示「板块数据暂不可用」占位
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

  return { sectors, loading, hasError, refresh: load };
}
