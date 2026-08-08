import { useEffect, useState } from 'react';

// Asia/Shanghai 时区（东八区）的星期与分钟数。
// 交易时段始终以北京时间为准，不能用宿主本地时区，否则在非 +08:00 的
// CI 环境下（如 UTC）会判定错误。
const shanghaiFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Shanghai',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function getShanghaiParts(now: Date): { weekday: string; minutes: number } {
  const parts = shanghaiFormatter.formatToParts(now);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  // Intl 在 hour12:false 下仍可能输出 "24"，归一化为 0。
  const hour = Number(map.hour) % 24;
  const minute = Number(map.minute);
  return { weekday: map.weekday, minutes: hour * 60 + minute };
}

export function isTradingTime(now: Date = new Date()): boolean {
  const { weekday, minutes } = getShanghaiParts(now);
  if (weekday === 'Sat' || weekday === 'Sun') return false;

  const morningStart = 9 * 60 + 15;
  const morningEnd = 11 * 60 + 30;
  const afternoonStart = 13 * 60;
  const afternoonEnd = 15 * 60 + 30;

  return (
    (minutes >= morningStart && minutes <= morningEnd) ||
    (minutes >= afternoonStart && minutes <= afternoonEnd)
  );
}

export function useTradingHours(intervalMs = 60_000): boolean {
  const [trading, setTrading] = useState(() => isTradingTime());

  useEffect(() => {
    const id = window.setInterval(() => {
      setTrading(isTradingTime());
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return trading;
}
