"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useProducts } from "./contexts/ProductContext";
import { useCart } from "./contexts/CartContext";
import { useAuth } from "./contexts/AuthContext";
import { showSuccess, showError, showWarning } from "./utils/swal";
import { InlineLoading } from "./components/PageLoading";
import StarRating from "./components/StarRating";
import { formatPrice } from "./utils/format";
import ProductCard from "./components/ProductCard";

// Fallback API Base URL jika tidak diimport dari config
const API_BASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : "";

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

const ProductDetailPage = () => {
  const params = useParams();
  const id = params?.id;
  const { getProductById, products } = useProducts();
  const { addToCart } = useCart();
  const { user, token } = useAuth();

  const product = getProductById(Number(id));

  const shopName =
    product &&
    (product.sellerName ||
      product.storeName ||
      product.shopName ||
      product.seller ||
      "BillSnack Store");

  const normalizeImg = (img) =>
    typeof img === "string" ? img : (img && (img.thumb || img.original)) || "";

  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [btnHover, setBtnHover] = useState(false);
  const [outOfStock, setOutOfStock] = useState(false);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    if (product) {
      setSelectedImage(normalizeImg(product.images && product.images[0]));
      setQuantity(1);
      setOutOfStock(!product.inStock || product.stock === 0);
      window.scrollTo(0, 0);
    }
  }, [product]);

  const handleAddToCart = () => {
    if (quantity > product.stock) {
      showError(
        "Stok Tidak Cukup",
        `Maaf, stok hanya tersedia ${product.stock} unit. Tidak bisa menambahkan lebih dari itu.`
      );
      return;
    }
    addToCart(product, quantity);
    showSuccess(
      "Berhasil",
      `${quantity} x ${product.name} ditambahkan ke keranjang!`
    );
  };

  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);

  useEffect(() => {
    if (!product) return;

    const fetchReviews = async () => {
      setLoadingReviews(true);
      setReviewsError(null);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const res = await fetch(
          `${API_BASE}/api/reviews/product/${product.id}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        } else {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      } catch (e) {
        if (e.name === "AbortError") {
          setReviewsError("Request timeout - server mungkin tidak merespons");
        } else {
          setReviewsError(
            "Gagal memuat ulasan - server mungkin tidak tersedia"
          );
        }
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();

    if (user && token) {
      (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const res = await fetch(
            `${API_BASE}/api/reviews/can-review?productId=${product.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              signal: controller.signal,
            }
          );
          clearTimeout(timeoutId);

          if (res.ok) {
            const d = await res.json();
            setCanReview(!!d.canReview);
          } else {
            setCanReview(false);
          }
        } catch (e) {
          setCanReview(false);
        }
      })();
    } else {
      setCanReview(false);
    }
  }, [product, user, token]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user || !token) {
      showWarning(
        "Login Diperlukan",
        "Silakan login terlebih dahulu untuk mengirim ulasan."
      );
      return;
    }
    setSubmittingReview(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for submission

      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          rating: Number(newRating),
          comment: newComment,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();

      // Refresh reviews after successful submission
      try {
        const revRes = await fetch(
          `${API_BASE}/api/reviews/product/${product.id}`
        );
        if (revRes.ok) setReviews(await revRes.json());
      } catch (refreshError) {}

      if (data && typeof data.rating !== "undefined") {
        product.rating = data.rating;
        product.reviewCount = data.reviewCount;
      }
      setNewComment("");
      setNewRating(5);
      setCanReview(false);
      showSuccess("Berhasil", "Ulasan berhasil dikirim!");
    } catch (err) {
      if (err.name === "AbortError") {
        showWarning(
          "Timeout",
          "Pengiriman ulasan timeout - coba lagi nanti"
        );
      } else {
        showError(
          "Gagal",
          err.message ||
            "Gagal mengirim ulasan - server mungkin tidak tersedia"
        );
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-surface dark:bg-[rgb(var(--bg))] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text))] mb-2">
            Produk Tidak Ditemukan
          </h1>
          <p className="text-[rgb(var(--text-muted))] mb-6">
            Maaf, produk yang Anda cari tidak tersedia atau telah dihapus.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 btn-primary px-6 py-3 rounded-lg font-semibold"
          >
            Kembali ke Toko
          </Link>
        </div>
      </div>
    );
  }

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const discountPct = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : null;

  return (
    <div className="bg-surface dark:bg-[rgb(var(--bg))] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-yellow-400 rounded-full blur-2xl"></div>
        <div className="absolute bottom-40 left-1/3 w-20 h-20 bg-yellow-400 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-yellow-400 rounded-full blur-lg"></div>
      </div>

      <div className="px-3 sm:px-8 lg:px-16 py-4 sm:py-12 max-w-7xl mx-auto relative">
        <nav className="flex items-center text-xs sm:text-sm text-[rgb(var(--text-muted))] mb-4 sm:mb-8 font-medium flex-wrap gap-0.5">
          <Link
            href="/"
            className="hover:text-[rgb(var(--accent))] transition-colors"
          >
            Beranda
          </Link>{" "}
          <span className="mx-1 sm:mx-2">
            <ChevronRightIcon />
          </span>
          <Link
            href="/shop"
            className="hover:text-[rgb(var(--accent))] transition-colors"
          >
            Toko
          </Link>{" "}
          <span className="mx-1 sm:mx-2">
            <ChevronRightIcon />
          </span>
          <span className="text-[rgb(var(--text))] font-bold truncate max-w-[150px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-12">
          {/* Product Images */}
          <div>
            <div className="bg-surface-alt dark:bg-[rgb(var(--surface-alt))] rounded-lg sm:rounded-xl shadow-lg overflow-hidden mb-3 sm:mb-4 flex items-center justify-center border border-base hover:shadow-xl transition-shadow duration-300">
              <div className="w-full max-w-[829px] aspect-[1.08/1] bg-surface-alt dark:bg-[rgb(var(--surface))] flex items-center justify-center overflow-hidden">
                <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
                  <img
                    src={selectedImage || null}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain object-center transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <div className="flex items-center gap-1 bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border border-[rgb(var(--accent))]/30">
                <svg
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Gratis Ongkir
              </div>
              <div className="flex items-center gap-1 bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border border-[rgb(var(--accent))]/30">
                <svg
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Garansi Uang Kembali
              </div>
              <div className="flex items-center gap-1 bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border border-[rgb(var(--accent))]/30">
                <svg
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Produk Asli
              </div>
            </div>

            <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2 px-1 sm:px-2 mt-3 sm:mt-4">
              {product.images &&
                product.images.map((img, index) => {
                  const url = normalizeImg(img);
                  return (
                    <div
                      key={index}
                      className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-300 hover:shadow-md shrink-0 ${
                        selectedImage === url
                          ? "border-[rgb(var(--accent))] shadow-lg scale-110"
                          : "border-base hover:border-gray-300"
                      } bg-surface-alt dark:bg-[rgb(var(--surface-alt))]`}
                      onClick={() => setSelectedImage(url)}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src={url || null}
                          alt={`${product.name} view ${index + 1}`}
                          className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-110"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Product Details Card */}
          <div className="bg-linear-to-br from-surface via-surface-alt to-surface dark:from-[rgb(var(--surface))] dark:via-[rgb(var(--surface-alt))] dark:to-[rgb(var(--surface))] rounded-lg sm:rounded-xl border border-base p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            {/* Title - Menggunakan text-[rgb(var(--text))] agar warna teks selalu kontras dengan background */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[rgb(var(--text))] mb-2">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex items-center text-xs sm:text-sm text-[rgb(var(--text-muted))]">
                <StarRating rating={product.rating} />
                <span className="ml-1 sm:ml-2 font-medium">
                  {product.rating}/5
                </span>
                <span className="ml-1">({product.reviewCount} ulasan)</span>
              </div>
              <div className="text-xs sm:text-sm text-[rgb(var(--text-muted))]">
                •{" "}
                {product.soldCount || Math.floor((product.id * 37) % 100) + 50}{" "}
                terjual
              </div>
            </div>

            <div className="flex items-center text-xs sm:text-sm text-[rgb(var(--text-muted))] mt-2 sm:mt-3 mb-3 sm:mb-4">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-[rgb(var(--accent))]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span className="font-medium">Penjual:</span>
              <span className="ml-1 text-[rgb(var(--accent))] font-bold truncate">
                {shopName}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mb-4 sm:mb-6">
              {/* Price - Menggunakan text-[rgb(var(--text))] agar warna teks selalu kontras dengan background */}
              <p className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text))]">
                Rp{formatPrice(product.price)}
              </p>
              {product.originalPrice && (
                <p className="text-base sm:text-xl line-through text-gray-500">
                  Rp{formatPrice(product.originalPrice)}
                </p>
              )}
              {discountPct && (
                <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold bg-linear-to-r from-red-500 to-orange-500 text-white shadow-md animate-pulse">
                  -{discountPct}%
                </span>
              )}
            </div>

            {/* Spec Box */}
            <div className="bg-[rgb(var(--accent))]/5 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-[rgb(var(--accent))]/20">
              <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <p className="text-[rgb(var(--text-muted))] mb-1">
                    <span className="font-semibold text-[rgb(var(--accent))]">
                      Ketersediaan Stok:
                    </span>
                  </p>
                  {/* Value - Menggunakan text-[rgb(var(--text))] agar warna teks selalu kontras dengan background */}
                  <p className="font-medium text-[rgb(var(--text))]">
                    {product.stock} unit
                  </p>
                </div>
                <div>
                  <p className="text-[rgb(var(--text-muted))] mb-1">
                    <span className="font-semibold text-[rgb(var(--accent))]">
                      Kategori:
                    </span>
                  </p>
                  <p className="font-medium text-[rgb(var(--text))]">
                    {product.category || "Umum"}
                  </p>
                </div>
                <div>
                  <p className="text-[rgb(var(--text-muted))] mb-1">
                    <span className="font-semibold text-[rgb(var(--accent))]">
                      Berat:
                    </span>
                  </p>
                  <p className="font-medium text-[rgb(var(--text))]">
                    {product.weight || "500g"}
                  </p>
                </div>
                <div>
                  <p className="text-[rgb(var(--text-muted))] mb-1">
                    <span className="font-semibold text-[rgb(var(--accent))]">
                      Kondisi:
                    </span>
                  </p>
                  <p className="font-medium text-[rgb(var(--text))]">Baru</p>
                </div>
              </div>
            </div>

            <hr className="my-4 sm:my-8 border-base" />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
              <div className="flex items-center justify-center border border-[rgb(var(--accent))]/30 rounded-full px-3 sm:px-4 py-2 sm:py-3 bg-[rgb(var(--accent))]/5 shadow-sm">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="text-[rgb(var(--accent))] text-lg sm:text-xl font-bold w-6 h-6 flex items-center justify-center hover:text-[rgb(var(--accent))]/80 transition-colors"
                  suppressHydrationWarning={true}
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold text-base sm:text-lg text-[rgb(var(--text))]">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                  className="text-[rgb(var(--accent))] text-lg sm:text-xl font-bold w-6 h-6 flex items-center justify-center hover:text-[rgb(var(--accent))]/80 transition-colors"
                  disabled={quantity >= product.stock}
                  suppressHydrationWarning={true}
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                disabled={outOfStock}
                className={`flex-1 sm:grow bg-linear-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent-hover))] hover:from-[rgb(var(--accent-hover))] hover:to-[rgb(var(--accent))] text-white py-3 sm:py-4 px-4 sm:px-8 rounded-full text-base sm:text-lg font-semibold focus:outline-none transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-md ${
                  outOfStock ? "opacity-50 cursor-not-allowed bg-gray-400" : ""
                }`}
                aria-label="Tambah ke Keranjang"
                suppressHydrationWarning={true}
              >
                {outOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
              </button>
            </div>

            <button
              className="w-full border-2 border-[rgb(var(--accent))] text-[rgb(var(--accent))] font-semibold py-2.5 sm:py-3 px-4 sm:px-8 rounded-full text-base sm:text-lg hover:bg-[rgb(var(--accent))] hover:text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              suppressHydrationWarning={true}
            >
              Tambah ke Wishlist ♡
            </button>
          </div>

          {/* Reviews Section */}
          <div className="mt-6 sm:mt-12 lg:col-span-2">
            <div className="border-b border-base pb-2 sm:pb-4 overflow-x-auto">
              <nav className="flex space-x-4 sm:space-x-8 min-w-max">
                <button
                  onClick={() => setActiveTab("description")}
                  className={`py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-300 whitespace-nowrap ${
                    activeTab === "description"
                      ? "border-[rgb(var(--accent))] text-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10 rounded-t-md"
                      : "border-transparent text-[rgb(var(--text-muted))] hover:text-[rgb(var(--accent))] hover:border-[rgb(var(--accent))]"
                  }`}
                  suppressHydrationWarning={true}
                >
                  Deskripsi
                </button>
                <button
                  onClick={() => setActiveTab("specifications")}
                  className={`py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-300 whitespace-nowrap ${
                    activeTab === "specifications"
                      ? "border-[rgb(var(--accent))] text-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10 rounded-t-md"
                      : "border-transparent text-[rgb(var(--text-muted))] hover:text-[rgb(var(--accent))] hover:border-[rgb(var(--accent))]"
                  }`}
                  suppressHydrationWarning={true}
                >
                  Spesifikasi
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-300 whitespace-nowrap ${
                    activeTab === "reviews"
                      ? "border-[rgb(var(--accent))] text-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10 rounded-t-md"
                      : "border-transparent text-[rgb(var(--text-muted))] hover:text-[rgb(var(--accent))] hover:border-[rgb(var(--accent))]"
                  }`}
                  suppressHydrationWarning={true}
                >
                  Ulasan (
                  {loadingReviews ? "..." : reviewsError ? "!" : reviews.length}
                  )
                </button>
              </nav>
            </div>
            <div className="mt-4 sm:mt-6">
              {activeTab === "description" && (
                <div className="prose prose-gray dark:prose-invert max-w-none bg-surface-alt dark:bg-[rgb(var(--surface-alt))] p-4 sm:p-6 rounded-lg border border-base shadow-sm">
                  <p className="text-sm sm:text-base text-[rgb(var(--text-muted))] leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}
              {activeTab === "specifications" && (
                <div className="bg-surface-alt dark:bg-[rgb(var(--surface-alt))] p-4 sm:p-6 rounded-lg border border-base shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[rgb(var(--text))]">
                    Spesifikasi Produk
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between py-1.5 sm:py-2 text-sm">
                        <span className="text-[rgb(var(--text-muted))]">
                          Nama Produk
                        </span>
                        <span className="font-medium text-[rgb(var(--text))]">
                          {product.name}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-[rgb(var(--text-muted))]">
                          Kategori
                        </span>
                        <span className="font-medium text-[rgb(var(--text))]">
                          {product.category || "Umum"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-[rgb(var(--text-muted))]">
                          Berat
                        </span>
                        <span className="font-medium text-[rgb(var(--text))]">
                          {product.weight || "500g"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-[rgb(var(--text-muted))]">
                          Stok
                        </span>
                        <span className="font-medium text-[rgb(var(--text))]">
                          {product.stock} unit
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2">
                        <span className="text-[rgb(var(--text-muted))]">
                          Kondisi
                        </span>
                        <span className="font-medium text-green-700 dark:text-green-400">
                          Baru
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-[rgb(var(--text-muted))]">
                          Pengiriman
                        </span>
                        <span className="font-medium text-[rgb(var(--text))]">
                          Gratis Ongkir
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-[rgb(var(--text-muted))]">
                          Garansi
                        </span>
                        <span className="font-medium text-[rgb(var(--text))]">
                          7 hari
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-[rgb(var(--text-muted))]">
                          Penjual
                        </span>
                        <span className="font-medium text-[rgb(var(--accent))]">
                          {shopName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "reviews" && (
                <>
                  {loadingReviews ? (
                    <div className="text-center py-12 bg-surface-alt dark:bg-[rgb(var(--surface-alt))] rounded-lg border border-base">
                      <InlineLoading text="Memuat ulasan..." variant="dots" size="md" />
                    </div>
                  ) : reviewsError ? (
                    <div className="text-center py-12 bg-surface-alt dark:bg-[rgb(var(--surface-alt))] rounded-lg border border-base">
                      <svg
                        className="w-16 h-16 mx-auto text-red-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      <p className="text-[rgb(var(--text-muted))] text-lg mb-2">
                        Gagal Memuat Ulasan
                      </p>
                      <p className="text-sm text-[rgb(var(--text-muted))] mb-4">
                        {reviewsError}
                      </p>
                      <button
                        onClick={() => {
                          setReviewsError(null);
                          // Trigger re-fetch by updating a dependency
                          setLoadingReviews(true);
                          setTimeout(() => {
                            window.location.reload();
                          }, 100);
                        }}
                        className="btn-primary px-4 py-2 rounded-lg text-sm"
                        suppressHydrationWarning={true}
                      >
                        Coba Lagi
                      </button>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-12 bg-surface-alt dark:bg-[rgb(var(--surface-alt))] rounded-lg border border-base">
                      <svg
                        className="w-16 h-16 mx-auto text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <p className="text-[rgb(var(--text-muted))] text-lg">
                        Belum ada ulasan untuk produk ini.
                      </p>
                      <p className="text-sm text-[rgb(var(--text-muted))] mt-2">
                        Jadilah yang pertama memberikan ulasan!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((r) => (
                        <div
                          key={r.id || `${r.userId}-${r.created_at}`}
                          className="p-6 border border-base rounded-xl bg-linear-to-r from-surface-alt to-surface dark:from-[rgb(var(--surface-alt))] dark:to-[rgb(var(--surface))] shadow-md hover:shadow-lg transition-shadow duration-300"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-linear-to-br from-[rgb(var(--accent))] to-[rgb(var(--accent-hover))] rounded-full flex items-center justify-center text-white font-bold">
                                {(r.users?.first_name || r.user_name || r.userId || "P")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <strong className="text-[rgb(var(--text))]">
                                {r.users ? `${r.users.first_name || ''} ${r.users.last_name || ''}`.trim() || r.users.username : r.user_name || r.userId || "Pelanggan"}
                              </strong>
                            </div>
                            <StarRating rating={r.rating} />
                          </div>
                          {r.comment && (
                            <p className="mt-2 text-[rgb(var(--text-muted))] leading-relaxed">
                              {r.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Review Form - only when allowed */}
                  {canReview ? (
                    <form
                      onSubmit={handleSubmitReview}
                      className="mt-8 space-y-4 bg-linear-to-r from-surface-alt to-surface dark:from-[rgb(var(--surface-alt))] dark:to-[rgb(var(--surface))] p-6 rounded-xl border border-base shadow-md"
                    >
                      <h3 className="text-lg font-semibold text-[rgb(var(--text))] mb-4">
                        Tulis Ulasan Anda
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-[rgb(var(--text-muted))] mb-2">
                          Rating
                        </label>
                        <select
                          value={newRating}
                          onChange={(e) => setNewRating(Number(e.target.value))}
                          className="mt-1 rounded-lg border border-base bg-white dark:bg-[rgb(var(--surface))] px-4 py-2 focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent transition-all duration-300 text-black"
                        >
                          {[5, 4, 3, 2, 1].map((v) => (
                            <option key={v} value={v}>
                              {v} bintang
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[rgb(var(--text-muted))] mb-2">
                          Ulasan
                        </label>
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-base bg-white dark:bg-[rgb(var(--surface))] px-4 py-2 focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent transition-all duration-300 text-black"
                          rows={4}
                          placeholder="Tulis pengalaman Anda menggunakan produk ini..."
                        />
                      </div>
                      <div>
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="inline-flex items-center px-6 py-3 btn-primary rounded-lg font-semibold disabled:opacity-50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                          suppressHydrationWarning={true}
                        >
                          {submittingReview ? "Mengirim..." : "Kirim Ulasan"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-8 bg-surface-alt dark:bg-[rgb(var(--surface-alt))] rounded-lg border border-base mt-6">
                      <p className="text-sm text-[rgb(var(--text-muted))]">
                        {user
                          ? "Anda belum dapat mengulas produk ini (mungkin belum membeli atau sudah mengulas)."
                          : "Silakan login setelah membeli untuk mengirim ulasan."}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="bg-linear-to-br from-surface-alt via-surface to-surface-alt dark:from-[rgb(var(--surface-alt))] dark:via-[rgb(var(--surface))] dark:to-[rgb(var(--surface-alt))] py-8 sm:py-16 mt-6 sm:mt-12 rounded-lg sm:rounded-xl border border-base shadow-lg">
            <div className="px-3 sm:px-8 lg:px-16">
              <h2 className="text-2xl sm:text-4xl font-bold text-center mb-6 sm:mb-10 text-[rgb(var(--text))]">
                Anda Mungkin Juga Suka
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-8">
                {relatedProducts.map((p, index) => (
                  <div
                    key={p.id}
                    className="transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
