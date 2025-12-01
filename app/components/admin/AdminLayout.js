"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AdminDashboardPage from "../../admin/AdminDashboardPage";
import AdminProductsPage from "../../admin/AdminProductsPage";
import AdminProductFormPage from "../../admin/AdminProductFormPage";
import AdminTransactionsPage from "../../admin/AdminTransactionsPage";
import AdminResellersPage from "../../admin/AdminResellersPage";
import AdminResellerFormPage from "../../admin/AdminResellerFormPage";

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

const TransactionIcon = () => (
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
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
  </svg>
);

const ResellerIcon = () => (
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
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
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

const AdminLayout = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check if admin is logged in
    const adminAuth = localStorage.getItem("adminAuth");
    if (adminAuth) {
      try {
        const auth = JSON.parse(adminAuth);
        if (auth.isLoggedIn) {
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
      } catch (e) {
      }
    }
    // Redirect to admin login if not authenticated
    setLoading(false);
    router.push("/perloginan");
  }, [router]);

  // Force light mode inside admin area regardless of stored preference
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    router.push("/perloginan");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  // Helper function to determine if a link is active based on pathname
  const getNavLinkClass = (path) => {
    const isActive =
      path === "/admin" ? pathname === "/admin" : pathname.startsWith(path);

    return `flex items-center space-x-3 py-3 px-4 rounded-lg transition-colors ${
      isActive
        ? "bg-amber-700 text-white shadow-md"
        : "text-gray-800 hover:bg-amber-600 hover:text-white"
    }`;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50">
      {/* Top Header Bar - Always visible */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-yellow-500 to-amber-600 border-b border-yellow-400 z-50 flex items-center justify-between px-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-800 hover:bg-yellow-600 p-2 rounded-lg transition-colors"
          >
            {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-700">Logged in as Admin</div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Overlay for Mobile - Hide on Desktop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden mt-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Collapsible on ALL screen sizes */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed lg:fixed left-0 top-16 z-40 w-64 h-screen-minus-16 bg-gradient-to-b from-yellow-500 to-amber-600 text-gray-800 p-4 flex flex-col transition-transform duration-300 ease-in-out overflow-y-auto shadow-xl`}
        style={{ height: "calc(100vh - 4rem)" }}
      >
        {/* Sidebar Header - Removed to avoid duplication with top header */}
        <div className="mb-8">
          <p className="text-sm text-gray-700 font-semibold">Menu Navigation</p>
        </div>
        <nav className="grow">
          <ul>
            <li>
              <Link
                href="/admin"
                className={getNavLinkClass("/admin")}
                onClick={() => setSidebarOpen(false)}
              >
                <DashboardIcon />
                <span>Dashboard</span>
              </Link>
            </li>
            <li className="mt-2">
              <Link
                href="/admin/products"
                className={getNavLinkClass("/admin/products")}
                onClick={() => setSidebarOpen(false)}
              >
                <ProductIcon />
                <span>Products</span>
              </Link>
            </li>
            <li className="mt-2">
              <Link
                href="/admin/transactions"
                className={getNavLinkClass("/admin/transactions")}
                onClick={() => setSidebarOpen(false)}
              >
                <TransactionIcon />
                <span>Transactions</span>
              </Link>
            </li>
            <li className="mt-2">
              <Link
                href="/admin/resellers"
                className={getNavLinkClass("/admin/resellers")}
                onClick={() => setSidebarOpen(false)}
              >
                <ResellerIcon />
                <span>Reseller</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 p-4 lg:p-8 transition-all duration-300 mt-16 ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* Manual Routing based on pathname, replacing <Outlet /> */}
        {pathname === "/admin" && <AdminDashboardPage />}
        {pathname === "/admin/products" && <AdminProductsPage />}
        {pathname === "/admin/products/new" && <AdminProductFormPage />}
        {pathname.startsWith("/admin/products/") &&
          pathname.includes("/edit/") && <AdminProductFormPage />}
        {pathname === "/admin/transactions" && <AdminTransactionsPage />}
        {pathname === "/admin/resellers" && <AdminResellersPage />}
        {pathname === "/admin/resellers/new" && <AdminResellerFormPage />}
        {pathname.startsWith("/admin/resellers/") &&
          pathname.includes("/edit/") && <AdminResellerFormPage />}
      </main>
    </div>
  );
};

export default AdminLayout;
