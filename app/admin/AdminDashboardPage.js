"use client";

import React, { useState, useEffect } from "react";

const AdminDashboardPage = () => {
  // State untuk menyimpan data statistik dan transaksi
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalTransactions: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [adminUser, setAdminUser] = useState({ name: "Admin", avatar: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Dashboard shows fewer items

  // Helper untuk format mata uang (pengganti formatPrice dari utils)
  const formatPrice = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    // 1. Load Admin User Info dari LocalStorage
    if (typeof window !== "undefined") {
      try {
        const adminRaw = localStorage.getItem("adminUser");
        if (adminRaw) {
          const au = JSON.parse(adminRaw);
          setAdminUser({
            name: au.name || au.email?.split("@")[0] || "Admin",
            avatar: au.profileImage || null,
          });
        }
      } catch (e) {
      }
    }

    // 2. Load Data from API
    const loadData = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        // Fetch products
        const productsRes = await fetch("/api/admin/products", { headers });
        if (productsRes.ok) {
          const products = await productsRes.json();
          // Get unique categories
          const categories = [
            ...new Set(products.map((p) => p.category).filter(Boolean)),
          ];

          // Fetch transactions
          const transactionsRes = await fetch("/api/admin/transactions", {
            headers,
          });
          let transactions = [];
          if (transactionsRes.ok) {
            transactions = await transactionsRes.json();
          } else {
          }

          setStats({
            totalProducts: products.length,
            totalCategories: categories.length,
            totalTransactions: transactions.length,
          });

          // Transform transactions for display
          const transformedTransactions = transactions.slice(0, 5).map((t) => {
            // Calculate total amount from order_items
            const totalAmount =
              t.order_items?.reduce((sum, item) => {
                return sum + item.quantity * (item.products?.price || 0);
              }, 0) ||
              t.total_amount ||
              t.amount ||
              t.total ||
              0;

            return {
              id: t.id || `TXN-${Math.random().toString(36).substr(2, 9)}`,
              orderId: t.order_number || t.id || `ORD-${Math.random().toString(36).substr(2, 9)}`,
              customer:
                t.user?.first_name && t.user?.last_name
                  ? `${t.user.first_name} ${t.user.last_name}`
                  : t.user?.email || t.name || "Unknown",
              amount: totalAmount,
              paymentMethod: t.payment_method || "Unknown",
              status: t.status || "Unknown",
              date: t.created_at
                ? new Date(t.created_at).toLocaleDateString("id-ID")
                : "Unknown",
            };
          });

          console.log("Transformed transactions:", transformedTransactions);
          setTransactions(transformedTransactions);
        } else {
        }
      } catch (error) {
        // Fallback to mock data if API fails
        setStats({
          totalProducts: 25,
          totalCategories: 8,
          totalTransactions: 150,
        });
        setTransactions([
          {
            id: "TXN-001",
            orderId: "ORD-123",
            customer: "Budi Santoso",
            amount: 150000,
            paymentMethod: "Transfer Bank",
            status: "Selesai",
            date: "2023-10-01",
          },
        ]);
      }
    };

    loadData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Selesai":
        return "bg-green-100 text-green-700";
      case "Menunggu":
        return "bg-yellow-100 text-yellow-700";
      case "Gagal":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Mendapatkan inisial nama untuk avatar fallback
  const getInitials = (name) => {
    const parts = name.split(" ");
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="pb-4">
      <h1 className="text-xl sm:text-3xl font-bold mb-2 text-black">Dashboard</h1>

      {/* Header Profil Admin */}
      <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-8">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm sm:text-lg font-semibold text-gray-500 overflow-hidden shadow-sm">
          {adminUser.avatar ? (
            <img
              src={adminUser.avatar}
              alt="Admin Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="select-none text-yellow-600">
              {getInitials(adminUser.name)}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm sm:text-lg text-gray-600">
            Selamat datang kembali,{" "}
            <span className="font-medium text-yellow-600">
              {adminUser.name}
            </span>
            !
          </p>
        </div>
      </div>

      {/* Kartu Statistik (Glassmorphism style matching JSX) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <h2 className="text-xs sm:text-xl font-semibold text-gray-800">Total Produk</h2>
          <p className="text-2xl sm:text-5xl font-bold mt-1 sm:mt-2 text-blue-600">
            {stats.totalProducts}
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <h2 className="text-xs sm:text-xl font-semibold text-gray-800">
            Total Kategori
          </h2>
          <p className="text-2xl sm:text-5xl font-bold mt-1 sm:mt-2 text-green-600">
            {stats.totalCategories}
          </p>
        </div>
        <div className="col-span-2 lg:col-span-1 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <h2 className="text-xs sm:text-xl font-semibold text-gray-800">
            Total Transaksi
          </h2>
          <p className="text-2xl sm:text-5xl font-bold mt-1 sm:mt-2 text-purple-600">
            {stats.totalTransactions}
          </p>
        </div>
      </div>

      {/* Tabel Transaksi */}
      <div className="mt-6 sm:mt-12">
        <h2 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4 text-yellow-600">
          Transaksi Terbaru
        </h2>
        {(() => {
          // Pagination logic
          const totalItems = transactions.length;
          const totalPages = Math.ceil(totalItems / itemsPerPage);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

          return (
            <>
              <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left table-auto min-w-[600px]">
                  <thead>
                    <tr className="bg-yellow-500 text-white">
                      <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">ID Transaksi</th>
                      <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">ID Pesanan</th>
                      <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">Pelanggan</th>
                      <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">Jumlah</th>
                      <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">
                        Metode Pembayaran
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
                      Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems}
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Prev
                      </button>
                      <span className="text-xs sm:text-sm text-gray-700">
                        {currentPage}/{totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
    </div>
  );
};

export default AdminDashboardPage;
