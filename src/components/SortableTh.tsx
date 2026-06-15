import type { SortKey, SortOrder } from '../types';

interface SortableThProps {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey | null;
  currentOrder: SortOrder;
  onSort: (key: SortKey) => void;
  align?: 'left' | 'right';
}

export function SortableTh({
  label,
  sortKey,
  currentKey,
  currentOrder,
  onSort,
  align = 'right',
}: SortableThProps) {
  const isActive = currentKey === sortKey;
  const arrow = !isActive
    ? ''
    : currentOrder === 'asc'
      ? ' ↑'
      : currentOrder === 'desc'
        ? ' ↓'
        : '';
  return (
    <th
      className={`px-2.5 py-2 ${align === 'left' ? 'text-left' : 'text-right'} border-b border-border whitespace-nowrap bg-surface-hover font-semibold text-text-secondary sticky top-0 cursor-pointer select-none hover:text-accent ${isActive ? 'text-accent' : ''}`}
      onClick={() => onSort(sortKey)}
    >
      {label}
      <span className="inline-block min-w-[12px]">{arrow}</span>
    </th>
  );
}
