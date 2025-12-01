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
    <div className="flex items-center py-6 border-b border-base">
      <img
        src={item.image}
        alt={item.name}
        className="w-28 h-28 object-cover rounded-lg"
      />
      <div className="ml-6 grow">
        <h3 className="text-lg font-semibold">{item.name}</h3>
        <p className="text-lg font-bold mt-2">Rp {formatPrice(item.price)}</p>
      </div>
      <div className="flex items-center border border-base rounded-full px-3 py-1 bg-surface-alt">
        <button
          onClick={() => updateQuantity(cartItemId, item.quantity - 1)}
          className="text-[rgb(var(--text-muted))] text-xl hover:text-[rgb(var(--accent))]"
          aria-label="Kurangi jumlah"
        >
          -
        </button>
        <span className="w-8 text-center font-semibold">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(cartItemId, item.quantity + 1)}
          className="text-[rgb(var(--text-muted))] text-xl hover:text-[rgb(var(--accent))]"
          aria-label="Tambah jumlah"
        >
          +
        </button>
      </div>
      <p className="w-24 text-center text-lg font-bold">
        Rp {formatPrice(item.price * item.quantity)}
      </p>
      <button
        onClick={() => removeFromCart(cartItemId)}
        className="text-red-500 hover:text-red-700 ml-4"
        aria-label={`Hapus ${item.name} dari keranjang`}
      >
        <TrashIcon />
      </button>
    </div>
  );
};

const CartPage = () => {
  const { cartItems, getCartItemsBySeller } = useCart();
  const router = useRouter();

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
      <div className="px-8 sm:px-12 lg:px-16 py-12">
        <nav className="flex items-center text-sm text-[rgb(var(--text-muted))] mb-8">
          <Link href="/" className="hover:text-[rgb(var(--accent))]">
            Beranda
          </Link>{" "}
          <ChevronRightIcon />
          <span className="font-medium text-yellow-600 dark:text-yellow-400">
            Keranjang
          </span>
        </nav>

        <h1 className="text-4xl font-bold mb-8">KERANJANG ANDA</h1>

        {cartItems.length === 0 ? (
          <div className="max-w-4xl mx-auto">
            {/* Empty Cart Illustration */}
            <div className="bg-surface-alt p-12 rounded-2xl shadow-lg text-center border border-base mb-8">
              <div className="mb-6">
                <svg
                  className="w-24 h-24 mx-auto text-[rgb(var(--text-muted))] opacity-50"
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
              <h2 className="text-3xl font-bold mb-4 text-gradient">
                Keranjang Belanja Kosong
              </h2>
              <p className="text-[rgb(var(--text-muted))] text-lg mb-8 max-w-md mx-auto">
                Yuk mulai berbelanja! Temukan berbagai camilan favorit Anda
                dengan harga terbaik.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center btn-primary font-semibold py-4 px-8 rounded-full text-lg focus:outline-none focus:ring-2 focus:ring-amber-300 transition duration-300 hover:scale-105 transform"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                Mulai Belanja Sekarang
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Group items by seller */}
            {cartsBySeller.map((sellerCart) => {
              const { subtotal, discount, total } = calculateTotalBySeller(
                sellerCart.items
              );
              return (
                <div
                  key={sellerCart.sellerId}
                  className="bg-surface rounded-lg p-6 shadow-lg border border-base"
                >
                  {/* Seller Header */}
                  <div className="flex items-center justify-between border-b border-base pb-4 mb-4">
                    <div>
                      <h2 className="text-xl font-bold flex items-center text-gradient">
                        <svg
                          className="w-5 h-5 mr-2 text-[rgb(var(--text-muted))]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="9" cy="21" r="1"></circle>
                          <circle cx="20" cy="21" r="1"></circle>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        {sellerCart.sellerName}
                      </h2>
                      {sellerCart.resellerEmail && (
                        <p className="text-sm text-[rgb(var(--text-muted))] mt-1">
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
                  <div className="mt-6 pt-4 border-t border-base bg-surface-alt rounded-lg p-4">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm text-[rgb(var(--text-muted))]">
                        <span>Subtotal</span>
                        <span className="font-medium text-[rgb(var(--text))]">
                          Rp {formatPrice(subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold text-base border-t border-base pt-2">
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
                      className="w-full btn-primary rounded-full text-base flex items-center justify-center gap-2 py-3"
                    >
                      Checkout Toko Ini <ChevronRightIcon />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Total Summary Card */}
            {cartsBySeller.length > 1 && (
              <div className="bg-surface-alt border border-base rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold mb-4 text-gradient">
                  Ringkasan Total Belanja
                </h3>
                <div className="space-y-2 text-sm">
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
