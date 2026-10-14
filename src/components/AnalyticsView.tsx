import React from 'react';
import { BacktestTrade } from '../types';
import { calculateSetupStats, calculateBacktestStats } from '../utils/analytics';
import { BarChart3, TrendingUp, Layers, Clock, ShieldAlert } from 'lucide-react';

interface AnalyticsViewProps {
  trades: BacktestTrade[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ trades }) => {
  if (trades.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center shadow-xs">
        <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-white">Статистика бэктеста пуста</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Здесь появится детальная статистика по вашим авторским сетапам, сессиям (Лондон, Нью-Йорк, Азия), лонгам и шортам сразу после добавления первых сделок.
        </p>
      </div>
    );
  }

  const setupStats = calculateSetupStats(trades);
  const generalStats = calculateBacktestStats(trades);

  // Direction stats
  const longTrades = trades.filter(t => t.direction === 'LONG');
  const shortTrades = trades.filter(t => t.direction === 'SHORT');
  const longStats = calculateBacktestStats(longTrades);
  const shortStats = calculateBacktestStats(shortTrades);

  // Session stats
  const sessions = ['London', 'New York AM', 'New York PM', 'Asia'] as const;
  const sessionStats = sessions.map(s => {
    const sTrades = trades.filter(t => t.session === s);
    return {
      session: s,
      ...calculateBacktestStats(sTrades),
    };
  });

  // Mistakes analysis
  const mistakeTrades = trades.filter(t => !t.followedPlan && t.mistakeTag && t.mistakeTag !== 'None');
  const mistakeMap = new Map<string, { count: number; lostR: number }>();
  mistakeTrades.forEach(t => {
    const tag = t.mistakeTag!;
    if (!mistakeMap.has(tag)) mistakeMap.set(tag, { count: 0, lostR: 0 });
    const item = mistakeMap.get(tag)!;
    item.count += 1;
    if (t.resultR < 0) {
      item.lostR += Math.abs(t.resultR);
    }
  });

  const mistakesList = Array.from(mistakeMap.entries()).map(([tag, data]) => ({
    tag,
    count: data.count,
    lostR: Number(data.lostR.toFixed(1)),
  })).sort((a, b) => b.lostR - a.lostR);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <span>Глубокая аналитика бэктеста и сетапов</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Статистика по вашим торговым сетапам, времени сессий, направлению и дисциплине
        </p>
      </div>

      {/* Setups Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Эффективность авторских сетапов</h4>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {setupStats.length} {setupStats.length === 1 ? 'сетап' : 'сетапов'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400">
                <th className="py-3 px-4 font-semibold">Название сетапа</th>
                <th className="py-3 px-3 font-semibold text-center">Сделок</th>
                <th className="py-3 px-3 font-semibold text-center">W / L</th>
                <th className="py-3 px-3 font-semibold text-center">Винрейт</th>
                <th className="py-3 px-4 font-semibold text-right">Суммарный R</th>
                <th className="py-3 px-4 font-semibold text-right">Средний R / сделку</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {setupStats.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-slate-200">
                    {item.setup}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-300 tabular-nums">
                    {item.tradesCount}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-400 tabular-nums">
                    <span className="text-emerald-400 font-bold">{item.winCount}</span> / <span className="text-rose-400 font-bold">{item.lossCount}</span>
                  </td>
                  <td className="py-3 px-3 text-center tabular-nums">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      item.winRate >= 60 ? 'bg-emerald-500/15 text-emerald-400' : item.winRate >= 45 ? 'bg-slate-800 text-slate-300' : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {item.winRate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">
                    <span className={`font-bold text-sm ${item.totalR > 0 ? 'text-emerald-400' : item.totalR < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {item.totalR > 0 ? `+${item.totalR} R` : `${item.totalR} R`}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300 tabular-nums font-semibold">
                    {item.avgR > 0 ? `+${item.avgR} R` : `${item.avgR} R`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2-Column Split: Direction and Sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Long vs Short */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Long vs Short позиции</h4>
          </div>

          <div className="space-y-4">
            {/* Long */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between font-mono mb-2">
                <span className="text-xs font-bold text-emerald-400">LONG</span>
                <span className={`text-sm font-bold ${longStats.totalR >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {longStats.totalR >= 0 ? `+${longStats.totalR} R` : `${longStats.totalR} R`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Сделок: {longStats.totalTrades}</span>
                <span>Винрейт: <strong className="text-white">{longStats.winRate}%</strong></span>
                <span>Profit Factor: <strong className="text-emerald-400">{longStats.profitFactor}</strong></span>
              </div>
            </div>

            {/* Short */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between font-mono mb-2">
                <span className="text-xs font-bold text-rose-400">SHORT</span>
                <span className={`text-sm font-bold ${shortStats.totalR >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {shortStats.totalR >= 0 ? `+${shortStats.totalR} R` : `${shortStats.totalR} R`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Сделок: {shortStats.totalTrades}</span>
                <span>Винрейт: <strong className="text-white">{shortStats.winRate}%</strong></span>
                <span>Profit Factor: <strong className="text-emerald-400">{shortStats.profitFactor}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Результативность по Сессиям</h4>
          </div>

          <div className="space-y-2.5">
            {sessionStats.map(s => (
              <div key={s.session} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between font-mono text-xs">
                <div>
                  <div className="font-semibold text-slate-200">{s.session}</div>
                  <div className="text-[10px] text-slate-500">{s.totalTrades} сдел. · WR {s.winRate}%</div>
                </div>
                <div className={`text-sm font-bold tabular-nums ${s.totalR >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {s.totalR >= 0 ? `+${s.totalR.toFixed(1)} R` : `${s.totalR.toFixed(1)} R`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Psychology & Discipline Analysis */}
      {mistakesList.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h4 className="text-sm font-bold text-white">Цена ошибок и нарушений дисциплины</h4>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Сколько R было потеряно из-за эмоций и отступлений от торгового плана
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {mistakesList.map((m, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-rose-900/30 font-mono">
                <div className="text-xs text-slate-200 font-sans font-medium truncate" title={m.tag}>
                  {m.tag}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-500">{m.count} раз(а)</span>
                  <span className="text-rose-400 font-bold text-sm">
                    -{m.lostR} R
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
