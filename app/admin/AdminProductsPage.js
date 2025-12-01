"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const AdminProductsPage = () => {
  // State management
  const [allProducts, setAllProducts] = useState([]);
  const [resellers, setResellers] = useState([]);
  const [toggleStates, setToggleStates] = useState({});
  const [selectedReseller, setSelectedReseller] = useState("all");
  const [sellerSort, setSellerSort] = useState("none"); // 'none' | 'asc' | 'desc'
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Helper formatting
  const formatPrice = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Fetch Data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.error('No admin token found');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch products
      const productsRes = await fetch('/api/admin/products', { headers });
      let products = [];
      if (productsRes.ok) {
        products = await productsRes.json();
        console.log('Fetched products:', products);
      } else {
        console.error('Failed to fetch products:', productsRes.status, productsRes.statusText);
      }

      // Fetch users (resellers)
      const usersRes = await fetch('/api/admin/users', { headers });
      let users = [];
      if (usersRes.ok) {
        users = await usersRes.json();
        console.log('Fetched users:', users);
      } else {
        console.error('Failed to fetch users:', usersRes.status, usersRes.statusText);
      }

      // Filter resellers
      const resellersData = users.filter(user => user.role === 'reseller').map(user => ({
        id: user.id,
        store_name: user.reseller_profiles?.[0]?.store_name || `${user.first_name} ${user.last_name}`,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      }));

      setResellers(resellersData);

      // Transform the data to match the expected format
      const transformedProducts = products.map((p) => {
        // Extract store name from reseller_profiles
        const rp = p.users?.reseller_profiles;
        let storeNameRaw = null;
        if (Array.isArray(rp)) storeNameRaw = rp[0]?.store_name;
        else if (rp && typeof rp === 'object') storeNameRaw = rp.store_name;
        const storeName = storeNameRaw && typeof storeNameRaw === 'string' ? storeNameRaw.trim() : null;

        return {
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price,
          stock: p.stock || 0,
          inStock: p.in_stock !== false, // Assuming in_stock field
          sellerName: storeName || 
                     (p.users?.first_name && p.users?.last_name ? 
                      `${p.users.first_name} ${p.users.last_name}` : 
                      p.users?.first_name || p.users?.last_name || 'Admin'),
          resellerId: p.reseller_id,
          resellerEmail: p.users?.email,
          images: p.images || [],
          is_approved: p.is_approved !== false
        };
      });

      console.log('Transformed products:', transformedProducts);
      setAllProducts(transformedProducts);

      // Set initial toggle states
      const map = transformedProducts.reduce((acc, product) => {
        acc[product.id] = product.inStock;
        return acc;
      }, {});
      setToggleStates(map);

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.")) {
      try {
        const token = localStorage.getItem('adminToken');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const res = await fetch(`/api/admin/products/${id}`, {
          method: 'DELETE',
          headers
        });

        if (res.ok) {
          setAllProducts(prev => prev.filter(p => p.id !== id));
          alert('Produk berhasil dihapus!');
        } else {
          alert('Gagal menghapus produk');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error menghapus produk');
      }
    }
  };

  const handleToggleStock = async (product) => {
    const newStockStatus = !toggleStates[product.id];
    try {
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ in_stock: newStockStatus })
      });

      if (res.ok) {
        setToggleStates((prev) => ({
          ...prev,
          [product.id]: newStockStatus,
        }));
        // Update product in state
        setAllProducts(prev => prev.map(p => 
          p.id === product.id ? { ...p, inStock: newStockStatus } : p
        ));
      } else {
        alert('Gagal update status stok');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error update stok');
    }
  };

  const handleApproveToggle = async (product) => {
    const newVal = !product.is_approved;
    try {
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ is_approved: newVal })
      });

      if (res.ok) {
        const updated = { ...product, is_approved: newVal };
        setAllProducts((prev) =>
          prev.map((p) => (p.id === product.id ? updated : p))
        );
        alert(newVal ? "Produk disetujui!" : "Persetujuan produk dibatalkan!");
      } else {
        alert('Gagal update approval');
      }
    } catch (error) {
      console.error('Error updating approval:', error);
      alert('Error update approval');
    }
  };

  // Filter & Sort Logic
  let displayed = allProducts.slice();
  
  if (selectedReseller !== "all") {
    displayed = displayed.filter(
      (p) => String(p.resellerId) === String(selectedReseller)
    );
  }
  
  if (searchTerm) {
    displayed = displayed.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sellerName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  if (sellerSort === "asc") {
    displayed.sort((a, b) => (a.sellerName || "").localeCompare(b.sellerName || ""));
  } else if (sellerSort === "desc") {
    displayed.sort((a, b) => (b.sellerName || "").localeCompare(a.sellerName || ""));
  }

  // Pagination
  const totalItems = displayed.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDisplayed = displayed.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedReseller, searchTerm, sellerSort]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Kelola Produk</h1>
        <Link
          href="/admin/products/new"
          className="bg-green-500 text-white px-5 py-2 rounded-md font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Produk Baru
        </Link>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Filter Penjual:
            </label>
            <select
              value={selectedReseller}
              onChange={(e) => setSelectedReseller(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 w-full md:w-auto"
            >
              <option value="all">Semua</option>
              {resellers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.store_name || `${r.first_name || ""} ${r.last_name || ""}`.trim()}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Urutkan Penjual:
            </label>
            <button
              onClick={() =>
                setSellerSort((s) => (s === "asc" ? "desc" : s === "desc" ? "none" : "asc"))
              }
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors w-full md:w-auto text-center"
            >
              {sellerSort === "asc"
                ? "A → Z"
                : sellerSort === "desc"
                ? "Z → A"
                : "Tidak"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead>
              <tr className="bg-yellow-500 text-white">
                <th className="p-4 font-semibold text-white">Gambar</th>
                <th className="p-4 font-semibold text-white">Nama</th>
                <th className="p-4 font-semibold text-white">Harga</th>
                <th className="p-4 font-semibold text-white">Stock</th>
                <th className="p-4 font-semibold text-white">Penjual</th>
                <th className="p-4 font-semibold text-white">Approval</th>
                <th className="p-4 font-semibold text-white text-center">Status Stok</th>
                <th className="p-4 font-semibold text-white text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDisplayed.length > 0 ? (
                paginatedDisplayed.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      {(() => {
                        const img = Array.isArray(product.images) && product.images.length > 0
                          ? product.images[0]
                          : null;
                        return img ? (
                          <img
                            src={typeof img === "string" ? img : img.thumb || ""}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-md"
                            onError={(e) => { e.target.style.display = "none"; if(e.target.nextSibling) e.target.nextSibling.style.display = "flex" }}
                          />
                        ) : null;
                      })()}
                      {(!product.images || product.images.length === 0) && (
                         <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">
                           No image
                         </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-yellow-600">
                        {formatPrice(product.price)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {product.stock} unit
                      </span>
                    </td>
                    <td className="p-4">
                      {product.resellerId ? (
                        <Link
                          href={`/admin/resellers/edit/${product.resellerId}`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {product.sellerName || "Reseller"}
                        </Link>
                      ) : (
                        <p className="font-medium text-gray-900">
                          {product.sellerName || "Admin"}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      {product.resellerId ? (
                        product.is_approved ? (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                            Disetujui
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                            Menunggu
                          </span>
                        )
                      ) : (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                          Admin
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
                    <td className="p-4 text-center">
                      <div className="flex gap-2 flex-col sm:flex-row">
                        <Link
                          href={`/admin/products/edit/${product.id}`}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Hapus
                        </button>
                      </div>
                      {/* Approve button for reseller products */}
                      {product.resellerId && (
                        <div className="mt-2">
                          <button
                            onClick={() => handleApproveToggle(product)}
                            className={`w-full inline-flex items-center justify-center px-3 py-1 rounded-md font-semibold text-xs ${
                              product.is_approved
                                ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                          >
                            {product.is_approved ? "Batalkan" : "Setujui"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-gray-500">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Menampilkan {startIndex + 1} sampai {Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems} produk
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;