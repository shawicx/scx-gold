/**
 * @description 历史分析报告抽屉（右侧滑出），展示某标的的历史分析时间线。
 *
 * 打开时从后端拉取最近 30 条历史报告，以时间线样式展示。
 * 支持 loading / error / empty 三态。
 */

import { useEffect, useState } from 'react';
import { AnalysisHistoryItem } from './AnalysisHistoryItem';
import { getApiV1AnalysisHistoryFunc } from '@/service';
import { ApiError } from '@/service/request';
import type { AnalysisReport } from '@/service/types';

interface HistoryDrawerProps {
  /** 是否打开 */
  open: boolean;
  /** 当前查看的标的代码（null 时关闭） */
  code: string | null;
  /** 标的名称（用于标题展示） */
  name: string;
  /** 关闭回调 */
  onClose: () => void;
}

export function HistoryDrawer({
  open,
  code,
  name,
  onClose,
}: HistoryDrawerProps) {
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // open + code 变化时拉取历史数据
  useEffect(() => {
    if (!open || !code) {
      setReports([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await getApiV1AnalysisHistoryFunc(code, 30);
        if (!cancelled) {
          setReports(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof ApiError
              ? e.message
              : e instanceof Error
                ? e.message
                : '加载历史失败',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, code]);

  // ESC 键关闭
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* 半透明遮罩层 */}
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* 抽屉面板 */}
      <div
        className="fixed top-0 right-0 z-50 h-full w-full sm:w-96 bg-bg border-l border-border shadow-2xl flex flex-col"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold m-0 truncate">
              {name || code} 历史分析
            </h2>
            {code && (
              <span className="text-xs text-text-muted">{code}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text shrink-0 ml-3"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* 内容区（滚动） */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 bg-surface rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-error m-0 mb-3">{error}</p>
              <button
                onClick={() => {
                  if (code) {
                    // 触发重新加载：通过改变 open 状态
                    onClose();
                  }
                }}
                className="text-sm text-accent hover:underline"
              >
                关闭
              </button>
            </div>
          )}

          {!loading && !error && reports.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-text-muted m-0">暂无历史分析记录</p>
              <p className="text-xs text-text-muted mt-1 m-0">
                点击「开始分析」后结果会自动保存
              </p>
            </div>
          )}

          {!loading && !error && reports.length > 0 && (
            <div>
              {reports.map((r, idx) => (
                <AnalysisHistoryItem key={`${r.code}-${r.trade_date}-${idx}`} report={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
