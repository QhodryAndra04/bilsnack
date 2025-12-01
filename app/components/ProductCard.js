"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "../contexts/CartContext";
import StarRating from "./StarRating";
import { formatPrice } from "../utils/format";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  // product.images can be array of strings or array of objects { original, thumb }
  const firstImage = (product.images && product.images.length > 0) ? product.images[0] : null;
  const imageUrl = firstImage
    ? (typeof firstImage === 'string' ? firstImage : (firstImage.thumb || firstImage.original))
    : null;

  const discountPct = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : null;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    try {
      addToCart(product, 1);
      // Show success feedback
      setTimeout(() => setIsAdding(false), 1000);
    } catch (error) {
      setIsAdding(false);
    }
  };

  return (
    <div className="group relative block overflow-hidden card shadow-sm sm:shadow-lg hover:shadow-md sm:hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1" suppressHydrationWarning>
      <Link href={`/products/${product.id}`} className="block" aria-label={`Lihat detail produk ${product.name}`}>
        {/* Image Container */}
        <div className="relative overflow-hidden aspect-square bg-gradient-to-br from-surface-alt to-surface flex items-center justify-center rounded-t-lg sm:rounded-t-2xl">
          {discountPct && (
            <span className="absolute top-1 sm:top-3 left-1 sm:left-3 z-10 badge bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg rounded-full px-1 sm:px-2 py-0.5 text-[8px] sm:text-xs font-bold animate-pulse">
              -{discountPct}%
            </span>
          )}
          
          {/* Quick Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="absolute top-1 sm:top-3 right-1 sm:right-3 z-10 w-6 h-6 sm:w-10 sm:h-10 glass rounded-full flex items-center justify-center shadow-md sm:shadow-lg hover:shadow-xl transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 hover:scale-110 disabled:opacity-50"
            aria-label="Tambah ke keranjang"
            suppressHydrationWarning
          >
            {isAdding ? (
              <svg className="w-3 h-3 sm:w-5 sm:h-5 text-green-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-3 h-3 sm:w-5 sm:h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13l-1.1 5M7 13h10m0 0v8a2 2 0 01-2 2H9a2 2 0 01-2-2v-8z" />
              </svg>
            )}
          </button>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>

          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-contain p-1 sm:p-4 transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={e => { e.target.style.display = 'none'; if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <svg className="w-6 h-6 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-1.5 sm:p-4 space-y-0.5 sm:space-y-2">
          {/* Seller Badge */}
          <div className="flex items-center text-[8px] sm:text-xs text-muted">
            <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span className="truncate">{product.sellerName || product.storeName || product.shopName || product.seller || 'BillSnack Store'}</span>
          </div>

          {/* Product Name */}
          <h3 className="text-[10px] sm:text-sm font-semibold line-clamp-2 group-hover:accent-text transition-colors leading-tight">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center space-x-0.5">
            <StarRating rating={product.rating} size="xs" />
            <span className="text-[8px] sm:text-xs text-muted">({product.rating})</span>
          </div>

          {/* Price */}
          <div className="flex items-center flex-wrap gap-0.5 sm:gap-2">
            <span className="text-xs sm:text-lg font-bold">
              Rp{formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-[8px] sm:text-sm line-through text-muted">
                Rp{formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {product.inStock !== undefined && (
            <div className="flex items-center text-[8px] sm:text-xs">
              {product.inStock ? (
                <span className="text-green-600 dark:text-green-400 flex items-center">
                  <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Tersedia
                </span>
              ) : (
                <span className="text-red-500 dark:text-red-400 flex items-center">
                  <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Habis
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
