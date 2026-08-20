import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { PaymentMethod } from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import confetti from 'canvas-confetti';
import {
  X,
  Banknote,
  QrCode,
  FileText,
  User,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { cartTotal, processCheckout, settings } = usePOS();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TUNAI');
  const [cashReceived, setCashReceived] = useState<number>(cartTotal);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const changeAmount = Math.max(0, (cashReceived || 0) - cartTotal);
  const isCashInsufficient = paymentMethod === 'TUNAI' && (cashReceived || 0) < cartTotal;

  // Preset cash suggestions based on total
  const generateCashPresets = (total: number) => {
    const presets = new Set<number>();
    presets.add(total); // Uang Pas

    const standardDenominations = [10000, 20000, 50000, 100000, 200000, 500000];
    standardDenominations.forEach((denom) => {
      if (denom >= total && presets.size < 6) {
        presets.add(denom);
      }
    });

    // Add rounded up to nearest 10k or 50k
    const roundUp10k = Math.ceil(total / 10000) * 10000;
    const roundUp50k = Math.ceil(total / 50000) * 50000;
    presets.add(roundUp10k);
    presets.add(roundUp50k);

    return Array.from(presets).sort((a, b) => a - b).slice(0, 6);
  };

  const cashPresets = generateCashPresets(cartTotal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCashInsufficient) return;
    if (paymentMethod === 'HUTANG' && !customerName.trim()) {
      alert('Mohon isi nama pelanggan untuk pencatatan hutang/bon!');
      return;
    }

    setIsProcessing(true);
    try {
      await processCheckout({
        paymentMethod,
        cashReceived: paymentMethod === 'TUNAI' ? cashReceived : undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        dueDate: paymentMethod === 'HUTANG' ? dueDate : undefined,
        notes: notes.trim() || undefined,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      onClose();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memproses pembayaran.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Pembayaran Transaksi
            </span>
            <h3 className="text-xl font-black text-white">
              Total: {formatRupiah(cartTotal)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                id="btn-pay-tunai"
                onClick={() => setPaymentMethod('TUNAI')}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'TUNAI'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>TUNAI (CASH)</span>
              </button>

              <button
                type="button"
                id="btn-pay-qris"
                onClick={() => setPaymentMethod('QRIS')}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'QRIS'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>QRIS DUKUNG</span>
              </button>

              <button
                type="button"
                id="btn-pay-hutang"
                onClick={() => setPaymentMethod('HUTANG')}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'HUTANG'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>HUTANG / BON</span>
              </button>
            </div>
          </div>

          {/* TUNAI View */}
          {paymentMethod === 'TUNAI' && (
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Uang Tunai Diterima (Rp)
                  </label>
                  {isCashInsufficient && (
                    <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Kurang {formatRupiah(cartTotal - (cashReceived || 0))}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    id="input-cash-received"
                    type="number"
                    min="0"
                    step="500"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 font-black text-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Cash Suggestions */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase">
                  Pilihan Nominal Cepat
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {cashPresets.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCashReceived(val)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border transition-colors ${
                        cashReceived === val
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val === cartTotal ? 'Uang Pas' : formatRupiah(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kembalian Display */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-xs text-slate-400 font-medium block leading-none mb-1">
                    Kembalian
                  </span>
                  <span className={`text-xl font-black ${isCashInsufficient ? 'text-slate-400' : 'text-emerald-600'}`}>
                    {formatRupiah(changeAmount)}
                  </span>
                </div>
                {!isCashInsufficient && changeAmount > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    Kembalikan {formatRupiah(changeAmount)}
                  </span>
                )}
                {changeAmount === 0 && !isCashInsufficient && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                    Uang Pas
                  </span>
                )}
              </div>
            </div>
          )}

          {/* QRIS View */}
          {paymentMethod === 'QRIS' && (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80 text-center space-y-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block shadow-sm">
                <div className="w-48 h-48 mx-auto bg-slate-900 rounded-lg p-2 flex flex-col items-center justify-center text-white relative overflow-hidden">
                  {/* Decorative QRIS Frame */}
                  <div className="absolute top-1 left-2 text-[8px] font-black text-rose-400 tracking-widest">
                    QRIS INDONESIA
                  </div>
                  <div className="w-36 h-36 bg-white p-2 rounded flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-slate-900" />
                  </div>
                  <div className="mt-1 text-[9px] font-bold tracking-tight text-slate-300">
                    NMID: ID1020038891001
                  </div>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-800 text-sm">{settings.storeName}</p>
                <p className="text-xs text-slate-500">
                  Scan kode QRIS di atas menggunakan BCA, Mandiri, BRI, GoPay, OVO, DANA, ShopeePay
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5" /> Nominal: {formatRupiah(cartTotal)}
                </div>
              </div>
            </div>
          )}

          {/* HUTANG / BON View */}
          {paymentMethod === 'HUTANG' && (
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                <FileText className="w-4 h-4" />
                Catatan Piutang / Bon Pelanggan
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Pelanggan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Pak Budi / Bu Dewi"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. WhatsApp / HP
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="08xxxxxxxx"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jatuh Tempo
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer info for non-debt methods (optional) */}
          {paymentMethod !== 'HUTANG' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Nama Pelanggan (Opsional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Pelanggan Umum"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  No HP / WA (Opsional)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="08..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Catatan Transaksi */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Catatan Pesanan / Nota (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Meja 04 / Takeaway"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit / Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-submit-payment"
              disabled={isCashInsufficient || isProcessing}
              className={`flex-[2] py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                isCashInsufficient || isProcessing
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : paymentMethod === 'HUTANG'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              {isProcessing
                ? 'Memproses...'
                : paymentMethod === 'HUTANG'
                ? 'Catat Bon & Selesai'
                : 'Selesaikan Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
