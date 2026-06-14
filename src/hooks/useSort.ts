import { useCallback, useEffect, useState } from 'react';
import type { SortKey, SortOrder } from '../types';

export interface SortState {
  key: SortKey | null;
  order: SortOrder;
}

export function useSort(): {
  state: SortState;
  toggle: (key: SortKey) => void;
  reset: () => void;
} {
  const [state, setState] = useState<SortState>(() => readFromUrl());

  useEffect(() => {
    writeToUrl(state);
  }, [state]);

  const toggle = useCallback((key: SortKey) => {
    setState((prev) => {
      if (prev.key !== key) return { key, order: 'desc' };
      const nextOrder: SortOrder =
        prev.order === 'desc' ? 'asc' : prev.order === 'asc' ? 'none' : 'desc';
      return { key: nextOrder === 'none' ? null : key, order: nextOrder };
    });
  }, []);

  const reset = useCallback(() => setState({ key: null, order: 'none' }), []);

  return { state, toggle, reset };
}

function readFromUrl(): SortState {
  if (typeof window === 'undefined') return { key: null, order: 'none' };
  const params = new URLSearchParams(window.location.search);
  const key = params.get('sort') as SortKey | null;
  const order = (params.get('order') as SortOrder | null) ?? 'none';
  if (!key) return { key: null, order: 'none' };
  return { key, order };
}

function writeToUrl(state: SortState) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (state.key && state.order !== 'none') {
    url.searchParams.set('sort', state.key);
    url.searchParams.set('order', state.order);
  } else {
    url.searchParams.delete('sort');
    url.searchParams.delete('order');
  }
  window.history.replaceState(null, '', url.toString());
}
