import React, { useState } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Navbar } from './components/Navbar';
import { POSScreen } from './components/pos/POSScreen';
import { InventoryScreen } from './components/inventory/InventoryScreen';
import { HistoryScreen } from './components/history/HistoryScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { PinAuthModal } from './components/auth/PinAuthModal';
import { CameraScannerModal } from './components/pos/CameraScannerModal';
import { HoldCartModal } from './components/pos/HoldCartModal';

function POSAppContent() {
  const { activeTab } = usePOS();

  // Modals controlled at top level
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isHoldCartsOpen, setIsHoldCartsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-emerald-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenPinModal={() => setIsPinModalOpen(true)}
        onOpenHoldCarts={() => setIsHoldCartsOpen(true)}
      />

      {/* Main Screen Views */}
      <div className="flex-1">
        {activeTab === 'pos' && (
          <POSScreen
            isScannerOpen={isScannerOpen}
            onCloseScanner={() => setIsScannerOpen(false)}
            onOpenScanner={() => setIsScannerOpen(true)}
            isHoldCartsOpen={isHoldCartsOpen}
            onCloseHoldCarts={() => setIsHoldCartsOpen(false)}
            onOpenHoldCarts={() => setIsHoldCartsOpen(true)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryScreen onOpenPinModal={() => setIsPinModalOpen(true)} />
        )}

        {activeTab === 'history' && <HistoryScreen />}

        {activeTab === 'reports' && <ReportsScreen />}

        {activeTab === 'settings' && <SettingsScreen />}
      </div>

      {/* Global Modals */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />

      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

      <HoldCartModal
        isOpen={isHoldCartsOpen}
        onClose={() => setIsHoldCartsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <POSProvider>
      <POSAppContent />
    </POSProvider>
  );
}
