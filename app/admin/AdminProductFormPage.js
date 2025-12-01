"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { showSuccess, showError, showWarning } from "../utils/swal";

// Helper format currency internal (agar tidak error jika file utils belum ada)
const formatPrice = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const AdminProductFormPage = () => {
  const params = useParams();
  const id = params?.id; // Next.js useParams
  const router = useRouter();

  // Cek apakah sedang mode edit
  const isEditing = Boolean(id);

  const [product, setProduct] = useState({
    name: "",
    category: "",
    price: "",
    images: [],
    description: "",
    sellerName: "BillSnack Store",
    stock: "", // Pastikan stock ada di initial state
  });

  // State untuk input gambar manual (URL text)
  const [imagesText, setImagesText] = useState("");

  // State untuk manajemen upload gambar
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedMeta, setUploadedMeta] = useState([]);
  const [uploadMessage, setUploadMessage] = useState("");

  // Helper normalize image object/string
  const normalizeImg = (img) =>
    typeof img === "string" ? img : (img && (img.thumb || img.original)) || "";

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files || files.length === 0) return;

    // Set local previews immediately
    const urls = files.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls(urls);
    setSelectedImages(files);

    // Require admin token to upload
    const adminToken =
      typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
    if (!adminToken) {
      setUploadMessage(
        "Anda perlu login sebagai admin untuk mengunggah gambar."
      );
      return;
    }

    // Upload immediately
    try {
      setUploading(true);
      setUploadMessage("Mengunggah gambar...");

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const res = await fetch('/api/uploads/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: formData
      });

      if (res.ok) {
        const uploaded = await res.json();
        if (uploaded && uploaded.length > 0) {
          setUploadedMeta(uploaded);
          // Normalize and show uploaded thumbs
          const norm = uploaded
            .map((i) => (typeof i === "string" ? i : i.thumb || i.original || ""))
            .filter(Boolean);
          setImagePreviewUrls(norm);
          setUploadMessage(`Terunggah ${uploaded.length} gambar`);
        } else {
          setUploadMessage(
            "Unggah selesai, namun tidak ada file yang dikembalikan dari server."
          );
        }
      } else {
        const errorData = await res.json();
        setUploadMessage(`Gagal mengunggah: ${errorData.error || 'Unknown error'}`);
        setUploadedMeta([]);
      }
    } catch (err) {
      setUploadMessage(
        "Gagal mengunggah gambar. Periksa ukuran file (max 5MB) dan coba lagi."
      );
      setUploadedMeta([]);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newUrls = imagePreviewUrls.filter((_, i) => i !== index);
    const newMeta = uploadedMeta.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviewUrls(newUrls);
    setUploadedMeta(newMeta);
  };

  useEffect(() => {
    if (isEditing && id) {
      // Load existing product from API
      const loadProduct = async () => {
        try {
          const token = localStorage.getItem('adminToken');
          if (!token) {
            return;
          }

          const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          };

          const res = await fetch(`/api/admin/products/${id}`, { headers });
          if (res.ok) {
            const existingProduct = await res.json();
            setProduct({
              name: existingProduct.name || "",
              category: existingProduct.category || "",
              price: existingProduct.price || "",
              images: existingProduct.images || [],
              description: existingProduct.description || "",
              sellerName: existingProduct.sellerName || "BillSnack Store",
              stock: existingProduct.stock || "",
            });
            // Handle existing images preview
            const previews = Array.isArray(existingProduct.images)
              ? existingProduct.images.map((i) => normalizeImg(i)).filter(Boolean)
              : [];
            setImagePreviewUrls(previews);
          } else if (res.status === 404) {
            showError("Error", "Produk tidak ditemukan.");
            router.push('/admin/products');
          } else {
            showError("Error", "Gagal memuat produk. Silakan coba lagi.");
          }
        } catch (error) {
        }
      };
      loadProduct();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({
      ...product,
      [name]: value,
    });
  };

  const parseCurrencyToNumber = (val) => {
    if (val === null || typeof val === "undefined") return null;
    const raw = String(val)
      .replace(/[^0-9\-,.]/g, "")
      .trim();
    // Coba parse format ribuan titik
    let num = Number(raw.replace(/\./g, "").replace(/,/g, "."));
    if (Number.isNaN(num)) {
      num = Number(String(val).replace(/[^0-9]/g, "")) || 0;
    }
    return num;
  };

  const handlePriceChange = (e) => {
    const raw = e.target.value || "";
    const num = parseCurrencyToNumber(raw);
    setProduct((prev) => ({ ...prev, price: raw === "" ? "" : num }));
  };

  const handleImagesTextChange = (e) => {
    setImagesText(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple validation
    const priceValid =
      product.price !== "" &&
      product.price !== null &&
      !Number.isNaN(Number(product.price));

    if (!product.name) {
      showWarning("Validasi", "Nama produk harus diisi!");
      return;
    }
    if (!product.category) {
      showWarning("Validasi", "Kategori harus dipilih!");
      return;
    }
    if (!priceValid) {
      showWarning("Validasi", "Harga produk tidak valid!");
      return;
    }

    let finalImages = [];

    try {
      if (uploadedMeta && uploadedMeta.length > 0) {
        finalImages = uploadedMeta;
      } else if (selectedImages.length > 0) {
        // Jika belum terupload, coba upload sekarang
        let uploaded;
        try {
          uploaded = await uploadImages(selectedImages);
        } catch (upErr) {
          showError("Gagal Upload", `Gagal mengunggah gambar: ${upErr.message}`);
          return;
        }
        if (uploaded && uploaded.length > 0) {
          finalImages = uploaded;
          setUploadedMeta(uploaded);
        }
      } else if (imagesText && imagesText.trim().length > 0) {
        // Parse text URLs
        const parts = imagesText
          .split(/[,\n]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        finalImages = parts.map((url) => ({ original: url, thumb: url }));
      } else if (product.images && Array.isArray(product.images)) {
        // Use existing images
        finalImages = product.images;
      }

      // Ensure images is array
      if (!Array.isArray(finalImages)) {
        finalImages = [];
      }

      const productToSave = {
        name: product.name,
        category: product.category,
        price: Number(product.price),
        stock: Number(product.stock || 0),
        description: product.description,
        images: finalImages
      };

      const token = localStorage.getItem('adminToken');
      if (!token) {
        showError("Error", "Token admin tidak ditemukan. Silakan login kembali.");
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      let res;
      if (isEditing) {
        res = await fetch(`/api/admin/products/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(productToSave)
        });
      } else {
        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers,
          body: JSON.stringify(productToSave)
        });
      }

      if (res.ok) {
        showSuccess("Berhasil", isEditing ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!').then(() => {
          router.push("/admin/products");
        });
      } else {
        const errorData = await res.json();
        showError("Error", `Gagal menyimpan produk: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      showError("Error", `Gagal menyimpan produk: ${err.message || "Unknown error"}`);
    }
  };

  return (
    <div>
      <h1 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">
        {isEditing ? "Edit Produk" : "Tambah Produk Baru"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 sm:p-8 rounded-lg shadow-md space-y-4 sm:space-y-6 border border-gray-100"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">
              Nama Produk
            </label>
            <textarea
              name="name"
              value={product.name}
              onChange={handleChange}
              required
              rows={2}
              className="mt-1 block w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm sm:text-base text-gray-900"
              placeholder="Masukkan nama produk"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">
              Kategori
            </label>
            <select
              name="category"
              value={product.category}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm sm:text-base text-gray-900"
            >
              <option value="">Pilih kategori...</option>
              <option value="All">All</option>
              <option value="Chips & Crisps">Chips & Crisps</option>
              <option value="Candies & Sweets">Candies & Sweets</option>
              <option value="Cookies">Cookies</option>
              <option value="Nuts & Dried Fruits">Nuts & Dried Fruits</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">
              Harga
            </label>
            <input
              type="text"
              name="price"
              value={
                product.price === "" || product.price === null
                  ? ""
                  : formatPrice(product.price)
              }
              onChange={handlePriceChange}
              className="mt-1 block w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm sm:text-base text-gray-900"
              placeholder="Masukkan harga produk"
              required
            />
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
              Masukkan nominal tanpa simbol. Tampilan akan diformat ke Rupiah.
            </p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">
              Stok
            </label>
            <input
              type="number"
              name="stock"
              value={product.stock || ""}
              onChange={handleChange}
              className="mt-1 block w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm sm:text-base text-gray-900"
              placeholder="Masukkan stok"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">
              Nama Toko
            </label>
            <input
              type="text"
              name="sellerName"
              value={product.sellerName || "BillSnack Store"}
              onChange={handleChange}
              className="mt-1 block w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm sm:text-base text-gray-900"
              placeholder="Nama toko/penjual"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700">
            Deskripsi
          </label>
          <textarea
            name="description"
            value={product.description}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm sm:text-base text-gray-900"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Gambar Produk
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-xs sm:text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            // Disable jika tidak ada token admin (opsional, tergantung logic app)
            disabled={
              typeof window !== "undefined" &&
              !localStorage.getItem("adminToken")
            }
          />
          {uploading && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
              {uploadMessage || "Mengunggah..."}
            </p>
          )}
          {!uploading && uploadMessage && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">{uploadMessage}</p>
          )}

          <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
            Atau ketik/paste URL gambar (satu per baris atau pisah koma):
          </p>
          <textarea
            value={imagesText}
            onChange={handleImagesTextChange}
            placeholder="https://.../img1.jpg&#10;https://.../img2.jpg"
            className="mt-1 sm:mt-2 block w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-xs sm:text-sm text-gray-900"
            rows={3}
          />

          {imagePreviewUrls.length > 0 && (
            <div className="mt-3 sm:mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="w-full aspect-[1.08/1] bg-gray-100 rounded-lg border overflow-hidden flex items-center justify-center">
                    <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
                      <img
                        src={url}
                        alt={`Pratinjau ${index + 1}`}
                        className="max-h-full max-w-full object-contain object-center"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-md"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-4 pt-3 sm:pt-4">
          <button
            type="submit"
            className="bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md text-sm sm:text-base font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors shadow-sm"
          >
            {isEditing ? "Perbarui Produk" : "Simpan Produk"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="bg-gray-200 text-gray-800 px-4 sm:px-6 py-2 sm:py-3 rounded-md text-sm sm:text-base font-semibold hover:bg-gray-300 transition-colors"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductFormPage;
