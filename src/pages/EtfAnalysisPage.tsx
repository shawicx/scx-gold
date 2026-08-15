/**
 * @description ETF、个股分析页面。
 *
 * 布局：左右分栏（大屏，左侧宽度可拖拽调整）/ 上下堆叠（小屏）
 *   - 左/上：关注列表（搜索 + 管理）
 *   - 右/下：开始分析按钮 + 结果展示（卡片网格 + 汇总表格 Tab 切换）
 *
 * 页面加载时默认从 DB 读取关注标的各自最后一次分析报告（不触发重算），
 * 点击「开始分析」才强制重算。
 */

import { useEffect, useState, type CSSProperties } from 'react';

import { AnalysisReportCard } from '@/components/AnalysisReportCard';
import { AnalysisTable } from '@/components/AnalysisTable';
import { Banner } from '@/components/Banner';
import { HistoryDrawer } from '@/components/HistoryDrawer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Watchlist } from '@/components/Watchlist';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useResizableWidth } from '@/hooks/useResizableWidth';
import { useWatchlist } from '@/context/WatchlistContext';
import { getApiV1AnalysisLatestFunc } from '@/service';
import type { AnalysisReport } from '@/service/types';

type ViewMode = 'cards' | 'table';

/** 左侧关注列表默认/最小/最大宽度（px），拖拽把手在此区间内调整 */
const SIDEBAR_DEFAULT_WIDTH = 320;
const SIDEBAR_MIN_WIDTH = 240;
const SIDEBAR_MAX_WIDTH = 560;

export function EtfAnalysisPage() {
  const { items, loading: watchlistLoading } = useWatchlist();
  const codes = items.map((it) => it.code);
  const analysis = useAnalysis(codes);
  const [view, setView] = useState<ViewMode>('cards');

  // 从 DB 加载的最新报告（页面初始化展示，不触发重算）
  const [cachedReports, setCachedReports] = useState<AnalysisReport[] | null>(null);
  // 最新报告拉取中（用于首屏骨架占位，避免闪现空状态）
  const [cachedLoading, setCachedLoading] = useState(false);

  const { result, loading, error, run } = analysis;

  // codes 每次渲染都是新数组引用，用 join 后的字符串作为 effect 依赖避免无限循环
  const codesKey = codes.join(',');

  // 左侧关注列表宽度：可拖拽调整，持久化到 localStorage
  const {
    width: sidebarWidth,
    isResizing,
    handleProps,
  } = useResizableWidth({
    storageKey: 'scx-gold.etf-sidebar-width',
    defaultWidth: SIDEBAR_DEFAULT_WIDTH,
    minWidth: SIDEBAR_MIN_WIDTH,
    maxWidth: SIDEBAR_MAX_WIDTH,
  });

  // 关注列表加载完成后，从 DB 读取每只标的最后一次的分析报告
  useEffect(() => {
    if (watchlistLoading || codes.length === 0) {
      setCachedReports(null);
      setCachedLoading(false);
      return;
    }
    let cancelled = false;
    setCachedLoading(true);
    (async () => {
      try {
        const reports = await getApiV1AnalysisLatestFunc(codesKey);
        if (!cancelled) setCachedReports(reports);
      } catch {
        if (!cancelled) setCachedReports(null);
      } finally {
        if (!cancelled) setCachedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codesKey, watchlistLoading]);

  // 分析结果优先用刚触发的 result，无则用 DB 缓存
  const reports = result?.reports ?? cachedReports ?? [];
  const nameMap = new Map(items.map((it) => [it.code, it.name]));

  // 历史 Drawer 状态
  const [historyCode, setHistoryCode] = useState<string | null>(null);
  const historyName = historyCode
    ? reports.find((r) => r.code === historyCode)?.name ||
      nameMap.get(historyCode) ||
      historyCode
    : '';

  return (
    <div className="max-w-[2560px] mx-auto px-5 pt-4 pb-10">
      {/* 页头 */}
      <header className="flex justify-between items-center pb-3 mb-4 border-b border-border">
        <h1 className="text-lg font-semibold m-0">ETF、个股分析</h1>
        <ThemeToggle />
      </header>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-0">
        {/* 左：关注列表（宽度通过 CSS 变量控制，可拖拽调整） */}
        <div
          className="w-full lg:w-[var(--etf-sidebar-w)] lg:shrink-0 lg:sticky lg:top-4 lg:self-start"
          style={{ '--etf-sidebar-w': `${sidebarWidth}px` } as CSSProperties}
        >
          <Watchlist />
        </div>

        {/* 拖拽把手：仅大屏显示，双击恢复默认宽度 */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="拖拽调整关注列表宽度（双击恢复默认）"
          title="拖拽调整宽度，双击恢复默认"
          tabIndex={0}
          {...handleProps}
          className={`hidden lg:flex items-center justify-center w-6 shrink-0 cursor-col-resize touch-none select-none group ${
            isResizing ? 'text-accent' : 'text-border hover:text-text-muted'
          }`}
        >
          <span className="w-1 h-12 rounded-full bg-current transition-colors" />
        </div>

        {/* 右：分析区 */}
        <div className="flex-1 min-w-0">
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
          {reports.length === 0 && !loading && !cachedLoading && !error && (
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

          {/* Loading 占位（手动分析或默认拉取最新报告时） */}
          {(loading || cachedLoading) && (
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
                      onHistory={setHistoryCode}
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

      {/* 历史分析 Drawer */}
      <HistoryDrawer
        open={historyCode !== null}
        code={historyCode}
        name={historyName}
        onClose={() => setHistoryCode(null)}
      />
    </div>
  );
}
