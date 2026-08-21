import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Product,
  CartItem,
  Transaction,
  StoreSettings,
  UserAccount,
  HoldCart,
  StockAdjustment,
  PaymentMethod,
  TransactionItem,
  SystemPrinterDevice,
  OperatingSystemType,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_USERS,
  INITIAL_SETTINGS,
  INITIAL_TRANSACTIONS,
} from '../data/initialData';
import { generateInvoiceNumber, syncToGoogleSheets } from '../utils/formatters';
import {
  detectOperatingSystem,
  getDefaultDetectedPrinters,
  sanitizePrinterList,
  isGhostPrinter,
  scanBluetoothPrinter,
  scanSerialUSBPrinter,
  scanNetworkLanPrinters,
  pingLanPrinter,
  executeTestPrint,
  OSInfo,
} from '../utils/printerDetector';

interface POSContextType {
  // Products & Categories
  products: Product[];
  categories: string[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (name: string) => void;
  deleteCategory: (name: string) => void;
  adjustStock: (adjustment: Omit<StockAdjustment, 'id' | 'createdAt' | 'performedBy'>) => void;
  recordProduction: (params: {
    productId: string;
    quantity: number;
    costPerUnit?: number;
    batchNumber?: string;
    notes?: string;
  }) => void;
  recordPurchase: (params: {
    productId: string;
    quantity: number;
    buyPricePerUnit: number;
    supplierName?: string;
    invoiceNumber?: string;
    notes?: string;
    updateProductBuyPrice?: boolean;
  }) => void;
  stockAdjustments: StockAdjustment[];

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  updateItemNote: (productId: string, note: string) => void;
  clearCart: () => void;
  
  // Cart totals & discounts
  discountType: 'nominal' | 'percent';
  discountValue: number;
  setDiscount: (type: 'nominal' | 'percent', value: number) => void;
  cartSubtotal: number;
  cartDiscountAmount: number;
  cartTaxAmount: number;
  cartTotal: number;
  cartTotalCost: number;

  // Hold Carts (Simpan Pesanan Sementara)
  holdCarts: HoldCart[];
  saveHoldCart: (title?: string, customerName?: string) => void;
  resumeHoldCart: (holdId: string) => void;
  deleteHoldCart: (holdId: string) => void;

  // Transactions & Checkout
  transactions: Transaction[];
  processCheckout: (params: {
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    customerName?: string;
    customerPhone?: string;
    dueDate?: string;
    notes?: string;
  }) => Promise<Transaction>;
  settleDebt: (transactionId: string) => void;
  processReturn: (transactionId: string, returnItems: { productId: string; qty: number }[], reason: string) => void;
  
  // Users & Auth
  users: UserAccount[];
  currentUser: UserAccount;
  switchUser: (pin: string) => { success: boolean; message: string };
  setCurrentUserDirect: (user: UserAccount) => void;
  addUser: (user: Omit<UserAccount, 'id'>) => void;
  updateUser: (id: string, updates: Partial<UserAccount>) => void;
  deleteUser: (id: string) => void;

  // Settings & Printers
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  detectedOSInfo: OSInfo;
  detectedPrinters: SystemPrinterDevice[];
  activePrinter: SystemPrinterDevice | undefined;
  setActivePrinterId: (id: string) => void;
  scanAllPrinters: () => Promise<{ count: number; message: string }>;
  resetPrintersToDefault: () => { count: number; message: string };
  scanBluetooth: () => Promise<{ success: boolean; message: string }>;
  scanSerialUSB: () => Promise<{ success: boolean; message: string }>;
  scanLanNetwork: (subnet?: string) => Promise<{ count: number; message: string; devices: SystemPrinterDevice[] }>;
  pingLan: (ipPort: string) => Promise<{ online: boolean; latencyMs: number; message: string }>;
  addCustomPrinter: (printer: Omit<SystemPrinterDevice, 'id' | 'lastChecked'>) => void;
  deletePrinter: (id: string) => void;
  connectBluetoothPrinter: () => Promise<boolean>;
  openCashDrawer: () => void;
  triggerPrintReceipt: (printer?: SystemPrinterDevice) => void;
  syncAllTransactionsToSheets: () => Promise<{ success: boolean; message: string }>;

  // UI state
  activeTab: 'pos' | 'inventory' | 'history' | 'reports' | 'settings';
  setActiveTab: (tab: 'pos' | 'inventory' | 'history' | 'reports' | 'settings') => void;
  latestCompletedTransaction: Transaction | null;
  setLatestCompletedTransaction: (trx: Transaction | null) => void;
  isOnline: boolean;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  PRODUCTS: 'pos_pro_products_v1',
  CATEGORIES: 'pos_pro_categories_v1',
  CART: 'pos_pro_cart_v1',
  HOLD_CARTS: 'pos_pro_hold_carts_v1',
  TRANSACTIONS: 'pos_pro_transactions_v1',
  SETTINGS: 'pos_pro_settings_v1',
  USERS: 'pos_pro_users_v1',
  STOCK_ADJUSTMENTS: 'pos_pro_stock_adjustments_v1',
  CURRENT_USER_ID: 'pos_pro_current_user_id_v1',
};

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'history' | 'reports' | 'settings'>('pos');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const detectedOSInfo = useMemo(() => detectOperatingSystem(), []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS);
    if (!saved) return INITIAL_PRODUCTS;
    try {
      const parsed: Product[] = JSON.parse(saved);
      return parsed.map((p) => ({
        ...p,
        procurementType:
          p.procurementType ||
          (p.category === 'Makanan' || p.category === 'Minuman' ? 'PRODUKSI' : 'PEMBELIAN'),
      }));
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Categories
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  // Stock adjustments log
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.STOCK_ADJUSTMENTS);
    return saved ? JSON.parse(saved) : [];
  });

  // Users
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const savedId = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_USER_ID);
    const found = users.find((u) => u.id === savedId);
    return found || users[0] || INITIAL_USERS[0];
  });

  // Settings with OS & Printer auto-detection
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS);
    const osInfo = detectOperatingSystem();
    const defaultPrinters = getDefaultDetectedPrinters(osInfo);
    if (saved) {
      const parsed = JSON.parse(saved);
      const cleanedPrinters = sanitizePrinterList(parsed.registeredPrinters, osInfo);
      const activeIdValid = cleanedPrinters.some((p) => p.id === parsed.activePrinterId)
        ? parsed.activePrinterId
        : cleanedPrinters[0]?.id;

      return {
        ...INITIAL_SETTINGS,
        ...parsed,
        detectedOS: parsed.detectedOS || osInfo.os,
        osName: parsed.osName || osInfo.osName,
        spoolerName: parsed.spoolerName || osInfo.spoolerName,
        registeredPrinters: cleanedPrinters,
        activePrinterId: activeIdValid,
        printMode: parsed.printMode || osInfo.recommendedMode,
        autoCutPaper: parsed.autoCutPaper ?? true,
        openDrawerOnPrint: parsed.openDrawerOnPrint ?? false,
      };
    }
    return {
      ...INITIAL_SETTINGS,
      detectedOS: osInfo.os,
      osName: osInfo.osName,
      spoolerName: osInfo.spoolerName,
      registeredPrinters: defaultPrinters,
      activePrinterId: defaultPrinters[0]?.id,
      printMode: osInfo.recommendedMode,
      autoCutPaper: true,
      openDrawerOnPrint: false,
    };
  });

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CART);
    return saved ? JSON.parse(saved) : [];
  });

  const [discountType, setDiscountType] = useState<'nominal' | 'percent'>('nominal');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Hold Carts
  const [holdCarts, setHoldCarts] = useState<HoldCart[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.HOLD_CARTS);
    return saved ? JSON.parse(saved) : [];
  });

  // Receipt Modal trigger
  const [latestCompletedTransaction, setLatestCompletedTransaction] = useState<Transaction | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.STOCK_ADJUSTMENTS, JSON.stringify(stockAdjustments));
  }, [stockAdjustments]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.HOLD_CARTS, JSON.stringify(holdCarts));
  }, [holdCarts]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
  }, [currentUser]);

  // Product CRUD
  const addProduct = (newProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `prod-${Date.now()}`;
    const defaultProcurement =
      newProduct.procurementType ||
      (newProduct.category === 'Makanan' || newProduct.category === 'Minuman'
        ? 'PRODUKSI'
        : 'PEMBELIAN');

    const product: Product = {
      ...newProduct,
      procurementType: defaultProcurement,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [product, ...prev]);

    // Record initial stock if > 0
    if (product.stock > 0) {
      const isProduction = product.procurementType === 'PRODUKSI';
      const adjustment: StockAdjustment = {
        id: `adj-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        type: isProduction ? 'PRODUKSI' : 'PEMBELIAN',
        sourceType: product.procurementType,
        previousStock: 0,
        adjustedQty: product.stock,
        finalStock: product.stock,
        costPerUnit: product.buyPrice,
        totalCost: product.stock * product.buyPrice,
        reason: isProduction
          ? 'Stok Awal Produk Baru (Hasil Produksi Sendiri)'
          : 'Stok Awal Produk Baru (Pembelian Supplier/Kulakan)',
        createdAt: new Date().toISOString(),
        performedBy: currentUser.name,
      };
      setStockAdjustments((prev) => [adjustment, ...prev]);
    }
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const addCategory = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
    }
  };

  const deleteCategory = (name: string) => {
    if (name === 'Semua') return;
    setCategories((prev) => prev.filter((c) => c !== name));
  };

  // Stock Opname & Manual Adjustments (Khusus Admin)
  const adjustStock = ({
    productId,
    productName,
    type,
    sourceType,
    previousStock,
    adjustedQty,
    finalStock,
    reason,
    costPerUnit,
    totalCost,
    supplierOrBatch,
    invoiceNumber,
  }: Omit<StockAdjustment, 'id' | 'createdAt' | 'performedBy'>) => {
    const newAdjustment: StockAdjustment = {
      id: `adj-${Date.now()}`,
      productId,
      productName,
      type,
      sourceType: sourceType || (type === 'OPNAME' ? 'OPNAME' : 'PENYESUAIAN_MANUAL'),
      previousStock,
      adjustedQty,
      finalStock,
      reason,
      costPerUnit,
      totalCost,
      supplierOrBatch,
      invoiceNumber,
      createdAt: new Date().toISOString(),
      performedBy: currentUser.name,
    };

    setStockAdjustments((prev) => [newAdjustment, ...prev]);
    updateProduct(productId, { stock: finalStock });
  };

  // 1. Penambahan Stok Melalui Produksi (Makanan, Minuman, Olahan Dapur)
  const recordProduction = ({
    productId,
    quantity,
    costPerUnit,
    batchNumber,
    notes,
  }: {
    productId: string;
    quantity: number;
    costPerUnit?: number;
    batchNumber?: string;
    notes?: string;
  }) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || quantity <= 0) return;

    const unitCost = costPerUnit !== undefined && costPerUnit >= 0 ? costPerUnit : prod.buyPrice;
    const totalCost = quantity * unitCost;
    const finalStock = prod.stock + quantity;

    const adjustment: StockAdjustment = {
      id: `adj-prod-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      type: 'PRODUKSI',
      sourceType: 'PRODUKSI',
      previousStock: prod.stock,
      adjustedQty: quantity,
      finalStock,
      costPerUnit: unitCost,
      totalCost,
      supplierOrBatch: batchNumber || `Batch ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
      reason: notes?.trim()
        ? `Hasil Produksi Dapur: ${notes.trim()}`
        : `Hasil Produksi Dapur / Olahan (+${quantity} ${prod.unit})`,
      createdAt: new Date().toISOString(),
      performedBy: currentUser.name,
    };

    setStockAdjustments((prev) => [adjustment, ...prev]);
    updateProduct(prod.id, {
      stock: finalStock,
      buyPrice: unitCost > 0 ? unitCost : prod.buyPrice,
    });
  };

  // 2. Penambahan Stok Melalui Pembelian (Produk Jadi, Kulakan Supplier/Distributor)
  const recordPurchase = ({
    productId,
    quantity,
    buyPricePerUnit,
    supplierName,
    invoiceNumber,
    notes,
    updateProductBuyPrice = true,
  }: {
    productId: string;
    quantity: number;
    buyPricePerUnit: number;
    supplierName?: string;
    invoiceNumber?: string;
    notes?: string;
    updateProductBuyPrice?: boolean;
  }) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || quantity <= 0) return;

    const unitCost = buyPricePerUnit >= 0 ? buyPricePerUnit : prod.buyPrice;
    const totalCost = quantity * unitCost;
    const finalStock = prod.stock + quantity;

    const descParts: string[] = [];
    if (supplierName?.trim()) descParts.push(`Supplier: ${supplierName.trim()}`);
    if (invoiceNumber?.trim()) descParts.push(`Faktur #${invoiceNumber.trim()}`);
    if (notes?.trim()) descParts.push(notes.trim());

    const reason = descParts.length > 0
      ? `Pembelian Barang Masuk (${descParts.join(' • ')})`
      : `Pembelian Barang Masuk / Kulakan (+${quantity} ${prod.unit})`;

    const adjustment: StockAdjustment = {
      id: `adj-buy-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      type: 'PEMBELIAN',
      sourceType: 'PEMBELIAN',
      previousStock: prod.stock,
      adjustedQty: quantity,
      finalStock,
      costPerUnit: unitCost,
      totalCost,
      supplierOrBatch: supplierName?.trim() || 'Supplier',
      invoiceNumber: invoiceNumber?.trim() || undefined,
      reason,
      createdAt: new Date().toISOString(),
      performedBy: currentUser.name,
    };

    setStockAdjustments((prev) => [adjustment, ...prev]);
    updateProduct(prod.id, {
      stock: finalStock,
      ...(updateProductBuyPrice && unitCost > 0 ? { buyPrice: unitCost } : {}),
    });
  };

  // Cart operations
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty > 0 ? newQty : 1,
          product, // ensure fresh stock data
        };
        return updated;
      }
      return [...prev, { product, quantity, itemDiscount: 0 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const updateItemDiscount = (productId: string, discount: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, itemDiscount: Math.max(0, discount) } : item
      )
    );
  };

  const updateItemNote = (productId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, note } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
  };

  const setDiscount = (type: 'nominal' | 'percent', value: number) => {
    setDiscountType(type);
    setDiscountValue(Math.max(0, value));
  };

  // Calculate cart totals
  const cartSubtotal = cart.reduce((sum, item) => {
    const price = item.customPrice ?? item.product.sellPrice;
    const itemSub = Math.max(0, price * item.quantity - (item.itemDiscount || 0));
    return sum + itemSub;
  }, 0);

  const cartTotalCost = cart.reduce((sum, item) => {
    return sum + item.product.buyPrice * item.quantity;
  }, 0);

  const cartDiscountAmount =
    discountType === 'percent'
      ? Math.round((cartSubtotal * Math.min(100, discountValue)) / 100)
      : Math.min(cartSubtotal, discountValue);

  const afterDiscount = Math.max(0, cartSubtotal - cartDiscountAmount);

  const cartTaxAmount = settings.enableTax
    ? Math.round((afterDiscount * (settings.taxRate || 0)) / 100)
    : 0;

  const cartTotal = afterDiscount + cartTaxAmount;

  // Hold Cart
  const saveHoldCart = (title?: string, customerName?: string) => {
    if (cart.length === 0) return;
    const hold: HoldCart = {
      id: `hold-${Date.now()}`,
      title: title || `Pesanan #${holdCarts.length + 1} (${cart.length} item)`,
      createdAt: new Date().toISOString(),
      items: [...cart],
      customerName,
      discountType,
      discountValue,
    };
    setHoldCarts((prev) => [hold, ...prev]);
    clearCart();
  };

  const resumeHoldCart = (holdId: string) => {
    const hold = holdCarts.find((h) => h.id === holdId);
    if (!hold) return;
    setCart(hold.items);
    setDiscountType(hold.discountType);
    setDiscountValue(hold.discountValue);
    setHoldCarts((prev) => prev.filter((h) => h.id !== holdId));
  };

  const deleteHoldCart = (holdId: string) => {
    setHoldCarts((prev) => prev.filter((h) => h.id !== holdId));
  };

  // Checkout Processing
  const processCheckout = async ({
    paymentMethod,
    cashReceived,
    customerName,
    customerPhone,
    dueDate,
    notes,
  }: {
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    customerName?: string;
    customerPhone?: string;
    dueDate?: string;
    notes?: string;
  }): Promise<Transaction> => {
    const invoiceId = generateInvoiceNumber();

    const items: TransactionItem[] = cart.map((item) => {
      const unitPrice = item.customPrice ?? item.product.sellPrice;
      const subtotal = Math.max(0, unitPrice * item.quantity - (item.itemDiscount || 0));
      return {
        productId: item.product.id,
        productName: item.product.name,
        barcode: item.product.barcode,
        category: item.product.category,
        buyPrice: item.product.buyPrice,
        sellPrice: unitPrice,
        quantity: item.quantity,
        itemDiscount: item.itemDiscount || 0,
        subtotal,
        note: item.note,
        returnedQty: 0,
      };
    });

    const status = paymentMethod === 'HUTANG' ? 'HUTANG' : 'LUNAS';
    const changeAmount =
      paymentMethod === 'TUNAI' && cashReceived !== undefined
        ? Math.max(0, cashReceived - cartTotal)
        : 0;

    const grossProfit = cartTotal - cartTotalCost;

    const transaction: Transaction = {
      id: invoiceId,
      createdAt: new Date().toISOString(),
      cashierName: currentUser.name,
      cashierId: currentUser.id,
      customerName: customerName?.trim() || undefined,
      customerPhone: customerPhone?.trim() || undefined,
      items,
      subtotal: cartSubtotal,
      discountType,
      discountValue,
      discountAmount: cartDiscountAmount,
      taxPercent: settings.enableTax ? settings.taxRate : 0,
      taxAmount: cartTaxAmount,
      totalAmount: cartTotal,
      totalCost: cartTotalCost,
      grossProfit,
      paymentMethod,
      cashReceived: paymentMethod === 'TUNAI' ? cashReceived : undefined,
      changeAmount: paymentMethod === 'TUNAI' ? changeAmount : undefined,
      dueDate: paymentMethod === 'HUTANG' ? dueDate : undefined,
      status,
      notes,
    };

    // Deduct stock for all items
    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = cart.find((ci) => ci.product.id === p.id);
        if (cartItem) {
          const newStock = Math.max(0, p.stock - cartItem.quantity);
          return { ...p, stock: newStock, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );

    // Save transaction
    setTransactions((prev) => [transaction, ...prev]);
    setLatestCompletedTransaction(transaction);

    // Auto sync to Google sheets if configured
    if (settings.autoSyncGoogleSheets && settings.googleSheetsUrl) {
      syncToGoogleSheets(settings.googleSheetsUrl, transaction, settings).catch(console.error);
    }

    // Auto open cash drawer simulation if enabled
    if (paymentMethod === 'TUNAI') {
      openCashDrawer();
    }

    // Clear active cart
    clearCart();

    return transaction;
  };

  const settleDebt = (transactionId: string) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              status: 'LUNAS',
              debtPaidAt: new Date().toISOString(),
              notes: t.notes ? `${t.notes} (Telah Dilunasi)` : 'Telah Dilunasi',
            }
          : t
      )
    );
  };

  const processReturn = (
    transactionId: string,
    returnItems: { productId: string; qty: number }[],
    reason: string
  ) => {
    // 1. Restore stock
    setProducts((prev) =>
      prev.map((prod) => {
        const ret = returnItems.find((r) => r.productId === prod.id);
        if (ret && ret.qty > 0) {
          return { ...prod, stock: prod.stock + ret.qty, updatedAt: new Date().toISOString() };
        }
        return prod;
      })
    );

    // 2. Log stock adjustments
    returnItems.forEach((ret) => {
      if (ret.qty > 0) {
        const prod = products.find((p) => p.id === ret.productId);
        if (prod) {
          const adjustment: StockAdjustment = {
            id: `adj-${Date.now()}-${ret.productId}`,
            productId: prod.id,
            productName: prod.name,
            type: 'IN',
            previousStock: prod.stock,
            adjustedQty: ret.qty,
            finalStock: prod.stock + ret.qty,
            reason: `Retur dari Nota #${transactionId}: ${reason}`,
            createdAt: new Date().toISOString(),
            performedBy: currentUser.name,
          };
          setStockAdjustments((prev) => [adjustment, ...prev]);
        }
      }
    });

    // 3. Update transaction record
    setTransactions((prev) =>
      prev.map((trx) => {
        if (trx.id !== transactionId) return trx;

        let totalReturnedAmount = 0;
        const updatedItems = trx.items.map((item) => {
          const ret = returnItems.find((r) => r.productId === item.productId);
          if (ret && ret.qty > 0) {
            const currentReturned = item.returnedQty || 0;
            const newReturned = Math.min(item.quantity, currentReturned + ret.qty);
            const unitPrice = item.sellPrice;
            totalReturnedAmount += unitPrice * ret.qty;
            return {
              ...item,
              returnedQty: newReturned,
            };
          }
          return item;
        });

        const allItemsFullyReturned = updatedItems.every(
          (i) => (i.returnedQty || 0) >= i.quantity
        );

        return {
          ...trx,
          items: updatedItems,
          status: allItemsFullyReturned ? 'RETUR_TOTAL' : 'RETUR_SEBAGIAN',
          returnReason: reason,
          refundAmount: (trx.refundAmount || 0) + totalReturnedAmount,
        };
      })
    );
  };

  // User Management
  const switchUser = (pin: string): { success: boolean; message: string } => {
    const found = users.find((u) => u.pin === pin);
    if (found) {
      setCurrentUser(found);
      return { success: true, message: `Selamat datang, ${found.name}` };
    }
    return { success: false, message: 'PIN yang Anda masukkan salah!' };
  };

  const setCurrentUserDirect = (user: UserAccount) => {
    setCurrentUser(user);
  };

  const addUser = (newUser: Omit<UserAccount, 'id'>) => {
    const id = `user-${Date.now()}`;
    setUsers((prev) => [...prev, { ...newUser, id }]);
  };

  const updateUser = (id: string, updates: Partial<UserAccount>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }
  };

  const deleteUser = (id: string) => {
    if (users.length <= 1) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // Settings
  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Printers & OS Detection
  const detectedPrinters = useMemo(() => {
    return settings.registeredPrinters || getDefaultDetectedPrinters(detectedOSInfo);
  }, [settings.registeredPrinters, detectedOSInfo]);

  const activePrinter = useMemo(() => {
    const found = detectedPrinters.find((p) => p.id === settings.activePrinterId);
    return found || detectedPrinters[0];
  }, [detectedPrinters, settings.activePrinterId]);

  const setActivePrinterId = (id: string) => {
    const found = detectedPrinters.find((p) => p.id === id);
    if (found) {
      updateSettings({
        activePrinterId: id,
        paperWidth: found.paperWidth === 'A4' ? '80mm' : found.paperWidth,
      });
    }
  };

  const scanAllPrinters = async (): Promise<{ count: number; message: string }> => {
    const osInfo = detectOperatingSystem();
    const defaultPrinters = getDefaultDetectedPrinters(osInfo);

    // Keep only real paired or manually added custom devices + default system printer
    const currentList = sanitizePrinterList(settings.registeredPrinters || [], osInfo);
    const merged = [...defaultPrinters];

    currentList.forEach((existing) => {
      if (
        !merged.some((m) => m.id === existing.id || m.interfacePort === existing.interfacePort) &&
        !isGhostPrinter(existing.id)
      ) {
        merged.push(existing);
      }
    });

    updateSettings({
      detectedOS: osInfo.os,
      osName: osInfo.osName,
      spoolerName: osInfo.spoolerName,
      registeredPrinters: merged,
      activePrinterId: settings.activePrinterId || merged[0]?.id,
    });

    return {
      count: merged.length,
      message: `Berhasil menyelaraskan printer sistem ${osInfo.osName} (${osInfo.spoolerName}). Terdeteksi ${merged.length} printer aktif.`,
    };
  };

  const resetPrintersToDefault = (): { count: number; message: string } => {
    const osInfo = detectOperatingSystem();
    const defaultPrinters = getDefaultDetectedPrinters(osInfo);

    updateSettings({
      detectedOS: osInfo.os,
      osName: osInfo.osName,
      spoolerName: osInfo.spoolerName,
      registeredPrinters: defaultPrinters,
      activePrinterId: defaultPrinters[0]?.id,
    });

    return {
      count: defaultPrinters.length,
      message: `Daftar printer telah dibersihkan! Hanya printer sistem bawaan ${osInfo.osName} yang aktif.`,
    };
  };

  const scanBluetooth = async (): Promise<{ success: boolean; message: string }> => {
    const res = await scanBluetoothPrinter();
    if (res.success && res.device) {
      const currentList = settings.registeredPrinters || [];
      const updated = [res.device, ...currentList.filter((p) => p.id !== res.device!.id)];
      updateSettings({
        registeredPrinters: updated,
        activePrinterId: res.device.id,
        bluetoothConnected: true,
        bluetoothPrinterName: res.device.name,
      });
      return { success: true, message: `Printer bluetooth "${res.device.name}" berhasil terhubung!` };
    }
    return { success: false, message: res.error || 'Gagal menyambungkan printer bluetooth' };
  };

  const scanSerialUSB = async (): Promise<{ success: boolean; message: string }> => {
    const res = await scanSerialUSBPrinter();
    if (res.success && res.device) {
      const currentList = settings.registeredPrinters || [];
      const updated = [res.device, ...currentList.filter((p) => p.id !== res.device!.id)];
      updateSettings({
        registeredPrinters: updated,
        activePrinterId: res.device.id,
      });
      return { success: true, message: `Printer USB/Serial "${res.device.name}" berhasil didaftarkan!` };
    }
    return { success: false, message: res.error || 'Gagal membuka port USB/Serial' };
  };

  const scanLanNetwork = async (
    subnet: string = '192.168.1'
  ): Promise<{ count: number; message: string; devices: SystemPrinterDevice[] }> => {
    const res = await scanNetworkLanPrinters(subnet);
    const currentList = settings.registeredPrinters || [];
    const merged = [...currentList];

    res.found.forEach((foundDevice) => {
      const idx = merged.findIndex((m) => m.id === foundDevice.id || m.interfacePort === foundDevice.interfacePort);
      if (idx >= 0) {
        merged[idx] = foundDevice;
      } else {
        merged.unshift(foundDevice);
      }
    });

    updateSettings({
      registeredPrinters: merged,
      activePrinterId: res.found[0]?.id || settings.activePrinterId || merged[0]?.id,
    });

    return {
      count: res.found.length,
      message: res.message,
      devices: res.found,
    };
  };

  const pingLan = async (
    ipPort: string
  ): Promise<{ online: boolean; latencyMs: number; message: string }> => {
    return await pingLanPrinter(ipPort);
  };

  const addCustomPrinter = (newPrinter: Omit<SystemPrinterDevice, 'id' | 'lastChecked'>) => {
    const id = `custom-printer-${Date.now()}`;
    const device: SystemPrinterDevice = {
      ...newPrinter,
      id,
      lastChecked: new Date().toISOString(),
    };
    const currentList = settings.registeredPrinters || [];
    updateSettings({
      registeredPrinters: [...currentList, device],
      activePrinterId: id,
    });
  };

  const deletePrinter = (id: string) => {
    const currentList = settings.registeredPrinters || [];
    const updated = currentList.filter((p) => p.id !== id);
    updateSettings({
      registeredPrinters: updated,
      activePrinterId: settings.activePrinterId === id ? (updated[0]?.id || '') : settings.activePrinterId,
    });
  };

  const connectBluetoothPrinter = async (): Promise<boolean> => {
    try {
      if ('bluetooth' in navigator) {
        const res = await scanBluetooth();
        return res.success;
      } else {
        updateSettings({
          bluetoothPrinterName: 'Thermal POS-58BT (Simulasi Terhubung)',
          bluetoothConnected: true,
        });
        return true;
      }
    } catch {
      updateSettings({
        bluetoothPrinterName: 'Thermal POS-58BT (Simulasi Terhubung)',
        bluetoothConnected: true,
      });
      return true;
    }
  };

  const triggerPrintReceipt = (printer?: SystemPrinterDevice) => {
    const targetPrinter = printer || activePrinter;
    if (settings.openDrawerOnPrint) {
      openCashDrawer();
    }
    executeTestPrint(settings, targetPrinter);
  };

  const openCashDrawer = () => {
    // Play subtle drawer chime/haptic
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch {
      // ignore
    }
  };

  const syncAllTransactionsToSheets = async (): Promise<{ success: boolean; message: string }> => {
    if (!settings.googleSheetsUrl) {
      return { success: false, message: 'URL Google Apps Script belum diisi di Pengaturan.' };
    }
    try {
      let count = 0;
      for (const trx of transactions) {
        await syncToGoogleSheets(settings.googleSheetsUrl, trx, settings);
        count++;
      }
      updateSettings({ lastSyncTime: new Date().toISOString() });
      return { success: true, message: `Berhasil menyinkronkan ${count} transaksi ke Google Sheets!` };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Gagal sinkronisasi' };
    }
  };

  return (
    <POSContext.Provider
      value={{
        products,
        categories,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        deleteCategory,
        adjustStock,
        recordProduction,
        recordPurchase,
        stockAdjustments,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemDiscount,
        updateItemNote,
        clearCart,
        discountType,
        discountValue,
        setDiscount,
        cartSubtotal,
        cartDiscountAmount,
        cartTaxAmount,
        cartTotal,
        cartTotalCost,
        holdCarts,
        saveHoldCart,
        resumeHoldCart,
        deleteHoldCart,
        transactions,
        processCheckout,
        settleDebt,
        processReturn,
        users,
        currentUser,
        switchUser,
        setCurrentUserDirect,
        addUser,
        updateUser,
        deleteUser,
        settings,
        updateSettings,
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
        connectBluetoothPrinter,
        openCashDrawer,
        triggerPrintReceipt,
        syncAllTransactionsToSheets,
        activeTab,
        setActiveTab,
        latestCompletedTransaction,
        setLatestCompletedTransaction,
        isOnline,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
