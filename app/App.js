import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ProductProvider } from "./contexts/ProductContext";

import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./HomePage";
import ShopPage from "./ShopPage";
import ProductDetailPage from "./ProductDetailPage";
import CartPage from "./CartPage";
import CheckoutPage from "./CheckoutPage";
import OrderConfirmationPage from "./OrderConfirmationPage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import ProfilePage from "./ProfilePage";
import OrderHistoryPage from "./OrderHistoryPage";

// Admin components
import AdminLayout from "./components/admin/AdminLayout";
import AdminLoginPage from "./admin/AdminLoginPage";
import AdminDashboardPage from "./admin/AdminDashboardPage";
import AdminProductsPage from "./admin/AdminProductsPage";
import AdminProductFormPage from "./admin/AdminProductFormPage";
import AdminTransactionsPage from "./admin/AdminTransactionsPage";

// Reseller components
import ResellerLoginPage from "./ResellerLoginPage";
import ResellerLayout from "./components/reseller/ResellerLayout";

// Public-only shell
const PublicShell = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const isBackoffice =
      location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/reseller") ||
      location.pathname.startsWith("/perloginan");
    if (isBackoffice) {
      document.documentElement.classList.remove("dark");
      return;
    }
    try {
      const pref = localStorage.getItem("theme");
      if (pref === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch {
      /* ignore */
    }
  }, [location]);

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="pointer-events-none absolute inset-0 mask-[radial-gradient(circle_at_center,white,transparent)] bg-[linear-gradient(120deg,rgba(255,183,3,0.15),transparent_35%,rgba(255,183,3,0.15))] opacity-40 dark:opacity-30"></div>

      <Header />

      {/* PERUBAHAN ADA DI SINI: tambahkan 'pt-20' (padding top 80px) */}
      <main className={`grow pt-20 ${isHomePage ? "" : "pb-12"}`}>
        <div
          className={
            isHomePage ? "w-full relative" : "container-custom relative"
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route
              path="/order-confirmation"
              element={<OrderConfirmationPage />}
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/orders" element={<OrderHistoryPage />} />
          </Routes>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ProductProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Admin Routes - tanpa Header dan Footer */}
              <Route path="/perloginan" element={<AdminLoginPage />} />
              <Route path="/admin/*" element={<AdminLayout />} />

              {/* Reseller Routes - tanpa Header dan Footer */}
              <Route path="/reseller/login" element={<ResellerLoginPage />} />
              <Route path="/reseller/*" element={<ResellerLayout />} />

              {/* Public Routes - dengan Header dan Footer */}
              <Route path="*" element={<PublicShell />} />
            </Routes>
          </Router>
        </CartProvider>
      </ProductProvider>
    </AuthProvider>
  );
};

export default App;
