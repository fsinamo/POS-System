import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Product, StockAdjustment } from '../../types';
import { formatRupiah, formatDateTime, generateBarcode, exportToCSV } from '../../utils/formatters';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  Sliders,
  History,
  QrCode,
  Download,
  X,
  Check,
  FolderPlus,
  Layers,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';

export const InventoryScreen: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    deleteCategory,
    adjustStock,
    stockAdjustments,
    currentUser,
  } = usePOS();

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Form State for Add / Edit Product
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
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
    barcode: '',
    buyPrice: 0,
    sellPrice: 0,
    stock: 10,
    minStockAlert: 5,
    unit: 'pcs',
    icon: '📦',
  });

  // Stock Opname Form State
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT' | 'OPNAME'>('IN');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('Restock Barang');

  // Category modal input
  const [newCatName, setNewCatName] = useState('');

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: categories.find((c) => c !== 'Semua') || 'Makanan',
      barcode: generateBarcode(),
      buyPrice: 0,
      sellPrice: 0,
      stock: 10,
      minStockAlert: 5,
      unit: 'pcs',
      icon: '📦',
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
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

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name.trim(),
        category: formData.category,
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

  // Handle Stock Adjustment Submit
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
      previousStock: current,
      adjustedQty: qtyChange,
      finalStock,
      reason: adjustReason.trim() || 'Penyesuaian Stok',
    });

    setStockAdjustProduct(null);
  };

  // Filtered Products
  const filtered = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'Semua' || p.category.toLowerCase() === selectedCategory.toLowerCase();
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

    return matchesCat && matchesQuery && matchesStock;
  });

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Nama Produk',
      'Kategori',
      'Barcode',
      'Harga Beli (HPP)',
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

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Manajemen Produk & Stok
              </h1>
              <p className="text-xs text-slate-500">
                Kelola katalog barang, harga HPP, barcode, dan penyesuaian stok opname.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <FolderPlus className="w-4 h-4 text-slate-500" />
            <span>Kategori</span>
          </button>

          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Log Stok</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-add-product"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Stock Summary Cards / Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setStockFilter('all')}
          className={`p-4 rounded-xl border text-left transition-all ${
            stockFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-xs opacity-70 block font-medium">Total Jenis Produk</span>
          <span className="text-2xl font-black">{products.length} SKU</span>
        </button>

        <button
          onClick={() => setStockFilter('low')}
          className={`p-4 rounded-xl border text-left transition-all ${
            stockFilter === 'low'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs opacity-70 block font-medium">Stok Menipis (Alert)</span>
            <AlertTriangle className={`w-4 h-4 ${stockFilter === 'low' ? 'text-white' : 'text-amber-500'}`} />
          </div>
          <span className="text-2xl font-black">{lowStockCount} Produk</span>
        </button>

        <button
          onClick={() => setStockFilter('out')}
          className={`p-4 rounded-xl border text-left transition-all ${
            stockFilter === 'out'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:border-rose-300'
          }`}
        >
          <span className="text-xs opacity-70 block font-medium">Stok Habis (Kosong)</span>
          <span className="text-2xl font-black">{outOfStockCount} Produk</span>
        </button>
      </div>

      {/* Search & Category Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama produk, barcode, atau kategori..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
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
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Barcode</th>
                <th className="py-3 px-4">Harga Beli (Modal)</th>
                <th className="py-3 px-4">Harga Jual</th>
                <th className="py-3 px-4">Margin Laba</th>
                <th className="py-3 px-4">Stok Saat Ini</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Tidak ada produk yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const profit = p.sellPrice - p.buyPrice;
                  const profitMarginPercent =
                    p.buyPrice > 0 ? Math.round((profit / p.buyPrice) * 100) : 100;
                  const isOutOfStock = p.stock <= 0;
                  const isLow = p.stock > 0 && p.stock <= p.minStockAlert;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Name & Icon */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl flex-shrink-0">{p.icon || '📦'}</span>
                          <div>
                            <span className="font-bold text-slate-900 block">{p.name}</span>
                            <span className="text-[10px] text-slate-400">ID: {p.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {p.category}
                        </span>
                      </td>

                      {/* Barcode */}
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {p.barcode}
                      </td>

                      {/* Buy Price */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">
                        {formatRupiah(p.buyPrice)}
                      </td>

                      {/* Sell Price */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatRupiah(p.sellPrice)}
                      </td>

                      {/* Margin */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-semibold text-emerald-700">
                          <span>+{formatRupiah(profit)}</span>
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">
                            ({profitMarginPercent}%)
                          </span>
                        </div>
                      </td>

                      {/* Stock Status */}
                      <td className="py-3 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            Habis (0 {p.unit})
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            {p.stock} {p.unit} (Menipis)
                          </span>
                        ) : (
                          <span className="font-bold text-slate-800">
                            {p.stock} {p.unit}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setStockAdjustProduct(p);
                              setAdjustQty(1);
                              setAdjustReason('Restock Barang');
                              setAdjustType('IN');
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition-colors"
                            title="Penyesuaian Stok (Stock Opname)"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
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

      {/* Modal Add / Edit Product */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">
                  {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Name & Emoji */}
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Icon/Emoji</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full text-center text-xl py-2 border border-slate-300 rounded-xl bg-white"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Produk <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Kopi Susu Gula Aren"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Category & Satuan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                    placeholder="pcs, cup, porsi, kg, box"
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
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Modal / Beli (HPP)
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Stok Awal</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div className={editingProduct ? 'col-span-2' : ''}>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batas Peringatan Stok Menipis
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
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Opname / Penyesuaian Stok Modal */}
      {stockAdjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <ArrowUpDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Penyesuaian Stok</h3>
                  <p className="text-[11px] text-slate-400">{stockAdjustProduct.name}</p>
                </div>
              </div>
              <button
                onClick={() => setStockAdjustProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjust} className="p-6 space-y-4">
              {/* Current Stock Banner */}
              <div className="p-3 rounded-xl bg-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-600">Stok Saat Ini:</span>
                <span className="font-black text-slate-900 text-base">
                  {stockAdjustProduct.stock} {stockAdjustProduct.unit}
                </span>
              </div>

              {/* Adjustment Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tipe Penyesuaian</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('IN');
                      setAdjustReason('Restock Pembelian Masuk');
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors ${
                      adjustType === 'IN'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    + Tambah Stok
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('OUT');
                      setAdjustReason('Barang Rusak/Kadaluarsa');
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors ${
                      adjustType === 'OUT'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    - Kurang Stok
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
                    ? 'Jumlah Stok Masuk (+)'
                    : adjustType === 'OUT'
                    ? 'Jumlah Stok Berkurang (-)'
                    : 'Jumlah Fisik Aktual'}
                </label>
                <input
                  type="number"
                  min="1"
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
                  Alasan / Catatan Penyesuaian
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Contoh: Kulakan supplier, barang retur, selisih hitung"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Result Preview */}
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs flex justify-between items-center text-emerald-900 font-bold">
                <span>Stok Baru Akhir:</span>
                <span>
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
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  Simpan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Kelola Kategori Produk</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Add category form */}
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Tambah
                </button>
              </div>

              {/* Categories list */}
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {categories.map((c) => (
                  <div key={c} className="py-2.5 flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">{c}</span>
                    {c !== 'Semua' && (
                      <button
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

      {/* Stock Adjustment History Log Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Log Riwayat Penyesuaian Stok</h3>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-2">
              {stockAdjustments.length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-8">
                  Belum ada catatan riwayat perubahan stok.
                </p>
              ) : (
                stockAdjustments.map((adj) => (
                  <div
                    key={adj.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs flex justify-between items-start"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{adj.productName}</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">{adj.reason}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {formatDateTime(adj.createdAt)} • Oleh {adj.performedBy}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-black font-mono px-2 py-0.5 rounded text-xs inline-block ${
                          adj.adjustedQty > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {adj.adjustedQty > 0 ? `+${adj.adjustedQty}` : adj.adjustedQty}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Akhir: {adj.finalStock}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
