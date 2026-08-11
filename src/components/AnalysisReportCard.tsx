/**
 * @description 单只标的的支撑位分析结果卡片。
 *
 * 展示：代码/名称、趋势、收盘价/涨跌幅、支撑1/支撑2/压力1（含来源标签）、AI 解读摘要。
 * 失败标的显示错误原因。
 */

import type { AnalysisReport, SupportLevel } from '@/service/types';
import {
  changeColorClass,
  formatChange,
  formatDistance,
  strengthColorClass,
  trendColorClass,
} from '@/utils/analysis-style';

/** 单个价位行（支撑/压力） */
function PriceRow({
  label,
  level,
  colorClass,
}: {
  label: string;
  level: SupportLevel | null;
  colorClass: string;
}) {
  if (!level) {
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-sm text-text-muted w-16 shrink-0">{label}</span>
        <span className="text-text-muted">--</span>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-sm text-text-muted w-16 shrink-0">{label}</span>
        <span className={`text-base font-semibold ${colorClass}`}>
          {level.price.toFixed(3)}
        </span>
        <span className={`text-xs ${colorClass}`}>
          {formatDistance(level.distance_pct)}
        </span>
        <span className={`text-xs ${strengthColorClass(level.strength)}`}>
          {level.strength}
        </span>
      </div>
      {level.sources.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1 ml-16">
          {level.sources.map((src) => (
            <span
              key={src}
              className="text-[11px] px-1.5 py-0.5 rounded bg-surface-hover text-text-muted"
            >
              {src}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function AnalysisReportCard({
  report,
  fallbackName,
  onHistory,
}: {
  report: AnalysisReport;
  fallbackName?: string;
  /** 点击「查看历史」按钮的回调 */
  onHistory?: (code: string) => void;
}) {
  // 名称优先用后端返回，为空时回退到前端关注列表中的名称
  const displayName = report.name || fallbackName || report.code;

  // 失败标的
  if (!report.ok) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-sm">{displayName}</span>
          <span className="text-xs text-text-muted">{report.code}</span>
        </div>
        <p className="text-sm text-error m-0">{report.error || '分析失败'}</p>
      </div>
    );
  }

  const changeColor = changeColorClass(report.change_pct);

  return (
    <div className="bg-surface border border-border rounded-lg p-4 shadow-[var(--shadow)]">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-sm truncate">
            {displayName}
          </span>
          <span className="text-xs text-text-muted shrink-0">
            {report.code}
          </span>
        </div>
        {report.trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full bg-surface-hover shrink-0 ${trendColorClass(
              report.trend,
            )}`}
          >
            {report.trend}
          </span>
        )}
      </div>

      {/* 收盘价 + 涨跌幅 */}
      <div className="flex items-baseline gap-3 mb-3 pb-3 border-b border-border">
        <span className="text-2xl font-bold">
          {report.close !== null ? report.close.toFixed(3) : '--'}
        </span>
        <span className={`text-sm font-medium ${changeColor}`}>
          {formatChange(report.change_pct)}
        </span>
        {report.trade_date && (
          <span className="text-xs text-text-muted ml-auto">
            {report.trade_date}
          </span>
        )}
      </div>

      {/* 支撑 / 压力 */}
      <div className="space-y-2 mb-3">
        <PriceRow
          label="支撑1"
          level={report.support_1}
          colorClass="text-down"
        />
        <PriceRow
          label="支撑2"
          level={report.support_2}
          colorClass="text-down"
        />
        <PriceRow
          label="压力1"
          level={report.resistance_1}
          colorClass="text-up"
        />
      </div>

      {/* AI 解读摘要 */}
      {report.summary && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-xs text-text-muted mb-1">AI 解读</div>
          <p className="text-sm text-text leading-relaxed m-0 whitespace-pre-wrap">
            {report.summary}
          </p>
        </div>
      )}

      {/* 历史入口 */}
      {onHistory && (
        <div className="mt-3 pt-3 border-t border-border flex justify-end">
          <button
            onClick={() => onHistory(report.code)}
            className="text-xs text-accent hover:underline"
          >
            查看历史 →
          </button>
        </div>
      )}
    </div>
  );
}
