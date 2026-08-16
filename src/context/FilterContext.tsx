import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  DEFAULT_FILTERS,
  type BoardScope,
  type FilterState,
} from '../types';

interface FilterContextValue {
  filters: FilterState;
  setBoardScope: (scope: BoardScope) => void;
  setPctRange: (range: [number, number]) => void;
  setMinMainInflow: (value: number) => void;
  toggleExcludeST: () => void;
  setSector: (sector: string) => void;
  clearSector: () => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const setBoardScope = (scope: BoardScope) =>
    setFilters((prev) => ({ ...prev, boardScope: scope }));

  const setPctRange = (range: [number, number]) =>
    setFilters((prev) => ({ ...prev, pctRange: range }));

  const setMinMainInflow = (value: number) =>
    setFilters((prev) => ({ ...prev, minMainInflow: value }));

  const toggleExcludeST = () =>
    setFilters((prev) => ({ ...prev, excludeST: !prev.excludeST }));

  const setSector = (sector: string) =>
    setFilters((prev) => ({ ...prev, sector }));

  const clearSector = () =>
    setFilters((prev) => ({ ...prev, sector: undefined }));

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  return (
    <FilterContext.Provider
      value={{
        filters,
        setBoardScope,
        setPctRange,
        setMinMainInflow,
        toggleExcludeST,
        setSector,
        clearSector,
        resetFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used inside FilterProvider');
  return ctx;
}
