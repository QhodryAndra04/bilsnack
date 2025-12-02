"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";

// Logo placeholder - replace with actual logo path when available
const logo = "/bilsnack.jpg";

// Komponen NavLink dengan animasi underline
const NavLink = ({ href, children }) => (
  <Link
    href={href}
    className="relative group text-sm font-medium text-muted hover:accent-text transition-colors py-2"
  >
    {children}
    <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 accent-bg transition-all duration-300 group-hover:w-full rounded-full"></span>
  </Link>
);

const SearchIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const UserAvatar = ({ name, src, size = 9 }) => {
  const initial = name ? name.trim().split(" ")[0][0].toUpperCase() : null;
  const sizeClass = size === 9 ? "w-9 h-9" : "w-10 h-10";
  return (
    <div
      className={`user-avatar-inner ${sizeClass} rounded-full overflow-hidden flex items-center justify-center font-bold border-2 border-base bg-surface text-muted shadow-sm transition-transform`}
    >
      {src ? (
        <img
          src={src}
          alt={name || "User avatar"}
          className="w-full h-full object-cover"
        />
      ) : initial ? (
        <span className="text-sm">{initial}</span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )}
    </div>
  );
};

const CartIcon = ({ filled = false }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-colors duration-300 ${
      filled ? "accent-text scale-110" : "text-muted"
    }`}
  >
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
);

const Header = () => {
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(null); // Start with null to avoid hydration mismatch
  const router = useRouter();
  const pathname = usePathname();
  const userMenuRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Load theme from localStorage on client side
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push("/");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    }
    function handleEsc(e) {
      if (e.key === "Escape") setIsUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const toggleTheme = () => {
    const currentTheme = theme || "light";
    const next = currentTheme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
  };

  const ThemeIcon = () => {
    const currentTheme = theme || "light";
    return currentTheme === "dark" ? (
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
        className="accent-text"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    ) : (
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
        className="accent-text"
      >
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07 6.07-1.42-1.42M8.35 8.35 6.93 6.93m0 10.14 1.42-1.42m9.72-9.72-1.42 1.42" />
      </svg>
    );
  };

  // Hide header on admin and reseller panel routes
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/reseller") ||
    pathname.startsWith("/perloginan")
  ) {
    return null;
  }

  // Styling Classes
  const iconBtnClass = "icon-btn";

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 glass shadow-sm transition-all duration-300"
      style={{
        background:
          "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 191, 36, 0.1) 50%, rgba(245, 158, 11, 0.15) 100%)",
      }}
    >
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          {/* Logo Section */}
          <div className="shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 group">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 overflow-hidden rounded-lg sm:rounded-xl shadow-[var(--shadow-sm)] group-hover:shadow-[var(--shadow-md)] transition-shadow">
                <img
                  src={logo}
                  alt="Bilsnack logo"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-gradient group-hover:from-accent-hover group-hover:to-accent transition-all">
                Bilsnack
                <span className="text-muted hidden sm:inline">.id</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation & Search */}
          <div className="hidden md:flex flex-1 items-center justify-center lg:justify-between max-w-3xl px-8">
            <nav className="flex items-center space-x-8 mr-6">
              <NavLink href="/">Beranda</NavLink>
              <NavLink href="/shop">Semua Produk</NavLink>
            </nav>

            {/* Enhanced Search Bar */}
            <div
              className={`relative flex items-center transition-all duration-300 ease-out ${
                isSearchFocused ? "grow max-w-md ring-2 ring-accent/20" : "w-64"
              } bg-surface-alt border border-base rounded-full hover:border-accent/50`}
            >
              <div className="pl-4 text-muted">
                <SearchIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Cari snack favorit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full bg-transparent border-none py-2.5 pl-3 pr-4 text-sm placeholder:text-muted focus:ring-0 focus:outline-none rounded-full"
                suppressHydrationWarning
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {/* Theme Toggle */}
            {!pathname.startsWith("/admin") &&
              !pathname.startsWith("/reseller") && (
                <button
                  onClick={toggleTheme}
                  className={`${iconBtnClass} w-9 h-9 sm:w-10 sm:h-10`}
                  aria-label="Toggle Theme"
                  suppressHydrationWarning
                >
                  <ThemeIcon />
                </button>
              )}

            {/* Cart Button */}
            <Link
              href="/cart"
              className={`${iconBtnClass} relative w-9 h-9 sm:w-10 sm:h-10 mr-0.5 sm:mr-1`}
              aria-label="Keranjang"
            >
              <CartIcon filled={itemCount > 0} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:top-0.5 sm:right-0.5 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm ring-1 sm:ring-2 ring-[rgb(var(--surface))] animate-in zoom-in duration-300">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Desktop Login/User Btn */}
            <div className="hidden md:flex items-center">
              {user ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-200 bg-surface"
                    suppressHydrationWarning
                  >
                    <span className="text-xs font-medium text-muted max-w-20 truncate hidden lg:block">
                      {user.name?.split(" ")[0]}
                    </span>
                    <UserAvatar name={user.name} src={user.profileImage} />
                  </button>

                  <div
                    className={`absolute right-0 mt-3 w-60 origin-top-right bg-[rgb(var(--surface))] rounded-2xl shadow-[var(--shadow-xl)] focus:outline-none transition-all duration-200 ${
                      isUserMenuOpen
                        ? "opacity-100 scale-100 visible"
                        : "opacity-0 scale-95 invisible"
                    }`}
                  >
                    {/* Added background and rounded-top to match JSX visual style */}
                    <div className="px-5 py-4 bg-[rgb(var(--surface-alt))]/50 rounded-t-2xl">
                      <p className="text-sm text-muted">Halo,</p>
                      <p className="text-sm font-bold truncate">{user.name}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-5 py-2.5 text-sm hover:bg-surface-alt hover:accent-text transition-colors"
                      >
                        Profil Saya
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-5 py-2.5 text-sm hover:bg-surface-alt hover:accent-text transition-colors"
                      >
                        Riwayat Pesanan
                      </Link>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-5 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                        suppressHydrationWarning
                      >
                        Keluar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="btn-primary py-2 px-6 rounded-full text-sm font-semibold shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-button-hover)] transform hover:-translate-y-0.5 transition-all"
                >
                  Masuk
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden icon-btn w-9 h-9 sm:w-10 sm:h-10"
              suppressHydrationWarning
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {isMobileMenuOpen ? (
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                ) : (
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                )}
                {isMobileMenuOpen ? (
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                ) : (
                  <>
                    {" "}
                    <line x1="3" y1="6" x2="21" y2="6"></line>{" "}
                    <line x1="3" y1="18" x2="21" y2="18"></line>{" "}
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out glass ${
          isMobileMenuOpen
            ? "max-h-screen opacity-100 shadow-[var(--shadow-xl)]"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-3 sm:px-4 pt-3 pb-4 sm:pt-4 sm:pb-6 space-y-3 sm:space-y-4 safe-bottom">
          {/* Mobile Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-muted" />
            </div>
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && {
                  handleSearch,
                  setIsMobileMenuOpen: () => setIsMobileMenuOpen(false),
                }
              }
              className="block w-full pl-10 pr-3 py-3 border border-base rounded-lg bg-surface placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 text-base"
              suppressHydrationWarning
            />
          </div>

          <div className="space-y-1">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-3 rounded-lg text-base font-medium text-muted hover:accent-text hover:bg-surface-alt active:bg-surface-alt/80 touch-target"
            >
              Beranda
            </Link>
            <Link
              href="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-3 rounded-lg text-base font-medium text-muted hover:accent-text hover:bg-surface-alt active:bg-surface-alt/80 touch-target"
            >
              Semua Produk
            </Link>
          </div>

          <div className="border-t border-base pt-3 sm:pt-4">
            {user ? (
              <div className="flex items-center px-3 py-2">
                <div className="shrink-0">
                  <UserAvatar
                    name={user.name}
                    src={user.profileImage}
                    size={10}
                  />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <div className="text-base font-medium leading-none truncate">
                    {user.name}
                  </div>
                  <div className="text-sm font-medium leading-none text-muted mt-1 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-3">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center btn-primary py-3 rounded-lg font-bold shadow-[var(--shadow-md)] touch-target"
                >
                  Masuk Sekarang
                </Link>
              </div>
            )}

            {user && (
              <div className="mt-2 sm:mt-3 px-2 space-y-1">
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-lg text-base font-medium text-muted hover:accent-text hover:bg-surface-alt active:bg-surface-alt/80 touch-target"
                >
                  Profil Saya
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-lg text-base font-medium text-muted hover:accent-text hover:bg-surface-alt active:bg-surface-alt/80 touch-target"
                >
                  Riwayat Pesanan
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-3 rounded-lg text-base font-medium text-red-500 hover:bg-red-500/10 active:bg-red-500/20 touch-target"
                  suppressHydrationWarning
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
