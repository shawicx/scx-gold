/**
 * @description 分析结果汇总表格，一目了然查看所有标的的关键数据。
 */

import type { AnalysisReport } from '@/service/types';
import {
  changeColorClass,
  formatChange,
  trendColorClass,
} from '@/utils/analysis-style';

function Cell({ value, className = '' }: { value: number | null; className?: string }) {
  return (
    <td className={`px-3 py-2 text-right tabular-nums ${className}`}>
      {value !== null ? value.toFixed(3) : '--'}
    </td>
  );
}

export function AnalysisTable({
  reports,
  nameMap,
}: {
  reports: AnalysisReport[];
  nameMap?: Map<string, string>;
}) {
  if (reports.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface border border-border rounded-lg shadow-[var(--shadow)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary text-xs">
              <th className="px-3 py-2 text-left font-medium">代码</th>
              <th className="px-3 py-2 text-left font-medium">名称</th>
              <th className="px-3 py-2 text-right font-medium">收盘</th>
              <th className="px-3 py-2 text-right font-medium">涨跌%</th>
              <th className="px-3 py-2 text-center font-medium">趋势</th>
              <th className="px-3 py-2 text-right font-medium hidden md:table-cell">支撑1</th>
              <th className="px-3 py-2 text-right font-medium hidden md:table-cell">支撑2</th>
              <th className="px-3 py-2 text-right font-medium hidden md:table-cell">压力1</th>
              <th className="px-3 py-2 text-right font-medium hidden lg:table-cell">MA20</th>
              <th className="px-3 py-2 text-right font-medium hidden lg:table-cell">MA60</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr
                key={r.code}
                className="border-b border-border last:border-0 hover:bg-surface-hover"
              >
                <td className="px-3 py-2 text-text-muted">{r.code}</td>
                <td className="px-3 py-2 font-medium">
                  {(() => {
                    const name = r.name || nameMap?.get(r.code) || r.code;
                    return r.ok ? name : (
                      <span className="text-error">{name}（失败）</span>
                    );
                  })()}
                </td>
                {r.ok ? (
                  <>
                    <Cell value={r.close} />
                    <td
                      className={`px-3 py-2 text-right tabular-nums ${changeColorClass(
                        r.change_pct,
                      )}`}
                    >
                      {formatChange(r.change_pct)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={trendColorClass(r.trend)}>
                        {r.trend}
                      </span>
                    </td>
                    <Cell value={r.support_1?.price ?? null} className="hidden md:table-cell" />
                    <Cell value={r.support_2?.price ?? null} className="hidden md:table-cell" />
                    <Cell value={r.resistance_1?.price ?? null} className="hidden md:table-cell" />
                    <Cell value={r.ma20} className="hidden lg:table-cell" />
                    <Cell value={r.ma60} className="hidden lg:table-cell" />
                  </>
                ) : (
                  <td
                    className="px-3 py-2 text-error text-xs"
                    colSpan={5}
                  >
                    {r.error}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
