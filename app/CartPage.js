"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./contexts/CartContext";
import formatPrice from "./utils/format";

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const CartItemRow = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const cartItemId = `${item.id}`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-4 sm:py-6 border-b border-base gap-3 sm:gap-4">
      <div className="flex items-start sm:items-center gap-3 sm:gap-0">
        <img
          src={item.image}
          alt={item.name}
          className="w-20 h-20 sm:w-28 sm:h-28 object-cover rounded-lg flex-shrink-0"
        />
        <div className="sm:ml-6 flex-1 min-w-0">
          <h3 className="text-sm sm:text-lg font-semibold line-clamp-2">{item.name}</h3>
          <p className="text-sm sm:text-lg font-bold mt-1 sm:mt-2">Rp {formatPrice(item.price)}</p>
        </div>
        {/* Mobile delete button */}
        <button
          onClick={() => removeFromCart(cartItemId)}
          className="sm:hidden text-red-500 hover:text-red-700 p-1.5"
          aria-label={`Hapus ${item.name} dari keranjang`}
        >
          <TrashIcon />
        </button>
      </div>
      
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
        <div className="flex items-center border border-base rounded-full px-2 sm:px-3 py-1 bg-surface-alt">
          <button
            onClick={() => updateQuantity(cartItemId, item.quantity - 1)}
            className="text-[rgb(var(--text-muted))] text-lg sm:text-xl hover:text-[rgb(var(--accent))] px-1 sm:px-0"
            aria-label="Kurangi jumlah"
          >
            -
          </button>
          <span className="w-6 sm:w-8 text-center text-sm sm:text-base font-semibold">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(cartItemId, item.quantity + 1)}
            className="text-[rgb(var(--text-muted))] text-lg sm:text-xl hover:text-[rgb(var(--accent))] px-1 sm:px-0"
            aria-label="Tambah jumlah"
          >
            +
          </button>
        </div>
        <p className="text-sm sm:text-lg font-bold sm:w-24 sm:text-center">
          Rp {formatPrice(item.price * item.quantity)}
        </p>
        <button
          onClick={() => removeFromCart(cartItemId)}
          className="hidden sm:block text-red-500 hover:text-red-700 ml-2 sm:ml-4"
          aria-label={`Hapus ${item.name} dari keranjang`}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
};

