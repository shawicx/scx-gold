/**
 * @description 历史分析报告的单条记录组件（时间线节点样式）。
 *
 * 用于 HistoryDrawer 内部，展示某标的某日的完整分析快照。
 */

import { useState } from 'react';
import type { AnalysisReport } from '@/service/types';
import {
  changeColorClass,
  formatChange,
  formatDistance,
  trendColorClass,
} from '@/utils/analysis-style';

/** 趋势圆点颜色 */
function trendDotClass(trend: string): string {
  if (trend === '多头') return 'bg-up';
  if (trend === '空头') return 'bg-down';
  return 'bg-text-muted';
}

export function AnalysisHistoryItem({ report }: { report: AnalysisReport }) {
  const [expanded, setExpanded] = useState(false);
  const changeColor = changeColorClass(report.change_pct);

  return (
    <div className="flex gap-3 group">
      {/* 时间线圆点 + 竖线 */}
      <div className="flex flex-col items-center shrink-0">
        <span
          className={`w-2.5 h-2.5 rounded-full mt-1.5 ${trendDotClass(report.trend)}`}
        />
        <span className="w-px flex-1 bg-border mt-1" />
      </div>

      {/* 内容区 */}
      <div className="flex-1 pb-5 min-w-0">
        {/* 日期 + 趋势 */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-medium">
            {report.trade_date || '未知日期'}
          </span>
          {report.trend && (
            <span
              className={`text-[11px] font-medium px-1.5 py-0.5 rounded bg-surface-hover ${trendColorClass(
                report.trend,
              )}`}
            >
              {report.trend}
            </span>
          )}
        </div>

        {/* 价格行 */}
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-base font-bold">
            {report.close !== null ? report.close.toFixed(3) : '--'}
          </span>
          <span className={`text-xs font-medium ${changeColor}`}>
            {formatChange(report.change_pct)}
          </span>
        </div>

        {/* 支撑/压力（紧凑展示） */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-2">
          {report.support_1 && (
            <span>
              <span className="text-text-muted">支撑1 </span>
              <span className="text-down font-medium">
                {report.support_1.price.toFixed(3)}
              </span>
              <span className="text-text-muted ml-0.5">
                ({formatDistance(report.support_1.distance_pct)})
              </span>
            </span>
          )}
          {report.support_2 && (
            <span>
              <span className="text-text-muted">支撑2 </span>
              <span className="text-down font-medium">
                {report.support_2.price.toFixed(3)}
              </span>
            </span>
          )}
          {report.resistance_1 && (
            <span>
              <span className="text-text-muted">压力1 </span>
              <span className="text-up font-medium">
                {report.resistance_1.price.toFixed(3)}
              </span>
              <span className="text-text-muted ml-0.5">
                ({formatDistance(report.resistance_1.distance_pct)})
              </span>
            </span>
          )}
        </div>

        {/* AI 摘要（折叠/展开） */}
        {report.summary && (
          <div className="mt-1.5">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-accent hover:underline"
            >
              {expanded ? '收起摘要' : '展开摘要'}
            </button>
            {expanded && (
              <p className="text-xs text-text leading-relaxed mt-1 m-0 whitespace-pre-wrap bg-surface-hover rounded p-2">
                {report.summary}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
