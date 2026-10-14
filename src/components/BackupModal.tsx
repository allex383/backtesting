import React, { useRef, useState } from 'react';
import { X, Download, Upload, RefreshCw, AlertTriangle, Check, FileSpreadsheet, HardDrive } from 'lucide-react';
import { exportAllDataAsJson, importAllDataFromJson, resetToDefaults, exportBacktestToCsv } from '../utils/storage';
import { BacktestTrade } from '../types';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTrades: BacktestTrade[];
  onDataReload: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  allTrades,
  onDataReload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importAllDataFromJson(content);
        if (success) {
          setImportStatus('Резервная копия успешно восстановлена!');
          onDataReload();
          setTimeout(() => {
            setImportStatus(null);
            onClose();
          }, 1200);
        } else {
          setImportStatus('Ошибка: Неверный формат файла JSON.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Сбросить дневник к исходным демонстрационным данным за Январь 2020? Все ваши текущие записи будут перезаписаны!')) {
      resetToDefaults();
      onDataReload();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Резервное копирование и экспорт</h3>
              <p className="text-xs text-slate-400">Сохраните 5-6 лет ваших данных бэктеста</p>
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
        <div className="p-6 space-y-4">
          {importStatus && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Export JSON */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Полный архив в JSON</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Сохраняет все сделки бэктеста, итоги месяцев и проп-счета в один файл
              </div>
            </div>
            <button
              onClick={exportAllDataAsJson}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer shadow-sm"
            >
              Скачать JSON
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-teal-400" />
                <span>Восстановить из файла JSON</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Загрузить сохраненную ранее резервную копию дневника
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all shrink-0 cursor-pointer"
            >
              Выбрать файл
            </button>
          </div>

          {/* Export CSV */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                <span>Экспорт таблицы в Excel / CSV</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {allTrades.length} сделок бэктеста для анализа в таблицах
              </div>
            </div>
            <button
              onClick={() => exportBacktestToCsv(allTrades)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all shrink-0 cursor-pointer"
            >
              Экспорт CSV
            </button>
          </div>

          {/* Reset button */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Сброс к демонстрационным сделкам 2020 года
            </span>
            <button
              onClick={handleReset}
              className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Сбросить демо</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
