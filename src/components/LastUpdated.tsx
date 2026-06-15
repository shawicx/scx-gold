interface LastUpdatedProps {
  lastUpdated: Date | null;
  isStale: boolean;
  loading: boolean;
}

export function LastUpdated({
  lastUpdated,
  isStale,
  loading,
}: LastUpdatedProps) {
  if (loading && !lastUpdated)
    return <span className="text-xs text-text-muted">加载中…</span>;
  if (!lastUpdated)
    return <span className="text-xs text-text-muted">未加载</span>;
  const time = lastUpdated.toLocaleTimeString('zh-CN', { hour12: false });
  return (
    <span className={`text-xs ${isStale ? 'text-warning' : 'text-text-muted'}`}>
      最后更新 {time}
      {isStale ? '（数据延迟）' : ''}
    </span>
  );
}