const CartPage = () => {
  const { cartItems, getCartItemsBySeller, canUseCart } = useCart();
  const router = useRouter();

  // Redirect to login if user is not logged in
  if (!canUseCart) {
    return (
      <div className="bg-surface min-h-screen">
        <div className="px-3 sm:px-8 lg:px-16 py-6 sm:py-12">
          <nav className="flex items-center text-xs sm:text-sm text-[rgb(var(--text-muted))] mb-4 sm:mb-8">
            <Link href="/" className="hover:text-[rgb(var(--accent))]">
              Beranda
            </Link>{" "}
            <ChevronRightIcon />
            <span className="font-medium text-[rgb(var(--accent))]">
              Keranjang
            </span>
          </nav>

          <div className="max-w-4xl mx-auto">
            <div className="bg-[rgb(var(--surface))] p-6 sm:p-12 rounded-xl sm:rounded-2xl shadow-[var(--shadow-card)] text-center">
              <div className="mb-4 sm:mb-6">
                <svg
                  className="w-16 h-16 sm:w-24 sm:h-24 mx-auto text-[rgb(var(--accent))] opacity-70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4 text-gradient">
                Login Diperlukan
              </h2>
              <p className="text-[rgb(var(--text-muted))] mb-6 sm:mb-8 text-sm sm:text-base">
                Silakan login terlebih dahulu untuk menggunakan keranjang belanja.
              </p>
              <Link
                href="/login"
                className="inline-block btn-primary px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-button-hover)] transform hover:scale-105 transition-all duration-300"
              >
                Login Sekarang
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cartsBySeller = getCartItemsBySeller();

  const calculateTotalBySeller = (items) => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discount = subtotal * 0.2;
    return { subtotal, discount, total: subtotal - discount };
  };

  const handleCheckoutSeller = (sellerId) => {
    // Navigate to checkout with specific seller
    router.push(`/checkout?sellerId=${sellerId}`);
  };

  // Removed unused grand total calculations to satisfy lint

  return (
    <div className="bg-surface">
      <div className="px-3 sm:px-8 lg:px-16 py-6 sm:py-12">
        <nav className="flex items-center text-xs sm:text-sm text-[rgb(var(--text-muted))] mb-4 sm:mb-8">
          <Link href="/" className="hover:text-[rgb(var(--accent))]">
            Beranda
          </Link>{" "}
          <ChevronRightIcon />
          <span className="font-medium text-[rgb(var(--accent))]">
            Keranjang
          </span>
        </nav>

        <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-8">KERANJANG ANDA</h1>

        {cartItems.length === 0 ? (
          <div className="max-w-4xl mx-auto">
            {/* Empty Cart Illustration */}
            <div className="bg-[rgb(var(--surface))] p-6 sm:p-12 rounded-xl sm:rounded-2xl shadow-[var(--shadow-card)] text-center mb-6 sm:mb-8 hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-300">
              <div className="mb-4 sm:mb-6">
                <svg
                  className="w-16 h-16 sm:w-24 sm:h-24 mx-auto text-[rgb(var(--text-muted))] opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13l-1.1 5M7 13h10m0 0v8a2 2 0 01-2 2H9a2 2 0 01-2-2v-8m10 0l1.1-5"
                  />
                </svg>
              </div>
              <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4 text-gradient">
                Keranjang Belanja Kosong
              </h2>
              <p className="text-sm sm:text-lg text-[rgb(var(--text-muted))] mb-6 sm:mb-8 max-w-md mx-auto px-2">
                Yuk mulai berbelanja! Temukan berbagai camilan favorit Anda
                dengan harga terbaik.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center btn-primary font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-full text-sm sm:text-lg focus:outline-none focus:ring-2 focus:ring-amber-300 transition duration-300 hover:scale-105 transform"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                Mulai Belanja
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Group items by seller */}
            {cartsBySeller.map((sellerCart) => {
              const { subtotal, discount, total } = calculateTotalBySeller(
                sellerCart.items
              );
              return (
                <div
                  key={sellerCart.sellerId}
                  className="bg-[rgb(var(--surface))] rounded-xl p-4 sm:p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300"
                >
                  {/* Seller Header */}
                  <div className="flex items-center justify-between border-b border-base pb-3 sm:pb-4 mb-3 sm:mb-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-xl font-bold flex items-center text-gradient truncate">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-[rgb(var(--text-muted))] flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="9" cy="21" r="1"></circle>
                          <circle cx="20" cy="21" r="1"></circle>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        <span className="truncate">{sellerCart.sellerName}</span>
                      </h2>
                      {sellerCart.resellerEmail && (
                        <p className="text-xs sm:text-sm text-[rgb(var(--text-muted))] mt-0.5 sm:mt-1 truncate">
                          {sellerCart.resellerEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Cart Items for this seller */}
                  <div className="space-y-4">
                    {sellerCart.items.map((item) => (
                      <CartItemRow
                        key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                        item={item}
                      />
                    ))}
                  </div>

                  {/* Seller Summary & Checkout Button */}
                  <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-base bg-surface-alt rounded-lg p-3 sm:p-4">
                    <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                      <div className="flex justify-between text-xs sm:text-sm text-[rgb(var(--text-muted))]">
                        <span>Subtotal</span>
                        <span className="font-medium text-[rgb(var(--text))]">
                          Rp {formatPrice(subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold text-sm sm:text-base border-t border-base pt-2">
                        <span className="text-[rgb(var(--text-muted))]">
                          Total Toko
                        </span>
                        <span className="text-[rgb(var(--accent))] font-bold">
                          Rp {formatPrice(total)}
                        </span>
                      </div>
                    </div>

                    {/* Checkout Button for this seller */}
                    <button
                      onClick={() => handleCheckoutSeller(sellerCart.sellerId)}
                      className="w-full btn-primary rounded-full text-sm sm:text-base flex items-center justify-center gap-2 py-2.5 sm:py-3"
                    >
                      Checkout Toko Ini <ChevronRightIcon />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Total Summary Card */}
            {cartsBySeller.length > 1 && (
              <div className="bg-[rgb(var(--surface-alt))] border border-[rgb(var(--border))] rounded-xl p-4 sm:p-6 mt-4 sm:mt-8 shadow-[var(--shadow-md)]">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gradient">
                  Ringkasan Total Belanja
                </h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-[rgb(var(--text-muted))]">
                      Total dari {cartsBySeller.length} toko
                    </span>
                    <span className="text-[rgb(var(--accent))] font-bold">
                      Rp{" "}
                      {formatPrice(
                        cartsBySeller.reduce((sum, seller) => {
                          const { total } = calculateTotalBySeller(
                            seller.items
                          );
                          return sum + total;
                        }, 0)
                      )}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[rgb(var(--text-muted))] mt-4">
                  💡 Setiap toko diproses sebagai pesanan terpisah.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
