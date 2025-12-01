"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showSuccess, showError, showDeleteConfirm } from "../utils/swal";
import { InlineLoading } from "../components/PageLoading";

const AdminResellersPage = () => {
  const router = useRouter();
  const [resellers, setResellers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Admin UI may store a separate admin token after admin login flow
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  // prefer adminToken for admin API calls, but fall back to normal user token (if any)
  const token = adminToken; // Since this is admin page, use adminToken

  useEffect(() => {
    loadResellers();
  }, [token, router]);

  const loadResellers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/resellers', {
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
        let msg = res.statusText || 'Failed to load resellers';
        try { const err = await res.json(); if (err && err.error) msg = err.error; } catch { /* ignore */ }
        throw new Error(msg);
      }

      const data = await res.json();
      // Transform the data to match the expected format
      const transformedData = data.map(reseller => {
        // Extract store name from reseller_profiles
        const rp = reseller.reseller_profiles;
        let storeNameRaw = null;
        if (Array.isArray(rp)) storeNameRaw = rp[0]?.store_name;
        else if (rp && typeof rp === 'object') storeNameRaw = rp.store_name;
        const storeName = storeNameRaw && typeof storeNameRaw === 'string' ? storeNameRaw.trim() : null;

        return {
          id: reseller.id,
          name: reseller.first_name && reseller.last_name 
            ? `${reseller.first_name} ${reseller.last_name}` 
            : reseller.username || reseller.email.split('@')[0],
          storeName: storeName || `${reseller.first_name || reseller.username || 'Reseller'}'s Store`,
          email: reseller.email,
          phone: reseller.phone || '-',
          address: [reseller.address, reseller.city, reseller.province, reseller.postal_code]
            .filter(Boolean)
            .join(', ') || '-',
          status: reseller.is_active ? 'active' : 'inactive',
          totalProducts: reseller.totalProducts || 0,
          totalSales: reseller.totalSales || 0,
          role: reseller.role,
        };
      });
      setResellers(transformedData);
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Filter resellers based on search and status
  const filteredResellers = resellers.filter((reseller) => {
    const matchesSearch =
      (reseller.name &&
        reseller.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reseller.email &&
        reseller.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reseller.storeName &&
        reseller.storeName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      filterStatus === "all" || reseller.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalItems = filteredResellers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResellers = filteredResellers.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const handleDelete = async (id, name) => {
    const result = await showDeleteConfirm(`Reseller "${name}"`);
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          showError('Error', 'Token tidak ditemukan. Silakan login kembali.');
          return;
        }

        const response = await fetch(`/api/admin/resellers?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete reseller');
        }

        // Remove from local state
        setResellers((prev) => prev.filter((r) => r.id !== id));
        showSuccess("Berhasil", "Reseller berhasil dihapus!");
      } catch (error) {
        showError('Error', error.message);
      }
    }
  };

  const toggleStatus = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        showError('Error', 'Token tidak ditemukan. Silakan login kembali.');
        return;
      }

      // Find current reseller to get current status
      const currentReseller = resellers.find(r => r.id === id);
      if (!currentReseller) return;

      const newStatus = currentReseller.status === "active" ? false : true;

      const response = await fetch('/api/admin/resellers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, is_active: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update reseller status');
      }

      // Update local state
      setResellers((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: newStatus ? "active" : "inactive" }
            : r
        )
      );
      showSuccess("Berhasil", "Status reseller berhasil diubah!");
    } catch (error) {
      showError('Error', error.message);
    }
  };

  if (loading) {
    return <InlineLoading text="Memuat data reseller..." variant="dots" size="md" />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Kelola Reseller</h1>
          <Link
            href="/admin/resellers/new"
            className="bg-green-500 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-md text-sm sm:text-base font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors flex items-center gap-1 sm:gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="hidden sm:inline">Tambah Reseller</span>
            <span className="sm:hidden">Tambah</span>
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <input
            type="text"
            placeholder="Cari reseller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 bg-white"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 bg-white"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
          <div className="text-xs sm:text-sm text-gray-600 flex items-center sm:justify-end">
            Total: <span className="font-bold ml-1 text-gray-900">{filteredResellers.length}</span>
          </div>
        </div>
      </div>

      {/* Resellers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto border border-gray-100">
        {filteredResellers.length === 0 ? (
          <div className="p-4 sm:p-8 text-center">
            <p className="text-gray-500 text-sm sm:text-lg">Tidak ada reseller ditemukan</p>
          </div>
        ) : (
          <table className="w-full text-left table-auto min-w-[600px]">
            <thead>
              <tr className="bg-yellow-500 text-white">
                <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">Toko</th>
                <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">Email</th>
                <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">Telepon</th>
                <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">Produk</th>
                <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">Sales</th>
                <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">Status</th>
                <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-white">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResellers.map((reseller) => (
                <tr key={reseller.id} className="hover:bg-gray-50">
                  <td className="p-2 sm:p-4">
                    <div>
                      <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                        {reseller.storeName || reseller.name}
                      </p>
                    </div>
                  </td>
                  <td className="p-2 sm:p-4">
                    <a
                      href={`mailto:${reseller.email}`}
                      className="text-blue-600 hover:underline text-xs sm:text-sm"
                    >
                      {reseller.email}
                    </a>
                  </td>
                  <td className="p-2 sm:p-4 text-gray-600 text-xs sm:text-sm">{reseller.phone}</td>
                  <td className="p-2 sm:p-4">
                    <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-semibold">
                      {reseller.totalProducts}
                    </span>
                  </td>
                  <td className="p-2 sm:p-4">
                    <span className="bg-green-100 text-green-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-semibold">
                      {reseller.totalSales}
                    </span>
                  </td>
                  <td className="p-2 sm:p-4">
                    <button
                      onClick={() => toggleStatus(reseller.id)}
                      className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-semibold transition-colors ${
                        reseller.status === "active"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      }`}
                    >
                      {reseller.status === "active" ? "Aktif" : "Off"}
                    </button>
                  </td>
                  <td className="p-2 sm:p-4">
                    <div className="flex gap-1 sm:gap-2 flex-col">
                      <Link
                        href={`/admin/resellers/edit/${reseller.id}`}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit
                      </Link>
                      <button
                        onClick={() =>
                          handleDelete(
                            reseller.id,
                            reseller.storeName || reseller.name
                          )
                        }
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-white border-t border-gray-200 mt-2 sm:mt-4 rounded-lg shadow-md gap-2">
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
  );
};

export default AdminResellersPage;