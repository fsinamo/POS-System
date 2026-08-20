export type PaymentMethod = 'TUNAI' | 'QRIS' | 'HUTANG';
export type TransactionStatus = 'LUNAS' | 'HUTANG' | 'RETUR_SEBAGIAN' | 'RETUR_TOTAL';
export type UserRole = 'OWNER' | 'KASIR';

export interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  buyPrice: number; // HPP (Harga Pokok Penjualan / Modal)
  sellPrice: number; // Harga Jual ke Konsumen
  stock: number;
  minStockAlert: number;
  unit: string; // pcs, porsi, botol, cup, kg, dll.
  imageUrl?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
  itemDiscount: number; // Potongan diskon per item (Rp)
  note?: string; // Catatan pesanan khusus (cth: "Pedas, tanpa es")
}

export interface TransactionItem {
  productId: string;
  productName: string;
  barcode: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  itemDiscount: number;
  subtotal: number;
  note?: string;
  returnedQty?: number;
}

export interface Transaction {
  id: string; // Nota/Invoice: cth TRX-20260819-001
  createdAt: string; // ISO date string
  cashierName: string;
  cashierId: string;
  customerName?: string;
  customerPhone?: string;
  items: TransactionItem[];
  subtotal: number;
  discountType: 'nominal' | 'percent';
  discountValue: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  totalCost: number; // Total HPP
  grossProfit: number; // Laba Kotor (Total Amount - Total Cost)
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  changeAmount?: number;
  dueDate?: string; // Untuk Hutang / Bon
  debtPaidAt?: string; // Tanggal pelunasan
  status: TransactionStatus;
  notes?: string;
  returnReason?: string;
  refundAmount?: number;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'OPNAME'; // IN = Tambah Masuk, OUT = Rusak/Hilang/Buang, OPNAME = Koreksi Fisik
  previousStock: number;
  adjustedQty: number; // + / -
  finalStock: number;
  reason: string;
  createdAt: string;
  performedBy: string;
}

export type PrinterConnectionType = 'SYSTEM_SPOOLER' | 'BLUETOOTH' | 'USB_SERIAL' | 'NETWORK_LAN';
export type OperatingSystemType = 'WINDOWS' | 'ANDROID' | 'LINUX' | 'MACOS' | 'IOS' | 'OTHER';

export interface SystemPrinterDevice {
  id: string;
  name: string;
  type: PrinterConnectionType;
  os: OperatingSystemType;
  status: 'ONLINE' | 'STANDBY' | 'DISCONNECTED';
  isDefault: boolean;
  paperWidth: '58mm' | '80mm' | 'A4';
  interfacePort?: string;
  details?: string;
  lastChecked?: string;
}

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  storeAddress: string;
  storePhone: string;
  footerMessage: string;
  taxRate: number; // persentase PPN (cth: 0 atau 11)
  enableTax: boolean;
  currencySymbol: string;
  paperWidth: '58mm' | '80mm';
  autoPrintReceipt: boolean;
  googleSheetsUrl: string;
  autoSyncGoogleSheets: boolean;
  lastSyncTime?: string;
  bluetoothPrinterName?: string;
  bluetoothConnected: boolean;
  // Multi-OS Printer Auto Detection fields
  detectedOS?: OperatingSystemType;
  osName?: string;
  spoolerName?: string;
  activePrinterId?: string;
  registeredPrinters?: SystemPrinterDevice[];
  autoCutPaper?: boolean;
  openDrawerOnPrint?: boolean;
  printMode?: 'SYSTEM_DIALOG' | 'BLUETOOTH_DIRECT' | 'RAW_ESCPOS';
}

export interface UserAccount {
  id: string;
  name: string;
  role: UserRole;
  pin: string; // 4 or 6 digit PIN
  avatar?: string;
}

export interface HoldCart {
  id: string;
  title: string;
  createdAt: string;
  items: CartItem[];
  customerName?: string;
  discountType: 'nominal' | 'percent';
  discountValue: number;
}
