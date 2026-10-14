import React from 'react';
import { BacktestTrade } from '../types';
import { buildMonthlyMatrix, MONTH_NAMES_RU, YEARS_RANGE } from '../utils/analytics';
import { Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MonthlyHeatmapProps {
  trades: BacktestTrade[];
  onSelectMonth: (monthKey: string) => void;
  currentActiveMonth: string;
}

export const MonthlyHeatmap: React.FC<MonthlyHeatmapProps> = ({
  trades,
  onSelectMonth,
  currentActiveMonth,
}) => {
  const matrix = buildMonthlyMatrix(trades, 2020, 2026);

  // Helper for cell color
  const getCellBg = (r: number, count: number, isCurrent: boolean) => {
    if (count === 0) {
      return isCurrent
        ? 'bg-slate-800/80 border border-emerald-500/40 text-slate-500'
        : 'bg-slate-900/60 text-slate-700 hover:bg-slate-800/40';
    }
    if (r > 6) return 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold';
    if (r > 2) return 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 font-semibold';
    if (r > 0) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10';
    if (r === 0) return 'bg-slate-800 text-slate-300';
    if (r < -4) return 'bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold';
    return 'bg-rose-500/15 text-rose-400 border border-rose-500/20 font-semibold';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Матрица доходности по месяцам (2020 — 2026)</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Результаты в единицах риска (R) по годам. Нажмите на ячейку любого месяца, чтобы перейти к нему.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600/30 border border-emerald-500/40" />
            <span className="text-slate-400">Профит (+R)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/30" />
            <span className="text-slate-400">Убыток (-R)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-900 border border-slate-800" />
            <span className="text-slate-500">Нет сделок</span>
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-left">
              <th className="py-2.5 px-3 font-semibold w-16">Год</th>
              {MONTH_NAMES_RU.map((m) => (
                <th key={m} className="py-2.5 px-2 text-center font-medium text-slate-400">
                  {m.slice(0, 3)}
                </th>
              ))}
              <th className="py-2.5 px-3 text-right font-semibold text-slate-200">Итог Года</th>
              <th className="py-2.5 px-3 text-right font-semibold text-slate-200">Винрейт</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {YEARS_RANGE.map((year) => {
              const yearData = matrix[year];
              let yearTotalR = 0;
              let yearWins = 0;
              let yearLosses = 0;
              let yearTrades = 0;

              for (let m = 1; m <= 12; m++) {
                const cell = yearData[m];
                yearTotalR += cell.totalR;
                yearWins += cell.winCount;
                yearLosses += cell.lossCount;
                yearTrades += cell.tradesCount;
              }

              const yearDecisive = yearWins + yearLosses;
              const yearWR = yearDecisive > 0 ? ((yearWins / yearDecisive) * 100).toFixed(0) : '—';

              return (
                <tr key={year} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-3 font-bold text-white text-left">
                    {year}
                  </td>

                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const cell = yearData[m];
                    const isCurrent = cell.monthKey === currentActiveMonth;
                    const bgClass = getCellBg(cell.totalR, cell.tradesCount, isCurrent);

                    return (
                      <td key={m} className="p-1 text-center">
                        <button
                          onClick={() => onSelectMonth(cell.monthKey)}
                          className={`w-full py-2 px-1 rounded-md text-[11px] tabular-nums transition-all flex flex-col items-center justify-center cursor-pointer ${bgClass}`}
                          title={`${MONTH_NAMES_RU[m - 1]} ${year}: ${
                            cell.tradesCount > 0
                              ? `${cell.totalR > 0 ? '+' : ''}${cell.totalR}R (${cell.tradesCount} сдел., WR ${cell.winRate}%)`
                              : 'Нет данных'
                          }`}
                        >
                          {cell.tradesCount > 0 ? (
                            <>
                              <span className="font-semibold">
                                {cell.totalR > 0 ? `+${cell.totalR.toFixed(1)}` : cell.totalR.toFixed(1)}
                              </span>
                              <span className="text-[9px] text-slate-400 opacity-75">
                                {cell.tradesCount}с
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-700 font-normal">—</span>
                          )}
                        </button>
                      </td>
                    );
                  })}

                  {/* Year Total R */}
                  <td className="py-2 px-3 text-right tabular-nums">
                    {yearTrades > 0 ? (
                      <span
                        className={`font-bold inline-flex items-center gap-0.5 ${
                          yearTotalR > 0
                            ? 'text-emerald-400'
                            : yearTotalR < 0
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {yearTotalR > 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
                        {yearTotalR < 0 && <ArrowDownRight className="w-3.5 h-3.5" />}
                        {yearTotalR > 0 ? `+${yearTotalR.toFixed(1)} R` : `${yearTotalR.toFixed(1)} R`}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Year WR */}
                  <td className="py-2 px-3 text-right text-slate-300 tabular-nums">
                    {yearTrades > 0 ? `${yearWR}%` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
