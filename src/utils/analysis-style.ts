/**
 * @description 分析结果展示用的样式映射工具（趋势色、强度色、方向箭头）。
 */

/** 趋势标签 → Tailwind 色类 */
export function trendColorClass(trend: string): string {
  if (trend === '多头') return 'text-up';
  if (trend === '空头') return 'text-down';
  return 'text-text-secondary';
}

/** 强度标签 → Tailwind 色类 */
export function strengthColorClass(strength: string): string {
  if (strength === '强') return 'text-up';
  if (strength === '中') return 'text-warning';
  return 'text-text-muted';
}

/** 涨跌幅 → Tailwind 色类（红涨绿跌，与 StockCard 一致） */
export function changeColorClass(changePct: number | null): string {
  if (changePct === null) return 'text-text-muted';
  return changePct >= 0 ? 'text-up' : 'text-down';
}

/** 涨跌幅 → 带符号的展示文本 */
export function formatChange(changePct: number | null): string {
  if (changePct === null) return '--';
  return `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`;
}

/** 距离百分比 → 带符号的展示文本（支撑为负、压力为正） */
export function formatDistance(distancePct: number): string {
  return `${distancePct >= 0 ? '+' : ''}${distancePct.toFixed(2)}%`;
}
