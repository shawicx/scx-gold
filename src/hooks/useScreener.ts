import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchStocks } from '../api/stocks';
import type { FilterState, Stock } from '../types';

interface ScreenerState {
  stocks: Stock[];
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  isStale: boolean;
  refresh: () => Promise<void>;
}

const POLL_INTERVAL = 30_000;

export function useScreener(
  filters: FilterState,
  isTrading: boolean,
): ScreenerState {
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const stocks = await fetchStocks({ boardScope: filters.boardScope });
      setAllStocks(stocks);
      setLastUpdated(new Date());
      setIsStale(false);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setIsStale(true);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [filters.boardScope]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isTrading) return;
    const id = window.setInterval(load, POLL_INTERVAL);
    return () => window.clearInterval(id);
  }, [isTrading, load]);

  const filtered = filterStocks(allStocks, filters);

  return {
    stocks: filtered,
    loading,
    error,
    lastUpdated,
    isStale,
    refresh: load,
  };
}

function filterStocks(stocks: Stock[], filters: FilterState): Stock[] {
  const [minPct, maxPct] = filters.pctRange;
  return stocks.filter((s) => {
    if (s.pctChange < minPct || s.pctChange > maxPct) return false;
    if (s.mainNetInflow < filters.minMainInflow) return false;
    if (filters.excludeST && s.isST) return false;
    return true;
  });
}
