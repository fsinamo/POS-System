import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Tag,
  MessageSquare,
  Layers,
  ArrowRight,
  Sparkles,
  Percent,
} from 'lucide-react';

interface CartPanelProps {
  onOpenCheckout: () => void;
  onOpenDiscount: () => void;
  onOpenHoldSave: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  onOpenCheckout,
  onOpenDiscount,
  onOpenHoldSave,
}) => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    updateItemNote,
    clearCart,
    cartSubtotal,
    cartDiscountAmount,
    discountType,
    discountValue,
    cartTaxAmount,
    cartTotal,
    settings,
  } = usePOS();

  const [activeNoteProductId, setActiveNoteProductId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState<string>('');

  const handleStartNote = (productId: string, currentNote?: string) => {
    setActiveNoteProductId(productId);
    setTempNote(currentNote || '');
  };

  const handleSaveNote = (productId: string) => {
    updateItemNote(productId, tempNote.trim());
    setActiveNoteProductId(null);
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <aside className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm leading-tight">Keranjang Belanja</h2>
            <span className="text-[11px] text-slate-400 font-medium">
              {totalItemsCount} item terhitung
            </span>
          </div>
        </div>

        {cart.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenHoldSave}
              className="p-1.5 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Simpan pesanan sementara"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Simpan</span>
            </button>
            <button
              onClick={clearCart}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Kosongkan keranjang"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100 sleek-scrollbar">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <p className="font-bold text-slate-600 text-sm">Keranjang masih kosong</p>
            <p className="text-xs text-slate-400 max-w-[200px] mt-1">
              Pilih produk dari katalog atau scan barcode barang untuk mulai transaksi.
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const isEditingNote = activeNoteProductId === item.product.id;
            const unitPrice = item.customPrice ?? item.product.sellPrice;
            const itemTotal = unitPrice * item.quantity - (item.itemDiscount || 0);

            return (
              <div key={item.product.id} className="pt-2 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  {/* Title & info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-800 leading-snug truncate">
                      {item.product.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-mono">{formatRupiah(unitPrice)}</span>
                      {item.itemDiscount > 0 && (
                        <span className="text-rose-600 font-semibold">
                          (Disc -{formatRupiah(item.itemDiscount)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 font-mono">
                      {formatRupiah(itemTotal)}
                    </span>
                  </div>
                </div>

                {/* Note display / trigger */}
                {item.note && !isEditingNote && (
                  <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded mt-1">
                    <span className="italic truncate max-w-[180px]">Note: {item.note}</span>
                    <button
                      onClick={() => handleStartNote(item.product.id, item.note)}
                      className="text-emerald-600 text-[10px] font-semibold hover:underline"
                    >
                      Ubah
                    </button>
                  </div>
                )}

                {/* Note Inline Edit */}
                {isEditingNote && (
                  <div className="mt-1.5 flex gap-1">
                    <input
                      type="text"
                      value={tempNote}
                      onChange={(e) => setTempNote(e.target.value)}
                      placeholder="Catatan item (cth: Pedas, Dingin)..."
                      className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 bg-white"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveNote(item.product.id)}
                      className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                    >
                      Simpan
                    </button>
                  </div>
                )}

                {/* Quantity Controls & Actions */}
                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={() => handleStartNote(item.product.id, item.note)}
                    className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>{item.note ? 'Edit Note' : '+ Note'}</span>
                  </button>

                  <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center shadow-2xs font-bold text-xs transition-colors"
                      title="Kurangi 1"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.product.id, parseInt(e.target.value) || 1)
                      }
                      className="w-10 text-center font-bold text-xs text-slate-800 bg-transparent focus:outline-none"
                    />

                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center shadow-2xs font-bold text-xs transition-colors"
                      title="Tambah 1"
                    >
                      <Plus className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="w-6 h-6 rounded text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-colors ml-1"
                      title="Hapus dari keranjang"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pricing & Checkout Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
        {/* Subtotal & Discounts */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-800 font-mono">
              {formatRupiah(cartSubtotal)}
            </span>
          </div>

          {/* Discount Trigger / Display */}
          <div className="flex justify-between items-center text-slate-500">
            <button
              onClick={onOpenDiscount}
              className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline text-xs"
            >
              <Tag className="w-3 h-3" />
              {cartDiscountAmount > 0 ? (
                <span>
                  Diskon ({discountType === 'percent' ? `${discountValue}%` : 'Nominal'}):
                </span>
              ) : (
                <span>+ Tambah Diskon</span>
              )}
            </button>

            {cartDiscountAmount > 0 && (
              <span className="font-semibold text-rose-600 font-mono">
                -{formatRupiah(cartDiscountAmount)}
              </span>
            )}
          </div>

          {/* Tax / PPN if enabled */}
          {settings.enableTax && (
            <div className="flex justify-between text-slate-500">
              <span>PPN ({settings.taxRate}%):</span>
              <span className="font-semibold text-slate-800 font-mono">
                {formatRupiah(cartTaxAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Total Highlight */}
        <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Total Bayar
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-tight">
            {formatRupiah(cartTotal)}
          </span>
        </div>

        {/* Big Checkout Button */}
        <button
          id="btn-checkout"
          disabled={cart.length === 0}
          onClick={onOpenCheckout}
          className={`w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition-all ${
            cart.length === 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.99] cursor-pointer ring-2 ring-emerald-500/20'
          }`}
        >
          <span>BAYAR / CHECKOUT</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
