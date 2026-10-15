import React, { useState } from 'react';
import { X, Edit3, Trash2, Calendar, Clock, Compass, Layers, ExternalLink, CheckCircle, AlertTriangle, ZoomIn } from 'lucide-react';
import { BacktestTrade } from '../types';
import { ImageViewerModal } from './ImageViewerModal';

interface TradeDetailModalProps {
  trade: BacktestTrade | null;
  onClose: () => void;
  onEdit: (trade: BacktestTrade) => void;
  onDelete: (tradeId: string) => void;
}

export const TradeDetailModal: React.FC<TradeDetailModalProps> = ({
  trade,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  if (!trade) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-md font-mono ${
                trade.direction === 'LONG'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {trade.direction}
            </span>
            <span className="text-base font-bold text-white font-mono">{trade.symbol}</span>
            <span
              className={`text-sm font-bold font-mono px-2.5 py-0.5 rounded ${
                trade.resultR > 0
                  ? 'bg-emerald-500 text-slate-950'
                  : trade.resultR < 0
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-700 text-white'
              }`}
            >
              {trade.resultR > 0 ? `+${trade.resultR.toFixed(2)} R` : `${trade.resultR.toFixed(2)} R`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onEdit(trade);
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Редактировать сделку"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm('Удалить эту сделку из бэктеста?')) {
                  onDelete(trade.id);
                  onClose();
                }
              }}
              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Удалить сделку"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Screenshot / Chart Area */}
          {trade.chartUrl ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ZoomIn className="w-4 h-4 text-emerald-400" />
                  <span>Скриншот графика / Разметка сделки</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsZoomOpen(true)}
                    className="px-3 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-medium rounded-lg border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Увеличить на весь экран</span>
                  </button>
                  {!trade.chartUrl.startsWith('data:') && (
                    <a
                      href={trade.chartUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
                      title="Открыть ссылку в новой вкладке"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">TradingView</span>
                    </a>
                  )}
                </div>
              </div>

              <div
                onClick={() => setIsZoomOpen(true)}
                className="rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 overflow-hidden relative group cursor-zoom-in transition-all"
                title="Нажмите для увеличения графика"
              >
                <img
                  src={trade.chartUrl}
                  alt="Trade chart"
                  className="w-full h-auto max-h-[460px] object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.01]"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="px-4 py-2 bg-slate-900/95 text-white text-xs font-semibold rounded-xl border border-emerald-500/40 flex items-center gap-2 shadow-2xl backdrop-blur-md">
                    <ZoomIn className="w-4 h-4 text-emerald-400" />
                    <span>Нажмите для подробного рассмотрения (зум, панорамирование)</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-600 font-mono">
              Скриншот графика не был прикреплен к этой сделке.
            </div>
          )}

          {/* Metric Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl font-mono">
              <span className="text-[10px] text-slate-500 block font-sans">Дата и время</span>
              <span className="text-xs font-semibold text-slate-200 block mt-1">
                {trade.date} {trade.time}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl font-mono">
              <span className="text-[10px] text-slate-500 block font-sans">Сетап</span>
              <span className="text-xs font-semibold text-emerald-400 block mt-1 truncate" title={trade.setup}>
                {trade.setup}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl font-mono">
              <span className="text-[10px] text-slate-500 block font-sans">Сессия / ТФ</span>
              <span className="text-xs font-semibold text-slate-200 block mt-1">
                {trade.session} · {trade.timeframe}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl font-mono">
              <span className="text-[10px] text-slate-500 block font-sans">Планируемый RR</span>
              <span className="text-xs font-semibold text-slate-200 block mt-1">
                1 : {trade.plannedRR}
              </span>
            </div>
          </div>

          {/* Prices if available */}
          {(trade.entryPrice || trade.stopLossPrice || trade.takeProfitPrice) && (
            <div className="bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-500 font-sans block mb-2 font-semibold">
                Ценовые уровни:
              </span>
              <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Вход:</span>
                  <span className="text-slate-200">{trade.entryPrice ?? '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Стоп:</span>
                  <span className="text-rose-400">{trade.stopLossPrice ?? '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Тейк:</span>
                  <span className="text-emerald-400">{trade.takeProfitPrice ?? '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Выход:</span>
                  <span className="text-slate-200">{trade.exitPrice ?? '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Discipline & Mistakes */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${
                trade.followedPlan
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              {trade.followedPlan ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>По правилам стратегии</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Нарушение правил: {trade.mistakeTag}</span>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {trade.notes && (
            <div className="space-y-1.5">
              <h5 className="text-xs font-semibold text-slate-400">Заметки трейдера:</h5>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {trade.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 bg-slate-950/80 border-t border-slate-800">
          <button
            onClick={onClose}
            className="text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>

      {/* Full-screen Zoom Modal */}
      {trade.chartUrl && (
        <ImageViewerModal
          isOpen={isZoomOpen}
          onClose={() => setIsZoomOpen(false)}
          imageUrl={trade.chartUrl}
          title={`${trade.symbol} · ${trade.date} ${trade.time || ''} (${trade.direction})`}
        />
      )}
    </div>
  );
};
