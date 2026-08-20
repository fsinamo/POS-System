import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { formatRupiah, formatNumber, formatDate, exportToCSV } from '../../utils/formatters';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  ShoppingBag,
  CreditCard,
  Download,
  Printer,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const { transactions, products } = usePOS();

  const [timeRange, setTimeRange] = useState<'TODAY' | '7DAYS' | '30DAYS' | 'THIS_MONTH' | 'ALL'>('ALL');

  // Filter transactions by time range
  const filteredTransactions = transactions.filter((t) => {
    const trxTime = new Date(t.createdAt).getTime();
    const now = Date.now();
    const oneDay = 24 * 3600 * 1000;

    if (timeRange === 'TODAY') {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      return trxTime >= todayStart;
    }
    if (timeRange === '7DAYS') {
      return trxTime >= now - 7 * oneDay;
    }
    if (timeRange === '30DAYS') {
      return trxTime >= now - 30 * oneDay;
    }
    if (timeRange === 'THIS_MONTH') {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const d = new Date(t.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }
    return true;
  });

  // Calculate Metrics
  const totalOmset = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalModalHPP = filteredTransactions.reduce((sum, t) => sum + (t.totalCost || 0), 0);
  const totalDiskon = filteredTransactions.reduce((sum, t) => sum + (t.discountAmount || 0), 0);
  const totalLabaBersih = totalOmset - totalModalHPP;
  const labaMarginPercent = totalModalHPP > 0 ? Math.round((totalLabaBersih / totalModalHPP) * 100) : 100;

  const totalTransactionsCount = filteredTransactions.length;
  const avgBasketSize = totalTransactionsCount > 0 ? Math.round(totalOmset / totalTransactionsCount) : 0;

  // Unpaid Debt Total
  const totalHutangBelumLunas = filteredTransactions
    .filter((t) => t.status === 'HUTANG')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  // Top Selling Products breakdown
  const productSalesMap: {
    [id: string]: {
      name: string;
      category: string;
      totalQty: number;
      totalRevenue: number;
      totalProfit: number;
    };
  } = {};

  filteredTransactions.forEach((trx) => {
    trx.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.productName,
          category: item.category,
          totalQty: 0,
          totalRevenue: 0,
          totalProfit: 0,
        };
      }
      const profitPerItem = item.sellPrice - item.buyPrice;
      productSalesMap[item.productId].totalQty += item.quantity;
      productSalesMap[item.productId].totalRevenue += item.subtotal;
      productSalesMap[item.productId].totalProfit += profitPerItem * item.quantity;
    });
  });

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.totalQty - a.totalQty);

  // Payment Method Breakdown
  const paymentBreakdown = {
    TUNAI: { count: 0, total: 0 },
    QRIS: { count: 0, total: 0 },
    HUTANG: { count: 0, total: 0 },
  };

  filteredTransactions.forEach((trx) => {
    if (paymentBreakdown[trx.paymentMethod]) {
      paymentBreakdown[trx.paymentMethod].count += 1;
      paymentBreakdown[trx.paymentMethod].total += trx.totalAmount;
    }
  });

  // Category Breakdown
  const categorySalesMap: { [cat: string]: number } = {};
  filteredTransactions.forEach((trx) => {
    trx.items.forEach((item) => {
      categorySalesMap[item.category] = (categorySalesMap[item.category] || 0) + item.subtotal;
    });
  });

  // Export Report to CSV
  const handleExportCSV = () => {
    const headers = ['Laporan Keuangan POS Pro'];
    const summaryRows = [
      ['Periode', timeRange],
      ['Total Omset (Gross Revenue)', totalOmset],
      ['Total Modal (HPP)', totalModalHPP],
      ['Total Laba Bersih (Net Profit)', totalLabaBersih],
      ['Margin Laba Bersih', `${labaMarginPercent}%`],
      ['Jumlah Transaksi', totalTransactionsCount],
      ['Rata-rata Penjualan per Nota', avgBasketSize],
      ['Hutang Belum Lunas', totalHutangBelumLunas],
      [],
      ['--- PRODUK TERLARIS ---'],
      ['Nama Produk', 'Kategori', 'Kuantitas Terjual', 'Total Omset (Rp)', 'Total Laba (Rp)'],
      ...topProducts.map((p) => [p.name, p.category, p.totalQty, p.totalRevenue, p.totalProfit]),
    ];

    exportToCSV(`Laporan_Keuangan_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`, [
      headers,
      ...summaryRows,
    ]);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-900 text-white">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Laporan Keuangan & Laba Bersih
            </h1>
            <p className="text-xs text-slate-500">
              Analisis omset penjualan, HPP/modal, keuntungan netto, dan statistik produk terlaris.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Filter Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(
              [
                { id: 'TODAY', label: 'Hari Ini' },
                { id: '7DAYS', label: '7 Hari' },
                { id: '30DAYS', label: '30 Hari' },
                { id: 'THIS_MONTH', label: 'Bulan Ini' },
                { id: 'ALL', label: 'Semua' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeRange === t.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Laporan</span>
          </button>
        </div>
      </div>

      {/* Main KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Omset (Gross)
            </span>
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {formatRupiah(totalOmset)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Dari {totalTransactionsCount} total transaksi
          </p>
        </div>

        {/* Total Modal / HPP */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Modal / HPP (COGS)
            </span>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {formatRupiah(totalModalHPP)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total biaya pokok pembelian barang
          </p>
        </div>

        {/* Laba Bersih (Net Profit) */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              Keuntungan Bersih (Netto)
            </span>
            <div className="p-2 rounded-lg bg-white/20 text-white">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight font-mono">
            {formatRupiah(totalLabaBersih)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-100 mt-1">
            <Sparkles className="w-3 h-3" />
            <span>Margin Laba Bersih: {labaMarginPercent}%</span>
          </div>
        </div>

        {/* Average Transaction & Debt */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rata-rata Nota / Bon
            </span>
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {formatRupiah(avgBasketSize)}
          </div>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">
            Hutang Belum Lunas: {formatRupiah(totalHutangBelumLunas)}
          </p>
        </div>
      </div>

      {/* Grid: Payment Method Breakdown & Category Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods (Tunai vs QRIS vs Hutang) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-600" />
              Metode Pembayaran
            </h3>
            <span className="text-xs text-slate-400">{filteredTransactions.length} Transaksi</span>
          </div>

          <div className="space-y-3">
            {/* TUNAI */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  💵
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Tunai (Cash)</h4>
                  <span className="text-[11px] text-slate-400">
                    {paymentBreakdown.TUNAI.count} transaksi (
                    {totalTransactionsCount > 0
                      ? Math.round((paymentBreakdown.TUNAI.count / totalTransactionsCount) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>
              <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                {formatRupiah(paymentBreakdown.TUNAI.total)}
              </span>
            </div>

            {/* QRIS */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                  📱
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">QRIS / Non-Tunai</h4>
                  <span className="text-[11px] text-slate-400">
                    {paymentBreakdown.QRIS.count} transaksi (
                    {totalTransactionsCount > 0
                      ? Math.round((paymentBreakdown.QRIS.count / totalTransactionsCount) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>
              <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                {formatRupiah(paymentBreakdown.QRIS.total)}
              </span>
            </div>

            {/* HUTANG / BON */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  📝
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Hutang / Bon</h4>
                  <span className="text-[11px] text-slate-400">
                    {paymentBreakdown.HUTANG.count} transaksi (
                    {totalTransactionsCount > 0
                      ? Math.round((paymentBreakdown.HUTANG.count / totalTransactionsCount) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>
              <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                {formatRupiah(paymentBreakdown.HUTANG.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Category Contribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-slate-600" />
              Kontribusi Kategori
            </h3>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {Object.entries(categorySalesMap).length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-8">Belum ada data penjualan.</p>
            ) : (
              Object.entries(categorySalesMap).map(([cat, total]) => {
                const percent = totalOmset > 0 ? Math.round((total / totalOmset) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{cat}</span>
                      <span className="font-mono">{formatRupiah(total)} ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Store Health & Tips */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Kesehatan Keuangan</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {labaMarginPercent >= 30
                ? 'Margin Laba Sangat Sehat'
                : 'Perhatikan Efisiensi Modal'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Toko menghasilkan margin keuntungan rata-rata sebesar{' '}
              <strong className="text-emerald-300">{labaMarginPercent}%</strong> dari modal HPP.
              Pastikan menagih piutang bon pelanggan tepat waktu untuk menjaga arus kas operasional.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 text-xs text-slate-300">
            <span className="font-bold text-white block mb-0.5">💡 Tips Manajemen Kasir:</span>
            Gunakan fitur backup berkala dan aktifkan integrasi Google Sheets agar data keuangan selalu terarsip otomatis di cloud.
          </div>
        </div>
      </div>

      {/* Top Selling Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Daftar Produk Terlaris (Top Selling Products)
            </h3>
          </div>
          <span className="text-xs text-slate-400">{topProducts.length} Produk terjual</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Nama Produk</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Total Terjual (Qty)</th>
                <th className="py-3 px-4 text-right">Total Omset</th>
                <th className="py-3 px-4 text-right">Total Keuntungan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Belum ada produk yang terjual dalam periode ini.
                  </td>
                </tr>
              ) : (
                topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-center">
                      {idx === 0 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black inline-flex items-center justify-center text-xs shadow-xs">
                          1
                        </span>
                      ) : idx === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black inline-flex items-center justify-center text-xs">
                          2
                        </span>
                      ) : idx === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-black inline-flex items-center justify-center text-xs">
                          3
                        </span>
                      ) : (
                        <span className="font-bold text-slate-400">{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {p.totalQty}x
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(p.totalRevenue)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      +{formatRupiah(p.totalProfit)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
