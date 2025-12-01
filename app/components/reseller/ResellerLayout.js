"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PageLoading from "../PageLoading";
import { useAuth } from "../../contexts/AuthContext";
import ResellerDashboardPage from "../../reseller/ResellerDashboardPage";
import ResellerProductsPage from "../../reseller/ResellerProductsPage";
import ResellerProductFormPage from "../../reseller/ResellerProductFormPage";

// Icons
const DashboardIcon = () => (
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
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const ProductIcon = () => (
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
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
);

const MenuIcon = () => (
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
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const CloseIcon = () => (
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
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const ResellerLayout = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resellerEmail, setResellerEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check authentication & role
    if (user && user.role === "reseller") {
      setIsAuthenticated(true);
      setResellerEmail(user.email || "");
      setLoading(false);
      return;
    }
    
    // Redirect if not authenticated as reseller
    // Add small delay to ensure context is loaded
    const timeout = setTimeout(() => {
       if (!user) {
         setLoading(false);
         router.push("/reseller/login");
       }
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [router, user]);

  // Force light mode
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const handleLogout = () => {
    try {
      logout();
    } catch (e) {
      console.error("Logout error", e);
    }
    router.push("/reseller/login");
  };

  if (loading) {
    return (
      <PageLoading
        text="Memuat Reseller Panel..."
        subText="Memeriksa autentikasi"
        variant="snack"
        size="lg"
      />
    );
  }

  if (!isAuthenticated && !user) {
    return null; // Will redirect
  }

  // Helper for active link styles
  const getNavLinkClass = (path) => {
    // Exact match for root, startsWith for subpaths
    const isActive =
      path === "/reseller"
        ? pathname === "/reseller"
        : pathname.startsWith(path);

    return `flex items-center space-x-3 py-3 px-4 rounded-lg transition-colors ${
      isActive
        ? "bg-amber-700 text-white shadow-md"
        : "text-gray-800 hover:bg-amber-600 hover:text-white"
    }`;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50">
      {/* Top Header Bar */}
      <div className="fixed top-0 left-0 right-0 h-12 sm:h-16 bg-gradient-to-r from-yellow-500 to-amber-600 border-b border-yellow-400 z-50 flex items-center justify-between px-2 sm:px-4 shadow-lg">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-800 hover:bg-yellow-600 p-1.5 sm:p-2 rounded-lg transition-colors"
          >
            {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <h1 className="text-sm sm:text-xl font-bold text-gray-800">Reseller Panel</h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="text-xs sm:text-sm text-gray-700 truncate max-w-[100px] sm:max-w-xs">
            {resellerEmail}
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1.5 px-2.5 sm:py-2 sm:px-4 text-xs sm:text-sm rounded-lg transition duration-300"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden mt-12 sm:mt-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed lg:fixed left-0 top-12 sm:top-16 z-40 w-56 sm:w-64 bg-gradient-to-b from-yellow-500 to-amber-600 text-gray-800 p-3 sm:p-4 flex flex-col transition-transform duration-300 ease-in-out overflow-y-auto shadow-xl`}
        style={{ height: "calc(100vh - 3rem)" }}
      >
        <div className="mb-4 sm:mb-8">
          <p className="text-xs sm:text-sm text-gray-700 font-semibold">Menu Navigation</p>
        </div>
        <nav className="grow">
          <ul>
            <li>
              <Link
                href="/reseller"
                className={getNavLinkClass("/reseller")}
                onClick={() => setSidebarOpen(false)}
              >
                <DashboardIcon />
                <span className="text-sm sm:text-base">Dashboard</span>
              </Link>
            </li>
            <li className="mt-2">
              <Link
                href="/reseller/products"
                className={getNavLinkClass("/reseller/products")}
                onClick={() => setSidebarOpen(false)}
              >
                <ProductIcon />
                <span className="text-sm sm:text-base">Produk Saya</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 p-2 sm:p-4 lg:p-8 transition-all duration-300 mt-12 sm:mt-16 ${
          sidebarOpen ? "ml-56 sm:ml-64" : "ml-0"
        }`}
      >
        {children ? (
          children
        ) : (
          <>
            {/* Manual Routing based on pathname */}
            {pathname === "/reseller" && <ResellerDashboardPage />}
            {pathname === "/reseller/products" && <ResellerProductsPage />}
            {pathname === "/reseller/products/new" && <ResellerProductFormPage />}
            {pathname.startsWith("/reseller/products/") &&
              pathname.includes("/edit/") && <ResellerProductFormPage />}
          </>
        )}
      </main>
    </div>
  );
};

export default ResellerLayout;