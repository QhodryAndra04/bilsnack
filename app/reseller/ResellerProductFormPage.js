"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

// Helper format currency internal
const formatPrice = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ResellerProductFormPage = () => {
  const params = useParams();
  const id = params?.id; // Next.js useParams
  const router = useRouter();
  const { token, user } = useAuth();

  // Cek apakah sedang mode edit
  const isEditing = Boolean(id);

  const [product, setProduct] = useState({
    name: "",
    category: "",
    price: "",
    images: [],
    description: "",
    stock: "",
    sellerName: user?.storeName || user?.name || "", // Default ke nama toko user
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

    // Require token to upload
    if (!token) {
      setUploadMessage("Anda perlu login untuk mengunggah gambar.");
      return;
    }

    // Upload immediately
    try {
      setUploading(true);
      setUploadMessage("Mengunggah gambar...");

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch("/api/uploads/image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const uploaded = await res.json();
        if (uploaded && uploaded.length > 0) {
          setUploadedMeta(uploaded);
          // Normalize and show uploaded thumbs
          const norm = uploaded
            .map((i) =>
              typeof i === "string" ? i : i.thumb || i.original || ""
            )
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
        setUploadMessage(
          `Gagal mengunggah: ${errorData.error || "Unknown error"}`
        );
        setUploadedMeta([]);
      }
    } catch (err) {
      console.error("Upload error (client)", err);
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
          if (!token) return;

          const headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          };

          const res = await fetch(`/api/products/reseller/${id}`, { headers });
          if (res.ok) {
            const existingProduct = await res.json();
            setProduct({
              name: existingProduct.name || "",
              category: existingProduct.category || "",
              price: existingProduct.price || "",
              images: existingProduct.images || [],
              description: existingProduct.description || "",
              stock: existingProduct.stock || "",
              sellerName:
                existingProduct.sellerName ||
                user?.storeName ||
                user?.name ||
                "",
            });
            // Handle existing images preview
            const previews = Array.isArray(existingProduct.images)
              ? existingProduct.images
                  .map((i) => normalizeImg(i))
                  .filter(Boolean)
              : [];
            setImagePreviewUrls(previews);
          } else if (res.status === 404) {
            alert("Produk tidak ditemukan.");
            router.push("/reseller/products");
          } else {
            console.error(
              "Failed to load product:",
              res.status,
              res.statusText
            );
            alert("Gagal memuat produk. Silakan coba lagi.");
          }
        } catch (error) {
          console.error("Error loading product:", error);
        }
      };
      loadProduct();
    } else {
      // Jika mode tambah, pastikan nama toko terisi default
      if (user) {
        setProduct((prev) => ({
          ...prev,
          sellerName: user.storeName || user.name || "",
        }));
      }
    }
  }, [id, isEditing, token, user]);

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

    console.log("=== SUBMIT PRODUCT ===");

    // Simple validation
    const priceValid =
      product.price !== "" &&
      product.price !== null &&
      !Number.isNaN(Number(product.price));

    if (!product.name) {
      alert("Nama produk harus diisi!");
      return;
    }
    if (!product.category) {
      alert("Kategori harus dipilih!");
      return;
    }
    if (!priceValid) {
      alert("Harga produk tidak valid!");
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
          // Manual upload call since helper is inside handler
          const formData = new FormData();
          selectedImages.forEach((file) => {
            formData.append("images", file);
          });
          const upRes = await fetch("/api/uploads/image", {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });
          if (upRes.ok) {
            uploaded = await upRes.json();
          } else {
            throw new Error("Upload failed on submit");
          }
        } catch (upErr) {
          alert(`Gagal mengunggah gambar: ${upErr.message}`);
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
        images: finalImages,
        // sellerName biasanya di-handle backend berdasarkan token,
        // tapi kita kirim juga jika backend mengizinkan update nama toko per produk
        sellerName: product.sellerName,
      };

      if (!token) {
        alert("Token tidak ditemukan. Silakan login kembali.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      let res;
      if (isEditing) {
        res = await fetch(`/api/products/reseller/${id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(productToSave),
        });
      } else {
        res = await fetch("/api/products/reseller/my-products", {
          method: "POST",
          headers,
          body: JSON.stringify(productToSave),
        });
      }

      if (res.ok) {
        alert(
          isEditing
            ? "Produk berhasil diperbarui!"
            : "Produk berhasil ditambahkan!"
        );
        router.push("/reseller/products");
      } else {
        const errorData = await res.json();
        alert(`Gagal menyimpan produk: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan. Silakan coba lagi.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        {isEditing ? "Edit Produk" : "Tambah Produk Baru"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md space-y-6 border border-gray-100"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nama Produk
            </label>
            <textarea
              name="name"
              value={product.name}
              onChange={handleChange}
              required
              rows={2}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-gray-900"
              placeholder="Masukkan nama produk"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Kategori
            </label>
            <select
              name="category"
              value={product.category}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-gray-900"
            >
              <option value="">Pilih kategori...</option>
              <option value="Chips & Crisps">Chips & Crisps</option>
              <option value="Candies & Sweets">Candies & Sweets</option>
              <option value="Cookies">Cookies</option>
              <option value="Nuts & Dried Fruits">Nuts & Dried Fruits</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
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
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-gray-900"
              placeholder="Masukkan harga produk"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Masukkan nominal tanpa simbol. Tampilan akan diformat ke Rupiah.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Stok
            </label>
            <input
              type="number"
              name="stock"
              value={product.stock}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-gray-900"
              placeholder="Masukkan stok"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nama Toko
            </label>
            <input
              type="text"
              name="sellerName"
              value={product.sellerName}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-gray-900"
              placeholder="Nama toko/penjual"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Deskripsi
          </label>
          <textarea
            name="description"
            value={product.description}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gambar Produk
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={!token}
          />
          {uploading && (
            <p className="text-sm text-gray-500 mt-2">
              {uploadMessage || "Mengunggah..."}
            </p>
          )}
          {!uploading && uploadMessage && (
            <p className="text-sm text-gray-500 mt-2">{uploadMessage}</p>
          )}

          <p className="text-sm text-gray-500 mt-2">
            Atau ketik/paste URL gambar (satu per baris atau pisah koma):
          </p>
          <textarea
            value={imagesText}
            onChange={handleImagesTextChange}
            placeholder="https://.../img1.jpg&#10;https://.../img2.jpg"
            className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm text-gray-900"
            rows={3}
          />

          {imagePreviewUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="w-full aspect-[1.08/1] bg-gray-100 rounded-lg border overflow-hidden flex items-center justify-center">
                    <div className="w-full h-full flex items-center justify-center p-4">
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

        <div className="flex items-center space-x-4 pt-4">
          <button
            type="submit"
            className="bg-green-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors shadow-sm"
          >
            {isEditing ? "Perbarui Produk" : "Simpan Produk"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/reseller/products")}
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md font-semibold hover:bg-gray-300 transition-colors"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResellerProductFormPage;
