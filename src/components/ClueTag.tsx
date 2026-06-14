import type { Clue } from '../types';

const TYPE_CLASS: Record<Clue['type'], string> = {
  fund: 'clue-tag--fund',
  limit: 'clue-tag--limit',
  volume: 'clue-tag--volume',
};

export function ClueTag({ clue }: { clue: Clue }) {
  return (
    <span className={`clue-tag ${TYPE_CLASS[clue.type]}`}>{clue.label}</span>
  );
}
