import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Product, StockAdjustment, ProcurementType } from '../../types';
import { formatRupiah, formatDateTime, generateBarcode, exportToCSV } from '../../utils/formatters';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  History,
  Download,
  X,
  Check,
  FolderPlus,
  ArrowUpDown,
  Lock,
  ShieldCheck,
  ChefHat,
  Truck,
  Layers,
  Sparkles,
  Info,
  Calendar,
  DollarSign,
  Tag,
  Factory,
  FileText,
} from 'lucide-react';

interface InventoryScreenProps {
  onOpenPinModal?: () => void;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({ onOpenPinModal }) => {
  const {
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
    currentUser,
    setActiveTab,
  } = usePOS();

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [procurementFilter, setProcurementFilter] = useState<'ALL' | 'PRODUKSI' | 'PEMBELIAN'>('ALL');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'ALL' | 'PRODUKSI' | 'PEMBELIAN' | 'OPNAME' | 'OTHER'>('ALL');

  // Dedicated Stock Addition Modals
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Form State for Add / Edit Product
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    procurementType: ProcurementType;
    barcode: string;
    buyPrice: number;
    sellPrice: number;
    stock: number;
    minStockAlert: number;
    unit: string;
    icon: string;
  }>({
    name: '',
    category: 'Makanan',
    procurementType: 'PRODUKSI',
    barcode: '',
    buyPrice: 0,
    sellPrice: 0,
    stock: 10,
    minStockAlert: 5,
    unit: 'porsi',
    icon: '🍲',
  });

  // Production Form State
  const [productionForm, setProductionForm] = useState<{
    productId: string;
    quantity: number;
    costPerUnit: number;
    batchNumber: string;
    notes: string;
  }>({
    productId: '',
    quantity: 10,
    costPerUnit: 0,
    batchNumber: '',
    notes: '',
  });

  // Purchase Form State
  const [purchaseForm, setPurchaseForm] = useState<{
    productId: string;
    quantity: number;
    buyPricePerUnit: number;
    supplierName: string;
    invoiceNumber: string;
    notes: string;
    updateProductBuyPrice: boolean;
  }>({
    productId: '',
    quantity: 20,
    buyPricePerUnit: 0,
    supplierName: '',
    invoiceNumber: '',
    notes: '',
    updateProductBuyPrice: true,
  });

  // Stock Opname Form State (Khusus Admin)
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT' | 'OPNAME'>('IN');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('Restock Barang');

  // Category modal input
  const [newCatName, setNewCatName] = useState('');

