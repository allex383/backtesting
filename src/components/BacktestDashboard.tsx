import React, { useState, useMemo } from 'react';
import { BacktestTrade, MonthReview } from '../types';
import { calculateBacktestStats, buildEquityCurve } from '../utils/analytics';
import { BacktestMonthBar } from './BacktestMonthBar';
import { EquityChart } from './EquityChart';
import {
  TrendingUp,
  Percent,
  Award,
  Zap,
  ShieldAlert,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { exportBacktestToCsv } from '../utils/storage';

interface BacktestDashboardProps {
  trades: BacktestTrade[];
  monthReviews: MonthReview[];
  currentMonthKey: string;
  onSelectMonth: (monthKey: string) => void;
  onOpenMonthCompletion: () => void;
  onEditTrade: (trade: BacktestTrade) => void;
  onDeleteTrade: (tradeId: string) => void;
  onViewTrade: (trade: BacktestTrade) => void;
  onNewTrade: () => void;
}

export const BacktestDashboard: React.FC<BacktestDashboardProps> = ({
  trades,
  monthReviews,
  currentMonthKey,
  onSelectMonth,
  onOpenMonthCompletion,
  onEditTrade,
  onDeleteTrade,
  onViewTrade,
  onNewTrade,
}) => {
  const [onlyCurrentMonth, setOnlyCurrentMonth] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'BE'>('ALL');
  const [showEquityCurve, setShowEquityCurve] = useState(true);

  // Filter trades based on Month and controls
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (onlyCurrentMonth && !t.date.startsWith(currentMonthKey)) {
        return false;
      }
      if (directionFilter !== 'ALL' && t.direction !== directionFilter) {
        return false;
      }
      if (outcomeFilter !== 'ALL' && t.outcome !== outcomeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSymbol = t.symbol.toLowerCase().includes(q);
        const matchSetup = t.setup.toLowerCase().includes(q);
        const matchNotes = (t.notes || '').toLowerCase().includes(q);
        if (!matchSymbol && !matchSetup && !matchNotes) return false;
      }
      return true;
    });
  }, [trades, onlyCurrentMonth, currentMonthKey, directionFilter, outcomeFilter, searchQuery]);

  // Compute stats on the displayed slice or total
  const stats = useMemo(() => {
    return calculateBacktestStats(filteredTrades);
  }, [filteredTrades]);

  // Equity data for chart (uses chronological order)
  const equityData = useMemo(() => {
    return buildEquityCurve(filteredTrades);
  }, [filteredTrades]);

  // Sort trades table descending by date and time
  const sortedTableTrades = useMemo(() => {
    return [...filteredTrades].sort((a, b) => {
      const da = `${a.date} ${a.time || '00:00'}`;
      const db = `${b.date} ${b.time || '00:00'}`;
      return db.localeCompare(da);
    });
  }, [filteredTrades]);

  return (
    <div className="space-y-6">
      {/* Backtest Month Navigation Bar with "Next Month" action */}
      <BacktestMonthBar
        currentMonthKey={currentMonthKey}
        onSelectMonth={onSelectMonth}
        onOpenMonthCompletion={onOpenMonthCompletion}
        allTrades={trades}
        monthReviews={monthReviews}
        onlyCurrentMonth={onlyCurrentMonth}
        setOnlyCurrentMonth={setOnlyCurrentMonth}
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total R */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Суммарный PnL</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-xl font-bold font-mono tabular-nums ${stats.totalR >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.totalR >= 0 ? `+${stats.totalR.toFixed(2)} R` : `${stats.totalR.toFixed(2)} R`}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            {stats.totalTrades} {stats.totalTrades === 1 ? 'сделка' : 'сделок'}
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Винрейт</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {stats.winRate}%
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            {stats.winCount}W · {stats.lossCount}L · {stats.beCount}BE
          </div>
        </div>

        {/* Profit Factor */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Profit Factor</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
            {stats.profitFactor}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            +{stats.grossWinR}R / -{stats.grossLossR}R
          </div>
        </div>

        {/* Expectancy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Мат. ожидание</span>
            <Zap className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {stats.expectancyR > 0 ? `+${stats.expectancyR} R` : `${stats.expectancyR} R`}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            среднее на сделку
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Макс. просадка</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-400 tabular-nums">
            -{stats.maxDrawdownR} R
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            серия: {stats.consecutiveLosses} loss
          </div>
        </div>

        {/* Discipline / Rule Adherence */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Дисциплина</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {stats.ruleAdherenceRate}%
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            по стратегии
          </div>
        </div>
      </div>

      {/* Equity Curve Toggle & Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowEquityCurve(!showEquityCurve)}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>{showEquityCurve ? 'Скрыть кривую эквити' : 'Показать кривую эквити'}</span>
          </button>
        </div>

        {showEquityCurve && <EquityChart data={equityData} />}
      </div>

      {/* Trades Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {/* Table Filters & Actions Header */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по сетапу, заметкам..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Direction Filter */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setDirectionFilter('ALL')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  directionFilter === 'ALL' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setDirectionFilter('LONG')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  directionFilter === 'LONG' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400'
                }`}
              >
                Long
              </button>
              <button
                onClick={() => setDirectionFilter('SHORT')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  directionFilter === 'SHORT' ? 'bg-rose-500/20 text-rose-400 font-bold' : 'text-slate-400'
                }`}
              >
                Short
              </button>
            </div>

            {/* Outcome Filter */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setOutcomeFilter('ALL')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  outcomeFilter === 'ALL' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setOutcomeFilter('WIN')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  outcomeFilter === 'WIN' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400'
                }`}
              >
                Win (+R)
              </button>
              <button
                onClick={() => setOutcomeFilter('LOSS')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  outcomeFilter === 'LOSS' ? 'bg-rose-500/20 text-rose-400 font-bold' : 'text-slate-400'
                }`}
              >
                Loss (-1R)
              </button>
              <button
                onClick={() => setOutcomeFilter('BE')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  outcomeFilter === 'BE' ? 'bg-slate-700 text-slate-200' : 'text-slate-400'
                }`}
              >
                BE (0R)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => exportBacktestToCsv(filteredTrades)}
              className="text-xs px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Экспорт отфильтрованных сделок в CSV для Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={onNewTrade}
              className="text-xs font-semibold px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-all shadow-sm cursor-pointer"
            >
              + Записать сделку
            </button>
          </div>
        </div>

        {/* Table Content */}
        {sortedTableTrades.length === 0 ? (
          <div className="p-12 text-center">
            <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-semibold text-slate-300">В этом периоде пока нет сделок</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Нажмите «Записать сделку», чтобы добавить первую позицию бэктеста за этот месяц с фиксированным риском -1R.
            </p>
            <button
              onClick={onNewTrade}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              + Добавить сделку бэктеста
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400">
                  <th className="py-3 px-4 font-semibold">Дата / Время</th>
                  <th className="py-3 px-4 font-semibold">Инструмент</th>
                  <th className="py-3 px-4 font-semibold">Тип</th>
                  <th className="py-3 px-4 font-semibold">Сетап / Модель</th>
                  <th className="py-3 px-3 font-semibold text-center">Риск</th>
                  <th className="py-3 px-4 font-semibold text-right">Результат (R)</th>
                  <th className="py-3 px-3 font-semibold text-center">График</th>
                  <th className="py-3 px-4 font-semibold text-center">Правила</th>
                  <th className="py-3 px-4 font-semibold text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedTableTrades.map((trade) => {
                  return (
                    <tr
                      key={trade.id}
                      onClick={() => onViewTrade(trade)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-200">{trade.date}</div>
                        <div className="text-[11px] text-slate-500">{trade.time || '10:00'} · {trade.session}</div>
                      </td>

                      {/* Symbol */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-white">{trade.symbol}</div>
                        <div className="text-[11px] text-slate-500">{trade.timeframe}</div>
                      </td>

                      {/* Direction */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            trade.direction === 'LONG'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {trade.direction}
                        </span>
                      </td>

                      {/* Setup */}
                      <td className="py-3 px-4 max-w-xs font-sans">
                        <div className="text-slate-200 font-medium truncate" title={trade.setup}>
                          {trade.setup}
                        </div>
                        {trade.notes && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {trade.notes}
                          </div>
                        )}
                      </td>

                      {/* Risk - 1.00R */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          -1.00 R
                        </span>
                      </td>

                      {/* Result R */}
                      <td className="py-3 px-4 text-right whitespace-nowrap tabular-nums">
                        <span
                          className={`font-bold text-sm ${
                            trade.resultR > 0
                              ? 'text-emerald-400'
                              : trade.resultR < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {trade.resultR > 0 ? `+${trade.resultR.toFixed(2)} R` : `${trade.resultR.toFixed(2)} R`}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          План: 1:{trade.plannedRR}
                        </div>
                      </td>

                      {/* Screenshot thumbnail */}
                      <td className="py-3 px-3 text-center">
                        {trade.chartUrl ? (
                          <div className="w-8 h-8 rounded bg-slate-800 overflow-hidden mx-auto border border-slate-700">
                            <img
                              src={trade.chartUrl}
                              alt="chart thumb"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-slate-700 text-xs">—</span>
                        )}
                      </td>

                      {/* Followed Plan / Discipline */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {trade.followedPlan ? (
                          <span className="text-emerald-400 text-xs" title="Сделка по стратегии">
                            ✓ Чек-лист
                          </span>
                        ) : (
                          <span className="text-rose-400 text-[11px]" title={trade.mistakeTag}>
                            ! {trade.mistakeTag}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onViewTrade(trade)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Подробнее"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditTrade(trade)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Редактировать"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Удалить эту сделку из бэктеста?')) {
                                onDeleteTrade(trade.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
