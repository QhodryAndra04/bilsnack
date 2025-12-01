"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import formatPrice from "../utils/format";
import { showSuccess, showError } from "../utils/swal";
import { InlineLoading } from "../components/PageLoading";
import Swal from "sweetalert2";

const AdminTransactionsPage = () => {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [sourceTable, setSourceTable] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingProvider, setTrackingProvider] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingHistoryText, setTrackingHistoryText] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Admin UI may store a separate admin token after admin login flow
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  // prefer adminToken for admin API calls, but fall back to normal user token (if any)
  const token = adminToken; // Since this is admin page, use adminToken

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/transactions', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          // If token is invalid or expired, redirect to admin login
          if (res.status === 401) {
            try { localStorage.removeItem('adminToken'); } catch { /* ignore */ }
            try { localStorage.removeItem('adminAuth'); } catch { /* ignore */ }
            router.push('/perloginan');
            return;
          }
          // try to surface JSON error body, or fallback to status text
          let msg = res.statusText || 'Failed to load transactions';
          try { const err = await res.json(); if (err && err.error) msg = err.error; } catch { /* ignore */ }
          throw new Error(msg);
        }

        // Defensive: ensure the response is JSON. Some dev setups accidentally
        // return index.html (text/html) which causes "Unexpected token '<'".
        const ctype = (res.headers.get('content-type') || '').toLowerCase();
        if (!ctype.includes('application/json')) {
          const text = await res.text();
          // show a short snippet to help debugging
          const snippet = text && text.length > 500 ? text.slice(0, 500) + '... (truncated)' : text;
          throw new Error('Expected JSON response from /api/admin/transactions — received: ' + (ctype || 'unknown') + '\n' + snippet);
        }

        const data = await res.json();
        // admin route returns array directly
        if (data && Array.isArray(data)) {
          setTransactions(data);
          setSourceTable('orders'); // Assuming from orders table
          setRawResponse(data);
        } else {
          setTransactions([]);
          setSourceTable(null);
          setRawResponse(data || null);
        }
      } catch (err) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [token, router]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Selesai":
        return "text-green-600 bg-green-100";
      case "Menunggu":
        return "text-yellow-600 bg-yellow-100";
      case "Gagal":
        return "text-red-600 bg-red-100";
      case "Dikirim":
        return "text-blue-600 bg-blue-100";
      case "Dalam Pengiriman":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const statusMatch =
      filterStatus === "All" || String(transaction.status) === filterStatus;
    const paymentField =
      transaction.payment_method || transaction.paymentMethod || "";
    const paymentMatch =
      filterPaymentMethod === "All" ||
      String(paymentField) === filterPaymentMethod;
    return statusMatch && paymentMatch;
  });

  // Pagination
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterPaymentMethod]);

  const totalAmount = filteredTransactions.reduce((sum, transaction) => {
    // Calculate total from order_items if available, otherwise use direct fields
    const totalAmount =
      transaction.order_items?.reduce((itemSum, item) => {
        return itemSum + item.quantity * (item.products?.price || item.unit_price || 0);
      }, 0) ||
      Number(transaction.total_amount) ||
      Number(transaction.amount) ||
      Number(transaction.total) ||
      Number(transaction.order_total) ||
      0;
    return sum + (Number.isFinite(totalAmount) ? totalAmount : 0);
  }, 0);

  // -- Tracking Handlers --
  const openTrackingModal = (order) => {
    setSelectedOrder(order);
    // Reset or prefill
    setTrackingProvider("");
    setTrackingNumber("");
    setTrackingHistoryText("");
    setShowModal(true);
  };

  const submitTracking = async () => {
    if (!selectedOrder) return;

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        showError('Error', 'Token tidak ditemukan. Silakan login kembali.');
        return;
      }

      const response = await fetch(`/api/orders/${selectedOrder.id}/tracking`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tracking_number: trackingNumber,
          tracking_provider: trackingProvider,
          tracking_history: trackingHistoryText ? JSON.parse(trackingHistoryText) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update tracking');
      }

      const updatedOrder = await response.json();
      showSuccess("Berhasil", "Tracking berhasil diperbarui!");
      setShowModal(false);
      // Refresh data
      loadTransactions();
    } catch (error) {
      showError('Error', error.message);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        showError('Error', 'Token tidak ditemukan. Silakan login kembali.');
        return;
      }

      const response = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      // Optimistic update
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      );
      showSuccess("Berhasil", `Status transaksi #${id} berhasil diubah menjadi ${newStatus}`);
    } catch (error) {
      showError('Error', error.message);
    }
  };

  if (loading) {
    return <InlineLoading text="Memuat data transaksi..." variant="dots" size="md" />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Transaksi</h1>
        <p className="text-sm sm:text-lg text-gray-600">
          Kelola dan pantau semua transaksi
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm">
          Error: {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-6">
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <h3 className="text-[10px] sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Total
          </h3>
          <p className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2 text-blue-600">
            {transactions.length}
          </p>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <h3 className="text-[10px] sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Selesai
          </h3>
          <p className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2 text-green-600">
            {transactions.filter((t) => t.status === "Selesai").length}
          </p>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <h3 className="text-[10px] sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Menunggu
          </h3>
          <p className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2 text-yellow-600">
            {transactions.filter((t) => t.status === "Menunggu").length}
          </p>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <h3 className="text-[10px] sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Dikirim
          </h3>
          <p className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2 text-blue-500">
            {transactions.filter((t) => t.status === "Dikirim").length}
          </p>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <h3 className="text-[10px] sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Pengiriman
          </h3>
          <p className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2 text-orange-600">
            {transactions.filter((t) => t.status === "Dalam Pengiriman").length}
          </p>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <h3 className="text-[10px] sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Pendapatan
          </h3>
          <p className="text-sm sm:text-xl font-bold mt-1 sm:mt-2 text-purple-600 break-all">
            {formatPrice(
              transactions
                .filter((t) => t.status === "Selesai")
                .reduce((sum, t) => {
                  // Calculate total from order_items if available, otherwise use direct fields
                  const totalAmount =
                    t.order_items?.reduce((itemSum, item) => {
                      return itemSum + item.quantity * (item.products?.price || item.unit_price || 0);
                    }, 0) ||
                    Number(t.total_amount) ||
                    Number(t.amount) ||
                    Number(t.total) ||
                    Number(t.order_total) ||
                    0;
                  return sum + totalAmount;
                }, 0)
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-700 bg-white"
            >
              <option value="All">Semua Status</option>
              <option value="Selesai">Selesai</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Gagal">Gagal</option>
              <option value="Dikirim">Dikirim</option>
              <option value="Dalam Pengiriman">Dalam Pengiriman</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Metode
            </label>
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-700 bg-white"
            >
              <option value="All">Semua Metode</option>
              <option value="QRIS">QRIS</option>
              <option value="Transfer Bank">Transfer Bank</option>
              <option value="COD">COD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
        <div className="px-3 sm:px-6 py-2 sm:py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="text-sm sm:text-lg font-semibold text-gray-800">
              Daftar Transaksi
            </h2>
            <span className="text-xs sm:text-sm text-gray-500">
              {filteredTransactions.length} item
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto min-w-[700px]">
            <thead>
              <tr className="bg-yellow-500 text-white">
                <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold whitespace-nowrap">ID</th>
                <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold whitespace-nowrap">Pesanan</th>
                <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold whitespace-nowrap">Pelanggan</th>
                <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold whitespace-nowrap">Role</th>
                <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold whitespace-nowrap">Jumlah</th>
                <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold whitespace-nowrap">Metode</th>
                <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold whitespace-nowrap">Status</th>
                <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold whitespace-nowrap">Tanggal</th>
                <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600">
                      {t.id}
                    </td>
                    <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600">
                      {t.order_number || t.orderId || "-"}
                    </td>
                    <td className="p-2 sm:p-4">
                      <div className="font-medium text-gray-900 text-xs sm:text-sm">
                        {t.users ? `${t.users.first_name || ''} ${t.users.last_name || ''}`.trim() : t.name || "-"}
                      </div>
                    </td>
                    <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 capitalize">
                      {t.users?.role || "Customer"}
                    </td>
                    <td className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-yellow-600">
                      {(() => {
                        // Calculate total from order_items if available, otherwise use direct fields
                        const totalAmount =
                          t.order_items?.reduce((itemSum, item) => {
                            return itemSum + item.quantity * (item.products?.price || item.unit_price || 0);
                          }, 0) ||
                          Number(t.total_amount) ||
                          Number(t.amount) ||
                          Number(t.total) ||
                          Number(t.order_total) ||
                          0;
                        return formatPrice(totalAmount);
                      })()}
                    </td>
                    <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600">
                      {t.payment_method || t.paymentMethod}
                    </td>
                    <td className="p-2 sm:p-4">
                      <select
                        value={t.status}
                        onChange={(e) => updateStatus(t.id, e.target.value)}
                        className={`text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border-0 cursor-pointer outline-none ${getStatusColor(
                          t.status
                        )}`}
                      >
                        <option value="Menunggu">Menunggu</option>
                        <option value="Selesai">Selesai</option>
                        <option value="Gagal">Gagal</option>
                        <option value="Dikirim">Dikirim</option>
                      </select>
                    </td>
                    <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                      {t.date || t.created_at || "-"}
                    </td>
                    <td className="p-2 sm:p-4">
                      <button
                        onClick={() => openTrackingModal(t)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <svg
                          className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="hidden sm:inline">Tracking</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-4 sm:p-8 text-center text-gray-500 text-sm">
                    Tidak ada transaksi yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-white border-t border-gray-200 gap-2">
            <div className="text-xs sm:text-sm text-gray-700">
              {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems}
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

      {/* Tracking Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
              Tracking Order #{selectedOrder.id}
            </h3>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Ekspedisi
                </label>
                <input
                  type="text"
                  value={trackingProvider}
                  onChange={(e) => setTrackingProvider(e.target.value)}
                  placeholder="JNE, J&T, dll"
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Nomor Resi
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Masukkan nomor resi"
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  History (JSON)
                </label>
                <textarea
                  rows={2}
                  value={trackingHistoryText}
                  onChange={(e) => setTrackingHistoryText(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none text-xs font-mono"
                  placeholder='[{"status": "shipped"}]'
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={submitTracking}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactionsPage;
