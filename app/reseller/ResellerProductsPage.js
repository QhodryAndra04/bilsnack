"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatPrice } from "../utils/format";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL, API_ENDPOINTS } from "../config/api";

const ResellerProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [toggleStates, setToggleStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [statusCode, setStatusCode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { token } = useAuth();
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Toggle stock state locally and persist to backend
  const handleToggleStock = (product) => {
    const newStockStatus = !toggleStates[product.id];
    setToggleStates((prev) => ({ ...prev, [product.id]: newStockStatus }));
    (async () => {
      try {
        const res = await fetch(
          API_ENDPOINTS.PRODUCTS.RESELLER.UPDATE(product.id),
          {
            method: "PUT",
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                }
              : { "Content-Type": "application/json" },
            body: JSON.stringify({
              in_stock: newStockStatus ? 1 : 0,
              stock: product.stock,
            }),
          }
        );
        if (!res.ok) throw new Error("Failed to update stock");
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, inStock: newStockStatus } : p
          )
        );
      } catch (err) {
        console.error("Failed to update stock", err);
        alert("Gagal memperbarui status stok");
        setToggleStates((prev) => ({ ...prev, [product.id]: !newStockStatus }));
      }
    })();
  };

  const handleDelete = (id) => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
      )
    )
      return;
    (async () => {
      try {
        const res = await fetch(API_ENDPOINTS.PRODUCTS.RESELLER.DELETE(id), {
          method: "DELETE",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
            : { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to delete");
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        console.error("Delete failed", err);
        alert("Gagal menghapus produk.");
      }
    })();
  };

  // Fetch using relative endpoint first, then fallback to explicit backend origin
  useEffect(() => {
    if (!token) return; // Wait for token to be loaded

    let cancelled = false;
    const endpoints = [
      API_ENDPOINTS.PRODUCTS.RESELLER.MY_PRODUCTS,
      `${API_BASE_URL.replace(/\/$/, "")}${
        API_ENDPOINTS.PRODUCTS.RESELLER.MY_PRODUCTS
      }`,
    ];

    const doFetch = async () => {
      setLoading(true);
      setErrorMsg(null);
      setStatusCode(null);
      let lastErr = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          setStatusCode(res.status);
          if (res.status === 401 || res.status === 403) {
            const txt = await res.text().catch(() => "");
            setErrorMsg(
              `Autorisasi gagal (${res.status}). ${txt || ""}`.trim()
            );
            setProducts([]);
            setToggleStates({});
            setLoading(false);
            return;
          }
          if (!res.ok) {
            lastErr = new Error(`HTTP ${res.status} from ${ep}`);
            continue;
          }
          const data = await res.json();
          if (cancelled) return;
          let list = data || [];
          // Note: In Next.js, location.state is not available.
          // If you need to pass new product data, use localStorage or URL params
          setProducts(list);
          const map = (list || []).reduce((acc, product) => {
            acc[product.id] = product.inStock !== false;
            return acc;
          }, {});
          setToggleStates(map);
          setLoading(false);
          return;
        } catch (err) {
          console.warn("Fetch attempt failed for", ep, err);
          lastErr = err;
          continue;
        }
      }
      setErrorMsg(lastErr ? String(lastErr) : "Gagal mengambil data");
      setProducts([]);
      setToggleStates({});
      setLoading(false);
    };

    doFetch();
    return () => {
      cancelled = true;
    };
  }, [token, pathname]);

  // Filter products based on search and status
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "approved" && product.is_approved) ||
      (filterStatus === "pending" && !product.is_approved);
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Produk Saya</h1>
        <Link
          href="/reseller/products/new"
          className="bg-green-500 text-white px-5 py-2 rounded-md font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
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
          Tambah Produk Baru
        </Link>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">
              Filter Status:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Semua Status</option>
              <option value="approved">Disetujui</option>
              <option value="pending">Menunggu</option>
            </select>
          </div>
          <div className="text-sm text-gray-600 flex items-center justify-end">
            Total:{" "}
            <span className="font-bold ml-2">{filteredProducts.length}</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="p-4 text-sm text-muted">Memuat produk...</div>
      )}
      {errorMsg && (
        <div className="p-4 mb-4 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-100 dark:border-red-800/40 rounded">
          {errorMsg} (status: {statusCode})
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full table-auto text-left">
          <thead>
            <tr className="bg-yellow-500 text-white">
              <th className="p-4 font-semibold text-white align-middle">Gambar</th>
              <th className="p-4 font-semibold text-white align-middle">Nama</th>
              <th className="p-4 font-semibold text-white align-middle">Harga</th>
              <th className="p-4 font-semibold text-white align-middle">Stock</th>
              <th className="p-4 font-semibold text-white align-middle">Approval</th>
              <th className="p-4 font-semibold text-white text-center align-middle">Status Stok</th>
              <th className="p-4 font-semibold text-white align-middle">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length === 0 && !loading ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-500">
                  Belum ada produk
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    {(() => {
                      const img =
                        Array.isArray(product.images) &&
                        product.images.length > 0
                          ? product.images[0]
                          : null;
                      const src = img
                        ? typeof img === "string"
                          ? img
                          : img.thumb || img.original || ""
                        : "";
                      return src ? (
                        <img
                          src={src}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-md"
                          onError={(e) => {
                            e.target.style.display = "none";
                            if (e.target.nextElementSibling)
                              e.target.nextElementSibling.style.display =
                                "flex";
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">
                          No image
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-900">
                      {product.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {product.category}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-yellow-600">
                      {formatPrice(product.price)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold w-fit">
                      {product.stock} unit
                    </span>
                  </td>
                  <td className="p-4">
                    {product.is_approved ? (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        Disetujui
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                        Menunggu
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => handleToggleStock(product)}
                        className={`group relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-yellow-400 ${
                          toggleStates[product.id]
                            ? "bg-green-500 shadow-sm shadow-green-500/30"
                            : "bg-gray-300 shadow-sm shadow-gray-400/30"
                        } hover:shadow-md transform hover:scale-105`}
                        title={toggleStates[product.id] ? "Klik untuk menonaktifkan stok" : "Klik untuk mengaktifkan stok"}
                      >
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transform transition-all duration-200 ease-in-out ${
                            toggleStates[product.id] ? "translate-x-6" : "translate-x-1"
                          }`}
                        >
                          {toggleStates[product.id] ? (
                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                      </button>
                      <div className="ml-2 flex flex-col">
                        <span className={`text-xs font-medium transition-colors duration-200 ${
                          toggleStates[product.id] ? "text-green-700" : "text-gray-600"
                        }`}>
                          {toggleStates[product.id] ? "Tersedia" : "Habis"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/reseller/products/edit/${product.id}`}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-md text-sm font-semibold transition-colors flex items-center gap-1"
                      >
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-md text-sm font-semibold transition-colors flex items-center gap-1"
                      >
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResellerProductsPage;
