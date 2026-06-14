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
    <section className="filter-bar">
      <div className="filter-bar__group">
        <span className="filter-bar__label">板块</span>
        <div className="seg-control">
          {(['main', 'all'] as BoardScope[]).map((scope) => (
            <button
              key={scope}
              className={`seg-control__btn ${filters.boardScope === scope ? 'seg-control__btn--active' : ''}`}
              onClick={() => setBoardScope(scope)}
            >
              {scope === 'main' ? '主板' : '全部 A 股'}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-bar__group">
        <span className="filter-bar__label">涨幅区间</span>
        <input
          type="number"
          step="0.1"
          className="filter-bar__num"
          value={filters.pctRange[0]}
          onChange={(e) => handlePctChange(0, e.target.value)}
        />
        <span className="filter-bar__sep">~</span>
        <input
          type="number"
          step="0.1"
          className="filter-bar__num"
          value={filters.pctRange[1]}
          onChange={(e) => handlePctChange(1, e.target.value)}
        />
        <span className="filter-bar__suffix">%</span>
      </div>

      <div className="filter-bar__group">
        <span className="filter-bar__label">主力资金</span>
        <select
          className="filter-bar__select"
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

      <div className="filter-bar__group">
        <label className="filter-bar__check">
          <input
            type="checkbox"
            checked={filters.excludeST}
            onChange={toggleExcludeST}
          />
          排除 ST
        </label>
      </div>

      <div className="filter-bar__group filter-bar__group--right">
        {isTrading && (
          <span className="filter-bar__status filter-bar__status--trading">
            交易中
          </span>
        )}
        <button
          className="filter-bar__refresh"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? '刷新中…' : '刷新'}
        </button>
      </div>
    </section>
  );
}
