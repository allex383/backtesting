import { BacktestTrade } from '../types';

export const MONTH_NAMES_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export const YEARS_RANGE = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

export function formatMonthName(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  return `${MONTH_NAMES_RU[monthIdx] || monthStr} ${yearStr}`;
}

export function getNextMonthKey(currentKey: string): string {
  const [yearStr, monthStr] = currentKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);

  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }

  const mm = month < 10 ? `0${month}` : `${month}`;
  return `${year}-${mm}`;
}

export function getPrevMonthKey(currentKey: string): string {
  const [yearStr, monthStr] = currentKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);

  month -= 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }

  const mm = month < 10 ? `0${month}` : `${month}`;
  return `${year}-${mm}`;
}

export interface BacktestStats {
  totalTrades: number;
  winCount: number;
  lossCount: number;
  beCount: number;
  partialCount: number;
  winRate: number; // 0 - 100
  totalR: number; // sum of resultR
  grossWinR: number;
  grossLossR: number;
  profitFactor: number;
  avgWinR: number;
  avgLossR: number;
  expectancyR: number;
  maxDrawdownR: number;
  bestTradeR: number;
  worstTradeR: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  ruleAdherenceRate: number; // % followed plan
}

export function calculateBacktestStats(trades: BacktestTrade[]): BacktestStats {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winCount: 0,
      lossCount: 0,
      beCount: 0,
      partialCount: 0,
      winRate: 0,
      totalR: 0,
      grossWinR: 0,
      grossLossR: 0,
      profitFactor: 0,
      avgWinR: 0,
      avgLossR: 0,
      expectancyR: 0,
      maxDrawdownR: 0,
      bestTradeR: 0,
      worstTradeR: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      ruleAdherenceRate: 100,
    };
  }

  let winCount = 0;
  let lossCount = 0;
  let beCount = 0;
  let partialCount = 0;
  let totalR = 0;
  let grossWinR = 0;
  let grossLossR = 0;
  let bestTradeR = -Infinity;
  let worstTradeR = Infinity;
  let followedPlanCount = 0;

  // Streak tracking
  let currentWins = 0;
  let maxWins = 0;
  let currentLosses = 0;
  let maxLosses = 0;

  // Drawdown tracking
  let peakR = 0;
  let cumulative = 0;
  let maxDd = 0;

  // Sort chronologically for streak & drawdown
  const sorted = [...trades].sort((a, b) => {
    const da = `${a.date} ${a.time || '00:00'}`;
    const db = `${b.date} ${b.time || '00:00'}`;
    return da.localeCompare(db);
  });

  sorted.forEach(t => {
    const r = t.resultR;
    totalR += r;
    cumulative += r;

    if (cumulative > peakR) {
      peakR = cumulative;
    }
    const currentDd = peakR - cumulative;
    if (currentDd > maxDd) {
      maxDd = currentDd;
    }

    if (r > bestTradeR) bestTradeR = r;
    if (r < worstTradeR) worstTradeR = r;

    if (t.followedPlan) followedPlanCount++;

    if (r > 0) {
      winCount++;
      grossWinR += r;
      currentWins++;
      currentLosses = 0;
      if (currentWins > maxWins) maxWins = currentWins;
    } else if (r < 0) {
      lossCount++;
      grossLossR += Math.abs(r);
      currentLosses++;
      currentWins = 0;
      if (currentLosses > maxLosses) maxLosses = currentLosses;
    } else {
      beCount++;
      currentWins = 0;
      currentLosses = 0;
    }

    if (t.outcome === 'PARTIAL') partialCount++;
  });

  const totalTrades = trades.length;
  // Win rate excluding pure BE or including BE as non-win
  const decisiveTrades = winCount + lossCount;
  const winRate = decisiveTrades > 0 ? (winCount / decisiveTrades) * 100 : 0;
  const profitFactor = grossLossR > 0 ? grossWinR / grossLossR : grossWinR > 0 ? 99.9 : 0;
  const avgWinR = winCount > 0 ? grossWinR / winCount : 0;
  const avgLossR = lossCount > 0 ? grossLossR / lossCount : 0;
  const expectancyR = totalTrades > 0 ? totalR / totalTrades : 0;
  const ruleAdherenceRate = totalTrades > 0 ? (followedPlanCount / totalTrades) * 100 : 100;

  return {
    totalTrades,
    winCount,
    lossCount,
    beCount,
    partialCount,
    winRate: Number(winRate.toFixed(1)),
    totalR: Number(totalR.toFixed(2)),
    grossWinR: Number(grossWinR.toFixed(2)),
    grossLossR: Number(grossLossR.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    avgWinR: Number(avgWinR.toFixed(2)),
    avgLossR: Number(avgLossR.toFixed(2)),
    expectancyR: Number(expectancyR.toFixed(2)),
    maxDrawdownR: Number(maxDd.toFixed(2)),
    bestTradeR: bestTradeR === -Infinity ? 0 : Number(bestTradeR.toFixed(2)),
    worstTradeR: worstTradeR === Infinity ? 0 : Number(worstTradeR.toFixed(2)),
    consecutiveWins: maxWins,
    consecutiveLosses: maxLosses,
    ruleAdherenceRate: Number(ruleAdherenceRate.toFixed(1)),
  };
}

