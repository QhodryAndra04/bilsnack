"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL, API_ENDPOINTS } from "../config/api";
import { showError } from "../utils/swal";

const ResellerDashboardPage = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalEarnings: 0,
    totalSold: 0,
  });
  const [soldProducts, setSoldProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  useEffect(() => {
    // Dummy data untuk tampilan
    setStats({
      totalProducts: 0,
      activeProducts: 0,
      totalEarnings: 0,
      totalSold: 0,
    });
  }, []);

  const { token, user } = useAuth();
  const [resellers, setResellers] = useState([]);
  const [connections, setConnections] = useState(new Set());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // fetch other resellers and existing connections (only for reseller role)
    const fetchResellers = async () => {
      try {
        const r1 = await fetch(`${API_BASE_URL}/api/resellers?excludeSelf=1`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (r1.ok) {
          const data = await r1.json();
          setResellers(data || []);
        }
        const r2 = await fetch(`${API_BASE_URL}/api/resellers/connections`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (r2.ok) {
          const d2 = await r2.json();
          setConnections(new Set(d2.connections || []));
        }
      } catch (e) {}
    };
    if (token && user && user.role === "reseller") fetchResellers();
  }, [token, user]);

  // fetch reseller metrics (counts) to populate dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.PRODUCTS.RESELLER.MY_PRODUCTS, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        const totalProducts = data.length;
        const activeProducts = data.filter(
          (p) => p.is_approved === 1 || p.is_approved === true
        ).length;
        const pending = data.filter(
          (p) => !p.is_approved || p.is_approved === 0
        ).length;

        // Fetch sales statistics from the new endpoint
        const statsRes = await fetch(`${API_BASE_URL}/api/resellers/stats`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        let totalSold = 0;
        let totalEarnings = 0;

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          totalSold = statsData.totalSold || 0;
          totalEarnings = statsData.totalEarnings || 0;
        }

        // Fetch sold products details
        const soldRes = await fetch(
          `${API_BASE_URL}/api/resellers/sold-products`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (soldRes.ok) {
          const soldData = await soldRes.json();
          setSoldProducts(soldData || []);
        }

        // Fetch recent transactions
        const transactionsRes = await fetch(
          `${API_BASE_URL}/api/resellers/transactions`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json();
          // Transform transactions for display
          const transformedTransactions = transactionsData
            .slice(0, 10)
            .map((t) => {
              // Calculate total amount from order_items
              const totalAmount =
                t.order_items?.reduce((sum, item) => {
                  return sum + item.quantity * (item.products?.price || 0);
                }, 0) || 0;

              return {
                id: t.id || `TXN-${Math.random().toString(36).substr(2, 9)}`,
                orderId:
                  t.order_number ||
                  t.id ||
                  `ORD-${Math.random().toString(36).substr(2, 9)}`,
                customer:
                  t.users?.first_name && t.users?.last_name
                    ? `${t.users.first_name} ${t.users.last_name}`
                    : t.users?.email || "Unknown",
                amount: totalAmount,
                paymentMethod: t.payment_method || "Unknown",
                status:
                  t.status === "completed"
                    ? "Selesai"
                    : t.status === "pending"
                    ? "Menunggu"
                    : t.status === "failed"
                    ? "Gagal"
                    : t.status || "Unknown",
                date: t.created_at
                  ? new Date(t.created_at).toLocaleDateString("id-ID")
                  : "Unknown",
              };
            });
          setTransactions(transformedTransactions);
        }

        setStats({ totalProducts, activeProducts, totalSold, totalEarnings });
        setPendingCount(pending);
      } catch (e) {}
    };
    if (token && user && user.role === "reseller") fetchStats();
  }, [token, user]);

  const toggleConnect = async (targetId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/resellers/${targetId}/connect`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) throw new Error("Request failed");
      const j = await res.json();
      setConnections((prev) => {
        const next = new Set(prev);
        if (j.connected) next.add(Number(targetId));
        else next.delete(Number(targetId));
        return next;
      });
    } catch (e) {
      showError(
        "Error",
        "Gagal menghubungkan reseller. Coba lagi."
      );
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div>
      <div className="mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Dashboard Reseller</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
          Selamat datang di panel reseller Bilsnack
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6 mb-4 sm:mb-8">
        {/* Total Products */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div>
            <p className="text-gray-600 text-[10px] sm:text-sm font-medium">Total Produk</p>
            <p className="text-xl sm:text-3xl font-bold text-blue-600 mt-1 sm:mt-2">
              {stats.totalProducts}
            </p>
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div>
            <p className="text-gray-600 text-[10px] sm:text-sm font-medium">Produk Aktif</p>
            <p className="text-xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">
              {stats.activeProducts}
            </p>
          </div>
        </div>

        {/* Total Sold */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div>
            <p className="text-gray-600 text-[10px] sm:text-sm font-medium">Terjual</p>
            <p className="text-xl sm:text-3xl font-bold text-orange-600 mt-1 sm:mt-2">
              {stats.totalSold}
            </p>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div>
            <p className="text-gray-600 text-[10px] sm:text-sm font-medium">
              Penghasilan
            </p>
            <p className="text-sm sm:text-2xl font-bold text-purple-600 mt-1 sm:mt-2 break-all">
              {formatPrice(stats.totalEarnings)}
            </p>
          </div>
        </div>
      </div>

      {/* Transaksi Terbaru */}
      <div className="mt-6 sm:mt-12">
        <h2 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4 text-yellow-600">
          Transaksi Terbaru
        </h2>
        {(() => {
          // Pagination logic
          const totalItems = transactions.length;
          const totalPages = Math.ceil(totalItems / itemsPerPage);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const paginatedTransactions = transactions.slice(
            startIndex,
            startIndex + itemsPerPage
          );

          return (
            <>
              <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left table-auto min-w-[600px]">
                  <thead>
                    <tr className="bg-yellow-500 text-white">
                      <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">
                        ID
                      </th>
                      <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">
                        Pesanan
                      </th>
                      <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">
                        Pelanggan
                      </th>
                      <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">Jumlah</th>
                      <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">
                        Metode
                      </th>
                      <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">Status</th>
                      <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-gray-50 text-gray-700"
                      >
                        <td className="p-2 sm:p-4 text-xs sm:text-sm">{transaction.id}</td>
                        <td className="p-2 sm:p-4 text-xs sm:text-sm">{transaction.orderId}</td>
                        <td className="p-2 sm:p-4 text-xs sm:text-sm">{transaction.customer}</td>
                        <td className="p-2 sm:p-4">
                          <span className="font-semibold text-yellow-600 text-xs sm:text-sm">
                            {formatPrice(transaction.amount)}
                          </span>
                        </td>
                        <td className="p-2 sm:p-4 text-xs sm:text-sm">{transaction.paymentMethod}</td>
                        <td className="p-2 sm:p-4">
                          <span
                            className={`inline-flex px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full ${getStatusColor(
                              transaction.status
                            )}`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                        <td className="p-2 sm:p-4 text-xs sm:text-sm">{transaction.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination for Dashboard */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-white border-t border-gray-200 gap-2">
                    <div className="text-xs sm:text-sm text-gray-700">
                      {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems}
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Prev
                      </button>
                      <span className="text-xs sm:text-sm text-gray-700">
                        {currentPage}/{totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>

      {/* Connect with other resellers (only visible to reseller role) */}
      {user && user.role === "reseller" ? (
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mt-4 sm:mt-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-4">
            Terhubung dengan Reseller
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            Temukan reseller lain dan bangun jaringan.
          </p>
          {resellers.length === 0 ? (
            <p className="text-gray-500 text-sm">Tidak ada reseller lain ditemukan.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:gap-4">
              {resellers.map((r) => (
                <div
                  key={r.id}
                  className="border rounded-lg p-2 sm:p-4 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-xs sm:text-base truncate">
                      {r.store_name ||
                        `${r.first_name || ""} ${r.last_name || ""}`.trim() ||
                        r.username ||
                        r.email}
                    </p>
                    <p className="text-[10px] sm:text-sm text-gray-500 truncate">{r.email}</p>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <button
                      onClick={() => toggleConnect(r.id)}
                      className={`py-1.5 px-2 sm:py-2 sm:px-4 rounded-lg font-semibold text-xs sm:text-sm ${
                        connections.has(r.id)
                          ? "bg-green-600 text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {connections.has(r.id) ? "Terhubung" : "Hubungkan"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mt-4 sm:mt-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
            Koneksi Reseller
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Fitur koneksi hanya tersedia untuk akun dengan peran{" "}
            <strong>reseller</strong>.
          </p>
        </div>
      )}
    </div>
  );
};

export default ResellerDashboardPage;
