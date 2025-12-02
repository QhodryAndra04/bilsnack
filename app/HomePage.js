"use client";

import React from "react";
import Link from "next/link";
import ProductCard from "./components/ProductCard";
import { useProducts } from "./contexts/ProductContext";

// Logo placeholder - replace with actual logo path when available
const logo = "/bilsnack.jpg";

const HomePage = () => {
  const { products, topSelling: ctxTopSelling } = useProducts();
  const newArrivals = (products || []).slice(0, 6);
  // Prefer server-provided topSelling list when available, otherwise fall back to local calculation
  const topSelling =
    Array.isArray(ctxTopSelling) && ctxTopSelling.length > 0
      ? ctxTopSelling.slice(0, 6)
      : (products || [])
          .slice()
          .sort(
            (a, b) => Number(b.reviewCount || 0) - Number(a.reviewCount || 0)
          )
          .slice(0, 6);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full">
        {/* Background Gradient menggunakan variabel CSS agar sinkron Light/Dark */}
        <div className="absolute inset-0 bg-linear-to-br from-[rgb(var(--hero-from))] via-[rgb(var(--hero-via))] to-[rgb(var(--hero-to))]" />
        
        {/* Radial overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_25%_30%,rgba(var(--accent)/0.18),transparent_65%),radial-gradient(circle_at_80%_70%,rgba(var(--accent)/0.12),transparent_70%)]" />
        
        <div className="relative px-4 sm:px-6 lg:px-12 py-12 sm:py-16 lg:py-28 w-full grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 lg:gap-14 items-center">
          <div className="text-center md:text-left">
            <span className="inline-block mb-3 sm:mb-4 px-2.5 sm:px-3 py-1 rounded-full accent-bg text-xs font-semibold tracking-wide shadow-sm">
              PROMO HARI INI
            </span>
            {/* Menggunakan text-[rgb(var(--text))] agar warna teks selalu kontras dengan background */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight text-[rgb(var(--text))]">
              Cemilan Enak,{" "}
              <span className="text-gradient">Mood Meningkat</span>.
            </h1>
            <p className="mt-3 sm:mt-5 text-[rgb(var(--text-muted))] text-base sm:text-lg max-w-xl mx-auto md:mx-0">
              Temukan snack terbaik dari ratusan merek. Pengiriman cepat, harga
              bersahabat, dan selalu ada kejutan setiap minggu.
            </p>
            <div className="mt-5 sm:mt-6 flex flex-row gap-2 sm:gap-4 justify-center md:justify-start">
              <Link
                href="/shop"
                className="btn-primary text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3"
              >
                Belanja Sekarang
              </Link>
              <Link
                href="/register"
                className="btn-secondary text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3"
              >
                Daftar Gratis
              </Link>
            </div>
            <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-4 sm:gap-6 max-w-md mx-auto md:mx-0">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-[rgb(var(--text))]">
                  200+
                </p>
                <p className="text-[rgb(var(--text-muted))] text-[10px] sm:text-xs font-medium">
                  Merek
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-[rgb(var(--text))]">
                  2,000+
                </p>
                <p className="text-[rgb(var(--text-muted))] text-[10px] sm:text-xs font-medium">
                  Produk
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-[rgb(var(--text))]">
                  30,000+
                </p>
                <p className="text-[rgb(var(--text-muted))] text-[10px] sm:text-xs font-medium">
                  Pelanggan
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center order-first md:order-last">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80">
              <div className="absolute -inset-2 bg-[radial-gradient(circle_at_40%_35%,rgba(var(--accent)/0.25),transparent_70%)] rounded-3xl blur-xl" />
              <div className="relative w-full h-full bg-surface rounded-2xl sm:rounded-3xl shadow-[var(--shadow-lg)] flex items-center justify-center overflow-hidden border border-base">
                <img
                  src={logo}
                  alt="Billsnack"
                  className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 object-contain select-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-surface py-8 sm:py-12 w-full">
        <div className="px-4 sm:px-6 lg:px-12 w-full">
          <h2 className="text-xl sm:text-3xl font-bold text-center mb-4 sm:mb-8 text-[rgb(var(--text))]">
            JELAJAHI KATEGORI
          </h2>
          {/* Mobile: grid 5 cols, Desktop: grid 5 cols centered */}
          <div className="flex justify-center">
            <div className="grid grid-cols-5 gap-2 sm:gap-4 lg:max-w-5xl w-full">
              {/* All */}
              <Link href="/shop" className="group">
                <div className="bg-[rgb(var(--surface))] rounded-lg sm:rounded-xl p-1.5 sm:p-6 h-20 sm:h-48 flex flex-col items-center justify-center shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 hover:-translate-y-0.5">
                  <div className="w-8 h-8 sm:w-20 sm:h-20 mb-1 sm:mb-3 flex items-center justify-center">
                    <span className="text-xl sm:text-4xl">🛍️</span>
                  </div>
                  <h3 className="text-[9px] sm:text-lg font-bold text-center text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent))] transition-colors leading-tight">
                    All
                  </h3>
                </div>
              </Link>

              {/* Chips & Crisps */}
              <Link
                href={`/shop?category=${encodeURIComponent("Chips & Crisps")}`}
                className="group"
              >
                <div className="bg-[rgb(var(--surface))] rounded-lg sm:rounded-xl p-1.5 sm:p-6 h-20 sm:h-48 flex flex-col items-center justify-center shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 hover:-translate-y-0.5">
                  <div className="w-8 h-8 sm:w-20 sm:h-20 mb-1 sm:mb-3 flex items-center justify-center">
                    <span className="text-xl sm:text-4xl">🥨</span>
                  </div>
                  <h3 className="text-[9px] sm:text-lg font-bold text-center text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent))] transition-colors leading-tight">
                    Chips
                  </h3>
                </div>
              </Link>

              {/* Candies & Sweets */}
              <Link
                href={`/shop?category=${encodeURIComponent(
                  "Candies & Sweets"
                )}`}
                className="group"
              >
                <div className="bg-[rgb(var(--surface))] rounded-lg sm:rounded-xl p-1.5 sm:p-6 h-20 sm:h-48 flex flex-col items-center justify-center shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 hover:-translate-y-0.5">
                  <div className="w-8 h-8 sm:w-20 sm:h-20 mb-1 sm:mb-3 flex items-center justify-center">
                    <span className="text-xl sm:text-4xl">🍬</span>
                  </div>
                  <h3 className="text-[9px] sm:text-lg font-bold text-center text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent))] transition-colors leading-tight">
                    Candies
                  </h3>
                </div>
              </Link>

              {/* Cookies */}
              <Link
                href={`/shop?category=${encodeURIComponent("Cookies")}`}
                className="group"
              >
                <div className="bg-[rgb(var(--surface))] rounded-lg sm:rounded-xl p-1.5 sm:p-6 h-20 sm:h-48 flex flex-col items-center justify-center shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 hover:-translate-y-0.5">
                  <div className="w-8 h-8 sm:w-20 sm:h-20 mb-1 sm:mb-3 flex items-center justify-center">
                    <span className="text-xl sm:text-4xl">🍪</span>
                  </div>
                  <h3 className="text-[9px] sm:text-lg font-bold text-center text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent))] transition-colors leading-tight">
                    Cookies
                  </h3>
                </div>
              </Link>

              {/* Nuts & Dried Fruits */}
              <Link
                href={`/shop?category=${encodeURIComponent(
                  "Nuts & Dried Fruits"
                )}`}
                className="group"
              >
                <div className="bg-[rgb(var(--surface))] rounded-lg sm:rounded-xl p-1.5 sm:p-6 h-20 sm:h-48 flex flex-col items-center justify-center shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 hover:-translate-y-0.5">
                  <div className="w-8 h-8 sm:w-20 sm:h-20 mb-1 sm:mb-3 flex items-center justify-center">
                    <span className="text-xl sm:text-4xl">🥜</span>
                  </div>
                  <h3 className="text-[9px] sm:text-lg font-bold text-center text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent))] transition-colors leading-tight">
                    Nuts
                  </h3>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="bg-surface py-12 sm:py-16 lg:py-20 w-full">
        <div className="px-4 sm:px-6 lg:px-12 w-full">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 text-[rgb(var(--text))]">
            PRODUK TERBARU
          </h2>
          <div className="grid grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4 lg:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-8 sm:mt-12">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center btn-primary rounded-full shadow-sm"
            >
              Lihat Semua
            </Link>
          </div>
        </div>
      </section>

      {/* Top Selling */}
      <section className="bg-surface py-12 sm:py-16 lg:py-20 w-full">
        <div className="px-4 sm:px-6 lg:px-12 w-full">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 text-[rgb(var(--text))]">TERLARIS</h2>
          <div className="grid grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4 lg:gap-6">
            {topSelling.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-8 sm:mt-12">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center btn-primary rounded-full shadow-sm"
            >
              Lihat Semua
            </Link>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="bg-surface-alt py-12 sm:py-16 lg:py-20 w-full">
        <div className="px-4 sm:px-6 lg:px-12 w-full">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 text-[rgb(var(--text))]">
            Apa Kata Pelanggan Kami
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
            <div className="bg-surface p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-[var(--shadow-lg)]">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg">
                  A
                </div>
                <div className="ml-3 sm:ml-4">
                  <h4 className="font-semibold text-sm sm:text-base text-[rgb(var(--text))]">
                    Ahmad S.
                  </h4>
                  <div className="flex text-yellow-400 text-sm">★★★★★</div>
                </div>
              </div>
              <p className="text-[rgb(var(--text-muted))] italic text-sm sm:text-base">
                "Snack-nya fresh banget! Pengiriman juga cepat. Sudah jadi
                langganan di Billsnack."
              </p>
            </div>
            <div className="bg-surface p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-[var(--shadow-lg)]">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg">
                  S
                </div>
                <div className="ml-3 sm:ml-4">
                  <h4 className="font-semibold text-sm sm:text-base text-[rgb(var(--text))]">
                    Sari P.
                  </h4>
                  <div className="flex text-yellow-400 text-sm">★★★★★</div>
                </div>
              </div>
              <p className="text-[rgb(var(--text-muted))] italic text-sm sm:text-base">
                "Variasi produknya lengkap, dari chips sampai coklat. Harganya
                juga terjangkau."
              </p>
            </div>
            <div className="bg-surface p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-[var(--shadow-lg)] sm:col-span-2 md:col-span-1">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg">
                  R
                </div>
                <div className="ml-3 sm:ml-4">
                  <h4 className="font-semibold text-sm sm:text-base text-[rgb(var(--text))]">
                    Rina M.
                  </h4>
                  <div className="flex text-yellow-400 text-sm">★★★★★</div>
                </div>
              </div>
              <p className="text-[rgb(var(--text-muted))] italic text-sm sm:text-base">
                "Website-nya user friendly, mudah cari produk favorit.
                Recommended banget!"
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
