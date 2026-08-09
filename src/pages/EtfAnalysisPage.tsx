/**
 * @description ETF 支撑位分析页面。
 *
 * 布局：左右分栏（大屏）/ 上下堆叠（小屏）
 *   - 左/上：关注列表（搜索 + 管理）
 *   - 右/下：开始分析按钮 + 结果展示（卡片网格 + 汇总表格 Tab 切换）
 */

import { useState } from 'react';

import { AnalysisReportCard } from '@/components/AnalysisReportCard';
import { AnalysisTable } from '@/components/AnalysisTable';
import { Banner } from '@/components/Banner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Watchlist } from '@/components/Watchlist';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useWatchlist } from '@/context/WatchlistContext';

type ViewMode = 'cards' | 'table';

export function EtfAnalysisPage() {
  const { items } = useWatchlist();
  const codes = items.map((it) => it.code);
  const analysis = useAnalysis(codes);
  const [view, setView] = useState<ViewMode>('cards');

  const { result, loading, error, run } = analysis;
  const reports = result?.reports ?? [];

  // 构建关注列表的 code → name 映射，用于补全后端未返回的名称
  const nameMap = new Map(items.map((it) => [it.code, it.name]));

  return (
    <div className="max-w-[2560px] mx-auto px-5 pt-4 pb-10">
      {/* 页头 */}
      <header className="flex justify-between items-center pb-3 mb-4 border-b border-border">
        <h1 className="text-lg font-semibold m-0">ETF 支撑位分析</h1>
        <ThemeToggle />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* 左：关注列表 */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Watchlist />
        </div>

        {/* 右：分析区 */}
        <div>
          {/* 操作栏 */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={run}
              disabled={loading || items.length === 0}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                loading || items.length === 0
                  ? 'bg-surface-hover text-text-muted cursor-not-allowed'
                  : 'bg-accent text-white hover:opacity-90'
              }`}
            >
              {loading ? '分析中…' : '开始分析'}
            </button>

            {reports.length > 0 && (
              <div className="flex items-center gap-1 bg-surface border border-border rounded-md p-0.5">
                {(['cards', 'table'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setView(mode)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      view === mode
                        ? 'bg-surface-hover text-accent'
                        : 'text-text-secondary hover:text-text'
                    }`}
                  >
                    {mode === 'cards' ? '卡片' : '表格'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <Banner type="error" message={`分析失败：${error}`} onAction={run} actionLabel="重试" />
          )}

          {/* 汇总信息 */}
          {result && !loading && (
            <div className="flex items-center gap-4 mb-3 text-sm text-text-secondary">
              <span>
                共 <strong className="text-text">{result.analyzed}</strong> 只
              </span>
              <span>
                成功 <strong className="text-down">{result.success}</strong>
              </span>
              {result.failed > 0 && (
                <span>
                  失败 <strong className="text-error">{result.failed}</strong>
                </span>
              )}
              <span className="text-text-muted">耗时 {result.elapsed}s</span>
            </div>
          )}

          {/* 空状态 */}
          {!result && !loading && !error && (
            <div className="bg-surface border border-border rounded-lg p-8 text-center">
              <p className="text-text-secondary m-0">
                点击「开始分析」获取关注标的的支撑位分析报告
              </p>
              {items.length === 0 && (
                <p className="text-sm text-text-muted mt-2 m-0">
                  请先在左侧添加关注的 ETF 或股票
                </p>
              )}
            </div>
          )}

          {/* Loading 占位 */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-surface border border-border rounded-lg p-4 h-48 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* 结果展示 */}
          {!loading && reports.length > 0 && (
            <>
              {view === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reports.map((r) => (
                    <AnalysisReportCard
                      key={r.code}
                      report={r}
                      fallbackName={nameMap.get(r.code)}
                    />
                  ))}
                </div>
              ) : (
                <AnalysisTable reports={reports} nameMap={nameMap} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
