import React from 'react';
import { Product } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { Plus, AlertTriangle, Check, Layers } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  cartQuantity: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  cartQuantity,
}) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => {
        if (!isOutOfStock) {
          onAddToCart(product);
        }
      }}
      className={`group relative flex flex-col justify-between bg-white rounded-xl border transition-all duration-200 p-3 select-none ${
        isOutOfStock
          ? 'opacity-60 bg-slate-50/80 border-slate-200 cursor-not-allowed'
          : 'hover:border-emerald-500/80 hover:shadow-md hover:shadow-slate-200/60 border-slate-200/80 cursor-pointer active:scale-[0.98]'
      }`}
    >
      {/* Top badges & icon */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          {/* Icon / Image container */}
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-2xl shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span>{product.icon || '📦'}</span>
            )}
          </div>

          {/* Stock Badges */}
          <div className="flex flex-col items-end gap-1">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                Habis
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-2.5 h-2.5" />
                Sisa {product.stock}
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                Stok {product.stock} {product.unit}
              </span>
            )}

            {/* Category Pill */}
            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[90px]">
              {product.category}
            </span>
          </div>
        </div>

        {/* Product Name */}
        <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 min-h-[2.5rem] mb-1">
          {product.name}
        </h3>

        {/* Barcode code */}
        <p className="text-[11px] font-mono text-slate-400 mb-2 truncate">
          {product.barcode}
        </p>
      </div>

      {/* Bottom: Price & Add Button */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-1">
        <div>
          <span className="text-xs text-slate-400 block font-normal leading-none mb-0.5">Harga</span>
          <span className="text-sm sm:text-base font-bold text-emerald-600">
            {formatRupiah(product.sellPrice)}
          </span>
        </div>

        {/* Action Button / Cart Counter */}
        {cartQuantity > 0 ? (
          <div className="flex items-center gap-1 bg-emerald-600 text-white rounded-lg px-2 py-1 shadow-sm">
            <Check className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">{cartQuantity}x</span>
          </div>
        ) : (
          <button
            type="button"
            disabled={isOutOfStock}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isOutOfStock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-100 text-slate-700 group-hover:bg-emerald-600 group-hover:text-white'
            }`}
            title="Tambah ke Keranjang"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
