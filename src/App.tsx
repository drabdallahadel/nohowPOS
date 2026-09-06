import React, { useState, useEffect } from 'react';
import { ScreenState, UserEntity } from './types';
import { storage } from './services/storage';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { SalesScreen } from './components/SalesScreen';
import { ProductsScreen } from './components/ProductsScreen';
import { SyncQueueScreen } from './components/SyncQueueScreen';
import { InvoicesScreen } from './components/InvoicesScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { PurchasesScreen } from './components/PurchasesScreen';
import { QuotationsScreen } from './components/QuotationsScreen';
import { InventoryHubScreen } from './components/InventoryHubScreen';
import { CustomersScreen } from './components/CustomersScreen';
import { SuppliersScreen } from './components/SuppliersScreen';
import { TreasuryScreen } from './components/TreasuryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AiAssistantScreen } from './components/AiAssistantScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserEntity | null>(() => storage.getCurrentUser());
  const [currentScreen, setCurrentScreen] = useState<ScreenState>(() =>
    storage.getCurrentUser() ? 'DASHBOARD' : 'LOGIN'
  );
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  const updatePendingCount = () => {
    const queue = storage.getSyncQueue();
    setPendingSyncCount(queue.filter((q) => !q.synced).length);
  };

  useEffect(() => {
    updatePendingCount();
  }, [currentScreen]);

  const handleLoginSuccess = (user: UserEntity) => {
    setCurrentUser(user);
    setCurrentScreen('DASHBOARD');
    updatePendingCount();
  };

  const handleLogout = () => {
    storage.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentScreen('LOGIN');
  };

  const handleNavigate = (screen: ScreenState) => {
    setCurrentScreen(screen);
    updatePendingCount();
  };

  const handleToggleOnline = () => {
    setIsOnline((prev) => !prev);
  };

  const settings = storage.getSettings();

  return (
    <div className="min-h-screen bg-[#FBFDF9] text-gray-900 flex flex-col font-['Cairo',sans-serif]">
      {/* Top App Header */}
      {currentUser && (
        <Header
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
          pendingSyncCount={pendingSyncCount}
          isOnline={isOnline}
          onToggleOnline={handleToggleOnline}
        />
      )}

      {/* Main Content View */}
      <main className="flex-1">
        {currentScreen === 'LOGIN' || !currentUser ? (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        ) : currentScreen === 'DASHBOARD' ? (
          <DashboardScreen
            currentUser={currentUser}
            onNavigate={handleNavigate}
            isOnline={isOnline}
          />
        ) : currentScreen === 'POS' ? (
          <SalesScreen
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('DASHBOARD')}
            onSaleCompleted={updatePendingCount}
          />
        ) : currentScreen === 'QUOTATIONS' ? (
          <QuotationsScreen />
        ) : currentScreen === 'PURCHASES' ? (
          <PurchasesScreen />
        ) : currentScreen === 'INVENTORY_HUB' ? (
          <InventoryHubScreen />
        ) : currentScreen === 'CUSTOMERS' ? (
          <CustomersScreen />
        ) : currentScreen === 'SUPPLIERS' ? (
          <SuppliersScreen />
        ) : currentScreen === 'TREASURY' ? (
          <TreasuryScreen />
        ) : currentScreen === 'PRODUCTS' ? (
          <ProductsScreen
            onBackToDashboard={() => handleNavigate('DASHBOARD')}
          />
        ) : currentScreen === 'INVOICES' ? (
          <InvoicesScreen
            onBackToDashboard={() => handleNavigate('DASHBOARD')}
          />
        ) : currentScreen === 'REPORTS' ? (
          <ReportsScreen
            currentUser={currentUser}
          />
        ) : currentScreen === 'AI_ASSISTANT' ? (
          <AiAssistantScreen />
        ) : currentScreen === 'SETTINGS' ? (
          <SettingsScreen />
        ) : currentScreen === 'SYNC_QUEUE' ? (
          <SyncQueueScreen
            onBackToDashboard={() => handleNavigate('DASHBOARD')}
            isOnline={isOnline}
            onSyncStateChanged={updatePendingCount}
          />
        ) : null}
      </main>

      {/* Footer */}
      {currentUser && (
        <footer className="border-t border-gray-200 bg-white py-3 text-center text-xs text-gray-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>{settings.storeName} — نظام إدارة المبيعات وتخطيط الموارد (ERP Enterprise)</span>
            <span className="font-mono text-[11px] text-gray-400">
              Offline-First Architecture • Google Cloud Sync • Audit Trail Active
            </span>
          </div>
        </footer>
      )}
    </div>
  );
}
