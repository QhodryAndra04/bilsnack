"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Ikon-ikon SVG tetap sama
const FacebookIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const TwitterIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
);

const InstagramIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const Footer = () => {
  let pathname = "";
  try {
    pathname = usePathname() || "";
  } catch (e) {
    pathname = "";
  }

  // Hide footer on admin and reseller panel routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/reseller") || pathname.startsWith("/perloginan")) {
    return null;
  }

  return (
    <footer
      className="relative bg-footer border-t border-base overflow-hidden"
    >
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-32 h-32 bg-[rgb(var(--accent))] rounded-full -translate-x-16 -translate-y-16 blur-sm"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-[rgb(var(--accent))] rounded-full translate-x-12 -translate-y-12 blur-sm"></div>
        <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-[rgb(var(--accent))] rounded-full translate-y-10 blur-sm"></div>
        <div className="absolute bottom-0 right-1/3 w-16 h-16 bg-[rgb(var(--accent))] rounded-full translate-y-8 blur-sm"></div>
      </div>

      <div className="px-6 py-8 max-w-6xl mx-auto relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-linear-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <div>
                {/* Menggunakan text-[rgb(var(--text))] agar warna teks selalu kontras dengan background */}
                <h3 className="text-xl font-bold text-[rgb(var(--text))]">
                  Bilsnack.id
                </h3>
                {/* Menggunakan text-[rgb(var(--text-muted))] untuk teks sekunder */}
                <p className="text-[rgb(var(--text-muted))] text-sm">
                  Camilan enak untuk semua
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href="#"
                className="w-8 h-8 bg-yellow-500/30 rounded-full flex items-center justify-center hover:bg-yellow-500/50 transition-colors backdrop-blur-sm"
              >
                <FacebookIcon />
              </a>
              <a
                href="#"
                className="w-8 h-8 bg-yellow-500/30 rounded-full flex items-center justify-center hover:bg-yellow-500/50 transition-colors backdrop-blur-sm"
              >
                <TwitterIcon />
              </a>
              <a
                href="#"
                className="w-8 h-8 bg-yellow-500/30 rounded-full flex items-center justify-center hover:bg-yellow-500/50 transition-colors backdrop-blur-sm"
              >
                <InstagramIcon />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            {/* Menggunakan text-[rgb(var(--text))] agar warna teks selalu kontras dengan background */}
            <h4 className="font-semibold text-lg mb-4 text-[rgb(var(--text))]">
              Menu Cepat
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--accent))] transition-colors text-sm"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--accent))] transition-colors text-sm"
                >
                  Belanja
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--accent))] transition-colors text-sm"
                >
                  Akun Saya
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--accent))] transition-colors text-sm"
                >
                  Kontak
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            {/* Menggunakan text-[rgb(var(--text))] agar warna teks selalu kontras dengan background */}
            <h4 className="font-semibold text-lg mb-4 text-[rgb(var(--text))]">
              Bantuan
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--accent))] transition-colors text-sm"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--accent))] transition-colors text-sm"
                >
                  Pengiriman
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--accent))] transition-colors text-sm"
                >
                  Pengembalian
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--accent))] transition-colors text-sm"
                >
                  Kontak Kami
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            {/* Menggunakan text-[rgb(var(--text))] agar warna teks selalu kontras dengan background */}
            <h4 className="font-semibold text-lg mb-4 text-[rgb(var(--text))]">
              Newsletter
            </h4>
            {/* Menggunakan text-[rgb(var(--text-muted))] untuk teks sekunder */}
            <p className="text-[rgb(var(--text-muted))] text-sm mb-3">
              Dapatkan update promo terbaru
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email Anda"
                // Menggunakan variabel CSS untuk input agar sesuai dengan mode
                className="flex-1 px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/50 backdrop-blur-sm"
              />
              <button className="px-4 py-2 bg-linear-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent-hover))] text-[rgb(var(--accent-fg))] rounded-md font-semibold hover:from-[rgb(var(--accent-hover))] hover:to-[rgb(var(--accent))] transition-all duration-300 text-sm shadow-lg hover:shadow-xl">
                Ikuti
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        {/* Menggunakan border-[rgb(var(--border))] untuk border yang sesuai mode */}
        <div className="mt-8 pt-6 border-t border-[rgb(var(--border))]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Menggunakan text-[rgb(var(--text-muted))] untuk teks sekunder */}
            <p className="text-[rgb(var(--text-muted))] text-sm text-center md:text-left">
              &copy; {new Date().getFullYear()} Bilsnack.id. Dibuat dengan ❤️
              untuk pecinta camilan.
            </p>
            <a
              href="#top"
              className="flex items-center gap-2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--accent))] transition-colors text-sm"
            >
              <span>Kembali ke atas</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;