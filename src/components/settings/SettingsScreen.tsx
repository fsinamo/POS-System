import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { UserAccount, StoreSettings, SystemPrinterDevice, OperatingSystemType, PrinterConnectionType } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import {
  Settings,
  Store,
  Printer,
  QrCode,
  Users,
  Database,
  Cloud,
  Check,
  RefreshCw,
  RotateCcw,
  Copy,
  Download,
  Upload,
  Shield,
  Key,
  Trash2,
  Plus,
  Radio,
  ExternalLink,
  Sparkles,
  Monitor,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sliders,
  Settings2,
  HardDrive,
  Layers,
  X,
  Network,
  Wifi,
  Globe,
  Activity,
  Search,
  Zap,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    connectBluetoothPrinter,
    openCashDrawer,
    syncAllTransactionsToSheets,
    products,
    transactions,
    categories,
    detectedOSInfo,
    detectedPrinters,
    activePrinter,
    setActivePrinterId,
    scanAllPrinters,
    resetPrintersToDefault,
    scanBluetooth,
    scanSerialUSB,
    scanLanNetwork,
    pingLan,
    addCustomPrinter,
    deletePrinter,
    triggerPrintReceipt,
  } = usePOS();

  // Active subtab
  const [subTab, setSubTab] = useState<'store' | 'devices' | 'employees' | 'sheets' | 'backup'>(
    'devices'
  );

  // Store Profile Form State
  const [storeForm, setStoreForm] = useState<StoreSettings>({ ...settings });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Printer scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [printerScanMsg, setPrinterScanMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // LAN Scanner & Ping Tool State
  const [lanSubnet, setLanSubnet] = useState('192.168.1');
  const [pingTarget, setPingTarget] = useState('192.168.1.200:9100');
  const [isPingTesting, setIsPingTesting] = useState(false);
  const [pingResult, setPingResult] = useState<{ online: boolean; latencyMs: number; message: string } | null>(null);

  // Custom Printer Modal State
  const [isAddPrinterOpen, setIsAddPrinterOpen] = useState(false);
  const [customPrinterName, setCustomPrinterName] = useState('');
  const [customPrinterType, setCustomPrinterType] = useState<PrinterConnectionType>('NETWORK_LAN');
  const [customPrinterPort, setCustomPrinterPort] = useState('192.168.1.200:9100');
  const [customPrinterWidth, setCustomPrinterWidth] = useState<'58mm' | '80mm'>('80mm');
  const [customPrinterDetails, setCustomPrinterDetails] = useState('Printer Thermal LAN Network POS');

  // Employee modal/form state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'OWNER' | 'KASIR'>('KASIR');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserAvatar, setNewUserAvatar] = useState('👨‍💼');

  // Sheets Sync test status
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const handleSaveStoreProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(storeForm);
    setSaveSuccessMsg('Pengaturan toko berhasil disimpan!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleResetPrinters = () => {
    const res = resetPrintersToDefault();
    setPrinterScanMsg({ type: 'success', text: res.message });
    setTimeout(() => setPrinterScanMsg(null), 5000);
  };

  const handleScanAllPrinters = async () => {
    setIsScanning(true);
    setPrinterScanMsg(null);
    try {
      const res = await scanAllPrinters();
      setPrinterScanMsg({ type: 'success', text: res.message });
    } catch (err: any) {
      setPrinterScanMsg({ type: 'error', text: err?.message || 'Gagal memindai printer sistem.' });
    } finally {
      setIsScanning(false);
      setTimeout(() => setPrinterScanMsg(null), 5000);
    }
  };

  const handleScanBluetooth = async () => {
    setIsScanning(true);
    setPrinterScanMsg(null);
    const res = await scanBluetooth();
    setIsScanning(false);
    setPrinterScanMsg({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    setTimeout(() => setPrinterScanMsg(null), 5000);
  };

  const handleScanSerialUSB = async () => {
    setIsScanning(true);
    setPrinterScanMsg(null);
    const res = await scanSerialUSB();
    setIsScanning(false);
    setPrinterScanMsg({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    setTimeout(() => setPrinterScanMsg(null), 5000);
  };

  const handleScanLanNetwork = async () => {
    setIsScanning(true);
    setPrinterScanMsg(null);
    try {
      const res = await scanLanNetwork(lanSubnet.trim() || '192.168.1');
      setPrinterScanMsg({
        type: 'success',
        text: res.message,
      });
    } catch (err: any) {
      setPrinterScanMsg({
        type: 'error',
        text: err?.message || 'Gagal memindai subnet LAN.',
      });
    } finally {
      setIsScanning(false);
      setTimeout(() => setPrinterScanMsg(null), 6000);
    }
  };

  const handlePingTest = async (ipPortToTest?: string) => {
    const target = ipPortToTest || pingTarget;
    if (!target.trim()) return;

    setIsPingTesting(true);
    setPingResult(null);

    const parts = target.trim().split(':');
    const ip = parts[0];
    const port = parts[1] || '9100';

    const res = await pingLan(`${ip}:${port}`);
    setIsPingTesting(false);
    setPingResult(res);
  };

  const handleAddLanPreset = (preset: {
    name: string;
    ipPort: string;
    details: string;
    paperWidth: '58mm' | '80mm';
  }) => {
    addCustomPrinter({
      name: preset.name,
      type: 'NETWORK_LAN',
      os: detectedOSInfo.os,
      status: 'ONLINE',
      isDefault: false,
      paperWidth: preset.paperWidth,
      interfacePort: preset.ipPort,
      details: preset.details,
    });

    setPrinterScanMsg({
      type: 'success',
      text: `Printer LAN "${preset.name}" (${preset.ipPort}) berhasil ditambahkan & dijadikan printer aktif!`,
    });
    setTimeout(() => setPrinterScanMsg(null), 5000);
  };

  const handleAddCustomPrinterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrinterName.trim()) return;

    addCustomPrinter({
      name: customPrinterName.trim(),
      type: customPrinterType,
      os: detectedOSInfo.os,
      status: 'ONLINE',
      isDefault: false,
      paperWidth: customPrinterWidth,
      interfacePort: customPrinterPort.trim(),
      details: customPrinterDetails.trim(),
    });

    setCustomPrinterName('');
    setIsAddPrinterOpen(false);
    setPrinterScanMsg({
      type: 'success',
      text: `Printer "${customPrinterName}" berhasil ditambahkan!`,
    });
    setTimeout(() => setPrinterScanMsg(null), 4000);
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPin.trim()) return;

    addUser({
      name: newUserName.trim(),
      role: newUserRole,
      pin: newUserPin.trim(),
      avatar: newUserAvatar,
    });

    setNewUserName('');
    setNewUserPin('');
    setIsAddUserOpen(false);
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    const res = await syncAllTransactionsToSheets();
    setIsSyncing(false);
    setSyncStatusMsg(res.message);
  };

  // Backup data to JSON file
  const handleExportBackupJSON = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      storeSettings: settings,
      products,
      categories,
      transactions,
      users,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `Backup_POS_${settings.storeName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getOSIcon = (os: OperatingSystemType) => {
    switch (os) {
      case 'WINDOWS':
        return <Monitor className="w-5 h-5 text-sky-500" />;
      case 'ANDROID':
        return <Smartphone className="w-5 h-5 text-emerald-500" />;
      case 'LINUX':
        return <Laptop className="w-5 h-5 text-amber-500" />;
      case 'MACOS':
      case 'IOS':
        return <Laptop className="w-5 h-5 text-slate-700" />;
      default:
        return <HardDrive className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getTypeBadge = (type: PrinterConnectionType) => {
    switch (type) {
      case 'SYSTEM_SPOOLER':
        return { label: 'System Spooler', bg: 'bg-sky-100 text-sky-800 border-sky-200' };
      case 'BLUETOOTH':
        return { label: 'Bluetooth Wireless', bg: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'USB_SERIAL':
        return { label: 'USB / Serial COM', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'NETWORK_LAN':
        return { label: 'LAN Network IP', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { label: 'Standard', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const appsScriptTemplate = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Transaksi POS") || ss.insertSheet("Transaksi POS");
    
    // Buat header jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Waktu", "No. Nota", "Nama Toko", "Kasir", "Pelanggan", 
        "Ringkasan Barang", "Total Qty", "Subtotal", "Diskon", "Pajak", 
        "Total Akhir", "Total Modal (HPP)", "Laba Bersih", "Metode Bayar", "Status"
      ]);
    }
    
    // Simpan baris transaksi
    sheet.appendRow([
      data.date,
      data.invoice,
      data.storeName,
      data.cashier,
      data.customer,
      data.itemsSummary,
      data.totalItems,
      data.subtotal,
      data.discount,
      data.tax,
      data.totalAmount,
      data.totalHPP,
      data.grossProfit,
      data.paymentMethod,
      data.status
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-900 text-white">
            <Settings className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Pengaturan Toko & Sistem
            </h1>
            <p className="text-xs text-slate-500">
              Konfigurasi profil struk, printer bluetooth, karyawan kasir, dan integrasi Google Sheets.
            </p>
          </div>
        </div>
      </div>

      {/* Sub Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs no-scrollbar">
        {[
          { id: 'store', label: 'Profil Toko', icon: Store },
          { id: 'devices', label: 'Perangkat & Printer', icon: Printer },
          { id: 'employees', label: 'Manajemen Karyawan', icon: Users },
          { id: 'sheets', label: 'Google Sheets (Apps Script)', icon: Cloud },
          { id: 'backup', label: 'Backup & Database Lokal', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* SUBTAB 1: Profil Toko */}
      {subTab === 'store' && (
        <form onSubmit={handleSaveStoreProfile} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store className="w-5 h-5 text-emerald-600" />
            Informasi Toko & Tampilan Struk
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Toko / Usaha <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={storeForm.storeName}
                onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Slogan / Subjudul Toko
              </label>
              <input
                type="text"
                value={storeForm.storeTagline}
                onChange={(e) => setStoreForm({ ...storeForm, storeTagline: e.target.value })}
                placeholder="Pusat Belanja & Kuliner Serba Ada"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Lengkap Toko
              </label>
              <input
                type="text"
                value={storeForm.storeAddress}
                onChange={(e) => setStoreForm({ ...storeForm, storeAddress: e.target.value })}
                placeholder="Jl. Merdeka No. 45"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={storeForm.storePhone}
                onChange={(e) => setStoreForm({ ...storeForm, storePhone: e.target.value })}
                placeholder="0812-3456-7890"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pesan Footer Struk (Catatan Penutup)
              </label>
              <textarea
                rows={3}
                value={storeForm.footerMessage}
                onChange={(e) => setStoreForm({ ...storeForm, footerMessage: e.target.value })}
                placeholder="Terima kasih atas kunjungan Anda!..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 md:col-span-2 flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 block">Aktifkan Pajak / PPN</label>
                <span className="text-[11px] text-slate-500">
                  Secara otomatis menambahkan persentase pajak pada total belanja
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={storeForm.taxRate}
                  onChange={(e) => setStoreForm({ ...storeForm, taxRate: Number(e.target.value) })}
                  className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-center bg-white"
                />
                <span className="text-xs font-bold">%</span>
                <input
                  type="checkbox"
                  checked={storeForm.enableTax}
                  onChange={(e) => setStoreForm({ ...storeForm, enableTax: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Simpan Perubahan Profil
            </button>
          </div>
        </form>
      )}

      {/* SUBTAB 2: Sambungan Perangkat (Deteksi Otomatis Multi-OS Printer, Scanner, Cash Drawer) */}
      {subTab === 'devices' && (
        <div className="space-y-5">
          {/* OS Auto-Detection & Print Engine Status Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-md text-white space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/80 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                  {getOSIcon(detectedOSInfo.os)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Sistem Operasi Terdeteksi
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {detectedOSInfo.os}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {detectedOSInfo.osName} &mdash; {detectedOSInfo.browser}
                  </h2>
                  <p className="text-xs text-slate-300">
                    Print Spooler Aktif:{' '}
                    <span className="font-semibold text-emerald-300 font-mono">
                      {detectedOSInfo.spoolerName}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  id="btn-reset-printers"
                  onClick={handleResetPrinters}
                  title="Bersihkan semua printer tambahan dan kembalikan hanya printer sistem asli"
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  Bersihkan / Reset Printer
                </button>

                <button
                  type="button"
                  id="btn-scan-all-printers"
                  onClick={handleScanAllPrinters}
                  disabled={isScanning}
                  className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  {isScanning ? 'Memindai Sistem...' : 'Deteksi Otomatis Printer'}
                </button>
              </div>
            </div>

            {/* Hardware APIs Compatibility Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-sky-400" />
                  <span className="text-slate-300">System Spooler Dialog</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Didukung Penuh
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-teal-400" />
                  <span className="text-slate-300">Web Bluetooth (Wireless)</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    detectedOSInfo.hasBluetoothSupport
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {detectedOSInfo.hasBluetoothSupport ? 'Siap / Tersedia' : 'Simulasi / Browser'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-indigo-400" />
                  <span className="text-slate-300">Web Serial / USB COM</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    detectedOSInfo.hasSerialSupport
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {detectedOSInfo.hasSerialSupport ? 'Siap / Tersedia' : 'Standard Driver'}
                </span>
              </div>
            </div>

            {/* Notification alert banner */}
            {printerScanMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 ${
                  printerScanMsg.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-600/60 text-emerald-200'
                    : 'bg-rose-950/80 border border-rose-600/60 text-rose-200'
                }`}
              >
                {printerScanMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span>{printerScanMsg.text}</span>
              </div>
            )}
          </div>

          {/* Quick Hardware Scan Actions Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Pindai Perangkat Spesifik:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="btn-scan-lan-network"
                onClick={handleScanLanNetwork}
                disabled={isScanning}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Network className="w-3.5 h-3.5 text-sky-400" />
                Pindai Jaringan LAN (IP Subnet)
              </button>

              <button
                type="button"
                id="btn-scan-bluetooth"
                onClick={handleScanBluetooth}
                disabled={isScanning}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Radio className="w-3.5 h-3.5 text-teal-400" />
                Pindai Bluetooth POS
              </button>

              <button
                type="button"
                id="btn-scan-usb-serial"
                onClick={handleScanSerialUSB}
                disabled={isScanning}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                Pindai Port USB / Serial
              </button>

              <button
                type="button"
                id="btn-add-custom-printer"
                onClick={() => setIsAddPrinterOpen(true)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                Tambah Manual IP / Port
              </button>

              <button
                type="button"
                id="btn-test-print-dialog"
                onClick={() => triggerPrintReceipt()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Tes Cetak Sample
              </button>
            </div>
          </div>

          {/* Windows LAN Network Printer Discovery & Quick Setup Hub */}
          <div className="bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50/30 p-5 rounded-2xl border border-sky-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-2xs">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    Deteksi & Integrasi Printer Jaringan LAN Windows
                  </h3>
                  <p className="text-xs text-slate-600">
                    Mendeteksi printer thermal Ethernet & WiFi LAN pada subnet Windows (Port 9100 / WSD / TCP-IP)
                  </p>
                </div>
              </div>

              {/* Subnet Scanner Form */}
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 pl-2">Subnet:</span>
                <input
                  type="text"
                  value={lanSubnet}
                  onChange={(e) => setLanSubnet(e.target.value)}
                  placeholder="192.168.1"
                  className="w-24 px-2 py-1 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={handleScanLanNetwork}
                  disabled={isScanning}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <Search className="w-3.5 h-3.5" />
                  {isScanning ? 'Memindai...' : 'Pindai Subnet'}
                </button>
              </div>
            </div>

            {/* Panduan & Tambah Printer LAN */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-sky-600" />
                    Koneksi Printer LAN / WiFi (IP Address):
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Masukkan IP printer kasir yang terhubung dalam satu jaringan router/WiFi lokal (misal: 192.168.1.200).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddPrinterOpen(true)}
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5 text-sky-600" />
                  Tambah IP Printer Baru
                </button>
              </div>
            </div>

            {/* Quick Ping Tester Tool */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-bold text-slate-800">Uji Ping / Latensi IP Printer LAN:</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={pingTarget}
                  onChange={(e) => setPingTarget(e.target.value)}
                  placeholder="192.168.1.200:9100"
                  className="flex-1 sm:w-48 px-2.5 py-1.5 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => handlePingTest()}
                  disabled={isPingTesting}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <Activity className={`w-3.5 h-3.5 ${isPingTesting ? 'animate-pulse text-emerald-400' : ''}`} />
                  {isPingTesting ? 'Ping...' : 'Cek Status'}
                </button>
              </div>
            </div>

            {pingResult && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
                  pingResult.online
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                    : 'bg-rose-50 border border-rose-300 text-rose-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${pingResult.online ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                  <span>{pingResult.message}</span>
                </div>
                {pingResult.online && (
                  <button
                    type="button"
                    onClick={() => {
                      const parts = pingTarget.split(':');
                      handleAddLanPreset({
                        name: `Printer LAN (${pingTarget})`,
                        ipPort: pingTarget,
                        details: `Printer Jaringan LAN Terverifikasi (${pingResult.latencyMs}ms)`,
                        paperWidth: '80mm',
                      });
                    }}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold"
                  >
                    Jadikan Printer Kasir
                  </button>
                )}
              </div>
            )}
          </div>

          {/* List of Detected / Registered Printers */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-600" />
                  Daftar Printer Terdeteksi di Sistem ({detectedPrinters.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih salah satu printer sebagai printer kasir aktif untuk cetak nota otomatis
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Printer Kasir Aktif:</span>
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {activePrinter?.name || 'Printer Sistem'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detectedPrinters.map((printer) => {
                const isSelected = printer.id === settings.activePrinterId || printer.id === activePrinter?.id;
                const badge = getTypeBadge(printer.type);

                return (
                  <div
                    key={printer.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {printer.paperWidth}
                          </span>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white">
                              ✓ DEFAULT KASIR
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{printer.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{printer.details}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            printer.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={printer.status === 'ONLINE' ? 'Siap Cetak' : 'Standby'}
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 flex justify-between items-center">
                      <span className="text-slate-400">Port / Alamat:</span>
                      <span className="font-semibold text-slate-800">{printer.interfacePort || 'System Spooler'}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        {!isSelected ? (
                          <button
                            type="button"
                            onClick={() => setActivePrinterId(printer.id)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            Pilih Sebagai Default
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Aktif
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {printer.type === 'NETWORK_LAN' && (
                          <button
                            type="button"
                            onClick={() => {
                              setPingTarget(printer.interfacePort || '192.168.1.200:9100');
                              handlePingTest(printer.interfacePort);
                            }}
                            className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            title="Tes Ping ke IP Printer LAN"
                          >
                            <Activity className="w-3.5 h-3.5 text-sky-600" />
                            Ping
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => triggerPrintReceipt(printer)}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-600" />
                          Tes Cetak
                        </button>

                        {(detectedPrinters.length > 1 || !printer.isDefault) && (
                          <button
                            type="button"
                            onClick={() => deletePrinter(printer.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus printer dari daftar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Print Preferences & Paper Width Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-5 h-5 text-emerald-600" />
              Preferensi Cetak Struk & Ukuran Kertas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Paper Width */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="block text-xs font-bold text-slate-800">Format Ukuran Kertas</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['58mm', '80mm'] as const).map((width) => (
                    <button
                      key={width}
                      type="button"
                      onClick={() => updateSettings({ paperWidth: width })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
                        settings.paperWidth === width
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {width === '58mm' ? '58mm (Mini POS)' : '80mm (Standar)'}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  58mm untuk printer thermal mini kasir, 80mm untuk printer kasir resto/supermarket.
                </p>
              </div>

              {/* Auto Print */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800">Cetak Otomatis Saat Checkout</label>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Langsung memunculkan dialog cetak struk tanpa perlu menekan tombol cetak manual.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={settings.autoPrintReceipt}
                    onChange={(e) => updateSettings({ autoPrintReceipt: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-800">Aktifkan Auto-Print</span>
                </label>
              </div>

              {/* Open Drawer */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800">Buka Laci Kasir Otomatis</label>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Kirim sinyal trigger pembuka laci kasir saat transaksi pembayaran tunai selesai.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={settings.openDrawerOnPrint ?? false}
                    onChange={(e) => updateSettings({ openDrawerOnPrint: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-800">Buka Laci Uang Tunai</span>
                </label>
              </div>
            </div>
          </div>

          {/* Scanner Barcode Configuration */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-800">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Scanner Barcode</h3>
                <p className="text-xs text-slate-500">
                  Mendukung Barcode Gun USB / Bluetooth (Plug & Play) dan Kamera HP / Webcam
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-900 block mb-1">
                  1. Mode Hardware (Scanner Fisik / USB)
                </span>
                <p className="text-slate-500 leading-relaxed">
                  Cukup colokkan barcode scanner USB/Bluetooth ke komputer/tablet Windows, Linux, maupun Android OTG. Sistem POS akan
                  otomatis mendeteksi pembacaan barcode tanpa perlu menekan input manual.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-900 block mb-1">
                  2. Mode Kamera (HP / Webcam)
                </span>
                <p className="text-slate-500 leading-relaxed">
                  Gunakan tombol "Scan Barcode" di navbar kasir untuk mengaktifkan pemindaian barcode
                  langsung melalui kamera perangkat.
                </p>
              </div>
            </div>
          </div>

          {/* Cash Drawer (Laci Kasir) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Laci Uang Kasir (Cash Drawer)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kirim sinyal trigger pembuka laci kasir otomatis saat checkout tunai selesai
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openCashDrawer}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                Tes Buka Laci Kasir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Printer Custom IP / LAN */}
      {isAddPrinterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Tambah Printer Jaringan / Custom</h3>
              </div>
              <button
                onClick={() => setIsAddPrinterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomPrinterSubmit} className="p-5 space-y-4 text-xs">
              {/* Quick Template Chips */}
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 block">Template Cepat:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'EPSON TM-T82 LAN', ip: '192.168.1.200:9100', width: '80mm' as const, type: 'NETWORK_LAN' as const },
                    { name: 'Xprinter POS-80 LAN', ip: '192.168.1.100:9100', width: '80mm' as const, type: 'NETWORK_LAN' as const },
                    { name: 'Windows Shared LAN', ip: '\\\\DESKTOP-POS\\Kasir', width: '58mm' as const, type: 'NETWORK_LAN' as const },
                    { name: 'USB POS Thermal', ip: 'USB001 / COM3', width: '58mm' as const, type: 'USB_SERIAL' as const },
                  ].map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => {
                        setCustomPrinterName(tpl.name);
                        setCustomPrinterPort(tpl.ip);
                        setCustomPrinterWidth(tpl.width);
                        setCustomPrinterType(tpl.type);
                        setCustomPrinterDetails(`Printer ${tpl.name} (${tpl.ip})`);
                      }}
                      className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-[10px] font-bold transition-all"
                    >
                      + {tpl.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Printer <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customPrinterName}
                  onChange={(e) => setCustomPrinterName(e.target.value)}
                  placeholder="Contoh: EPSON TM-T82 LAN (Dapur)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Koneksi</label>
                  <select
                    value={customPrinterType}
                    onChange={(e) => setCustomPrinterType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium bg-white"
                  >
                    <option value="NETWORK_LAN">LAN Network (IP:9100)</option>
                    <option value="USB_SERIAL">USB / Serial COM</option>
                    <option value="BLUETOOTH">Bluetooth Wireless</option>
                    <option value="SYSTEM_SPOOLER">System Spooler</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ukuran Kertas</label>
                  <select
                    value={customPrinterWidth}
                    onChange={(e) => setCustomPrinterWidth(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium bg-white"
                  >
                    <option value="58mm">58mm (Mini)</option>
                    <option value="80mm">80mm (Standar)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat Port / IP Jaringan
                </label>
                <input
                  type="text"
                  required
                  value={customPrinterPort}
                  onChange={(e) => setCustomPrinterPort(e.target.value)}
                  placeholder="192.168.1.200:9100 atau COM3"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Lokasi</label>
                <input
                  type="text"
                  value={customPrinterDetails}
                  onChange={(e) => setCustomPrinterDetails(e.target.value)}
                  placeholder="Contoh: Printer Kasir Depan / Dapur"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPrinterOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Printer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Manajemen Karyawan & Hak Akses Kasir vs Pemilik */}
      {subTab === 'employees' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Daftar Karyawan & Hak Akses
                </h3>
                <p className="text-xs text-slate-500">
                  Akun Pemilik (Akses penuh & Laporan Keuangan) vs Akun Kasir (Khusus transaksi)
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Tambah Karyawan
            </button>
          </div>

          {/* User List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {users.map((user) => {
              const isCurrent = currentUser.id === user.id;

              return (
                <div
                  key={user.id}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xl shadow-2xs">
                      {user.avatar || '👤'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{user.name}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-600 text-white">
                            Aktif
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span
                          className={`font-semibold ${
                            user.role === 'OWNER' ? 'text-amber-700' : 'text-slate-600'
                          }`}
                        >
                          Role: {user.role === 'OWNER' ? '👑 Pemilik' : '👩‍💼 Kasir'}
                        </span>
                        <span>•</span>
                        <span>PIN: ****</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {users.length > 1 && (
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        title="Hapus Karyawan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Employee Dialog */}
          {isAddUserOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
                <h3 className="font-bold text-base text-slate-900">Tambah Akun Karyawan Baru</h3>

                <form onSubmit={handleAddEmployee} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Karyawan
                    </label>
                    <input
                      type="text"
                      required
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Contoh: Rian Pratama (Kasir)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Hak Akses (Role)
                      </label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="KASIR">Kasir</option>
                        <option value="OWNER">Pemilik (Full Access)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        PIN Masuk (4-6 digit)
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={6}
                        value={newUserPin}
                        onChange={(e) => setNewUserPin(e.target.value)}
                        placeholder="Contoh: 1234"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-center font-mono font-bold tracking-widest focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddUserOpen(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                    >
                      Simpan Karyawan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: Google Sheets & Apps Script Integration */}
      {subTab === 'sheets' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Penyimpanan Online ke Google Sheets
              </h3>
              <p className="text-xs text-slate-500">
                Sinkronkan setiap nota penjualan otomatis ke Google Spreadsheet pemilik toko secara gratis.
              </p>
            </div>
          </div>

          {/* Webhook Form */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL Google Apps Script Web App
              </label>
              <input
                type="url"
                value={settings.googleSheetsUrl}
                onChange={(e) => updateSettings({ googleSheetsUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoSyncGoogleSheets}
                  onChange={(e) => updateSettings({ autoSyncGoogleSheets: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span>Otomatis Sinkronkan saat Transaksi Selesai</span>
              </label>

              <button
                type="button"
                onClick={handleTriggerSync}
                disabled={isSyncing || !settings.googleSheetsUrl}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  isSyncing || !settings.googleSheetsUrl
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            </div>

            {syncStatusMsg && (
              <div className="p-2.5 rounded-lg bg-slate-900 text-white text-xs font-medium mt-2">
                {syncStatusMsg}
              </div>
            )}
          </div>

          {/* Tutorial Guide */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Cara Pengaturan Google Sheets (Gratis & Mudah):
            </h4>

            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              <li>Buka Google Spreadsheet baru di browser Anda (sheets.new).</li>
              <li>Klik menu <strong>Extensions (Ekstensi)</strong> → <strong>Apps Script</strong>.</li>
              <li>Hapus semua kode lama, lalu salin dan tempelkan kode di bawah ini.</li>
              <li>Klik tombol <strong>Deploy (Terapkan)</strong> → <strong>New deployment (Penerapan baru)</strong>.</li>
              <li>Pilih jenis <strong>Web app</strong>, ubah "Who has access (Siapa yang memiliki akses)" menjadi <strong>Anyone (Siapa saja)</strong>, lalu klik <strong>Deploy</strong>.</li>
              <li>Salin URL Web App yang dihasilkan, lalu tempelkan ke kolom URL di atas!</li>
            </ol>

            <div className="relative bg-slate-900 rounded-xl p-4 text-slate-200 font-mono text-[11px] overflow-x-auto">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                <span className="text-slate-400 font-bold">Kode Google Apps Script (Code.gs)</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(appsScriptTemplate);
                    alert('Kode Apps Script berhasil disalin ke clipboard!');
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-xs font-sans font-semibold flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Salin Kode
                </button>
              </div>
              <pre className="text-emerald-300">{appsScriptTemplate}</pre>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: Backup & Database Lokal */}
      {subTab === 'backup' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-slate-900 text-white">
              <Database className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Database Lokal & Cadangan Data (Backup)
              </h3>
              <p className="text-xs text-slate-500">
                Aplikasi menyimpan data di IndexedDB / LocalStorage perangkat Anda, bekerja 100% offline tanpa internet.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export Backup */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">Unduh Cadangan Lengkap (JSON)</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Simpan seluruh data produk, riwayat transaksi, dan pengaturan toko ke berkas JSON di komputer/HP Anda.
                </p>
              </div>

              <button
                onClick={handleExportBackupJSON}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Unduh Berkas Backup (.json)
              </button>
            </div>

            {/* PWA Ready Info */}
            <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50/60 space-y-2 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-emerald-950 mb-1">
                  📱 Dukungan Aplikasi PWA (Progressive Web App)
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Aplikasi ini dapat diinstal langsung di layar utama (Home Screen) smartphone Android, iOS, maupun desktop seperti aplikasi kasir asli.
                </p>
              </div>

              <span className="text-[11px] font-semibold text-emerald-900 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 block text-center">
                ✅ Mode Offline Aktif • Data tersimpan aman di perangkat
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
