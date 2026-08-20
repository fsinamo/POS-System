import React from 'react';
import { usePOS } from '../../context/POSContext';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { X, Layers, Play, Trash2, Clock, User } from 'lucide-react';

interface HoldCartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HoldCartModal: React.FC<HoldCartModalProps> = ({ isOpen, onClose }) => {
  const { holdCarts, resumeHoldCart, deleteHoldCart } = usePOS();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Pesanan Disimpan ({holdCarts.length})</h3>
              <p className="text-xs text-slate-400">Lanjutkan transaksi pelanggan yang ditunda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
          {holdCarts.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Layers className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="font-medium text-sm">Tidak ada pesanan yang disimpan.</p>
              <p className="text-xs text-slate-400 mt-1">
                Gunakan tombol "Simpan" pada keranjang belanja untuk menunda transaksi.
              </p>
            </div>
          ) : (
            holdCarts.map((hold) => {
              const totalItems = hold.items.reduce((sum, item) => sum + item.quantity, 0);
              const totalPrice = hold.items.reduce(
                (sum, item) => sum + (item.product.sellPrice * item.quantity - item.itemDiscount),
                0
              );

              return (
                <div
                  key={hold.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-emerald-300 transition-all flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{hold.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(hold.createdAt)}
                        </span>
                        {hold.customerName && (
                          <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <User className="w-3 h-3" />
                            {hold.customerName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">{totalItems} Item</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {formatRupiah(totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Preview Items */}
                  <div className="text-xs text-slate-500 bg-white p-2 rounded-lg border border-slate-100 line-clamp-2">
                    {hold.items.map((i) => `${i.product.name} (${i.quantity}x)`).join(', ')}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => deleteHoldCart(hold.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                    <button
                      onClick={() => {
                        resumeHoldCart(hold.id);
                        onClose();
                      }}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Buka Pesanan Ini
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
