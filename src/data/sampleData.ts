import { BacktestTrade, MonthReview } from '../types';

// Zero trades - Start fresh from scratch
export const INITIAL_BACKTEST_TRADES: BacktestTrade[] = [];

// Zero initial month reviews
export const INITIAL_MONTH_REVIEWS: MonthReview[] = [];

export const TIMEFRAMES = ['1m', '3m', '5m', '15m', '1h', '4h', '1D'];

export const SESSIONS: Array<{ id: string; label: string }> = [
  { id: 'London', label: 'Лондон (London)' },
  { id: 'New York AM', label: 'Нью-Йорк AM (NY Open)' },
  { id: 'New York PM', label: 'Нью-Йорк PM (NY Close)' },
  { id: 'Asia', label: 'Азия (Asia)' },
  { id: 'Other', label: 'Другая сессия' }
];

export const MISTAKE_TAGS = [
  'None',
  'FOMO / Поспешил',
  'Ранний выход из сделки',
  'Вход против старшего тренда',
  'Пересиживание / Перенос стопа',
  'Вход вне торговой сессии',
  'Завышенный риск / Ошибка расчета'
];
