import { BacktestTrade, MonthReview } from '../types';
import { INITIAL_BACKTEST_TRADES, INITIAL_MONTH_REVIEWS } from '../data/sampleData';

const KEYS = {
  BACKTEST_TRADES: 'alphajournal_backtest_trades_v2',
  MONTH_REVIEWS: 'alphajournal_month_reviews_v2',
  CURRENT_MONTH: 'alphajournal_current_month_v2',
};

// Clean legacy v1 storage if present
try {
  localStorage.removeItem('alphajournal_backtest_trades_v1');
  localStorage.removeItem('alphajournal_month_reviews_v1');
  localStorage.removeItem('alphajournal_prop_accounts_v1');
  localStorage.removeItem('alphajournal_prop_trades_v1');
  localStorage.removeItem('alphajournal_prop_payouts_v1');
} catch (e) {
  // Ignore
}

export function loadBacktestTrades(): BacktestTrade[] {
  try {
    const raw = localStorage.getItem(KEYS.BACKTEST_TRADES);
    if (!raw) return INITIAL_BACKTEST_TRADES;
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_BACKTEST_TRADES;
  }
}

export function saveBacktestTrades(trades: BacktestTrade[]): void {
  try {
    localStorage.setItem(KEYS.BACKTEST_TRADES, JSON.stringify(trades));
  } catch (e) {
    console.error('Failed to save backtest trades', e);
  }
}

export function loadMonthReviews(): MonthReview[] {
  try {
    const raw = localStorage.getItem(KEYS.MONTH_REVIEWS);
    if (!raw) return INITIAL_MONTH_REVIEWS;
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_MONTH_REVIEWS;
  }
}

export function saveMonthReviews(reviews: MonthReview[]): void {
  try {
    localStorage.setItem(KEYS.MONTH_REVIEWS, JSON.stringify(reviews));
  } catch (e) {
    console.error('Failed to save month reviews', e);
  }
}

export function loadCurrentBacktestMonth(): string {
  try {
    const raw = localStorage.getItem(KEYS.CURRENT_MONTH);
    return raw || '2020-01';
  } catch (e) {
    return '2020-01';
  }
}

export function saveCurrentBacktestMonth(monthKey: string): void {
  try {
    localStorage.setItem(KEYS.CURRENT_MONTH, monthKey);
  } catch (e) {
    console.error('Failed to save current month', e);
  }
}

export interface BackupData {
  version: string;
  exportedAt: string;
  currentBacktestMonth: string;
  backtestTrades: BacktestTrade[];
  monthReviews: MonthReview[];
}

export function exportAllDataAsJson(): void {
  const data: BackupData = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    currentBacktestMonth: loadCurrentBacktestMonth(),
    backtestTrades: loadBacktestTrades(),
    monthReviews: loadMonthReviews(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backtest-journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importAllDataFromJson(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr) as Partial<BackupData>;
    if (Array.isArray(parsed.backtestTrades)) saveBacktestTrades(parsed.backtestTrades);
    if (Array.isArray(parsed.monthReviews)) saveMonthReviews(parsed.monthReviews);
    if (parsed.currentBacktestMonth) saveCurrentBacktestMonth(parsed.currentBacktestMonth);
    return true;
  } catch (e) {
    console.error('Import failed', e);
    return false;
  }
}

export function exportBacktestToCsv(trades: BacktestTrade[]): void {
  const headers = [
    'ID', 'Date', 'Time', 'Symbol', 'Direction', 'Outcome',
    'Risk_R', 'Result_R', 'Planned_RR', 'Entry_Price', 'Stop_Loss', 'Take_Profit',
    'Setup', 'Timeframe', 'Session', 'Followed_Plan', 'Mistake', 'Notes'
  ];

  const rows = trades.map(t => [
    t.id,
    t.date,
    t.time,
    t.symbol,
    t.direction,
    t.outcome,
    t.riskR,
    t.resultR,
    t.plannedRR,
    t.entryPrice || '',
    t.stopLossPrice || '',
    t.takeProfitPrice || '',
    `"${(t.setup || '').replace(/"/g, '""')}"`,
    t.timeframe,
    t.session,
    t.followedPlan ? 'YES' : 'NO',
    `"${(t.mistakeTag || '').replace(/"/g, '""')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backtest-trades-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function resetToDefaults(): void {
  saveBacktestTrades([]);
  saveMonthReviews([]);
  saveCurrentBacktestMonth('2020-01');
}
