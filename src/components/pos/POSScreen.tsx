import React, { useState, useEffect, useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import { ProductCard } from './ProductCard';
import { CartPanel } from './CartPanel';
import { DiscountModal } from './DiscountModal';
import { HoldCartModal } from './HoldCartModal';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { CameraScannerModal } from './CameraScannerModal';
import {
  Search,
  QrCode,
  SlidersHorizontal,
  Package,
  Layers,
  Sparkles,
  AlertCircle,
  X,
} from 'lucide-react';

interface POSScreenProps {
  isScannerOpen: boolean;
  onCloseScanner: () => void;
  onOpenScanner: () => void;
  isHoldCartsOpen: boolean;
  onCloseHoldCarts: () => void;
  onOpenHoldCarts: () => void;
}

export const POSScreen: React.FC<POSScreenProps> = ({
  isScannerOpen,
  onCloseScanner,
  onOpenScanner,
  isHoldCartsOpen,
  onCloseHoldCarts,
  onOpenHoldCarts,
}) => {
  const {
    products,
    categories,
    cart,
    addToCart,
    latestCompletedTransaction,
    setLatestCompletedTransaction,
    saveHoldCart,
  } = usePOS();

  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDiscountOpen, setIsDiscountOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);
  const [saveHoldPromptOpen, setSaveHoldPromptOpen] = useState<boolean>(false);
  const [holdCustomerName, setHoldCustomerName] = useState<string>('');
  const [barcodeNotification, setBarcodeNotification] = useState<string | null>(null);

  // USB Barcode Scanner Hardware listener (buffer keystrokes ending with Enter)
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input field
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTimeRef.current > 100) {
        barcodeBufferRef.current = '';
      }
      lastKeyTimeRef.current = currentTime;

      if (e.key === 'Enter') {
        const scannedCode = barcodeBufferRef.current.trim();
        if (scannedCode.length >= 3) {
          const matched = products.find(
            (p) => p.barcode.toLowerCase() === scannedCode.toLowerCase() || p.id === scannedCode
          );
          if (matched) {
            if (matched.stock > 0) {
              addToCart(matched, 1);
              setBarcodeNotification(`✅ Berhasil scan: ${matched.name}`);
            } else {
              setBarcodeNotification(`⚠️ ${matched.name} Stok Habis!`);
            }
          } else {
            setBarcodeNotification(`❌ Barcode "${scannedCode}" tidak ditemukan`);
          }
          setTimeout(() => setBarcodeNotification(null), 2500);
        }
        barcodeBufferRef.current = '';
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, addToCart]);

  // Filter products by category & search term
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'Semua' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.barcode.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  const getCartQuantityForProduct = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const handleConfirmSaveHold = (e: React.FormEvent) => {
    e.preventDefault();
    saveHoldCart(undefined, holdCustomerName.trim() || undefined);
    setHoldCustomerName('');
    setSaveHoldPromptOpen(false);
  };

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-slate-50">
      {/* LEFT AREA: Search, Categories, Products Grid */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden p-3 sm:p-5">
        {/* Top Filter Bar */}
        <div className="space-y-3 mb-3">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-products"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama produk, kategori, atau barcode barang..."
                className="w-full pl-10 pr-9 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Camera Barcode trigger */}
            <button
              onClick={onOpenScanner}
              title="Buka Kamera Barcode"
              className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:text-emerald-600 transition-colors shadow-xs"
            >
              <QrCode className="w-5 h-5 text-emerald-600" />
            </button>
          </div>

          {/* Barcode scanner notification toast */}
          {barcodeNotification && (
            <div className="p-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-150 border border-slate-800">
              <span>{barcodeNotification}</span>
              <button
                onClick={() => setBarcodeNotification(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  id={`cat-chip-${cat}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100/70 border border-slate-200/80'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid Area */}
        <div className="flex-1 overflow-y-auto pr-1 pb-20 lg:pb-2 sleek-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <Package className="w-12 h-12 opacity-30 mb-2" />
              <p className="font-bold text-slate-600 text-sm">Tidak ada produk yang cocok</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Coba ubah kata kunci pencarian atau pilih kategori lain.
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-xs hover:bg-emerald-700 transition-colors"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3.5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  cartQuantity={getCartQuantityForProduct(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* RIGHT AREA: Persistent Desktop Cart */}
      <div className="hidden lg:block w-96 xl:w-[410px] p-3 sm:p-5 pl-0 h-full">
        <CartPanel
          onOpenCheckout={() => setIsCheckoutOpen(true)}
          onOpenDiscount={() => setIsDiscountOpen(true)}
          onOpenHoldSave={() => setSaveHoldPromptOpen(true)}
        />
      </div>

      {/* Mobile Floating Cart Summary Button */}
      <div className="lg:hidden fixed bottom-3 left-3 right-3 z-20">
        <button
          onClick={() => setIsMobileCartOpen(true)}
          className="w-full bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-slate-800"
        >
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-xs">
              {cartTotalItems}
            </span>
            <span className="font-bold text-sm">Lihat Keranjang</span>
          </div>
          <span className="font-bold text-emerald-400 text-sm">Buka Pesanan →</span>
        </button>
      </div>

      {/* Mobile Cart Drawer Modal */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="flex-1" onClick={() => setIsMobileCartOpen(false)} />
          <div className="h-[85vh] bg-white rounded-t-3xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-3 bg-slate-900 text-white flex justify-between items-center">
              <span className="font-bold text-sm">Keranjang Belanja</span>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CartPanel
                onOpenCheckout={() => {
                  setIsMobileCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                onOpenDiscount={() => setIsDiscountOpen(true)}
                onOpenHoldSave={() => setSaveHoldPromptOpen(true)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hold Prompt Dialog */}
      {saveHoldPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Simpan Pesanan Sementara</h3>
                <p className="text-xs text-slate-400">Keranjang akan disimpan untuk nanti</p>
              </div>
            </div>

            <form onSubmit={handleConfirmSaveHold} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Pelanggan / Catatan Meja
                </label>
                <input
                  type="text"
                  value={holdCustomerName}
                  onChange={(e) => setHoldCustomerName(e.target.value)}
                  placeholder="Contoh: Meja 5 / Mas Doni"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSaveHoldPromptOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
                >
                  Simpan Pesanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      <DiscountModal isOpen={isDiscountOpen} onClose={() => setIsDiscountOpen(false)} />
      <HoldCartModal isOpen={isHoldCartsOpen} onClose={onCloseHoldCarts} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      <ReceiptModal
        transaction={latestCompletedTransaction}
        isOpen={!!latestCompletedTransaction}
        onClose={() => setLatestCompletedTransaction(null)}
      />
      <CameraScannerModal isOpen={isScannerOpen} onClose={onCloseScanner} />
    </div>
  );
};