  // ----------------------------------------------------
  // KETENTUAN 1: HAK AKSES KHUSUS ADMIN
  // ----------------------------------------------------
  if (currentUser.role !== 'OWNER') {
    return (
      <div className="max-w-2xl mx-auto p-6 sm:p-12 my-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-center p-8 sm:p-10 space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-inner">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Akses Dibatasi — Khusus Admin Toko
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Manajemen Produk & Stok Terkunci
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Sesuai ketentuan sistem, menu <strong>Manajemen Produk</strong> dan{' '}
              <strong>Penyesuaian Stok</strong> hanya dapat diakses dan diubah oleh{' '}
              <strong>Admin</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 max-w-md mx-auto text-left space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-bold text-slate-800">1.</span>
              <span><strong>Manajemen Produk:</strong> Tambah/edit katalog, ubah harga, dan metode pengadaan (Produksi/Pembelian).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-slate-800">2.</span>
              <span><strong>Penyesuaian Stok:</strong> Koreksi opname fisik, barang rusak, dan restock master.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              type="button"
              id="btn-unlock-owner"
              onClick={() => {
                if (onOpenPinModal) onOpenPinModal();
              }}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              Masukkan PIN Admin
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pos')}
              className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
            >
              Kembali ke Layar Kasir (POS)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // HANDLERS FOR ADD & EDIT PRODUCT
  // ----------------------------------------------------
  const handleOpenAdd = () => {
    setEditingProduct(null);
    const initialCat = categories.find((c) => c !== 'Semua') || 'Makanan';
    const isFoodOrDrink = initialCat === 'Makanan' || initialCat === 'Minuman';

    setFormData({
      name: '',
      category: initialCat,
      procurementType: isFoodOrDrink ? 'PRODUKSI' : 'PEMBELIAN',
      barcode: generateBarcode(),
      buyPrice: 0,
      sellPrice: 0,
      stock: 10,
      minStockAlert: 5,
      unit: isFoodOrDrink ? 'porsi' : 'pcs',
      icon: isFoodOrDrink ? '🍲' : '📦',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      procurementType: p.procurementType || (p.category === 'Makanan' || p.category === 'Minuman' ? 'PRODUKSI' : 'PEMBELIAN'),
      barcode: p.barcode,
      buyPrice: p.buyPrice,
      sellPrice: p.sellPrice,
      stock: p.stock,
      minStockAlert: p.minStockAlert,
      unit: p.unit,
      icon: p.icon || '📦',
    });
    setIsAddModalOpen(true);
  };

  const handleCategoryChange = (newCat: string) => {
    const isFoodOrDrink = newCat === 'Makanan' || newCat === 'Minuman';
    const autoProcurement: ProcurementType = isFoodOrDrink ? 'PRODUKSI' : 'PEMBELIAN';
    const autoUnit = isFoodOrDrink ? (newCat === 'Minuman' ? 'cup' : 'porsi') : 'pcs';
    const autoIcon = newCat === 'Minuman' ? '☕' : newCat === 'Makanan' ? '🍲' : newCat === 'Sembako' ? '🍚' : '📦';

    setFormData((prev) => ({
      ...prev,
      category: newCat,
      // Auto-suggest procurement if user hasn't explicitly customized or when adding new
      procurementType: !editingProduct ? autoProcurement : prev.procurementType,
      unit: !editingProduct && prev.unit === 'pcs' && isFoodOrDrink ? autoUnit : prev.unit,
      icon: !editingProduct && (prev.icon === '📦' || prev.icon === '🍲') ? autoIcon : prev.icon,
    }));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name.trim(),
        category: formData.category,
        procurementType: formData.procurementType,
        barcode: formData.barcode.trim() || generateBarcode(),
        buyPrice: Number(formData.buyPrice) || 0,
        sellPrice: Number(formData.sellPrice) || 0,
        minStockAlert: Number(formData.minStockAlert) || 5,
        unit: formData.unit.trim() || 'pcs',
        icon: formData.icon || '📦',
      });
    } else {
      addProduct({
        name: formData.name.trim(),
        category: formData.category,
        procurementType: formData.procurementType,
        barcode: formData.barcode.trim() || generateBarcode(),
        buyPrice: Number(formData.buyPrice) || 0,
        sellPrice: Number(formData.sellPrice) || 0,
        stock: Number(formData.stock) || 0,
        minStockAlert: Number(formData.minStockAlert) || 5,
        unit: formData.unit.trim() || 'pcs',
        icon: formData.icon || '📦',
      });
    }
    setIsAddModalOpen(false);
  };

  const handleDeleteProduct = (p: Product) => {
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${p.name}"?`)) {
      deleteProduct(p.id);
    }
  };

  // ----------------------------------------------------
  // HANDLERS FOR PRODUKSI & PEMBELIAN MODALS
  // ----------------------------------------------------
  const handleOpenProductionModal = (targetProduct?: Product) => {
    const prod = targetProduct || products.find((p) => p.procurementType === 'PRODUKSI') || products[0];
    if (!prod) return;

    setProductionForm({
      productId: prod.id,
      quantity: 10,
      costPerUnit: prod.buyPrice || 0,
      batchNumber: `Batch ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
      notes: `Produksi ${prod.name}`,
    });
    setIsProductionModalOpen(true);
  };

  const handleSaveProduction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productionForm.productId || productionForm.quantity <= 0) return;

    recordProduction({
      productId: productionForm.productId,
      quantity: Number(productionForm.quantity),
      costPerUnit: Number(productionForm.costPerUnit),
      batchNumber: productionForm.batchNumber.trim(),
      notes: productionForm.notes.trim(),
    });

    setIsProductionModalOpen(false);
  };

  const handleOpenPurchaseModal = (targetProduct?: Product) => {
    const prod = targetProduct || products.find((p) => p.procurementType === 'PEMBELIAN') || products[0];
    if (!prod) return;

    setPurchaseForm({
      productId: prod.id,
      quantity: 20,
      buyPricePerUnit: prod.buyPrice || 0,
      supplierName: '',
      invoiceNumber: '',
      notes: `Pembelian stok ${prod.name}`,
      updateProductBuyPrice: true,
    });
    setIsPurchaseModalOpen(true);
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseForm.productId || purchaseForm.quantity <= 0) return;

    recordPurchase({
      productId: purchaseForm.productId,
      quantity: Number(purchaseForm.quantity),
      buyPricePerUnit: Number(purchaseForm.buyPricePerUnit),
      supplierName: purchaseForm.supplierName.trim(),
      invoiceNumber: purchaseForm.invoiceNumber.trim(),
      notes: purchaseForm.notes.trim(),
      updateProductBuyPrice: purchaseForm.updateProductBuyPrice,
    });

    setIsPurchaseModalOpen(false);
  };

  // ----------------------------------------------------
  // KETENTUAN 2: PENYESUAIAN STOK (OPNAME) OLEH PEMILIK
  // ----------------------------------------------------
  const handleSaveStockAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustProduct) return;

    const current = stockAdjustProduct.stock;
    let finalStock = current;
    let qtyChange = Number(adjustQty);

    if (adjustType === 'IN') {
      finalStock = current + qtyChange;
    } else if (adjustType === 'OUT') {
      finalStock = Math.max(0, current - qtyChange);
      qtyChange = -qtyChange;
    } else if (adjustType === 'OPNAME') {
      finalStock = Math.max(0, Number(adjustQty));
      qtyChange = finalStock - current;
    }

    adjustStock({
      productId: stockAdjustProduct.id,
      productName: stockAdjustProduct.name,
      type: adjustType,
      sourceType: adjustType === 'OPNAME' ? 'OPNAME' : 'PENYESUAIAN_MANUAL',
      previousStock: current,
      adjustedQty: qtyChange,
      finalStock,
      costPerUnit: stockAdjustProduct.buyPrice,
      totalCost: Math.abs(qtyChange) * stockAdjustProduct.buyPrice,
      reason: adjustReason.trim() || 'Penyesuaian Stok oleh Admin',
    });

    setStockAdjustProduct(null);
  };

  // ----------------------------------------------------
  // FILTERING
  // ----------------------------------------------------
  const filtered = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'Semua' || p.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesProcurement =
      procurementFilter === 'ALL' ||
      p.procurementType === procurementFilter;

    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.barcode.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query);

    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = p.stock > 0 && p.stock <= p.minStockAlert;
    } else if (stockFilter === 'out') {
      matchesStock = p.stock <= 0;
    }

    return matchesCat && matchesProcurement && matchesQuery && matchesStock;
  });

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;
  const productionProductsCount = products.filter((p) => p.procurementType === 'PRODUKSI').length;
  const purchaseProductsCount = products.filter((p) => p.procurementType === 'PEMBELIAN').length;

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Nama Produk',
      'Kategori',
      'Metode Pengadaan',
      'Barcode',
      'Harga Beli / Biaya Produksi (HPP)',
      'Harga Jual',
      'Margin Laba (Rp)',
      'Margin (%)',
      'Stok Aktual',
      'Satuan',
      'Batas Minimal Alert',
    ];

    const rows = products.map((p) => {
      const margin = p.sellPrice - p.buyPrice;
      const marginPercent = p.buyPrice > 0 ? Math.round((margin / p.buyPrice) * 100) : 100;
      return [
        p.id,
        p.name,
        p.category,
        p.procurementType === 'PRODUKSI' ? 'Produksi (Makanan/Minuman)' : 'Pembelian (Produk Jadi)',
        p.barcode,
        p.buyPrice,
        p.sellPrice,
        margin,
        `${marginPercent}%`,
        p.stock,
        p.unit,
        p.minStockAlert,
      ];
    });

    exportToCSV(`Stok_Produk_${new Date().toISOString().slice(0, 10)}.csv`, [headers, ...rows]);
  };

  const selectedProductionProduct = products.find((p) => p.id === productionForm.productId);
  const selectedPurchaseProduct = products.find((p) => p.id === purchaseForm.productId);

  const filteredHistory = stockAdjustments.filter((adj) => {
    if (historyTypeFilter === 'ALL') return true;
    if (historyTypeFilter === 'PRODUKSI') return adj.type === 'PRODUKSI' || adj.sourceType === 'PRODUKSI';
    if (historyTypeFilter === 'PEMBELIAN') return adj.type === 'PEMBELIAN' || adj.sourceType === 'PEMBELIAN';
    if (historyTypeFilter === 'OPNAME') return adj.type === 'OPNAME' || adj.sourceType === 'OPNAME';
    return adj.type === 'IN' || adj.type === 'OUT';
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header with Title, Owner Badge & Action Buttons */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Manajemen Produk & Stok
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Akses Khusus Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola katalog barang, penetapan HPP, penambahan stok melalui <strong>Produksi</strong> & <strong>Pembelian</strong>, serta opname fisik.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
          {/* 1. Tambah Stok via Produksi (Makanan/Minuman) */}
          <button
            type="button"
            id="btn-open-production"
            onClick={() => handleOpenProductionModal()}
            className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            title="Tambah stok dari hasil olahan/masak dapur"
          >
            <ChefHat className="w-4 h-4 text-emerald-200" />
            <span>+ Produksi (Dapur)</span>
          </button>

          {/* 2. Tambah Stok via Pembelian (Produk Jadi) */}
          <button
            type="button"
            id="btn-open-purchase"
            onClick={() => handleOpenPurchaseModal()}
            className="px-3.5 py-2.5 bg-sky-700 hover:bg-sky-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            title="Tambah stok dari pembelian supplier / distributor"
          >
            <Truck className="w-4 h-4 text-sky-200" />
            <span>+ Pembelian (Kulakan)</span>
          </button>

          {/* 3. Tambah Master Produk Baru */}
          <button
            type="button"
            id="btn-add-product"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Tambah Produk</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200"
              title="Kelola Kategori"
            >
              <FolderPlus className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200"
              title="Riwayat Log Stok (Produksi, Pembelian, Opname)"
            >
              <History className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stock & Procurement KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total SKU */}
        <button
          type="button"
          onClick={() => {
            setProcurementFilter('ALL');
            setStockFilter('all');
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            procurementFilter === 'ALL' && stockFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs opacity-75 font-medium">Total Katalog Produk</span>
            <Layers className="w-4 h-4 opacity-50" />
          </div>
          <span className="text-2xl font-black mt-1 block">{products.length} SKU</span>
        </button>

        {/* Produksi Sendiri */}
        <button
          type="button"
          onClick={() => {
            setProcurementFilter('PRODUKSI');
            setStockFilter('all');
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            procurementFilter === 'PRODUKSI'
              ? 'bg-emerald-800 text-white border-emerald-800 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs opacity-80 font-medium">🍳 Hasil Produksi Dapur</span>
            <ChefHat className={`w-4 h-4 ${procurementFilter === 'PRODUKSI' ? 'text-white' : 'text-emerald-600'}`} />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black">{productionProductsCount}</span>
            <span className="text-xs opacity-75 font-medium">Menu / Minuman</span>
          </div>
        </button>

        {/* Pembelian Produk Jadi */}
        <button
          type="button"
          onClick={() => {
            setProcurementFilter('PEMBELIAN');
            setStockFilter('all');
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            procurementFilter === 'PEMBELIAN'
              ? 'bg-sky-800 text-white border-sky-800 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs opacity-80 font-medium">📦 Pembelian Produk Jadi</span>
            <Truck className={`w-4 h-4 ${procurementFilter === 'PEMBELIAN' ? 'text-white' : 'text-sky-600'}`} />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black">{purchaseProductsCount}</span>
            <span className="text-xs opacity-75 font-medium">Barang Jadi</span>
          </div>
        </button>

        {/* Alert Stok Menipis / Kosong */}
        <button
          type="button"
          onClick={() => {
            setProcurementFilter('ALL');
            setStockFilter(stockFilter === 'low' ? 'all' : 'low');
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            stockFilter === 'low'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs opacity-80 font-medium">Peringatan Stok</span>
            <AlertTriangle className={`w-4 h-4 ${stockFilter === 'low' ? 'text-white' : 'text-amber-500'}`} />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-600">{lowStockCount} Menipis</span>
            {outOfStockCount > 0 && (
              <span className="text-xs font-bold text-rose-600">({outOfStockCount} Kosong)</span>
            )}
          </div>
        </button>
      </div>

      {/* Search & Combined Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3.5 shadow-2xs">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama produk, barcode, kategori, atau tipe pengadaan..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Procurement Type Filter Chips */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setProcurementFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                procurementFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Tipe
            </button>
            <button
              type="button"
              onClick={() => setProcurementFilter('PRODUKSI')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
                procurementFilter === 'PRODUKSI'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              Produksi ({productionProductsCount})
            </button>
            <button
              type="button"
              onClick={() => setProcurementFilter('PEMBELIAN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
                procurementFilter === 'PEMBELIAN'
                  ? 'bg-sky-700 text-white shadow-2xs'
                  : 'text-sky-800 hover:bg-sky-50'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Pembelian ({purchaseProductsCount})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Kategori:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Pengadaan Stok</th>
                <th className="py-3 px-4">Barcode</th>
                <th className="py-3 px-4">Harga Modal / Beli</th>
                <th className="py-3 px-4">Harga Jual</th>
                <th className="py-3 px-4">Margin Laba</th>
                <th className="py-3 px-4">Stok Saat Ini</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada produk yang cocok</p>
                    <p className="text-xs text-slate-400 mt-0.5">Silakan sesuaikan kata kunci pencarian atau filter kategori.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const profit = p.sellPrice - p.buyPrice;
                  const profitMarginPercent =
                    p.buyPrice > 0 ? Math.round((profit / p.buyPrice) * 100) : 100;
                  const isOutOfStock = p.stock <= 0;
                  const isLow = p.stock > 0 && p.stock <= p.minStockAlert;
                  const isProduction = p.procurementType === 'PRODUKSI';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Name & Icon */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl flex-shrink-0">{p.icon || (isProduction ? '🍲' : '📦')}</span>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs sm:text-sm">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">SKU: {p.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {p.category}
                        </span>
                      </td>

                      {/* Procurement Type Badge */}
                      <td className="py-3 px-4">
                        {isProduction ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                            <ChefHat className="w-3.5 h-3.5 text-emerald-700" />
                            Produksi Dapur
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-200">
                            <Truck className="w-3.5 h-3.5 text-sky-700" />
                            Pembelian Supplier
                          </span>
                        )}
                      </td>

                      {/* Barcode */}
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {p.barcode}
                      </td>

                      {/* Buy Price / HPP */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">
                        <div>
                          <span>{formatRupiah(p.buyPrice)}</span>
                          <span className="block text-[10px] text-slate-400">
                            {isProduction ? 'Biaya Masak/Porsi' : 'HPP Kulakan'}
                          </span>
                        </div>
                      </td>

                      {/* Sell Price */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatRupiah(p.sellPrice)}
                      </td>

                      {/* Margin */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-bold text-emerald-700">
                          <span>+{formatRupiah(profit)}</span>
                          <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-semibold">
                            {profitMarginPercent}%
                          </span>
                        </div>
                      </td>

                      {/* Stock Status */}
                      <td className="py-3 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                            Habis (0 {p.unit})
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {p.stock} {p.unit} (Menipis)
                          </span>
                        ) : (
                          <span className="font-black text-slate-900 text-xs">
                            {p.stock} <span className="font-normal text-slate-500">{p.unit}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Quick Restock by Procurement Type */}
                          {isProduction ? (
                            <button
                              type="button"
                              onClick={() => handleOpenProductionModal(p)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title="Catat Hasil Produksi Menu Ini"
                            >
                              <ChefHat className="w-3.5 h-3.5" />
                              + Masak
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenPurchaseModal(p)}
                              className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title="Catat Pembelian Masuk Barang Ini"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              + Beli
                            </button>
                          )}

                          {/* Stock Opname / Penyesuaian Stok Button (Khusus Admin) */}
                          <button
                            type="button"
                            onClick={() => {
                              setStockAdjustProduct(p);
                              setAdjustQty(1);
                              setAdjustReason('Penyesuaian Stok Admin');
                              setAdjustType('IN');
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors"
                            title="Penyesuaian Stok / Opname Fisik (Khusus Admin)"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-700" />
                          </button>

                          {/* Edit Product */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            title="Edit Data Produk"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Product */}
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 1: TAMBAH / EDIT PRODUK BARU                                */}
      {/* ------------------------------------------------------------------ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingProduct ? 'Perbarui informasi dan pengadaan produk' : 'Daftarkan menu atau barang baru ke katalog'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* PILIHAN METODE PENGADAAN (PRODUKSI vs PEMBELIAN) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Metode Pengadaan & Penambahan Stok <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Option 1: Produksi */}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        procurementType: 'PRODUKSI',
                        unit: prev.unit === 'pcs' ? 'porsi' : prev.unit,
                        icon: prev.icon === '📦' ? '🍲' : prev.icon,
                      }))
                    }
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      formData.procurementType === 'PRODUKSI'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <ChefHat className={`w-4 h-4 ${formData.procurementType === 'PRODUKSI' ? 'text-emerald-700' : 'text-slate-500'}`} />
                        <span className={`text-xs font-bold ${formData.procurementType === 'PRODUKSI' ? 'text-emerald-950' : 'text-slate-800'}`}>
                          1. Produksi
                        </span>
                      </div>
                      {formData.procurementType === 'PRODUKSI' && (
                        <Check className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-tight">
                      Untuk makanan, minuman, racikan & olahan dapur.
                    </p>
                  </button>

                  {/* Option 2: Pembelian */}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        procurementType: 'PEMBELIAN',
                        unit: prev.unit === 'porsi' || prev.unit === 'cup' ? 'pcs' : prev.unit,
                        icon: prev.icon === '🍲' || prev.icon === '☕' ? '📦' : prev.icon,
                      }))
                    }
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      formData.procurementType === 'PEMBELIAN'
                        ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-500/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Truck className={`w-4 h-4 ${formData.procurementType === 'PEMBELIAN' ? 'text-sky-700' : 'text-slate-500'}`} />
                        <span className={`text-xs font-bold ${formData.procurementType === 'PEMBELIAN' ? 'text-sky-950' : 'text-slate-800'}`}>
                          2. Pembelian
                        </span>
                      </div>
                      {formData.procurementType === 'PEMBELIAN' && (
                        <Check className="w-4 h-4 text-sky-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-tight">
                      Untuk produk jadi, barang dagangan distributor & kemasan.
                    </p>
                  </button>
                </div>
              </div>

              {/* Name & Emoji */}
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Icon/Emoji</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full text-center text-xl py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Produk / Menu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={
                      formData.procurementType === 'PRODUKSI'
                        ? 'Contoh: Nasi Goreng Spesial / Kopi Susu Aren'
                        : 'Contoh: Beras Ramos 5kg / Keripik Singkong'
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    {categories
                      .filter((c) => c !== 'Semua')
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan (Unit)</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="porsi, cup, pcs, botol, kg"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Barcode */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">Kode Barcode / SKU</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, barcode: generateBarcode() })}
                    className="text-[11px] text-emerald-600 font-bold hover:underline"
                  >
                    Generate Barcode Otomatis
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="899..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Pricing (HPP & Sell Price) */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formData.procurementType === 'PRODUKSI'
                      ? 'Modal Produksi / HPP (Bahan)'
                      : 'Harga Beli Supplier (HPP)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formData.buyPrice || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, buyPrice: Number(e.target.value) })
                      }
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-sm font-bold bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Jual <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.sellPrice || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, sellPrice: Number(e.target.value) })
                      }
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-sm font-bold bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="col-span-2 text-xs text-slate-600 flex justify-between pt-1 border-t border-slate-200">
                  <span>Estimasi Laba per Item:</span>
                  <span className="font-bold text-emerald-700">
                    {formatRupiah(formData.sellPrice - formData.buyPrice)} (
                    {formData.buyPrice > 0
                      ? Math.round(((formData.sellPrice - formData.buyPrice) / formData.buyPrice) * 100)
                      : 100}
                    %)
                  </span>
                </div>
              </div>

              {/* Initial Stock (Only for new product) & Low Stock Alert threshold */}
              <div className="grid grid-cols-2 gap-3">
                {!editingProduct && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Stok Awal Masuk
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {formData.procurementType === 'PRODUKSI' ? 'Dicatat via Hasil Produksi' : 'Dicatat via Pembelian'}
                    </span>
                  </div>
                )}

                <div className={editingProduct ? 'col-span-2' : ''}>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batas Alert Stok Menipis
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStockAlert}
                    onChange={(e) =>
                      setFormData({ ...formData, minStockAlert: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Notifikasi ketika stok ≤ batas ini
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 2: PENAMBAHAN STOK VIA PRODUKSI (MAKANAN / MINUMAN)          */}
      {/* ------------------------------------------------------------------ */}
      {isProductionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Catat Hasil Produksi Dapur</h3>
                  <p className="text-[11px] text-emerald-300">
                    Penambahan stok dari hasil memasak / meracik (Makanan & Minuman)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProductionModalOpen(false)}
                className="p-1 rounded-lg text-emerald-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduction} className="p-6 space-y-4">
              {/* Product Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Pilih Menu / Produk yang Diproduksi <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={productionForm.productId}
                  onChange={(e) => {
                    const prod = products.find((p) => p.id === e.target.value);
                    setProductionForm((prev) => ({
                      ...prev,
                      productId: e.target.value,
                      costPerUnit: prod ? prod.buyPrice : prev.costPerUnit,
                    }));
                  }}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <optgroup label="Produk Tipe Produksi (Menu Masak / Olahan)">
                    {products
                      .filter((p) => p.procurementType === 'PRODUKSI')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.icon || '🍲'} {p.name} — Stok Saat Ini: {p.stock} {p.unit}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Produk Lainnya">
                    {products
                      .filter((p) => p.procurementType !== 'PRODUKSI')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.icon || '📦'} {p.name} — Stok Saat Ini: {p.stock} {p.unit}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {selectedProductionProduct && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-emerald-800 font-semibold block">Stok Sebelumnya:</span>
                    <span className="font-mono text-xs text-slate-500">ID: {selectedProductionProduct.id}</span>
                  </div>
                  <span className="font-black text-emerald-950 text-base">
                    {selectedProductionProduct.stock} {selectedProductionProduct.unit}
                  </span>
                </div>
              )}

              {/* Quantity Produced & Cost per Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jumlah Diproduksi (+) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={productionForm.quantity}
                    onChange={(e) =>
                      setProductionForm({ ...productionForm, quantity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-black focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Satuan: {selectedProductionProduct?.unit || 'porsi/cup'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Biaya Bahan per Unit (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productionForm.costPerUnit || ''}
                    onChange={(e) =>
                      setProductionForm({ ...productionForm, costPerUnit: Number(e.target.value) })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Modal bahan per porsi
                  </span>
                </div>
              </div>

              {/* Batch & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Batch / Shift Dapur
                  </label>
                  <input
                    type="text"
                    value={productionForm.batchNumber}
                    onChange={(e) =>
                      setProductionForm({ ...productionForm, batchNumber: e.target.value })
                    }
                    placeholder="Batch Pagi / Shift 1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Produksi
                  </label>
                  <input
                    type="text"
                    value={productionForm.notes}
                    onChange={(e) =>
                      setProductionForm({ ...productionForm, notes: e.target.value })
                    }
                    placeholder="Cth: Masak 30 porsi kuah baru"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Summary calculation */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Total Estimasi Biaya Produksi:</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    {formatRupiah(productionForm.quantity * productionForm.costPerUnit)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
                  <span>Stok Akhir Produk:</span>
                  <span className="font-bold text-white text-sm">
                    {(selectedProductionProduct?.stock || 0) + Number(productionForm.quantity)}{' '}
                    {selectedProductionProduct?.unit || 'porsi'}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductionModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Simpan & Tambah Stok Produksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 3: PENAMBAHAN STOK VIA PEMBELIAN (KULAKAN SUPPLIER)         */}
      {/* ------------------------------------------------------------------ */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-sky-950 text-white flex items-center justify-between border-b border-sky-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-300">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Catat Pembelian Masuk (Kulakan)</h3>
                  <p className="text-[11px] text-sky-300">
                    Penambahan stok dari supplier / distributor untuk produk jadi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPurchaseModalOpen(false)}
                className="p-1 rounded-lg text-sky-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-6 space-y-4">
              {/* Product Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Pilih Produk yang Dibeli <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={purchaseForm.productId}
                  onChange={(e) => {
                    const prod = products.find((p) => p.id === e.target.value);
                    setPurchaseForm((prev) => ({
                      ...prev,
                      productId: e.target.value,
                      buyPricePerUnit: prod ? prod.buyPrice : prev.buyPricePerUnit,
                    }));
                  }}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white font-medium focus:ring-2 focus:ring-sky-500"
                >
                  <optgroup label="Produk Tipe Pembelian (Produk Jadi / Sembako)">
                    {products
                      .filter((p) => p.procurementType === 'PEMBELIAN')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.icon || '📦'} {p.name} — Stok Saat Ini: {p.stock} {p.unit}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Produk Lainnya">
                    {products
                      .filter((p) => p.procurementType !== 'PEMBELIAN')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.icon || '🍲'} {p.name} — Stok Saat Ini: {p.stock} {p.unit}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {selectedPurchaseProduct && (
                <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-sky-800 font-semibold block">Stok Sebelumnya:</span>
                    <span className="font-mono text-xs text-slate-500">ID: {selectedPurchaseProduct.id}</span>
                  </div>
                  <span className="font-black text-sky-950 text-base">
                    {selectedPurchaseProduct.stock} {selectedPurchaseProduct.unit}
                  </span>
                </div>
              )}

              {/* Quantity Purchased & Buy Price per Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jumlah Barang Masuk (+) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purchaseForm.quantity}
                    onChange={(e) =>
                      setPurchaseForm({ ...purchaseForm, quantity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-black focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Satuan: {selectedPurchaseProduct?.unit || 'pcs'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Beli / HPP per Unit (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={purchaseForm.buyPricePerUnit || ''}
                    onChange={(e) =>
                      setPurchaseForm({ ...purchaseForm, buyPricePerUnit: Number(e.target.value) })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Harga beli modal dari supplier
                  </span>
                </div>
              </div>

              {/* Supplier Name & Invoice Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Supplier / Agen
                  </label>
                  <input
                    type="text"
                    value={purchaseForm.supplierName}
                    onChange={(e) =>
                      setPurchaseForm({ ...purchaseForm, supplierName: e.target.value })
                    }
                    placeholder="Contoh: PT Sumber Rejeki"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Faktur / Nota Pembelian
                  </label>
                  <input
                    type="text"
                    value={purchaseForm.invoiceNumber}
                    onChange={(e) =>
                      setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })
                    }
                    placeholder="INV-SUP-001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Checkbox: Update HPP Master */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-update-buyprice"
                  checked={purchaseForm.updateProductBuyPrice}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, updateProductBuyPrice: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                />
                <label htmlFor="chk-update-buyprice" className="text-xs text-slate-700 font-medium">
                  Perbarui Harga Modal (HPP) master produk dengan harga beli baru ini
                </label>
              </div>

              {/* Summary calculation */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Total Tagihan Pembelian:</span>
                  <span className="font-bold text-sky-400 font-mono text-sm">
                    {formatRupiah(purchaseForm.quantity * purchaseForm.buyPricePerUnit)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
                  <span>Stok Akhir Produk:</span>
                  <span className="font-bold text-white text-sm">
                    {(selectedPurchaseProduct?.stock || 0) + Number(purchaseForm.quantity)}{' '}
                    {selectedPurchaseProduct?.unit || 'pcs'}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-600 active:scale-[0.98] text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Simpan & Tambah Stok Pembelian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 4: PENYESUAIAN STOK & OPNAME FISIK (KHUSUS PEMILIK)          */}
      {/* ------------------------------------------------------------------ */}
      {stockAdjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <ArrowUpDown className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-white">Penyesuaian Stok (Opname)</h3>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[10px] font-black">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{stockAdjustProduct.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStockAdjustProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjust} className="p-6 space-y-4">
              {/* Current Stock Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-100 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-600 font-semibold block">Stok Tercatat di Sistem:</span>
                  <span className="text-[11px] text-slate-500">
                    Tipe: {stockAdjustProduct.procurementType === 'PRODUKSI' ? 'Hasil Produksi' : 'Pembelian Supplier'}
                  </span>
                </div>
                <span className="font-black text-slate-900 text-lg">
                  {stockAdjustProduct.stock} {stockAdjustProduct.unit}
                </span>
              </div>

              {/* Adjustment Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tipe Penyesuaian
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('IN');
                      setAdjustReason('Penyesuaian Stok Masuk Manual');
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors ${
                      adjustType === 'IN'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    + Tambah
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('OUT');
                      setAdjustReason('Barang Rusak / Kadaluarsa / Hilang');
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors ${
                      adjustType === 'OUT'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    - Kurang / Rusak
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('OPNAME');
                      setAdjustReason('Hasil Stock Opname Fisik');
                      setAdjustQty(stockAdjustProduct.stock);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors ${
                      adjustType === 'OPNAME'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Opname Fisik
                  </button>
                </div>
              </div>

              {/* Qty Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {adjustType === 'IN'
                    ? 'Jumlah Stok Tambahan (+)'
                    : adjustType === 'OUT'
                    ? 'Jumlah Stok Berkurang / Dibuang (-)'
                    : 'Jumlah Fisik Riil di Toko / Dapur'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-base font-black focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan / Keterangan Penyesuaian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Contoh: Selisih hitung opname bulanan, tumpah, dll."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Result Preview */}
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-xs flex justify-between items-center text-emerald-950 font-bold">
                <span>Stok Akhir Baru:</span>
                <span className="text-sm font-black">
                  {adjustType === 'IN'
                    ? stockAdjustProduct.stock + Number(adjustQty)
                    : adjustType === 'OUT'
                    ? Math.max(0, stockAdjustProduct.stock - Number(adjustQty))
                    : Number(adjustQty)}{' '}
                  {stockAdjustProduct.unit}
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStockAdjustProduct(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  Simpan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 5: KELOLA KATEGORI PRODUK                                    */}
      {/* ------------------------------------------------------------------ */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Kelola Kategori Produk</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nama kategori baru..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCatName.trim()) {
                      addCategory(newCatName.trim());
                      setNewCatName('');
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Tambah
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {categories.map((c) => (
                  <div key={c} className="py-2.5 flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">{c}</span>
                    {c !== 'Semua' && (
                      <button
                        type="button"
                        onClick={() => deleteCategory(c)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL 6: LOG RIWAYAT PERUBAHAN STOK                                */}
      {/* ------------------------------------------------------------------ */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">Log Riwayat Stok Lengkap</h3>
                  <p className="text-[11px] text-slate-400">Catatan Produksi, Pembelian Supplier, dan Opname</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Types inside Log Modal */}
            <div className="px-6 pt-4 pb-2 flex items-center gap-1.5 overflow-x-auto border-b border-slate-100">
              <button
                type="button"
                onClick={() => setHistoryTypeFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  historyTypeFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({stockAdjustments.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryTypeFilter('PRODUKSI')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                  historyTypeFilter === 'PRODUKSI'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <ChefHat className="w-3 h-3" />
                Produksi
              </button>
              <button
                type="button"
                onClick={() => setHistoryTypeFilter('PEMBELIAN')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                  historyTypeFilter === 'PEMBELIAN'
                    ? 'bg-sky-700 text-white'
                    : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
                }`}
              >
                <Truck className="w-3 h-3" />
                Pembelian
              </button>
              <button
                type="button"
                onClick={() => setHistoryTypeFilter('OPNAME')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  historyTypeFilter === 'OPNAME'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Opname Fisik
              </button>
            </div>

            <div className="p-6 max-h-[65vh] overflow-y-auto space-y-2.5">
              {filteredHistory.length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-10">
                  Belum ada catatan riwayat perubahan stok pada filter ini.
                </p>
              ) : (
                filteredHistory.map((adj) => {
                  const isProd = adj.type === 'PRODUKSI' || adj.sourceType === 'PRODUKSI';
                  const isBuy = adj.type === 'PEMBELIAN' || adj.sourceType === 'PEMBELIAN';
                  const isOpname = adj.type === 'OPNAME' || adj.sourceType === 'OPNAME';

                  return (
                    <div
                      key={adj.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs flex justify-between items-start gap-3"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{adj.productName}</span>
                          {isProd ? (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <ChefHat className="w-3 h-3" /> Produksi Dapur
                            </span>
                          ) : isBuy ? (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
                              <Truck className="w-3 h-3" /> Pembelian Supplier
                            </span>
                          ) : isOpname ? (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Opname Fisik
                            </span>
                          ) : (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                              Penyesuaian Manual
                            </span>
                          )}
                        </div>

                        <p className="text-slate-600 text-xs font-medium">{adj.reason}</p>

                        {(adj.supplierOrBatch || adj.invoiceNumber || adj.totalCost) && (
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-0.5">
                            {adj.supplierOrBatch && <span>Ref: {adj.supplierOrBatch}</span>}
                            {adj.invoiceNumber && <span>Faktur: #{adj.invoiceNumber}</span>}
                            {adj.totalCost ? <span>Total Biaya: {formatRupiah(adj.totalCost)}</span> : null}
                          </div>
                        )}

                        <span className="text-[10px] text-slate-400 block pt-0.5">
                          {formatDateTime(adj.createdAt)} • Oleh {adj.performedBy}
                        </span>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span
                          className={`font-black font-mono px-2.5 py-1 rounded-lg text-xs inline-block ${
                            adj.adjustedQty > 0
                              ? isProd
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-sky-100 text-sky-800 border border-sky-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {adj.adjustedQty > 0 ? `+${adj.adjustedQty}` : adj.adjustedQty}
                        </span>
                        <span className="text-[11px] text-slate-600 block mt-1 font-semibold">
                          Stok Akhir: {adj.finalStock}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
