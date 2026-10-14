import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, ArrowRight, CalendarDays, Filter } from 'lucide-react';
import { formatMonthName, getNextMonthKey, getPrevMonthKey, MONTH_NAMES_RU, YEARS_RANGE } from '../utils/analytics';
import { BacktestTrade, MonthReview } from '../types';

interface BacktestMonthBarProps {
  currentMonthKey: string;
  onSelectMonth: (monthKey: string) => void;
  onOpenMonthCompletion: () => void;
  allTrades: BacktestTrade[];
  monthReviews: MonthReview[];
  onlyCurrentMonth: boolean;
  setOnlyCurrentMonth: (val: boolean) => void;
}

export const BacktestMonthBar: React.FC<BacktestMonthBarProps> = ({
  currentMonthKey,
  onSelectMonth,
  onOpenMonthCompletion,
  allTrades,
  monthReviews,
  onlyCurrentMonth,
  setOnlyCurrentMonth,
}) => {
  const [selectedYearStr, selectedMonthNumStr] = currentMonthKey.split('-');
  const currentYear = parseInt(selectedYearStr, 10);
  const currentMonthNum = parseInt(selectedMonthNumStr, 10);

  const nextMonthKey = getNextMonthKey(currentMonthKey);
  const prevMonthKey = getPrevMonthKey(currentMonthKey);

  // Month review status
  const currentReview = monthReviews.find(r => r.monthKey === currentMonthKey);
  const isMonthCompleted = !!currentReview?.isCompleted;

  // Filter trades for this specific month
  const monthTrades = allTrades.filter(t => t.date.startsWith(currentMonthKey));
  const monthTotalR = monthTrades.reduce((acc, t) => acc + t.resultR, 0);
  const monthWins = monthTrades.filter(t => t.resultR > 0).length;
  const monthLosses = monthTrades.filter(t => t.resultR < 0).length;
  const monthDecisive = monthWins + monthLosses;
  const monthWR = monthDecisive > 0 ? ((monthWins / monthDecisive) * 100).toFixed(0) : '0';

  // Overall backtest timeline calculation (2020 to 2026 = 84 months)
  const totalMonths = YEARS_RANGE.length * 12; // 7 * 12 = 84
  const monthIndex = (currentYear - 2020) * 12 + currentMonthNum;
  const progressPercent = Math.min(100, Math.max(1, (monthIndex / totalMonths) * 100));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 mb-6 shadow-sm">
      {/* Upper row: Active month title, Next Month button, and quick jump */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/60 rounded-lg p-1">
            <button
              onClick={() => onSelectMonth(prevMonthKey)}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors"
              title="Предыдущий месяц"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 text-sm font-bold text-white font-mono flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <span>{formatMonthName(currentMonthKey)}</span>
            </div>
            <button
              onClick={() => onSelectMonth(nextMonthKey)}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors"
              title="Следующий месяц"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month Stats Summary */}
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-800/40 border border-slate-800 rounded-lg px-3 py-1.5">
            <span className="text-slate-400">Итог месяца:</span>
            <span className={`font-semibold tabular-nums ${monthTotalR > 0 ? 'text-emerald-400' : monthTotalR < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {monthTotalR > 0 ? `+${monthTotalR.toFixed(1)}R` : `${monthTotalR.toFixed(1)}R`}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300">{monthTrades.length} сдел.</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300">WR: {monthWR}%</span>
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setOnlyCurrentMonth(!onlyCurrentMonth)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
              onlyCurrentMonth
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{onlyCurrentMonth ? 'Фильтр: Текущий месяц' : 'Все месяцы'}</span>
          </button>
        </div>

        {/* Transition Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenMonthCompletion}
            className={`text-xs font-medium px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${
              isMonthCompleted
                ? 'bg-slate-800 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800/90 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isMonthCompleted ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{isMonthCompleted ? 'Месяц закрыт (Итоги)' : 'Завершить месяц'}</span>
          </button>

          <button
            onClick={() => {
              onSelectMonth(nextMonthKey);
            }}
            className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm"
          >
            <span>В следующий месяц ({formatMonthName(nextMonthKey)})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Timeline Progress Bar (2020 -> 2026) */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
          <span className="flex items-center gap-1.5">
            <span className="text-slate-300 font-semibold">Хронология бэктеста:</span>
            <span>Месяц {monthIndex} из {totalMonths} ({progressPercent.toFixed(0)}%)</span>
          </span>
          <span>Старт: 01.01.2020 → Финиш: 31.12.2026</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Lower row: Year selector and Month tabs */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Years */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-500 mr-1 shrink-0">Год:</span>
          {YEARS_RANGE.map(year => (
            <button
              key={year}
              onClick={() => {
                const mm = currentMonthNum < 10 ? `0${currentMonthNum}` : `${currentMonthNum}`;
                onSelectMonth(`${year}-${mm}`);
              }}
              className={`text-xs px-2.5 py-1 rounded-md font-mono transition-colors shrink-0 ${
                currentYear === year
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {year}
            </button>
          ))}
        </div>

        {/* Months in current year */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {MONTH_NAMES_RU.map((name, idx) => {
            const mNum = idx + 1;
            const mm = mNum < 10 ? `0${mNum}` : `${mNum}`;
            const key = `${currentYear}-${mm}`;
            const isSelected = key === currentMonthKey;
            
            // Check if there are trades in this month
            const count = allTrades.filter(t => t.date.startsWith(key)).length;

            return (
              <button
                key={key}
                onClick={() => onSelectMonth(key)}
                className={`text-xs px-2 py-1 rounded-md font-medium transition-colors shrink-0 relative ${
                  isSelected
                    ? 'bg-slate-800 text-emerald-400 font-bold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title={`${name} ${currentYear}: ${count} сделок`}
              >
                <span>{name.slice(0, 3)}</span>
                {count > 0 && (
                  <span
                    className={`ml-1 text-[10px] tabular-nums font-mono ${
                      isSelected ? 'text-emerald-300' : 'text-slate-500'
                    }`}
                  >
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
