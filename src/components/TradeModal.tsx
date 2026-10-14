import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Check, AlertTriangle, Upload, Trash2 } from 'lucide-react';
import { BacktestTrade, TradeDirection, TradeOutcome, SessionName } from '../types';
import { TIMEFRAMES, SESSIONS, MISTAKE_TAGS } from '../data/sampleData';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: BacktestTrade) => void;
  initialTrade?: BacktestTrade | null;
  currentMonthKey: string;
  existingSetups?: string[];
}

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTrade,
  currentMonthKey,
  existingSetups = [],
}) => {
  const defaultDate = `${currentMonthKey}-01`;

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('10:00');
  const [symbol, setSymbol] = useState('ETHUSDT');
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  
  // R Multiple mechanics: -1.00R stop loss
  const [resultRInput, setResultRInput] = useState<string>('-1');
  const [plannedRRInput, setPlannedRRInput] = useState<string>('3');
  const [outcome, setOutcome] = useState<TradeOutcome>('LOSS');

  // Prices (optional)
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [stopLossPrice, setStopLossPrice] = useState<string>('');
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('');
  const [exitPrice, setExitPrice] = useState<string>('');

  // Strategy Context - User writes their own setup freely!
  const [setup, setSetup] = useState('');
  const [timeframe, setTimeframe] = useState('5m');
  const [session, setSession] = useState<SessionName>('London');
  const [followedPlan, setFollowedPlan] = useState(true);
  const [mistakeTag, setMistakeTag] = useState('None');
  
  // Screenshots & Notes
  const [chartUrl, setChartUrl] = useState('');
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTrade) {
      setDate(initialTrade.date);
      setTime(initialTrade.time || '10:00');
      setSymbol(initialTrade.symbol);
      setDirection(initialTrade.direction);
      setResultRInput(initialTrade.resultR.toString());
      setPlannedRRInput(initialTrade.plannedRR.toString());
      setOutcome(initialTrade.outcome);
      setEntryPrice(initialTrade.entryPrice?.toString() || '');
      setStopLossPrice(initialTrade.stopLossPrice?.toString() || '');
      setTakeProfitPrice(initialTrade.takeProfitPrice?.toString() || '');
      setExitPrice(initialTrade.exitPrice?.toString() || '');
      setSetup(initialTrade.setup || '');
      setTimeframe(initialTrade.timeframe || '5m');
      setSession(initialTrade.session || 'London');
      setFollowedPlan(initialTrade.followedPlan ?? true);
      setMistakeTag(initialTrade.mistakeTag || 'None');
      setChartUrl(initialTrade.chartUrl || '');
      setNotes(initialTrade.notes || '');
    } else {
      // New trade defaults starting at current month
      setDate(`${currentMonthKey}-01`);
      setTime('10:00');
      setSymbol('ETHUSDT');
      setDirection('LONG');
      setResultRInput('-1');
      setPlannedRRInput('3');
      setOutcome('LOSS');
      setEntryPrice('');
      setStopLossPrice('');
      setTakeProfitPrice('');
      setExitPrice('');
      setSetup('');
      setTimeframe('5m');
      setSession('London');
      setFollowedPlan(true);
      setMistakeTag('None');
      setChartUrl('');
      setNotes('');
    }
  }, [initialTrade, isOpen, currentMonthKey]);

  if (!isOpen) return null;

  // Handle Quick Outcome selection
  const handleSelectOutcomePreset = (type: 'LOSS' | 'BE' | 'WIN', rVal: number) => {
    setOutcome(type);
    setResultRInput(rVal.toString());
  };

  const currentResultR = isNaN(parseFloat(resultRInput)) ? 0 : parseFloat(resultRInput);

  // Image Paste Handler (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setChartUrl(event.target.result as string);
            }
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setChartUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save trade
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedR = parseFloat(resultRInput);
    const finalResultR = isNaN(parsedR) ? 0 : parsedR;
    const parsedRR = parseFloat(plannedRRInput);
    const finalPlannedRR = isNaN(parsedRR) ? 3.0 : parsedRR;

    const trade: BacktestTrade = {
      id: initialTrade?.id || `bt-${Date.now()}`,
      date,
      time,
      symbol: symbol.toUpperCase().trim(),
      direction,
      riskR: 1.0,
      resultR: finalResultR,
      plannedRR: finalPlannedRR,
      outcome,
      entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
      stopLossPrice: stopLossPrice ? parseFloat(stopLossPrice) : undefined,
      takeProfitPrice: takeProfitPrice ? parseFloat(takeProfitPrice) : undefined,
      exitPrice: exitPrice ? parseFloat(exitPrice) : undefined,
      setup: setup.trim() || 'Без названия',
      timeframe,
      session,
      followedPlan,
      mistakeTag: followedPlan ? 'None' : mistakeTag,
      chartUrl: chartUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: initialTrade?.createdAt || Date.now(),
    };

    onSave(trade);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto"
      onPaste={handlePaste}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{initialTrade ? 'Редактировать сделку' : 'Записать сделку бэктеста'}</span>
              <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Риск: -1.00R
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Стоп = 1.00 R (без денежного эквивалента, как в TradingView)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Risk & Outcome Strip */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Результат сделки в R (Риск = 1.00R):
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-slate-500">Итог позиции:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded tabular-nums ${
                    currentResultR > 0
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : currentResultR < 0
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {currentResultR > 0 ? `+${currentResultR.toFixed(2)} R` : `${currentResultR.toFixed(2)} R`}
                </span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSelectOutcomePreset('LOSS', -1.0)}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  (resultRInput === '-1' || resultRInput === '-1.0' || resultRInput === '-1.00') && outcome === 'LOSS'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                }`}
              >
                <span>Стоп (-1.00 R)</span>
                <span className="text-[10px] font-normal opacity-80">Полный стоп-лосс</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOutcomePreset('BE', 0.0)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  (resultRInput === '0' || resultRInput === '0.0')
                    ? 'bg-slate-700 text-white border-slate-600'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span>Безубыток (0 R)</span>
                <span className="text-[10px] font-normal opacity-80">Выход в 0</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOutcomePreset('WIN', 2.0)}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  (resultRInput === '2' || resultRInput === '2.0')
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                }`}
              >
                <span>Тейк +2.00 R</span>
                <span className="text-[10px] font-normal opacity-80">1:2 соотношение</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOutcomePreset('WIN', 3.0)}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  (resultRInput === '3' || resultRInput === '3.0')
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                }`}
              >
                <span>Тейк +3.00 R</span>
                <span className="text-[10px] font-normal opacity-80">1:3 соотношение</span>
              </button>
            </div>

            {/* Custom R and Planned RR */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Точный полученный результат (R):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={resultRInput}
                    onChange={(e) => {
                      const raw = e.target.value.replace(',', '.').replace(/[^0-9.-]/g, '');
                      setResultRInput(raw);
                      if (raw !== '' && raw !== '-' && raw !== '.') {
                        const val = parseFloat(raw);
                        if (!isNaN(val)) {
                          if (val > 0) setOutcome('WIN');
                          else if (val < 0) setOutcome('LOSS');
                          else setOutcome('BE');
                        }
                      }
                    }}
                    placeholder="Например: 2.5 или -1"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 tabular-nums"
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleSelectOutcomePreset('WIN', 4.0)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-mono rounded border border-slate-700 cursor-pointer"
                    >
                      +4R
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectOutcomePreset('WIN', 5.0)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-mono rounded border border-slate-700 cursor-pointer"
                    >
                      +5R
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectOutcomePreset('LOSS', -0.5)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-mono rounded border border-slate-700 cursor-pointer"
                    >
                      -0.5R
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Запланированный Risk/Reward (RR):
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={plannedRRInput}
                  onChange={(e) => {
                    const raw = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
                    setPlannedRRInput(raw);
                  }}
                  placeholder="3.0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Date, Time, Symbol, Direction */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Дата сделки:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Время:</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Инструмент:</label>
              <input
                type="text"
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="ETHUSDT"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Направление:</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setDirection('LONG')}
                  className={`py-1 text-xs font-bold rounded transition-colors cursor-pointer ${
                    direction === 'LONG'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  LONG
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SHORT')}
                  className={`py-1 text-xs font-bold rounded transition-colors cursor-pointer ${
                    direction === 'SHORT'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SHORT
                </button>
              </div>
            </div>
          </div>

          {/* Quick Symbol presets */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-500">Быстрый выбор:</span>
            {['ETHUSDT', 'ETHUSD', 'ETHBTC', 'BTCUSDT', 'SOLUSDT'].map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSymbol(s)}
                className={`px-2 py-0.5 rounded font-mono transition-colors cursor-pointer ${
                  symbol === s
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Setup / Model (Custom user input!) + Timeframe + Session */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                Сетап / Модель (напишите свой):
              </label>
              <input
                type="text"
                value={setup}
                onChange={(e) => setSetup(e.target.value)}
                placeholder="Например: Слом 5м, Ретест, FVG..."
                list="user-setups-list"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-sans"
              />
              {existingSetups.length > 0 && (
                <datalist id="user-setups-list">
                  {existingSetups.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              )}
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Таймфрейм входа:</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              >
                {TIMEFRAMES.map((tf) => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Торговая сессия:</label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value as SessionName)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {SESSIONS.map((sess) => (
                  <option key={sess.id} value={sess.id}>{sess.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Prices (Optional) */}
          <div className="border border-slate-800/80 rounded-xl p-3 bg-slate-950/40">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              Ценовые уровни (необязательно, для фиксации цен):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Вход ($):</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value.replace(',', '.'))}
                  placeholder="130.50"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Стоп-лосс ($):</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(e.target.value.replace(',', '.'))}
                  placeholder="129.20"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-rose-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Тейк-профит ($):</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(e.target.value.replace(',', '.'))}
                  placeholder="134.40"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Факт выхода ($):</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value.replace(',', '.'))}
                  placeholder="134.30"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Discipline / Mistake Tracker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div className="flex items-center gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                id="followedPlan"
                checked={followedPlan}
                onChange={(e) => setFollowedPlan(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="followedPlan" className="text-xs font-medium text-slate-200 cursor-pointer select-none">
                Сделка строго по правилам стратегии
              </label>
            </div>

            {!followedPlan && (
              <div>
                <label className="block text-[11px] text-rose-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Какая ошибка была допущена?</span>
                </label>
                <select
                  value={mistakeTag}
                  onChange={(e) => setMistakeTag(e.target.value)}
                  className="w-full bg-slate-950 border border-rose-900/60 rounded-lg px-3 py-2 text-xs text-rose-300 focus:outline-none"
                >
                  {MISTAKE_TAGS.filter(m => m !== 'None').map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Screenshots / Charts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Скриншот графика (Вставить Ctrl+V или ссылка TradingView):</span>
              </label>
              {chartUrl && (
                <button
                  type="button"
                  onClick={() => setChartUrl('')}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Удалить изображение</span>
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chartUrl.startsWith('data:') ? 'Изображение загружено из буфера / файла' : chartUrl}
                onChange={(e) => setChartUrl(e.target.value)}
                disabled={chartUrl.startsWith('data:')}
                placeholder="https://www.tradingview.com/x/... или вставьте скриншот из буфера (Ctrl+V)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Файл</span>
              </button>
            </div>

            {chartUrl && (
              <div className="mt-2 rounded-lg border border-slate-800 overflow-hidden bg-slate-950 max-h-48 flex items-center justify-center">
                <img
                  src={chartUrl}
                  alt="Chart snapshot"
                  className="max-h-48 object-contain w-auto"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Заметки и ход мыслей:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Контекст старшего таймфрейма, почему был вход, поведение цены..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <div className="text-xs text-slate-400 font-mono">
            Результат: <strong className={currentResultR > 0 ? 'text-emerald-400' : currentResultR < 0 ? 'text-rose-400' : 'text-slate-200'}>
              {currentResultR > 0 ? `+${currentResultR.toFixed(2)} R` : `${currentResultR.toFixed(2)} R`}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="text-xs font-semibold px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialTrade ? 'Сохранить изменения' : 'Добавить сделку'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
