import type { Clue, Stock } from '../types';

/**
 * @description 根据股票代码与是否 ST 推断其涨跌停幅度（%）。
 *
 * 规则：
 * - 300/301/302（创业板）、688/689（科创板）→ 20%
 * - 4xx / 8xx / 920（北交所）→ 30%
 * - 主板 ST（60x/00x 且 isST）→ 5%
 * - 其余（沪主板 60x、深主板 00x）→ 10%
 *
 * @param code 股票代码。
 * @param isST 是否 ST 股票。
 * @returns 涨跌停幅度（%）。
 *
 * @example
 * getBoardLimit('300750'); // 20
 * getBoardLimit('600000'); // 10
 * getBoardLimit('600000', true); // 5（主板 ST）
 * getBoardLimit('830001'); // 30（北交所）
 */
export function getBoardLimit(code: string, isST = false): number {
  if (/^(300|301|302|688|689)/.test(code)) return 20;
  if (/^(4|8|92)/.test(code)) return 30;
  if (isST) return 5;
  return 10;
}

const THRESHOLDS = {
  mainInflowLarge: 1e8,
  mainInflowMedium: 5e7,
  /** 接近涨停的下沿距涨跌停幅度的距离（%） */
  limitNearGap: 0.5,
  /** 封涨停的判定容差：涨幅达到 涨跌停幅度 - 0.05 视为封板 */
  limitSealedGap: 0.05,
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

  // 涨跌停线索按板块涨跌停幅度拆分（主板 10% / 创业板·科创板 20% / 北交所 30% / 主板 ST 5%）
  const limit = getBoardLimit(stock.code, stock.isST);
  const sealed = limit - THRESHOLDS.limitSealedGap;
  const near = limit - THRESHOLDS.limitNearGap;

  if (
    stock.pctChange >= sealed &&
    stock.high > 0 &&
    stock.price >= stock.high * 0.999
  ) {
    clues.push({ label: '封涨停', type: 'limit' });
  } else if (stock.pctChange >= near && stock.pctChange < sealed) {
    clues.push({ label: '接近涨停', type: 'limit' });
  }

  if (stock.high > 0 && stock.price < stock.high * THRESHOLDS.gapFromHigh) {
    clues.push({ label: '炸板风险', type: 'limit' });
  }

  if (stock.turnoverRate > THRESHOLDS.highTurnover) {
    clues.push({ label: '放量', type: 'volume' });
  } else if (
    stock.turnoverRate > 0 &&
    stock.turnoverRate < THRESHOLDS.lowTurnover
  ) {
    clues.push({ label: '低换手', type: 'volume' });
  }

  if (stock.amount > THRESHOLDS.largeAmount) {
    clues.push({ label: '高成交', type: 'volume' });
  }

  return clues;
}
