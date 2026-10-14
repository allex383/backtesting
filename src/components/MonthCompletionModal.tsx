import React, { useState } from 'react';
import { X, CheckCircle2, Trophy, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BacktestTrade, MonthReview } from '../types';
import { formatMonthName, getNextMonthKey } from '../utils/analytics';

interface MonthCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthKey: string;
  trades: BacktestTrade[];
  currentReview?: MonthReview;
  onSaveReviewAndAdvance: (review: MonthReview, advanceToNext: boolean) => void;
}

export const MonthCompletionModal: React.FC<MonthCompletionModalProps> = ({
  isOpen,
  onClose,
  monthKey,
  trades,
  currentReview,
  onSaveReviewAndAdvance,
}) => {
  const [notes, setNotes] = useState(currentReview?.summaryNotes || '');
  const [targetR, setTargetR] = useState<number>(currentReview?.targetR || 10);

  if (!isOpen) return null;

  // Calculate statistics for this specific month
  const monthTrades = trades.filter(t => t.date.startsWith(monthKey));
  const totalR = monthTrades.reduce((acc, t) => acc + t.resultR, 0);
  const wins = monthTrades.filter(t => t.resultR > 0);
  const losses = monthTrades.filter(t => t.resultR < 0);
  const be = monthTrades.filter(t => t.resultR === 0);
  const decisive = wins.length + losses.length;
  const winRate = decisive > 0 ? ((wins.length / decisive) * 100).toFixed(1) : '0';

  const grossWin = wins.reduce((acc, t) => acc + t.resultR, 0);
  const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.resultR, 0));
  const profitFactor = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : grossWin > 0 ? '∞' : '0.00';

  let bestTrade = 0;
  monthTrades.forEach(t => {
    if (t.resultR > bestTrade) bestTrade = t.resultR;
  });

  const nextMonthKey = getNextMonthKey(monthKey);

  const handleCompleteAndAdvance = () => {
    // Fire celebratory confetti if profitable or finished
    if (totalR > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#3b82f6'],
        });
      } catch (e) {
        // Safe fallback
      }
    }

    const review: MonthReview = {
      monthKey,
      isCompleted: true,
      completedAt: new Date().toISOString(),
      summaryNotes: notes,
      targetR,
    };

    onSaveReviewAndAdvance(review, true);
    onClose();
  };

  const handleSaveOnly = () => {
    const review: MonthReview = {
      monthKey,
      isCompleted: currentReview?.isCompleted || false,
      summaryNotes: notes,
      targetR,
    };
    onSaveReviewAndAdvance(review, false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Итоги месяца: {formatMonthName(monthKey)}
              </h3>
              <p className="text-xs text-slate-400">
                Фиксация результатов и переход к следующему шагу бэктеста
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Month KPI strip */}
          <div className="grid grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center font-mono">
            <div>
              <div className="text-[11px] text-slate-400 font-sans">Итог PnL</div>
              <div className={`text-lg font-bold tabular-nums mt-0.5 ${totalR > 0 ? 'text-emerald-400' : totalR < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                {totalR > 0 ? `+${totalR.toFixed(1)}R` : `${totalR.toFixed(1)}R`}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-sans">Винрейт</div>
              <div className="text-lg font-bold text-white tabular-nums mt-0.5">
                {winRate}%
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-sans">Сделок</div>
              <div className="text-lg font-bold text-white tabular-nums mt-0.5">
                {monthTrades.length}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-sans">Profit Factor</div>
              <div className="text-lg font-bold text-emerald-400 tabular-nums mt-0.5">
                {profitFactor}
              </div>
            </div>
          </div>

          {/* Breakdown row */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
            <span>Победы: <strong className="text-emerald-400 font-semibold">{wins.length}</strong> (+{grossWin.toFixed(1)}R)</span>
            <span>Убытки: <strong className="text-rose-400 font-semibold">{losses.length}</strong> (-{grossLoss.toFixed(1)}R)</span>
            <span>Безубыток: <strong className="text-slate-300 font-semibold">{be.length}</strong></span>
            <span>Лучшая сделка: <strong className="text-emerald-400 font-semibold">+{bestTrade.toFixed(1)}R</strong></span>
          </div>

          {/* Target R input */}
          <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
            <span className="text-xs text-slate-300">
              Цель по R на этот месяц:
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="1"
                value={targetR}
                onChange={(e) => setTargetR(parseFloat(e.target.value) || 0)}
                className="w-18 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-slate-400 font-mono">R</span>
            </div>
          </div>

          {/* Notes textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Выводы по стратегии за этот месяц (заметки для следующего этапа):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Например: 'На открытии Лондона ETHUSDT дает лучшие точки входа по MSS. Снятие ликвидности Азии отработало 6 из 7 раз. Следует избегать входов во второй половине дня пятницы...'"
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <button
            onClick={handleSaveOnly}
            className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Сохранить без перехода
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xs text-slate-300 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleCompleteAndAdvance}
              className="text-xs font-semibold px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Завершить и открыть {formatMonthName(nextMonthKey)}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
