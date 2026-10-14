import React from 'react';
import { ActiveTab } from '../types';
import { Plus, HardDriveDownload, BarChart3, Calendar, Layers } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewTrade: () => void;
  onOpenBackup: () => void;
  currentMonthKey: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTrade,
  onOpenBackup,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('backtest');
            }}
            className="text-lg font-bold tracking-tight text-white flex items-center gap-2 whitespace-nowrap shrink-0 hover:text-emerald-400 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono text-sm font-bold">
              α
            </div>
            <span>AlphaJournal</span>
          </a>
          <span className="hidden sm:inline text-xs text-slate-500 font-mono">
            Дневник Бектеста (с 01.01.2020)
          </span>
        </div>

        {/* Zone 2: Navigation Links (single-line, concise) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('backtest')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'backtest'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Дневник Бектеста</span>
          </button>

          <button
            onClick={() => setActiveTab('heatmap')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'heatmap'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Сетка Месяцев (2020–2026)</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'analytics'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Аналитика</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Backup */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenBackup}
            title="Экспорт, импорт и резервные копии"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg border border-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <HardDriveDownload className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenNewTrade}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm hover:shadow-emerald-500/10 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Записать сделку</span>
          </button>
        </div>
      </div>

      {/* Mobile nav subbar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 bg-slate-900/90 border-t border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('backtest')}
          className={`py-1 px-3 rounded ${activeTab === 'backtest' ? 'text-emerald-400 font-semibold bg-emerald-500/10' : 'text-slate-400'}`}
        >
          Дневник
        </button>
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`py-1 px-3 rounded ${activeTab === 'heatmap' ? 'text-emerald-400 font-semibold bg-emerald-500/10' : 'text-slate-400'}`}
        >
          Сетка 2020-2026
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-1 px-3 rounded ${activeTab === 'analytics' ? 'text-emerald-400 font-semibold bg-emerald-500/10' : 'text-slate-400'}`}
        >
          Аналитика
        </button>
      </div>
    </header>
  );
};
