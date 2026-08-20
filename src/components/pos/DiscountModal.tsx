import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { formatRupiah } from '../../utils/formatters';
import { X, Percent, Tag, Check } from 'lucide-react';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({ isOpen, onClose }) => {
  const { discountType, discountValue, setDiscount, cartSubtotal } = usePOS();

  const [localType, setLocalType] = useState<'nominal' | 'percent'>(discountType);
  const [localValue, setLocalValue] = useState<number>(discountValue);

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setDiscount(localType, Number(localValue) || 0);
    onClose();
  };

  const calculatedDiscount =
    localType === 'percent'
      ? Math.round((cartSubtotal * Math.min(100, Number(localValue) || 0)) / 100)
      : Math.min(cartSubtotal, Number(localValue) || 0);

  const presetPercents = [5, 10, 15, 20, 25, 50];
  const presetNominals = [2000, 5000, 10000, 20000, 50000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Diskon Transaksi</h3>
              <p className="text-xs text-slate-400">Potongan harga untuk seluruh keranjang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleApply} className="p-5 space-y-4">
          {/* Subtotal preview */}
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-xs font-medium text-slate-500">Subtotal Belanja:</span>
            <span className="font-bold text-slate-800">{formatRupiah(cartSubtotal)}</span>
          </div>

          {/* Discount Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Tipe Potongan</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setLocalType('nominal');
                  if (localType === 'percent') setLocalValue(0);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${
                  localType === 'nominal'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Tag className="w-4 h-4" />
                Nominal (Rp)
              </button>

              <button
                type="button"
                onClick={() => {
                  setLocalType('percent');
                  if (localType === 'nominal') setLocalValue(0);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${
                  localType === 'percent'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Percent className="w-4 h-4" />
                Persentase (%)
              </button>
            </div>
          </div>

          {/* Value Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {localType === 'percent' ? 'Persentase Diskon (%)' : 'Jumlah Potongan (Rp)'}
            </label>
            <div className="relative">
              <input
                id="input-discount-val"
                type="number"
                min="0"
                max={localType === 'percent' ? 100 : cartSubtotal}
                value={localValue || ''}
                onChange={(e) => setLocalValue(Number(e.target.value))}
                placeholder={localType === 'percent' ? 'Contoh: 10' : 'Contoh: 15000'}
                className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-lg text-slate-800"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                {localType === 'percent' ? '%' : 'Rp'}
              </span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Pilihan Cepat
            </span>
            <div className="flex flex-wrap gap-1.5">
              {localType === 'percent'
                ? presetPercents.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setLocalValue(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        localValue === p
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p}%
                    </button>
                  ))
                : presetNominals.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setLocalValue(n)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        localValue === n
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {formatRupiah(n)}
                    </button>
                  ))}
              <button
                type="button"
                onClick={() => setLocalValue(0)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
              >
                Hapus Diskon
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between text-emerald-800">
              <span>Total Potongan:</span>
              <span className="font-bold">{formatRupiah(calculatedDiscount)}</span>
            </div>
            <div className="flex justify-between text-emerald-900 font-bold border-t border-emerald-200/60 pt-1">
              <span>Total Baru:</span>
              <span>{formatRupiah(Math.max(0, cartSubtotal - calculatedDiscount))}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Terapkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
