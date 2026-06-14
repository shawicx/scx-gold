export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return '--';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e8) return `${sign}${(abs / 1e8).toFixed(2)}亿`;
  if (abs >= 1e4) return `${sign}${(abs / 1e4).toFixed(2)}万`;
  return `${value}`;
}

export function formatAmount(value: number): string {
  return formatMoney(value);
}

export function formatPct(value: number): string {
  if (!Number.isFinite(value)) return '--';
  return `${value.toFixed(2)}%`;
}

export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '--';
  return value.toFixed(2);
}
