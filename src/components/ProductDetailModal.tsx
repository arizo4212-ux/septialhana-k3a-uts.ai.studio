import React from 'react';
import { X, ShoppingBag, Check } from 'lucide-react';
import { Product } from '../types';
import { formatIDR } from '../seedData';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-[#E5E0D8] max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden my-8">
        {/* Left Image Gallery */}
        <div className="bg-[#F2EFE9] relative flex items-center justify-center min-h-[320px] md:min-h-[460px]">
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Contiguous Purchase Module */}
        <div className="p-8 md:p-10 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center justify-between text-xs text-[#71706B] mb-3">
              <span>
                {product.category} · {product.subType} · {product.sku}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-[#71706B] hover:text-[#141413] cursor-pointer"
                aria-label="Tutup detail produk"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-2xl md:text-3xl font-semibold text-[#141413] leading-tight">
              {product.name}
            </h2>

            <p className="text-xl font-mono-tabular font-semibold text-[#141413] mt-4">
              {formatIDR(product.price)}
            </p>

            <div className="border-t border-b border-[#E5E0D8] py-4 my-6 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#71706B]">Spesifikasi / Ukuran:</span>
                <span className="font-medium text-[#141413]">
                  {product.volumeOrSize}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71706B]">
                  Ketersediaan Stok Database:
                </span>
                <span
                  className={`font-mono-tabular font-semibold ${
                    product.stock > 0 ? 'text-[#1E3A2F]' : 'text-[#991B1B]'
                  }`}
                >
                  {product.stock > 0
                    ? `Tersedia (${product.stock} Unit)`
                    : 'Stok Habis'}
                </span>
              </div>
            </div>

            <p className="text-sm text-[#141413]/85 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="pt-8 space-y-3">
            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="w-full py-3.5 px-6 bg-[#141413] text-white text-xs font-medium flex items-center justify-center gap-2 hover:bg-[#292826] transition-colors cursor-pointer disabled:opacity-40"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {product.stock > 0
                  ? 'Tambahkan ke Shopping Bag'
                  : 'Stok Sedang Habis'}
              </span>
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[#71706B]">
              <Check className="w-3.5 h-3.5 text-[#1E3A2F]" />
              <span>
                Otentik Garansi Resmi YSL Beauté & Maison · Pengiriman Asuransi
                Penuh
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
