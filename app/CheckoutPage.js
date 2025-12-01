"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "./contexts/CartContext";
import { useAuth } from "./contexts/AuthContext";
import { showWarning, showError } from "./utils/swal";
import { API_BASE_URL } from "./config/api";
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

const CheckoutPage = () => {
  const { cartItems, clearCart, clearCartBySeller, getCartItemsBySeller } =
    useCart();
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentMethod, setPaymentMethod] = useState("qris");
  const [shippingMethod, setShippingMethod] = useState("gosend");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [shippingFeePerStore, setShippingFeePerStore] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState(null);

  // Get checkout seller ID from URL params (if coming from specific seller checkout)
  const checkoutSellerId = searchParams.get("sellerId");

  const cartsBySeller = getCartItemsBySeller();

  // Filter to only show items from the selected seller if specified
  const checkoutCarts = checkoutSellerId
    ? cartsBySeller.filter(
        (cart) => String(cart.sellerId) === String(checkoutSellerId)
      )
    : cartsBySeller;

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        postalCode: user.postalCode || "",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Calculate totals for checkout items only
  const subtotal = checkoutCarts.reduce((sum, sellerCart) => {
    return (
      sum +
      sellerCart.items.reduce((itemSum, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return itemSum + price * quantity;
      }, 0)
    );
  }, 0);
  const discount = 0;

  // Fetch distance-based shipping fee when dependencies change

  useEffect(() => {
    if (!formData.city || !shippingMethod) return; // wait until required data entered
    let active = true;
    const fetchQuote = async () => {
      setShippingLoading(true);
      setShippingError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/shipping/quote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: formData.city,
            postalCode: formData.postalCode || null,
            shippingMethod,
            sellersCount: checkoutCarts.length,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Gagal menghitung ongkir");
        }
        const data = await res.json();
        if (active) {
          setShippingFeePerStore(data.feePerStore || 0);
          setShippingError(null);
        }
      } catch (err) {
        if (active) {
          setShippingError(err.message || "Gagal menghitung ongkir");
          setShippingFeePerStore(0);
        }
      } finally {
        if (active) setShippingLoading(false);
      }
    };
    fetchQuote();
    return () => {
      active = false;
    };
  }, [
    API_BASE_URL,
    formData.city,
    formData.postalCode,
    shippingMethod,
    checkoutCarts.length,
  ]);

  const deliveryFee = shippingFeePerStore * checkoutCarts.length;
  const total = subtotal - discount + deliveryFee;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (shippingLoading) {
      showWarning(
        "Menunggu",
        "Menunggu perhitungan ongkir selesai"
      );
      return;
    }
    if (shippingError) {
      showError(
        "Error",
        "Tidak bisa membuat pesanan: " + shippingError
      );
      return;
    }
    setSubmitting(true);
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      // Create separate order for each seller in checkoutCarts
      const orderPromises = checkoutCarts.map(async (sellerCart) => {
        const items = sellerCart.items;
        const subtotal = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const discount = 0;
        const deliveryFee = shippingFeePerStore; // per store
        const total = subtotal - discount + deliveryFee;

        const payload = {
          customer: {
            name: formData.username,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            province: formData.province || null,
            postalCode: formData.postalCode,
          },
          items: items.map((it) => ({
            productId: it.id,
            name: it.name,
            unit_price: it.price,
            quantity: it.quantity,
            total_price: it.price * it.quantity,
            selected_options: {
              size: it.selectedSize,
              color: it.selectedColor,
            },
          })),
          subtotal,
          discount,
          total, // server will recompute deliveryFee & total for integrity
          paymentMethod,
          shippingMethod,
          sellerId:
            sellerCart.sellerId !== "admin" ? sellerCart.sellerId : null,
          sellerName: sellerCart.sellerName,
        };

        const res = await fetch(`${API_BASE_URL}/api/orders`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            err.error || `Failed to create order for ${sellerCart.sellerName}`
          );
        }

        return res.json();
      });

      const orders = await Promise.all(orderPromises);

      // Collect all order IDs and items from checkout
      const orderIds = orders
        .map(
          (o) =>
            o.orderId || Math.random().toString(36).substr(2, 9).toUpperCase()
        )
        .join(", ");
      const checkoutItems = checkoutCarts.flatMap((cart) => cart.items);
      const totalAmount = subtotal + deliveryFee;

      // Create lightweight items list for confirmation page
      const purchasedItems = checkoutItems.map((it) => ({
        id: it.id,
        name: it.name,
        image: it.image || "",
      }));

      // Clear only items from sellers that were checked out
      if (checkoutSellerId) {
        // If checking out specific seller, only clear that seller's items
        clearCartBySeller(checkoutSellerId);
      } else {
        // If checking out all sellers, clear entire cart
        clearCart();
      }

      // Store order data in localStorage for the confirmation page
      const orderData = {
        orderId: orderIds,
        total: totalAmount,
        paymentMethod,
        shippingMethod,
        items: purchasedItems,
        orderCount: orders.length,
      };
      localStorage.setItem("orderConfirmationData", JSON.stringify(orderData));

      router.push("/order-confirmation");
    } catch (err) {
      showError(
        "Gagal",
        err.message || "Gagal membuat pesanan"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="px-4 sm:px-8 lg:px-16 py-10 sm:py-20 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold">Keranjang Anda Kosong</h1>
        <p className="text-gray-600 mt-3 sm:mt-4 text-sm sm:text-base px-4">
          Anda perlu menambahkan item ke keranjang sebelum dapat checkout.
        </p>
        <Link
          href="/shop"
          className="mt-4 sm:mt-6 inline-block bg-amber-500 text-white font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-full text-sm sm:text-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-300 transition duration-300"
        >
          Kembali ke Toko
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface">
      <div className="px-3 sm:px-8 lg:px-16 py-4 sm:py-12">
        <nav className="flex items-center text-xs sm:text-sm text-[rgb(var(--text-muted))] mb-4 sm:mb-8 flex-wrap gap-0.5">
          <Link href="/" className="hover:text-[rgb(var(--accent))]">
            Beranda
          </Link>{" "}
          <ChevronRightIcon />
          <Link href="/cart" className="hover:text-[rgb(var(--accent))]">
            Keranjang
          </Link>{" "}
          <ChevronRightIcon />
          <span className="font-medium text-[rgb(var(--text))]">Checkout</span>
        </nav>
        <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-8 text-gradient">Checkout</h1>
        <form
          onSubmit={handlePlaceOrder}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 lg:gap-12"
        >
          <div className="lg:col-span-2 bg-surface p-4 sm:p-8 rounded-lg shadow space-y-6 sm:space-y-8 border border-base">
            {/* Shipping Information */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Informasi Pengiriman</h2>
              {user && (
                <div className="bg-surface-alt border border-base rounded-md p-2.5 sm:p-3 mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-[rgb(var(--text-muted))]">
                    Informasi terisi otomatis dari profil Anda.{" "}
                    <Link
                      href="/profile"
                      className="underline text-[rgb(var(--accent))]"
                    >
                      Perbarui profil
                    </Link>
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Username"
                  required
                  className="p-2.5 sm:p-3 text-sm sm:text-base rounded-md w-full sm:col-span-2 bg-surface-alt border border-base placeholder:text-[rgb(var(--text-muted))]"
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Alamat Email"
                  required
                  className="p-2.5 sm:p-3 text-sm sm:text-base rounded-md w-full sm:col-span-2 bg-surface-alt border border-base placeholder:text-[rgb(var(--text-muted))]"
                />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Nomor Telepon"
                  required
                  className="p-2.5 sm:p-3 text-sm sm:text-base rounded-md w-full sm:col-span-2 bg-surface-alt border border-base placeholder:text-[rgb(var(--text-muted))]"
                />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Alamat Lengkap"
                  required
                  className="p-2.5 sm:p-3 text-sm sm:text-base rounded-md w-full sm:col-span-2 bg-surface-alt border border-base placeholder:text-[rgb(var(--text-muted))]"
                />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Kota"
                  required
                  className="p-2.5 sm:p-3 text-sm sm:text-base rounded-md w-full bg-surface-alt border border-base placeholder:text-[rgb(var(--text-muted))]"
                />
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="Kode Pos"
                  required
                  className="p-2.5 sm:p-3 text-sm sm:text-base rounded-md w-full bg-surface-alt border border-base placeholder:text-[rgb(var(--text-muted))]"
                />
              </div>
            </div>

            {/* Shipping Method */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Metode Pengiriman</h2>
              <div className="space-y-2 sm:space-y-3">
                <label className="flex items-start sm:items-center p-3 sm:p-4 border border-base rounded-lg hover:bg-surface-alt cursor-pointer transition">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="gosend"
                    checked={shippingMethod === "gosend"}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="mr-2.5 sm:mr-3 mt-0.5 sm:mt-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm sm:text-base">GoSend</div>
                    <div className="text-xs sm:text-sm text-[rgb(var(--text-muted))]">
                      Pengiriman instan dalam 1-2 jam
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-green-600">
                      Gratis ongkir
                    </div>
                  </div>
                </label>
                <label className="flex items-start sm:items-center p-3 sm:p-4 border border-base rounded-lg hover:bg-surface-alt cursor-pointer transition">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="jne"
                    checked={shippingMethod === "jne"}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="mr-2.5 sm:mr-3 mt-0.5 sm:mt-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm sm:text-base">JNE</div>
                    <div className="text-xs sm:text-sm text-[rgb(var(--text-muted))]">
                      Pengiriman reguler 2-3 hari kerja
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-green-600">
                      Rp{formatPrice(32000)}
                    </div>
                  </div>
                </label>
                <label className="flex items-start sm:items-center p-3 sm:p-4 border border-base rounded-lg hover:bg-surface-alt cursor-pointer transition">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="jnt"
                    checked={shippingMethod === "jnt"}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="mr-2.5 sm:mr-3 mt-0.5 sm:mt-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm sm:text-base">JNT</div>
                    <div className="text-xs sm:text-sm text-[rgb(var(--text-muted))]">
                      Pengiriman express 1-2 hari kerja
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-green-600">
                      Rp{formatPrice(30000)}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Detail Pembayaran</h2>

              {/* Payment Method Selection */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
                  Pilih Metode Pembayaran
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <label className="flex items-center text-sm sm:text-base">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="qris"
                      checked={paymentMethod === "qris"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-2.5 sm:mr-3"
                    />
                    <span>QRIS</span>
                  </label>
                  <label className="flex items-center text-sm sm:text-base">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={paymentMethod === "bank"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-2.5 sm:mr-3"
                    />
                    <span>Transfer Bank</span>
                  </label>
                  <label className="flex items-center text-sm sm:text-base">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-2.5 sm:mr-3"
                    />
                    <span>Bayar di Tempat (COD)</span>
                  </label>
                </div>
              </div>

              {/* Payment Details Based on Method */}
              {paymentMethod === "qris" && (
                <div className="text-center p-4 sm:p-6 bg-surface-alt rounded-lg border border-base">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                    Scan Kode QR untuk Membayar
                  </h3>
                  <div className="bg-surface p-3 sm:p-4 rounded-lg inline-block border border-base">
                    {/* QR Code image for Billsnack (place file `public/qris-billsnack.png`) */}
                    <div className="w-36 h-36 sm:w-48 sm:h-48 flex items-center justify-center rounded-lg overflow-hidden bg-surface border border-base">
                      <img
                        src="/assets/qrisbillsnack.jpg"
                        alt="QRIS BillSnack"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          try {
                            if (e && e.target)
                              e.target.src = "/qrisbillsnack.jpg";
                          } catch {
                            if (e && e.target)
                              e.target.src = "/qris-billsnack.svg";
                          }
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-[rgb(var(--text-muted))] mt-3 sm:mt-4 px-2">
                    Scan kode QR ini dengan aplikasi e-wallet Anda untuk
                    menyelesaikan pembayaran
                  </p>
                  <p className="text-base sm:text-lg font-bold mt-2">
                    Total: Rp{formatPrice(total)}
                  </p>
                </div>
              )}

              {paymentMethod === "bank" && (
                <div className="p-4 sm:p-6 bg-surface-alt rounded-lg border border-base">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                    Detail Transfer Bank
                  </h3>
                  <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                    <div className="flex justify-between">
                      <span className="font-medium">Bank:</span>
                      <span>Mandiri</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Nomor Rekening:</span>
                      <span className="font-mono text-xs sm:text-base">1110024781714</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Nama Rekening:</span>
                      <span>BilSnack Store</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Jumlah:</span>
                      <span className="font-bold">Rp{formatPrice(total)}</span>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-surface border border-base rounded">
                    <p className="text-xs sm:text-sm text-[rgb(var(--text-muted))]">
                      <strong>Penting:</strong> Harap sertakan ID pesanan Anda
                      dalam deskripsi transfer. Pesanan Anda akan diproses
                      setelah pembayaran dikonfirmasi (biasanya dalam 1-2 hari
                      kerja).
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === "cod" && (
                <div className="p-4 sm:p-6 bg-surface-alt rounded-lg border border-base">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                    Bayar di Tempat
                  </h3>
                  <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                    <div className="flex justify-between">
                      <span className="font-medium">Metode Pembayaran:</span>
                      <span>Bayar di Tempat</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total Pembayaran:</span>
                      <span className="font-bold">Rp{formatPrice(total)}</span>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-surface border border-base rounded">
                    <p className="text-xs sm:text-sm text-[rgb(var(--text-muted))]">
                      <strong>Catatan:</strong> Anda akan membayar tunai saat
                      pesanan dikirim ke alamat Anda. Harap siapkan jumlah yang
                      tepat untuk pelayanan yang lebih cepat.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-surface-alt p-4 sm:p-8 rounded-lg shadow h-fit border border-base order-first lg:order-last">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 border-b pb-3 sm:pb-4">
              Ringkasan Pesanan
            </h2>

            {/* Show items grouped by seller - only for checkout items */}
            {checkoutCarts.map((sellerCart, index) => {
              const sellerSubtotal = sellerCart.items.reduce((sum, item) => {
                const price = Number(item.price) || 0;
                const quantity = Number(item.quantity) || 0;
                return sum + price * quantity;
              }, 0);
              const sellerDiscount = 0;
              const sellerTotal = sellerSubtotal - sellerDiscount;

              return (
                <div
                  key={sellerCart.sellerId}
                  className={`${
                    index > 0 ? "mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-base" : ""
                  }`}
                >
                  <div className="mb-2 sm:mb-3 flex items-center">
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
                    <div className="min-w-0">
                      <p className="font-semibold text-sm sm:text-base text-[rgb(var(--accent))] truncate">
                        {sellerCart.sellerName}
                      </p>
                      {sellerCart.resellerEmail && (
                        <p className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))] truncate">
                          {sellerCart.resellerEmail}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 ml-1 sm:ml-2">
                    {sellerCart.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-xs sm:text-sm gap-2"
                      >
                        <span className="text-[rgb(var(--text-muted))] truncate flex-1">
                          {item.name} x {item.quantity}
                        </span>
                        <span className="font-semibold whitespace-nowrap">
                          Rp
                          {formatPrice(
                            (Number(item.price) || 0) *
                              (Number(item.quantity) || 0)
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 ml-1 sm:ml-2 text-xs sm:text-sm text-right">
                    <p className="text-[rgb(var(--text-muted))]">
                      Subtotal: Rp{formatPrice(sellerSubtotal)}
                    </p>
                    <p className="font-semibold text-[rgb(var(--accent))]">
                      Total Toko: Rp{formatPrice(sellerTotal)}
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="space-y-3 sm:space-y-4 text-sm sm:text-lg mt-4 sm:mt-6 border-t pt-3 sm:pt-4 border-base">
              <div className="flex justify-between">
                <span className="text-[rgb(var(--text-muted))]">
                  Total Belanja
                </span>
                <span className="font-semibold">Rp{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[rgb(var(--text-muted))] text-xs sm:text-base">
                  Biaya Pengiriman{" "}
                  {checkoutCarts.length > 1 && `(${checkoutCarts.length} toko)`}
                </span>
                <span className="font-semibold">
                  {shippingLoading
                    ? "Menghitung..."
                    : shippingError
                    ? "Error"
                    : `Rp${formatPrice(deliveryFee)}`}
                </span>
              </div>
              {shippingError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 p-2.5 sm:p-3 rounded text-xs sm:text-sm">
                  {shippingError}
                </div>
              )}
              {checkoutCarts.length > 1 && (
                <div className="bg-surface p-2.5 sm:p-3 rounded-lg border border-base">
                  <p className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))]">
                    <strong>Info:</strong> Anda berbelanja dari{" "}
                    {checkoutCarts.length} toko berbeda. Biaya pengiriman
                    dikenakan per toko.
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-between text-lg sm:text-2xl font-bold mt-4 sm:mt-6 border-t pt-3 sm:pt-4 border-base">
              <span>Total</span>
              <span className="text-[rgb(var(--accent))]">
                Rp{formatPrice(total)}
              </span>
            </div>

            <button
              type="submit"
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              className="w-full mt-4 sm:mt-6 btn-primary rounded-full text-sm sm:text-lg disabled:opacity-80 py-3"
              style={{
                filter: btnHover ? "brightness(1.08)" : "none",
                opacity: submitting ? 0.85 : 1,
              }}
              disabled={submitting || shippingLoading || !!shippingError}
            >
              {submitting
                ? "Memproses..."
                : shippingLoading
                ? "Menghitung Ongkir..."
                : shippingError
                ? "Perbaiki Ongkir"
                : `Buat Pesanan${
                    checkoutCarts.length > 1
                      ? ` (${checkoutCarts.length} Toko)`
                      : ""
                  }`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
