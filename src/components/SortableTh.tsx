import type { SortKey, SortOrder } from '../types';

interface SortableThProps {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey | null;
  currentOrder: SortOrder;
  onSort: (key: SortKey) => void;
}

export function SortableTh({
  label,
  sortKey,
  currentKey,
  currentOrder,
  onSort,
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
      className={`sortable-th ${isActive ? 'sortable-th--active' : ''}`}
      onClick={() => onSort(sortKey)}
    >
      {label}
      <span className="sortable-th__arrow">{arrow}</span>
    </th>
  );
}
