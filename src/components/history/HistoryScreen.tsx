import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Transaction, TransactionItem } from '../../types';
import { formatRupiah, formatDateTime, formatNumber, exportToCSV } from '../../utils/formatters';
import { ReceiptModal } from '../pos/ReceiptModal';
import {
  History,
  Search,
  Filter,
  Calendar,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
  Download,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
} from 'lucide-react';

export const HistoryScreen: React.FC = () => {
  const { transactions, settleDebt, processReturn } = usePOS();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LUNAS' | 'HUTANG' | 'RETUR'>('ALL');
  const [dateFilter, setDateFilter] = useState<'TODAY' | '7DAYS' | '30DAYS' | 'ALL'>('ALL');

  // Selected Transaction for Detail Modal / Reprint / Return
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [reprintTransaction, setReprintTransaction] = useState<Transaction | null>(null);

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnQtys, setReturnQtys] = useState<{ [productId: string]: number }>({});
  const [returnReason, setReturnReason] = useState('Barang cacat/rusak');

  // Filter transactions
  const filtered = transactions.filter((trx) => {
    // Search
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      trx.id.toLowerCase().includes(query) ||
      (trx.customerName && trx.customerName.toLowerCase().includes(query)) ||
      trx.cashierName.toLowerCase().includes(query);

    // Status
    let matchesStatus = true;
    if (statusFilter === 'LUNAS') {
      matchesStatus = trx.status === 'LUNAS';
    } else if (statusFilter === 'HUTANG') {
      matchesStatus = trx.status === 'HUTANG';
    } else if (statusFilter === 'RETUR') {
      matchesStatus = trx.status === 'RETUR_SEBAGIAN' || trx.status === 'RETUR_TOTAL';
    }

    // Date
    let matchesDate = true;
    const trxDate = new Date(trx.createdAt).getTime();
    const now = Date.now();
    const oneDay = 24 * 3600 * 1000;

    if (dateFilter === 'TODAY') {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      matchesDate = trxDate >= todayStart;
    } else if (dateFilter === '7DAYS') {
      matchesDate = trxDate >= now - 7 * oneDay;
    } else if (dateFilter === '30DAYS') {
      matchesDate = trxDate >= now - 30 * oneDay;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleOpenReturnModal = (trx: Transaction) => {
    const initial: { [id: string]: number } = {};
    trx.items.forEach((item) => {
      initial[item.productId] = 0;
    });
    setReturnQtys(initial);
    setReturnReason('Barang rusak / komplain pelanggan');
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    const returnList = Object.entries(returnQtys)
      .map(([productId, qty]) => ({ productId, qty: Number(qty) }))
      .filter((r) => r.qty > 0);

    if (returnList.length === 0) {
      alert('Pilih setidaknya 1 item untuk dikembalikan.');
      return;
    }

    processReturn(selectedTransaction.id, returnList, returnReason);
    setIsReturnModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleExportHistoryCSV = () => {
    const headers = [
      'No. Nota',
      'Waktu Transaksi',
      'Kasir',
      'Pelanggan',
      'Metode Pembayaran',
      'Status',
      'Subtotal',
      'Diskon',
      'Total Akhir',
      'Laba Bersih',
      'Ringkasan Item',
    ];

    const rows = transactions.map((t) => [
      t.id,
      formatDateTime(t.createdAt),
      t.cashierName,
      t.customerName || '-',
      t.paymentMethod,
      t.status,
      t.subtotal,
      t.discountAmount,
      t.totalAmount,
      t.grossProfit,
      t.items.map((i) => `${i.productName} (${i.quantity}x)`).join('; '),
    ]);

    exportToCSV(`Riwayat_Transaksi_${new Date().toISOString().slice(0, 10)}.csv`, [headers, ...rows]);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-900 text-white">
            <History className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Riwayat Transaksi & Struk
            </h1>
            <p className="text-xs text-slate-500">
              Lacak seluruh struk penjualan, cetak ulang nota, pelunasan bon piutang, dan retur.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportHistoryCSV}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Export CSV Riwayat</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. Nota (TRX-...), nama pelanggan, atau nama kasir..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'ALL', label: 'Semua Waktu' },
                { id: 'TODAY', label: 'Hari Ini' },
                { id: '7DAYS', label: '7 Hari' },
                { id: '30DAYS', label: '30 Hari' },
              ] as const
            ).map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  dateFilter === d.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mr-1">
            Status:
          </span>
          {(
            [
              { id: 'ALL', label: 'Semua Status' },
              { id: 'LUNAS', label: 'Lunas Saja' },
              { id: 'HUTANG', label: 'Hutang / Bon' },
              { id: 'RETUR', label: 'Ada Retur' },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                statusFilter === st.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Nota</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Kasir</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4">Total Belanja</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <History className="w-8 h-8 opacity-30 mx-auto mb-1" />
                    Tidak ada riwayat transaksi yang sesuai.
                  </td>
                </tr>
              ) : (
                filtered.map((trx) => {
                  const isHutang = trx.status === 'HUTANG';
                  const isRetur =
                    trx.status === 'RETUR_SEBAGIAN' || trx.status === 'RETUR_TOTAL';

                  return (
                    <tr
                      key={trx.id}
                      onClick={() => setSelectedTransaction(trx)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      {/* Invoice ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {trx.id}
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTime(trx.createdAt)}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {trx.customerName || <span className="text-slate-400">Umum</span>}
                      </td>

                      {/* Cashier */}
                      <td className="py-3.5 px-4 text-slate-600">{trx.cashierName}</td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          {trx.paymentMethod === 'TUNAI' && (
                            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          {trx.paymentMethod === 'QRIS' && (
                            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                          {trx.paymentMethod === 'HUTANG' && (
                            <FileText className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          {trx.paymentMethod}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm">
                        {formatRupiah(trx.totalAmount)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isHutang ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertCircle className="w-3 h-3" />
                            HUTANG (BON)
                          </span>
                        ) : isRetur ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <RotateCcw className="w-3 h-3" />
                            {trx.status === 'RETUR_TOTAL' ? 'RETUR TOTAL' : 'RETUR SEBAGIAN'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            LUNAS
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setReprintTransaction(trx)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1"
                            title="Cetak Ulang Struk"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-500" />
                            <span className="hidden sm:inline">Cetak</span>
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

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold block">
                  DETAIL TRANSAKSI
                </span>
                <h3 className="font-bold text-base text-white">{selectedTransaction.id}</h3>
              </div>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Waktu:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateTime(selectedTransaction.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Kasir:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedTransaction.cashierName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Pelanggan:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedTransaction.customerName || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Metode Bayar:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedTransaction.paymentMethod}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status:</span>
                  <span className="font-bold text-emerald-700">
                    {selectedTransaction.status}
                  </span>
                </div>
                {selectedTransaction.dueDate && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Jatuh Tempo:</span>
                    <span className="font-bold text-amber-700">
                      {selectedTransaction.dueDate}
                    </span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 uppercase text-[11px]">
                  Daftar Barang Belanja
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Nama Produk</th>
                        <th className="py-2 px-3">Qty</th>
                        <th className="py-2 px-3">Harga</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedTransaction.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-800 block">
                              {item.productName}
                            </span>
                            {item.returnedQty && item.returnedQty > 0 ? (
                              <span className="text-[10px] text-purple-700 font-semibold">
                                (Diretur: {item.returnedQty}x)
                              </span>
                            ) : null}
                          </td>
                          <td className="py-2.5 px-3 font-semibold">{item.quantity}x</td>
                          <td className="py-2.5 px-3 font-mono">{formatRupiah(item.sellPrice)}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-right">
                            {formatRupiah(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(selectedTransaction.subtotal)}</span>
                </div>
                {selectedTransaction.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(selectedTransaction.discountAmount)}</span>
                  </div>
                )}
                {selectedTransaction.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>PPN ({selectedTransaction.taxPercent}%):</span>
                    <span>{formatRupiah(selectedTransaction.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-slate-900 text-sm pt-1 border-t border-slate-200">
                  <span>Total Transaksi:</span>
                  <span>{formatRupiah(selectedTransaction.totalAmount)}</span>
                </div>
              </div>

              {/* Actions: Settle Debt, Retur, Reprint */}
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedTransaction.status === 'HUTANG' && (
                  <button
                    onClick={() => {
                      if (confirm(`Lunasi hutang untuk nota ${selectedTransaction.id}?`)) {
                        settleDebt(selectedTransaction.id);
                        setSelectedTransaction(null);
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Tandai Hutang Lunas
                  </button>
                )}

                <button
                  onClick={() => handleOpenReturnModal(selectedTransaction)}
                  className="flex-1 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retur / Kembalikan Barang
                </button>

                <button
                  onClick={() => {
                    setReprintTransaction(selectedTransaction);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  Cetak Struk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {isReturnModalOpen && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">Retur Barang</h3>
                  <p className="text-[11px] text-slate-400">Nota #{selectedTransaction.id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturn} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Pilih kuantitas barang yang ingin dikembalikan. Stok barang akan otomatis dikembalikan ke inventori toko.
              </p>

              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-48 overflow-y-auto">
                {selectedTransaction.items.map((item) => {
                  const maxReturnable = item.quantity - (item.returnedQty || 0);
                  if (maxReturnable <= 0) return null;

                  return (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between gap-2 text-xs bg-white p-2 rounded-lg border border-slate-200"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-slate-800 block truncate">
                          {item.productName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Beli: {item.quantity}x (Maks retur: {maxReturnable})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max={maxReturnable}
                          value={returnQtys[item.productId] || 0}
                          onChange={(e) =>
                            setReturnQtys({
                              ...returnQtys,
                              [item.productId]: Math.min(
                                maxReturnable,
                                Math.max(0, parseInt(e.target.value) || 0)
                              ),
                            })
                          }
                          className="w-14 px-2 py-1 border border-slate-300 rounded text-center font-bold"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Retur / Pengembalian
                </label>
                <input
                  type="text"
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Contoh: Barang rusak, salah beli, kadaluarsa"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  Konfirmasi Retur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reprint Receipt Modal */}
      <ReceiptModal
        transaction={reprintTransaction}
        isOpen={!!reprintTransaction}
        onClose={() => setReprintTransaction(null)}
      />
    </div>
  );
};
