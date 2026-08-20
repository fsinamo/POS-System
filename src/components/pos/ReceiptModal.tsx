import React, { useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import { Transaction } from '../../types';
import { formatRupiah, formatDateTime, formatNumber } from '../../utils/formatters';
import {
  X,
  Printer,
  Share2,
  Download,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const { settings, activePrinter, detectedOSInfo, triggerPrintReceipt } = usePOS();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    triggerPrintReceipt(activePrinter);
  };

  const handleShareWhatsApp = () => {
    if (!transaction) return;
    const phone = transaction.customerPhone ? transaction.customerPhone.replace(/[^0-9]/g, '') : '';
    
    let text = `*${settings.storeName}*\n`;
    text += `${settings.storeAddress}\n`;
    text += `Telp: ${settings.storePhone}\n`;
    text += `--------------------------------\n`;
    text += `No. Nota: ${transaction.id}\n`;
    text += `Tanggal : ${formatDateTime(transaction.createdAt)}\n`;
    text += `Kasir   : ${transaction.cashierName}\n`;
    if (transaction.customerName) text += `Pelanggan: ${transaction.customerName}\n`;
    text += `--------------------------------\n`;
    transaction.items.forEach((item) => {
      text += `${item.productName}\n`;
      text += `  ${item.quantity} x ${formatNumber(item.sellPrice)} = ${formatNumber(item.subtotal)}\n`;
    });
    text += `--------------------------------\n`;
    text += `Subtotal : ${formatRupiah(transaction.subtotal)}\n`;
    if (transaction.discountAmount > 0) {
      text += `Diskon   : -${formatRupiah(transaction.discountAmount)}\n`;
    }
    if (transaction.taxAmount > 0) {
      text += `PPN (${transaction.taxPercent}%) : ${formatRupiah(transaction.taxAmount)}\n`;
    }
    text += `*TOTAL    : ${formatRupiah(transaction.totalAmount)}*\n`;
    text += `Bayar    : ${transaction.paymentMethod}\n`;
    if (transaction.cashReceived) {
      text += `Tunai    : ${formatRupiah(transaction.cashReceived)}\n`;
      text += `Kembali  : ${formatRupiah(transaction.changeAmount || 0)}\n`;
    }
    text += `--------------------------------\n`;
    text += `${settings.footerMessage.replace(/\n/g, ' ')}\n`;

    const encoded = encodeURIComponent(text);
    const waUrl = phone ? `https://wa.me/${phone.startsWith('0') ? '62' + phone.slice(1) : phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  const handleDownloadReceiptText = () => {
    let content = `${settings.storeName}\n`;
    content += `${settings.storeTagline}\n`;
    content += `${settings.storeAddress}\n`;
    content += `Telp: ${settings.storePhone}\n`;
    content += `==========================================\n`;
    content += `No. Nota : ${transaction.id}\n`;
    content += `Waktu    : ${formatDateTime(transaction.createdAt)}\n`;
    content += `Kasir    : ${transaction.cashierName}\n`;
    if (transaction.customerName) content += `Customer : ${transaction.customerName}\n`;
    content += `------------------------------------------\n`;
    transaction.items.forEach((item) => {
      content += `${item.productName}\n`;
      content += `  ${item.quantity}x @${item.sellPrice}  = ${item.subtotal}\n`;
    });
    content += `------------------------------------------\n`;
    content += `Subtotal : ${formatRupiah(transaction.subtotal)}\n`;
    if (transaction.discountAmount > 0) content += `Diskon   : -${formatRupiah(transaction.discountAmount)}\n`;
    if (transaction.taxAmount > 0) content += `Pajak    : ${formatRupiah(transaction.taxAmount)}\n`;
    content += `TOTAL    : ${formatRupiah(transaction.totalAmount)}\n`;
    content += `Metode   : ${transaction.paymentMethod}\n`;
    if (transaction.cashReceived) {
      content += `Bayar    : ${formatRupiah(transaction.cashReceived)}\n`;
      content += `Kembali  : ${formatRupiah(transaction.changeAmount || 0)}\n`;
    }
    content += `==========================================\n`;
    content += `${settings.footerMessage}\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Struk-${transaction.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 my-4 print:shadow-none print:border-none print:max-w-none print:w-full">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Struk Pembayaran</h3>
              <p className="text-[11px] text-slate-400">Nota #{transaction.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Thermal Receipt Container */}
        <div className="p-4 sm:p-6 bg-slate-100/70 flex justify-center print:bg-white print:p-0">
          <div
            ref={receiptRef}
            id="thermal-receipt"
            className="w-full max-w-[340px] bg-white p-5 rounded-lg shadow-sm border border-slate-200 text-slate-900 font-mono text-xs leading-tight print:shadow-none print:border-none print:p-2 print:max-w-none"
          >
            {/* Store Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <h2 className="font-black text-sm uppercase tracking-wider text-slate-950 font-sans">
                {settings.storeName || 'KASIR POS PRO'}
              </h2>
              {settings.storeTagline && (
                <p className="text-[10px] text-slate-600 font-sans">{settings.storeTagline}</p>
              )}
              <p className="text-[10px] text-slate-600 font-sans leading-tight">
                {settings.storeAddress}
              </p>
              {settings.storePhone && (
                <p className="text-[10px] text-slate-600 font-sans">Telp: {settings.storePhone}</p>
              )}
            </div>

            {/* Transaction Metadata */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Nota:</span>
                <span className="font-bold">{transaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu:</span>
                <span>{formatDateTime(transaction.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir:</span>
                <span>{transaction.cashierName}</span>
              </div>
              {transaction.customerName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Pelanggan:</span>
                  <span className="font-semibold">{transaction.customerName}</span>
                </div>
              )}
              {transaction.status === 'HUTANG' && (
                <div className="flex justify-between text-amber-700 font-bold bg-amber-50 px-1 py-0.5 rounded">
                  <span>Status:</span>
                  <span>BELUM LUNAS (BON)</span>
                </div>
              )}
            </div>

            {/* Itemized List */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-semibold text-slate-900 break-words font-sans">
                    {item.productName}
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>
                      {item.quantity} x {formatNumber(item.sellPrice)}
                      {item.itemDiscount > 0 && ` (Disc -${formatNumber(item.itemDiscount)})`}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatNumber(item.subtotal)}
                    </span>
                  </div>
                  {item.note && (
                    <div className="text-[10px] italic text-slate-500 pl-2">
                      * {item.note}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Calculation Breakdown */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span>{formatRupiah(transaction.subtotal)}</span>
              </div>

              {transaction.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon Transaksi:</span>
                  <span>-{formatRupiah(transaction.discountAmount)}</span>
                </div>
              )}

              {transaction.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>PPN ({transaction.taxPercent}%):</span>
                  <span>{formatRupiah(transaction.taxAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-slate-950 pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span>{formatRupiah(transaction.totalAmount)}</span>
              </div>
            </div>

            {/* Payment info */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Metode Bayar:</span>
                <span className="font-bold">{transaction.paymentMethod}</span>
              </div>

              {transaction.paymentMethod === 'TUNAI' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tunai Diterima:</span>
                    <span>{formatRupiah(transaction.cashReceived || transaction.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(transaction.changeAmount || 0)}</span>
                  </div>
                </>
              )}

              {transaction.paymentMethod === 'HUTANG' && transaction.dueDate && (
                <div className="flex justify-between text-amber-700">
                  <span>Jatuh Tempo:</span>
                  <span>{transaction.dueDate}</span>
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className="text-center pt-3 space-y-1">
              <p className="text-[10px] text-slate-500 whitespace-pre-line font-sans">
                {settings.footerMessage || 'Terima kasih atas kunjungan Anda!'}
              </p>
              <div className="pt-2 flex justify-center">
                <div className="inline-block tracking-widest text-[9px] text-slate-400 font-mono">
                  |||||| |||| ||||| ||||||| ||||
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls (Hidden in Print) */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2.5 print:hidden">
          {/* Active Printer Spooler & OS Info */}
          <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              <span>Printer:</span>
              <span className="font-bold text-slate-900 line-clamp-1 max-w-[150px]">
                {activePrinter?.name || 'Printer Sistem'}
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              {detectedOSInfo.os} ({settings.paperWidth || '58mm'})
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handlePrint}
              id="btn-print-receipt"
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              Cetak Struk
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </button>

            <button
              onClick={handleDownloadReceiptText}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
            >
              <Download className="w-4 h-4" />
              Unduh Teks
            </button>
          </div>

          <button
            onClick={onClose}
            id="btn-close-receipt"
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors border border-slate-200 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
};
