export type TradeDirection = 'LONG' | 'SHORT';
export type TradeOutcome = 'WIN' | 'LOSS' | 'BE' | 'PARTIAL';
export type SessionName = 'London' | 'New York AM' | 'New York PM' | 'Asia' | 'Other';

export interface BacktestTrade {
  id: string;
  date: string; // YYYY-MM-DD (e.g. '2020-01-08')
  time: string; // HH:mm
  symbol: string; // 'ETHUSDT', 'ETHUSD', etc.
  direction: TradeDirection;
  
  // R-Multiple mechanics:
  // Risk is always 1.00R (fixed -1R on full stop loss)
  riskR: number; // default 1.0
  resultR: number; // e.g. -1.0, +2.5, +3.2, 0.0
  plannedRR: number; // e.g. 3.0
  outcome: TradeOutcome;

  // Technical parameters (optional or calculated)
  entryPrice?: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  exitPrice?: number;

  // Strategy & Context (custom entered by the user)
  setup: string;
  timeframe: string; // '1m', '3m', '5m', '15m', '1h', '4h', '1D'
  session: SessionName;
  followedPlan: boolean;
  mistakeTag?: string;
  
  // Media & Notes
  chartUrl?: string; // Image URL or Base64
  exitChartUrl?: string;
  notes?: string;
  tags?: string[];
  createdAt: number;
}

export interface MonthReview {
  monthKey: string; // '2020-01'
  isCompleted: boolean;
  completedAt?: string;
  summaryNotes?: string;
  targetR?: number;
}

export type ActiveTab = 'backtest' | 'heatmap' | 'analytics';
