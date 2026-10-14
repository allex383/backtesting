/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ActiveTab, BacktestTrade, MonthReview } from './types';
import {
  loadBacktestTrades,
  saveBacktestTrades,
  loadMonthReviews,
  saveMonthReviews,
  loadCurrentBacktestMonth,
  saveCurrentBacktestMonth,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { BacktestDashboard } from './components/BacktestDashboard';
import { MonthlyHeatmap } from './components/MonthlyHeatmap';
import { AnalyticsView } from './components/AnalyticsView';
import { TradeModal } from './components/TradeModal';
import { TradeDetailModal } from './components/TradeDetailModal';
import { MonthCompletionModal } from './components/MonthCompletionModal';
import { BackupModal } from './components/BackupModal';
import { getNextMonthKey } from './utils/analytics';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('backtest');

  // Backtest State (starts with 0 trades, clean state)
  const [backtestTrades, setBacktestTrades] = useState<BacktestTrade[]>(() => loadBacktestTrades());
  const [monthReviews, setMonthReviews] = useState<MonthReview[]>(() => loadMonthReviews());
  const [currentMonthKey, setCurrentMonthKey] = useState<string>(() => loadCurrentBacktestMonth());

  // Modal States
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<BacktestTrade | null>(null);
  const [viewingTrade, setViewingTrade] = useState<BacktestTrade | null>(null);
  const [isMonthCompletionModalOpen, setIsMonthCompletionModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Collect unique user-written setups for datalist autocomplete
  const existingSetups = useMemo(() => {
    const set = new Set<string>();
    backtestTrades.forEach((t) => {
      if (t.setup && t.setup.trim()) set.add(t.setup.trim());
    });
    return Array.from(set);
  }, [backtestTrades]);

  // Sync to localStorage
  const handleUpdateBacktestTrades = (newTrades: BacktestTrade[]) => {
    setBacktestTrades(newTrades);
    saveBacktestTrades(newTrades);
  };

  const handleUpdateMonthReviews = (newReviews: MonthReview[]) => {
    setMonthReviews(newReviews);
    saveMonthReviews(newReviews);
  };

  const handleSelectMonth = (monthKey: string) => {
    setCurrentMonthKey(monthKey);
    saveCurrentBacktestMonth(monthKey);
  };

  // Reload everything from localStorage
  const handleReloadAll = () => {
    setBacktestTrades(loadBacktestTrades());
    setMonthReviews(loadMonthReviews());
    setCurrentMonthKey(loadCurrentBacktestMonth());
  };

  // Save Trade (Create or Edit)
  const handleSaveTrade = (trade: BacktestTrade) => {
    const existingIndex = backtestTrades.findIndex((t) => t.id === trade.id);
    let updated: BacktestTrade[];
    if (existingIndex >= 0) {
      updated = [...backtestTrades];
      updated[existingIndex] = trade;
    } else {
      updated = [trade, ...backtestTrades];
    }
    handleUpdateBacktestTrades(updated);
  };

  // Delete Trade
  const handleDeleteTrade = (tradeId: string) => {
    const updated = backtestTrades.filter((t) => t.id !== tradeId);
    handleUpdateBacktestTrades(updated);
  };

  // Month Completion and Transition Handler
  const handleSaveMonthReviewAndAdvance = (review: MonthReview, advanceToNext: boolean) => {
    const existingIndex = monthReviews.findIndex((r) => r.monthKey === review.monthKey);
    let updatedReviews: MonthReview[];
    if (existingIndex >= 0) {
      updatedReviews = [...monthReviews];
      updatedReviews[existingIndex] = review;
    } else {
      updatedReviews = [...monthReviews, review];
    }
    handleUpdateMonthReviews(updatedReviews);

    if (advanceToNext) {
      const nextKey = getNextMonthKey(review.monthKey);
      handleSelectMonth(nextKey);
    }
  };

  const currentMonthReview = monthReviews.find((r) => r.monthKey === currentMonthKey);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTrade={() => {
          setEditingTrade(null);
          setIsTradeModalOpen(true);
        }}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        currentMonthKey={currentMonthKey}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 1: Backtest Journal */}
        {activeTab === 'backtest' && (
          <BacktestDashboard
            trades={backtestTrades}
            monthReviews={monthReviews}
            currentMonthKey={currentMonthKey}
            onSelectMonth={handleSelectMonth}
            onOpenMonthCompletion={() => setIsMonthCompletionModalOpen(true)}
            onEditTrade={(trade) => {
              setEditingTrade(trade);
              setIsTradeModalOpen(true);
            }}
            onDeleteTrade={handleDeleteTrade}
            onViewTrade={(trade) => setViewingTrade(trade)}
            onNewTrade={() => {
              setEditingTrade(null);
              setIsTradeModalOpen(true);
            }}
          />
        )}

        {/* Tab 2: Monthly Heatmap Matrix (2020 - 2026) */}
        {activeTab === 'heatmap' && (
          <div className="space-y-6">
            <MonthlyHeatmap
              trades={backtestTrades}
              onSelectMonth={(monthKey) => {
                handleSelectMonth(monthKey);
                setActiveTab('backtest');
              }}
              currentActiveMonth={currentMonthKey}
            />
          </div>
        )}

        {/* Tab 3: Analytics View */}
        {activeTab === 'analytics' && (
          <AnalyticsView trades={backtestTrades} />
        )}
      </main>

      {/* Modals */}
      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={() => {
          setIsTradeModalOpen(false);
          setEditingTrade(null);
        }}
        onSave={handleSaveTrade}
        initialTrade={editingTrade}
        currentMonthKey={currentMonthKey}
        existingSetups={existingSetups}
      />

      <TradeDetailModal
        trade={viewingTrade}
        onClose={() => setViewingTrade(null)}
        onEdit={(trade) => {
          setEditingTrade(trade);
          setIsTradeModalOpen(true);
        }}
        onDelete={handleDeleteTrade}
      />

      <MonthCompletionModal
        isOpen={isMonthCompletionModalOpen}
        onClose={() => setIsMonthCompletionModalOpen(false)}
        monthKey={currentMonthKey}
        trades={backtestTrades}
        currentReview={currentMonthReview}
        onSaveReviewAndAdvance={handleSaveMonthReviewAndAdvance}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        allTrades={backtestTrades}
        onDataReload={handleReloadAll}
      />
    </div>
  );
}
