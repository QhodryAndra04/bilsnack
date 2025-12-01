"use client";

// Fix: Populating ShopPage with product grid and filtering, as the file was empty.
import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useProducts } from "./contexts/ProductContext";
import SkeletonCard from "./components/SkeletonCard";

// Lazy load ProductCard
const ProductCard = React.lazy(() => import("./components/ProductCard"));

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

const ShopPage = () => {
  const { products, loading } = useProducts();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const [sort, setSort] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(String(p.category));
    });
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let base = category
      ? products.filter(
          (p) =>
            String(p.category || "").toLowerCase() ===
            String(category).toLowerCase()
        )
      : products;
    if (search) {
      base = base.filter(
        (p) =>
          String(p.name || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          String(p.category || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          String(p.brand || "")
            .toLowerCase()
            .includes(search.toLowerCase())
      );
    }
    // Price filter
    base = base.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );
    // Rating filter
    if (selectedRating > 0) {
      base = base.filter((p) => (p.rating || 0) >= selectedRating);
    }
    if (sort === "price-asc")
      base = [...base].sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-desc")
      base = [...base].sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "rating-desc")
      base = [...base].sort(
        (a, b) => Number(b.rating || 0) - Number(a.rating || 0)
      );
    return base;
  }, [products, category, search, sort, priceRange, selectedRating]);

  return (
    <div className="min-h-screen bg-surface dark:bg-[rgb(var(--bg))]">
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center text-xs sm:text-sm text-[rgb(var(--text-muted))] mb-4 sm:mb-6">
          <Link
            href="/"
            className="hover:text-amber-600 dark:hover:text-amber-400"
          >
            Beranda
          </Link>{" "}
          <ChevronRightIcon />
          <span className="text-[rgb(var(--text))] font-medium">Toko</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-5 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
            Koleksi Snack
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-[rgb(var(--text-muted))] max-w-2xl mx-auto px-2">
            Jelajahi ribuan pilihan snack favorit dengan filter kategori dan
            urutkan sesuai kebutuhanmu.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Mobile Filter Overlay */}
          {showFilters && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setShowFilters(false)}
            />
          )}
          
          {/* Sidebar Filters */}
          <div
            className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-300 ease-in-out lg:relative lg:z-10 lg:w-64 lg:transform-none lg:transition-none ${showFilters ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${showFilters ? "" : "hidden lg:block"}`}
          >
            <div className="bg-surface-alt border-base rounded-none lg:rounded-2xl shadow-lg lg:shadow-sm p-4 sm:p-6 h-full lg:h-auto lg:sticky lg:top-24 overflow-y-auto lg:max-h-[calc(100vh-120px)]">
              {/* Close button for mobile */}
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h3 className="text-lg font-semibold text-[rgb(var(--text))]">Filter</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 rounded-lg hover:bg-surface"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <h3 className="text-lg font-semibold text-[rgb(var(--text))] mb-4 hidden lg:block">
                Filter
              </h3>

              {/* Categories */}
              <div className="mb-4 sm:mb-6">
                <h4 className="font-medium text-sm sm:text-base text-[rgb(var(--text))] mb-2 sm:mb-3">
                  Kategori
                </h4>
                <div className="space-y-2">
                  <Link
                    href="/shop"
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      !category
                        ? "bg-filter-active text-filter-active"
                        : "text-[rgb(var(--text-muted))] hover:bg-surface"
                    }`}
                  >
                    Semua Kategori
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/shop?category=${encodeURIComponent(cat)}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        category === cat
                          ? "bg-filter-active text-filter-active"
                          : "text-[rgb(var(--text-muted))] hover:bg-surface"
                      }`}
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-4 sm:mb-6">
                <h4 className="font-medium text-sm sm:text-base text-[rgb(var(--text))] mb-2 sm:mb-3">
                  Rentang Harga
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-[rgb(var(--text-muted))]">
                    <span>Rp{priceRange[0].toLocaleString()}</span>
                    <span>Rp{priceRange[1].toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000000"
                    step="10000"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], Number(e.target.value)])
                    }
                    className="w-full h-2 bg-gray-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-4 sm:mb-6">
                <h4 className="font-medium text-sm sm:text-base text-[rgb(var(--text))] mb-2 sm:mb-3">
                  Rating Minimal
                </h4>
                <div className="space-y-2">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setSelectedRating(rating)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedRating === rating
                          ? "bg-filter-active text-filter-active"
                          : "text-[rgb(var(--text-muted))] hover:bg-surface"
                      }`}
                    >
                      {rating === 0 ? "Semua Rating" : `${rating}+ Bintang`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(category ||
                search ||
                priceRange[1] < 1000000 ||
                selectedRating > 0) && (
                <button
                  onClick={() => {
                    setPriceRange([0, 1000000]);
                    setSelectedRating(0);
                    window.location.href = "/shop";
                  }}
                  className="w-full bg-surface text-[rgb(var(--text))] py-2 px-4 rounded-lg hover:bg-surface-alt transition-colors"
                >
                  Hapus Filter
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 relative z-0">
            {/* Top Bar */}
            <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-1.5 sm:gap-2 bg-surface-alt px-2.5 sm:px-4 py-2 rounded-lg shadow-sm border-base text-sm"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  <span className="hidden xs:inline">Filter</span>
                </button>
                <div className="text-xs sm:text-sm text-[rgb(var(--text-muted))]">
                  {filtered.length} <span className="hidden xs:inline">produk ditemukan</span><span className="xs:hidden">produk</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <label
                  htmlFor="sort"
                  className="text-xs sm:text-sm text-[rgb(var(--text-muted))] hidden sm:block"
                >
                  Urutkan:
                </label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="text-xs sm:text-sm border-base rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 bg-surface-alt text-[rgb(var(--text))] focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Default</option>
                  <option value="price-asc">Harga ↑</option>
                  <option value="price-desc">Harga ↓</option>
                  <option value="rating-desc">Rating</option>
                </select>
              </div>
            </div>

            {/* Results Info */}
            {(category || search) && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                {category && (
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    Menampilkan produk untuk kategori{" "}
                    <strong>{category}</strong>
                  </div>
                )}
                {search && (
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    Menampilkan produk yang cocok dengan{" "}
                    <strong>"{search}"</strong>
                  </div>
                )}
                <Link
                  href="/shop"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                >
                  Hapus filter
                </Link>
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-4 lg:gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <Suspense fallback={<div className="grid grid-cols-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-4 lg:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>}>
                <div className="grid grid-cols-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-4 lg:gap-6">
                  {filtered.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </Suspense>
            ) : (
              <div className="text-center py-10 sm:py-20">
                <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-5v2m0 0v2m0-2h2m-2 0h-2"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[rgb(var(--text))] mb-2">
                  Tidak ada produk ditemukan
                </h3>
                <p className="text-sm sm:text-base text-[rgb(var(--text-muted))] mb-4 sm:mb-6 px-4">
                  Coba ubah filter atau kata kunci pencarian Anda.
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Lihat Semua Produk
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
