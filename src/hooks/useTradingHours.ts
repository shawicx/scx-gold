import { useEffect, useState } from 'react';

export function isTradingTime(now: Date = new Date()): boolean {
  const day = now.getDay();
  if (day === 0 || day === 6) return false;

  const minutes = now.getHours() * 60 + now.getMinutes();
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
