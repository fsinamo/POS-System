import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import {
  Store,
  ShoppingCart,
  Package,
  History,
  BarChart3,
  Settings,
  QrCode,
  Printer,
  Wifi,
  WifiOff,
  User,
  ShieldCheck,
  Lock,
  Layers,
} from 'lucide-react';

interface NavbarProps {
  onOpenScanner: () => void;
  onOpenPinModal: () => void;
  onOpenHoldCarts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenScanner,
  onOpenPinModal,
  onOpenHoldCarts,
}) => {
  const {
    activeTab,
    setActiveTab,
    cart,
    holdCarts,
    currentUser,
    settings,
    isOnline,
    connectBluetoothPrinter,
  } = usePOS();

  const [isConnectingPrinter, setIsConnectingPrinter] = useState(false);

  const navItems: Array<{
    id: 'pos' | 'inventory' | 'history' | 'reports' | 'settings';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    ownerOnly?: boolean;
  }> = [
    { id: 'pos', label: 'Kasir (POS)', icon: ShoppingCart },
    { id: 'inventory', label: 'Stok & Produk', icon: Package },
    { id: 'history', label: 'Riwayat Transaksi', icon: History },
    { id: 'reports', label: 'Laporan Keuangan', icon: BarChart3, ownerOnly: true },
    { id: 'settings', label: 'Pengaturan Toko', icon: Settings, ownerOnly: true },
  ];

  const handlePrinterClick = async () => {
    setIsConnectingPrinter(true);
    await connectBluetoothPrinter();
    setTimeout(() => setIsConnectingPrinter(false), 500);
  };

  const handleTabClick = (tabId: 'pos' | 'inventory' | 'history' | 'reports' | 'settings', isOwnerOnly?: boolean) => {
    if (isOwnerOnly && currentUser.role !== 'OWNER') {
      onOpenPinModal();
      return;
    }
    setActiveTab(tabId);
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Store Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white line-clamp-1">
                  {settings.storeName || 'KASIR POS PRO'}
                </span>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  POS PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block line-clamp-1">
                {settings.storeTagline || 'Sistem Kasir & Manajemen Toko'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isLocked = item.ownerOnly && currentUser.role !== 'OWNER';

              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => handleTabClick(item.id, item.ownerOnly)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all relative ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isLocked && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
                  {item.id === 'pos' && cartItemsCount > 0 && (
                    <span className="w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                      {cartItemsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Widgets */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Camera Barcode Scanner Button */}
            <button
              id="btn-scan-barcode"
              onClick={onOpenScanner}
              title="Buka Scanner Barcode Kamera"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Scan Barcode</span>
            </button>

            {/* Hold Cart button if there are saved carts */}
            {holdCarts.length > 0 && (
              <button
                id="btn-hold-carts"
                onClick={onOpenHoldCarts}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium transition-colors"
                title="Pesanan Disimpan"
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Tersimpan</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                  {holdCarts.length}
                </span>
              </button>
            )}

            {/* Bluetooth Printer Status / Toggle */}
            <button
              id="btn-printer-status"
              onClick={handlePrinterClick}
              disabled={isConnectingPrinter}
              title={
                settings.bluetoothConnected
                  ? `Printer: ${settings.bluetoothPrinterName}`
                  : 'Hubungkan Printer Bluetooth Thermal'
              }
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                settings.bluetoothConnected
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Printer className={`w-3.5 h-3.5 ${settings.bluetoothConnected ? 'text-teal-400' : ''}`} />
              <span className="truncate max-w-[100px]">
                {settings.bluetoothConnected ? 'Printer Ready' : 'Printer Off'}
              </span>
            </button>

            {/* Online / Offline Status Badge */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${
                isOnline
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
              }`}
              title={isOnline ? 'Online (Data sinkron)' : 'Offline (Tersimpan Lokal)'}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="hidden xl:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Active User Switcher / Profile */}
            <button
              id="btn-user-switch"
              onClick={onOpenPinModal}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 transition-colors"
              title="Ganti Pengguna / Masukkan PIN Pemilik"
            >
              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                {currentUser.avatar || (currentUser.role === 'OWNER' ? '👑' : '👤')}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-slate-200 line-clamp-1 leading-tight">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1">
                  {currentUser.role === 'OWNER' ? (
                    <span className="text-[10px] text-amber-400 font-medium flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" /> Pemilik
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                      <User className="w-2.5 h-2.5" /> Kasir
                    </span>
                  )}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1.5 no-scrollbar border-t border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isLocked = item.ownerOnly && currentUser.role !== 'OWNER';

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id, item.ownerOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {isLocked && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                {item.id === 'pos' && cartItemsCount > 0 && (
                  <span className="w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
