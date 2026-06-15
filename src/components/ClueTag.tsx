import type { Clue } from '../types';

const TYPE_CLASS: Record<Clue['type'], string> = {
  fund: 'bg-[rgba(37,99,235,0.12)] text-accent',
  limit: 'bg-[rgba(239,68,68,0.12)] text-up',
  volume: 'bg-[rgba(245,158,11,0.15)] text-warning',
};

export function ClueTag({ clue }: { clue: Clue }) {
  return (
    <span
      className={`inline-block px-1.5 py-0.5 text-[13px] rounded-sm ${TYPE_CLASS[clue.type]}`}
    >
      {clue.label}
    </span>
  );
}
