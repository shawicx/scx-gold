import { useFilters } from '../context/FilterContext';
import { INFLOW_PRESETS, type BoardScope } from '../types';

interface FilterBarProps {
  onRefresh: () => void;
  loading: boolean;
  isTrading: boolean;
}

export function FilterBar({ onRefresh, loading, isTrading }: FilterBarProps) {
  const {
    filters,
    setBoardScope,
    setPctRange,
    setMinMainInflow,
    toggleExcludeST,
  } = useFilters();

  const handlePctChange = (idx: 0 | 1, raw: string) => {
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    const next: [number, number] = [...filters.pctRange];
    next[idx] = value;
    setPctRange(next);
  };

  return (
    <section className="flex flex-wrap items-center gap-4 p-3 bg-surface border border-border rounded-lg mb-4">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-secondary">板块</span>
        <div className="inline-flex border border-border rounded overflow-hidden divide-x divide-border">
          {(['main', 'all'] as BoardScope[]).map((scope) => (
            <button
              key={scope}
              className={`px-2.5 py-1 text-[15px] ${filters.boardScope === scope ? 'bg-accent text-white' : 'bg-surface text-text'}`}
              onClick={() => setBoardScope(scope)}
            >
              {scope === 'main' ? '主板' : '全部 A 股'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-secondary">涨幅区间</span>
        <input
          type="number"
          step="0.1"
          className="w-[60px] px-1.5 py-1 bg-bg text-text border border-border rounded text-[15px]"
          value={filters.pctRange[0]}
          onChange={(e) => handlePctChange(0, e.target.value)}
        />
        <span className="text-text-secondary">~</span>
        <input
          type="number"
          step="0.1"
          className="w-[60px] px-1.5 py-1 bg-bg text-text border border-border rounded text-[15px]"
          value={filters.pctRange[1]}
          onChange={(e) => handlePctChange(1, e.target.value)}
        />
        <span className="text-text-secondary text-xs">%</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-secondary">主力资金</span>
        <select
          className="px-2 py-1 bg-bg text-text border border-border rounded text-[15px]"
          value={filters.minMainInflow}
          onChange={(e) => setMinMainInflow(Number(e.target.value))}
        >
          {INFLOW_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="flex items-center gap-1 text-[15px] cursor-pointer">
          <input
            type="checkbox"
            checked={filters.excludeST}
            onChange={toggleExcludeST}
          />
          排除 ST
        </label>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        {isTrading && (
          <span className="text-xs px-2 py-0.5 rounded bg-[rgba(16,185,129,0.15)] text-down">
            交易中
          </span>
        )}
        <button
          className="px-3.5 py-1.5 bg-accent text-white border-none rounded text-[15px] disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? '刷新中…' : '刷新'}
        </button>
      </div>
    </section>
  );
}
