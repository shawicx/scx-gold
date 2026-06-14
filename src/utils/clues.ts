import type { Clue, Stock } from '../types';

const THRESHOLDS = {
  mainInflowLarge: 1e8,
  mainInflowMedium: 5e7,
  limitSealed: 9.95,
  limitNear: 9.5,
  gapFromHigh: 0.99,
  highTurnover: 10,
  lowTurnover: 3,
  largeAmount: 5e8,
};

export function generateClues(stock: Stock): Clue[] {
  const clues: Clue[] = [];

  if (stock.mainNetInflow > THRESHOLDS.mainInflowLarge) {
    clues.push({ label: '主力大幅流入', type: 'fund' });
  } else if (stock.mainNetInflow > THRESHOLDS.mainInflowMedium) {
    clues.push({ label: '主力流入', type: 'fund' });
  } else if (stock.mainNetInflow < 0) {
    clues.push({ label: '主力流出', type: 'fund' });
  }

  if (stock.pctChange >= THRESHOLDS.limitSealed &&
      stock.high > 0 &&
      stock.price >= stock.high * 0.999) {
    clues.push({ label: '封涨停', type: 'limit' });
  } else if (stock.pctChange >= THRESHOLDS.limitNear &&
             stock.pctChange < THRESHOLDS.limitSealed) {
    clues.push({ label: '接近涨停', type: 'limit' });
  }

  if (stock.high > 0 && stock.price < stock.high * THRESHOLDS.gapFromHigh) {
    clues.push({ label: '炸板风险', type: 'limit' });
  }

  if (stock.turnoverRate > THRESHOLDS.highTurnover) {
    clues.push({ label: '放量', type: 'volume' });
  } else if (stock.turnoverRate > 0 && stock.turnoverRate < THRESHOLDS.lowTurnover) {
    clues.push({ label: '低换手', type: 'volume' });
  }

  if (stock.amount > THRESHOLDS.largeAmount) {
    clues.push({ label: '高成交', type: 'volume' });
  }

  return clues;
}