export interface MonthlyCellData {
  year: number;
  month: number; // 1-12
  monthKey: string; // '2020-01'
  totalR: number;
  tradesCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  isCompleted?: boolean;
}

export function buildMonthlyMatrix(
  trades: BacktestTrade[],
  startYear = 2020,
  endYear = 2026
): Record<number, Record<number, MonthlyCellData>> {
  const matrix: Record<number, Record<number, MonthlyCellData>> = {};

  for (let y = startYear; y <= endYear; y++) {
    matrix[y] = {};
    for (let m = 1; m <= 12; m++) {
      const mm = m < 10 ? `0${m}` : `${m}`;
      matrix[y][m] = {
        year: y,
        month: m,
        monthKey: `${y}-${mm}`,
        totalR: 0,
        tradesCount: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
      };
    }
  }

  trades.forEach(t => {
    if (!t.date) return;
    const [yStr, mStr] = t.date.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);

    if (matrix[y] && matrix[y][m]) {
      const cell = matrix[y][m];
      cell.tradesCount += 1;
      cell.totalR += t.resultR;
      if (t.resultR > 0) cell.winCount += 1;
      else if (t.resultR < 0) cell.lossCount += 1;
    }
  });

  // Calculate winrates & round
  for (let y = startYear; y <= endYear; y++) {
    for (let m = 1; m <= 12; m++) {
      const cell = matrix[y][m];
      cell.totalR = Number(cell.totalR.toFixed(2));
      const decisive = cell.winCount + cell.lossCount;
      cell.winRate = decisive > 0 ? Number(((cell.winCount / decisive) * 100).toFixed(0)) : 0;
    }
  }

  return matrix;
}

export interface SetupStat {
  setup: string;
  tradesCount: number;
  winCount: number;
  lossCount: number;
  totalR: number;
  winRate: number;
  avgR: number;
}

export function calculateSetupStats(trades: BacktestTrade[]): SetupStat[] {
  const map = new Map<string, { count: number; wins: number; losses: number; r: number }>();

  trades.forEach(t => {
    const s = t.setup || 'Без названия';
    if (!map.has(s)) {
      map.set(s, { count: 0, wins: 0, losses: 0, r: 0 });
    }
    const item = map.get(s)!;
    item.count += 1;
    item.r += t.resultR;
    if (t.resultR > 0) item.wins += 1;
    else if (t.resultR < 0) item.losses += 1;
  });

  const res: SetupStat[] = [];
  map.forEach((val, setup) => {
    const decisive = val.wins + val.losses;
    const winRate = decisive > 0 ? (val.wins / decisive) * 100 : 0;
    res.push({
      setup,
      tradesCount: val.count,
      winCount: val.wins,
      lossCount: val.losses,
      totalR: Number(val.r.toFixed(2)),
      winRate: Number(winRate.toFixed(1)),
      avgR: Number((val.r / val.count).toFixed(2)),
    });
  });

  return res.sort((a, b) => b.totalR - a.totalR);
}

export interface EquityPoint {
  index: number;
  date: string;
  tradeId: string;
  changeR: number;
  cumulativeR: number;
  symbol: string;
}

export function buildEquityCurve(trades: BacktestTrade[]): EquityPoint[] {
  const sorted = [...trades].sort((a, b) => {
    const da = `${a.date} ${a.time || '00:00'}`;
    const db = `${b.date} ${b.time || '00:00'}`;
    return da.localeCompare(db);
  });

  let runningR = 0;
  const points: EquityPoint[] = [
    {
      index: 0,
      date: sorted[0]?.date || 'Начало',
      tradeId: 'start',
      changeR: 0,
      cumulativeR: 0,
      symbol: 'INIT',
    }
  ];

  sorted.forEach((t, i) => {
    runningR += t.resultR;
    points.push({
      index: i + 1,
      date: t.date,
      tradeId: t.id,
      changeR: t.resultR,
      cumulativeR: Number(runningR.toFixed(2)),
      symbol: t.symbol,
    });
  });

  return points;
}
