/**
 * @description 板块涨跌排行：StockTable 下方可折叠的板块排行表。
 *
 * 数据来自 useSectorRanking（按涨跌幅降序前 50）；支持折叠/展开与手动刷新。
 * 点击行将该板块写入筛选器（联动过滤上方个股列表），再次点击同板块取消。
 * 后端业务错误（如 DB 未连）且无数据时显示「板块数据暂不可用」占位，不打扰主链路。
 * 移动端隐藏部分列（上涨/下跌家数、领涨股）。
 */

import { useState } from 'react';
import { useFilters } from '@/context/FilterContext';
import { useSectorRanking } from '@/hooks/useSectorRanking';
import { formatPct, formatPrice } from '@/utils/format';

interface SectorRankingProps {
  /** 是否处于交易时段（决定是否 30s 轮询） */
  isTrading: boolean;
}

const TH_LEFT =
  'px-2.5 py-2 text-left border-b border-border whitespace-nowrap bg-surface-hover font-semibold text-text-secondary';
const TH_RIGHT =
  'px-2.5 py-2 text-right border-b border-border whitespace-nowrap bg-surface-hover font-semibold text-text-secondary';
const TD_LEFT =
  'px-2.5 py-2 text-left border-b border-border whitespace-nowrap';
const TD_RIGHT =
  'px-2.5 py-2 text-right border-b border-border whitespace-nowrap';

export function SectorRanking({ isTrading }: SectorRankingProps) {
  const { sectors, loading, hasError, refresh } = useSectorRanking(isTrading);
  const { filters, setSector, clearSector } = useFilters();
  const [collapsed, setCollapsed] = useState(false);

  /**
   * @description 点击板块行：选中该板块写入筛选器；再次点击同板块取消筛选。
   *
   * @param name 板块名称（与个股 industry 字段同源）。
   */
  const handleRowClick = (name: string) => {
    if (filters.sector === name) clearSector();
    else setSector(name);
  };

  const showPlaceholder = hasError && sectors.length === 0;

  return (
    <section className="bg-surface border border-border rounded-lg mt-6">
      {/* 头部：标题 + 折叠/刷新 */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <button
          className="flex items-center gap-1.5 text-sm font-semibold text-text"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
        >
          <span
            className={`inline-block text-xs transition-transform ${collapsed ? '-rotate-90' : ''}`}
          >
            ▼
          </span>
          板块涨跌排行
          <span className="ml-2 text-xs font-normal text-text-muted hidden md:inline">
            点击行按板块筛选上方个股
          </span>
        </button>
        <div className="flex items-center gap-3">
          {!collapsed && loading && (
            <span className="text-xs text-text-muted">更新中…</span>
          )}
          <button
            className="text-xs text-accent hover:underline"
            onClick={refresh}
            disabled={loading}
          >
            刷新
          </button>
        </div>
      </div>

      {!collapsed && showPlaceholder && (
        <p className="p-5 text-center text-sm text-text-muted m-0">
          板块数据暂不可用
        </p>
      )}

      {!collapsed && !showPlaceholder && sectors.length === 0 && !loading && (
        <p className="p-5 text-center text-sm text-text-muted m-0">暂无板块数据</p>
      )}

      {!collapsed && sectors.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={TH_LEFT}>板块</th>
                <th className={TH_RIGHT}>最新价</th>
                <th className={TH_RIGHT}>涨跌幅</th>
                <th className={`hidden md:table-cell ${TH_RIGHT}`}>上涨</th>
                <th className={`hidden md:table-cell ${TH_RIGHT}`}>下跌</th>
                <th className={`hidden lg:table-cell ${TH_RIGHT}`}>领涨股</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map((s) => {
                const pct = s.change_pct ?? 0;
                const isUp = pct >= 0;
                const selected = filters.sector === s.name;
                return (
                  <tr
                    key={s.code}
                    className={`hover:bg-surface-hover cursor-pointer ${selected ? 'bg-accent/10' : ''}`}
                    onClick={() => handleRowClick(s.name)}
                    title={selected ? '点击取消板块筛选' : '点击按板块筛选上方个股'}
                    aria-pressed={selected}
                  >
                    <td className={`${TD_LEFT} ${selected ? 'text-accent font-medium' : ''}`}>{s.name}</td>
                    <td className={TD_RIGHT}>{formatPrice(s.price ?? 0)}</td>
                    <td className={`${TD_RIGHT} ${isUp ? 'text-up' : 'text-down'}`}>
                      {isUp ? '+' : ''}
                      {formatPct(pct)}
                    </td>
                    <td className={`hidden md:table-cell ${TD_RIGHT} text-up`}>
                      {s.up_count ?? 0}
                    </td>
                    <td className={`hidden md:table-cell ${TD_RIGHT} text-down`}>
                      {s.down_count ?? 0}
                    </td>
                    <td className={`hidden lg:table-cell ${TD_RIGHT}`}>
                      {s.leading_stock ? (
                        <>
                          {s.leading_stock}
                          {s.leading_stock_change_pct != null && (
                            <span
                              className={`ml-1.5 ${s.leading_stock_change_pct >= 0 ? 'text-up' : 'text-down'}`}
                            >
                              {s.leading_stock_change_pct >= 0 ? '+' : ''}
                              {formatPct(s.leading_stock_change_pct)}
                            </span>
                          )}
                        </>
                      ) : (
                        '--'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
