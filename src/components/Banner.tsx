interface BannerProps {
  type: 'error' | 'warning';
  message: string;
  onAction?: () => void;
  actionLabel?: string;
}

export function Banner({ type, message, onAction, actionLabel }: BannerProps) {
  return (
    <div className={`banner banner--${type}`}>
      <span className="banner__msg">{message}</span>
      {onAction && actionLabel && (
        <button className="banner__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
