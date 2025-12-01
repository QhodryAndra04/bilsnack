"use client";

/* eslint-disable react-refresh/only-export-components */
// Fix: Populating ProductContext to manage and provide product data, as the file was empty.   
import React, { createContext, useContext, useState, useEffect } from "react";
import { PRODUCTS } from "../constants";
import { API_ENDPOINTS, apiGet, apiPost, apiPut, apiDelete } from '../config/api';const ProductContext = createContext(undefined);

import { API_BASE_URL } from '../config/api';

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(PRODUCTS || []);
  const [topSelling, setTopSelling] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      // Normalize server product fields to consistent client-side shape
      // - map `in_stock` -> `inStock`
      // - if `inStock` is missing, derive it from `stock` (>0)
      const normalized = Array.isArray(data)
        ? data.map((p) => ({
            ...p,
            stock: typeof p.stock === 'number' ? p.stock : (p.quantity || 0),
            inStock: typeof p.inStock !== 'undefined'
              ? p.inStock
              : (typeof p.in_stock !== 'undefined' ? Boolean(p.in_stock) : ( (typeof p.stock === 'number') ? p.stock > 0 : true )),
          }))
        : data;
      setProducts(normalized);
    } catch (err) {
      console.error('Failed to fetch products from API, falling back to local constants', err);
      // keep existing PRODUCTS as fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // also fetch top-selling for convenience
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/top-selling?limit=8`);
        if (res.ok) {
          const ds = await res.json();
          setTopSelling(ds || []);
        }
      } catch {
        // ignore, optional
      }
    })();
  }, []);

  const getProductById = (id) => products.find((p) => Number(p.id) === Number(id));

  // Admin functions that call the API and update local state
  const addProduct = async (productData) => {
    try {
      // Admin uses /api/products with admin token
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const token = adminToken || (typeof window !== 'undefined' ? localStorage.getItem('billsnack_token') : null);
      
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      
      console.log('Creating product:', productData);
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify(productData),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Create product failed:', res.status, errorText);
        throw new Error(`Failed to create product: ${res.status}`);
      }
      
      const created = await res.json();
      console.log('Product created:', created);
      // normalize created product
      const normCreated = {
        ...created,
        stock: typeof created.stock === 'number' ? created.stock : (created.quantity || 0),
        inStock: typeof created.inStock !== 'undefined'
          ? created.inStock
          : (typeof created.in_stock !== 'undefined' ? Boolean(created.in_stock) : ( (typeof created.stock === 'number') ? created.stock > 0 : true )),
      };
      setProducts((prev) => [normCreated, ...prev]);
      return normCreated;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const updateProduct = async (updatedProduct) => {
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const token = adminToken || (typeof window !== 'undefined' ? localStorage.getItem('billsnack_token') : null);
      
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      
      console.log('Updating product:', updatedProduct);
      const res = await fetch(`${API_BASE_URL}/api/products/${updatedProduct.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatedProduct),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Update product failed:', res.status, errorText);
        throw new Error(`Failed to update product: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Product updated:', data);
      // Preserve any client-only fields (e.g., inStock) that the server doesn't echo back.
      const merged = Object.assign({}, data, {});
      if (typeof updatedProduct.inStock !== 'undefined') merged.inStock = updatedProduct.inStock;
      // also preserve any other unknown keys present on updatedProduct but not returned by server
      Object.keys(updatedProduct).forEach((k) => {
        if (!(k in merged)) merged[k] = updatedProduct[k];
      });
      // ensure merged.inStock is defined and consistent
      merged.stock = typeof merged.stock === 'number' ? merged.stock : (merged.quantity || 0);
      if (typeof merged.inStock === 'undefined') {
        merged.inStock = typeof merged.in_stock !== 'undefined' ? Boolean(merged.in_stock) : (merged.stock > 0);
      }
      setProducts((prev) => prev.map((p) => (Number(p.id) === Number(merged.id) ? merged : p)));
      return merged;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const token = adminToken || (typeof window !== 'undefined' ? localStorage.getItem('billsnack_token') : null);
      
      if (!token) {
        throw new Error('Authentication required. Please login as admin.');
      }
      
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      
      console.log('Deleting product:', id, 'with token:', token ? 'Present' : 'Missing');
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE', headers });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Delete product failed:', res.status, errorText);
        let errorMsg = `Failed to delete product: ${res.status}`;
        try {
          const errJson = JSON.parse(errorText);
          errorMsg = errJson.error || errorMsg;
          
          // Special handling for foreign key constraint
          if (errJson.code === 'FOREIGN_KEY_CONSTRAINT' || res.status === 409) {
            throw new Error(errJson.error || 'Product has existing orders and cannot be deleted. It will be marked as discontinued.');
          }
        } catch (parseErr) {
          if (parseErr.message.includes('discontinued')) throw parseErr;
          // ignore parse error
        }
        throw new Error(errorMsg);
      }
      
      const data = await res.json();
      
      // Handle discontinued vs deleted
      if (data.discontinued) {
        alert('Produk tidak dapat dihapus karena memiliki riwayat pesanan. Produk telah ditandai sebagai "discontinued".');
        // Refresh products to show updated status
        await fetchProducts();
      } else {
        // Remove from local state
        setProducts((prev) => prev.filter((p) => Number(p.id) !== Number(id)));
        alert('Produk berhasil dihapus!');
      }
      
      return true;
    } catch (err) {
      console.error('Delete product error:', err);
      alert(`Gagal menghapus produk: ${err.message}`);
      throw err;
    }
  };

  const uploadImages = async (files) => {
    if (!files || files.length === 0) return [];
    
    try {
      const fd = new FormData();
      for (const f of files) {
        fd.append('files', f);
      }
      
      // Upload endpoint doesn't require auth, but we'll send token if available
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const token = adminToken || (typeof window !== 'undefined' ? localStorage.getItem('billsnack_token') : null);
      
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      
      const res = await fetch(`${API_BASE_URL}/api/uploads`, { 
        method: 'POST', 
        body: fd, 
        headers 
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Upload failed:', res.status, errorText);
        throw new Error(`Image upload failed: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Upload response:', data);
      
      // prefer structured meta if provided (files_meta contains { original, thumb })
      if (data.files_meta && Array.isArray(data.files_meta)) return data.files_meta;
      // otherwise return array of objects for consistency
      if (data.files && Array.isArray(data.files)) return data.files.map((u) => ({ original: u, thumb: u }));
      return [];
    } catch (err) {
      console.error('Upload images error:', err);
      throw err;
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        topSelling,
        loading,
        getProductById,
        addProduct,
        updateProduct,
        deleteProduct,
        refresh: fetchProducts,
        uploadImages,
        fetchTopSelling: async (limit = 8) => {
          const res = await fetch(`${API_BASE_URL}/api/products/top-selling?limit=${Number(limit)}`);
          if (!res.ok) throw new Error('Failed to fetch top-selling');
          return res.json();
        },
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};
