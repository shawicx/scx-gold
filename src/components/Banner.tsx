import { useRef } from 'react';
import { useBannerSlide } from '../hooks/animations/useBannerSlide';

interface BannerProps {
  type: 'error' | 'warning';
  message: string;
  onAction?: () => void;
  actionLabel?: string;
}

const TYPE_CLASS: Record<BannerProps['type'], string> = {
  error: 'bg-[rgba(239,68,68,0.1)] text-error border-error',
  warning: 'bg-[rgba(245,158,11,0.1)] text-warning border-warning',
};

export function Banner({ type, message, onAction, actionLabel }: BannerProps) {
  const ref = useRef<HTMLDivElement>(null);
  useBannerSlide(ref);

  return (
    <div
      ref={ref}
      className={`flex items-center justify-between px-3 py-2 rounded-md mb-3 text-[15px] border ${TYPE_CLASS[type]}`}
    >
      <span>{message}</span>
      {onAction && actionLabel && (
        <button
          className="bg-transparent border border-current text-current px-2.5 py-1 rounded text-xs"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
