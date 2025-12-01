"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useNotification } from "../contexts/NotificationContext";

const AdminResellerFormPage = () => {
  const router = useRouter();
  const params = useParams();
  const { showNotification } = useNotification();
  const id = params?.id; // Ambil ID dari params URL
  const isEditing = !!id;

  // Ambil token admin dari localStorage (pola Next.js yang digunakan sebelumnya)
  const adminToken =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Load data jika sedang dalam mode edit
  useEffect(() => {
    if (!isEditing) return;

    const load = async () => {
      try {
        if (adminToken) {
          const resp = await fetch(`/api/admin/resellers/${id}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
          });

          if (resp.ok) {
            const data = await resp.json();

            setFormData((prev) => ({
              ...prev,
              name: data.store_name || data.first_name || "",
              email: data.email || "",
              phone: data.phone || data.rp_phone || "",
              address: data.address || "",
              status: data.is_active ? "active" : "inactive",
            }));
            return;
          } else if (resp.status === 404) {
            showNotification("Error", "Reseller tidak ditemukan.", "error");
            router.push('/admin/resellers');
            return;
          } else {
            showNotification("Error", "Gagal memuat reseller. Silakan coba lagi.", "error");
            return;
          }
        }

        // Fallback dummy data jika tidak ada token/API (opsional, meniru logika JSX)
        const dummyResellers = [
          {
            id: 1,
            name: "Toko Cemilan Jaya",
            email: "toko.jaya@email.com",
            phone: "0812345678",
            address: "Jl. Merdeka No. 10, Bandung",
            status: "active",
          },
          {
            id: 2,
            name: "Reseller Snack Mantap",
            email: "snack.mantap@email.com",
            phone: "0823456789",
            address: "Jl. Sudirman No. 25, Jakarta",
            status: "active",
          },
        ];
        const reseller = dummyResellers.find((r) => r.id === parseInt(id));
        if (reseller) {
          setFormData({
            name: reseller.name,
            email: reseller.email,
            phone: reseller.phone,
            address: reseller.address,
            status: reseller.status,
            password: "",
          });
        }
      } catch (err) {
        showNotification("Error", "Terjadi kesalahan saat memuat reseller.", "error");
      }
    };

    load();
  }, [id, isEditing, adminToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nama toko harus diisi";
    if (!formData.email.trim()) newErrors.email = "Email harus diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Email tidak valid";
    if (!formData.phone.trim()) newErrors.phone = "Nomor telepon harus diisi";
    if (!formData.address.trim()) newErrors.address = "Alamat harus diisi";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);

    try {
      const payload = {
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        store_name: formData.name,
      };
      if (formData.password) payload.password = formData.password;

      if (adminToken) {
        if (isEditing) {
          payload.is_active = formData.status === "active";

          const resp = await fetch(`/api/admin/resellers/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify(payload),
          });

          if (!resp.ok) {
            const errorText = await resp.text();
            throw new Error(`Update failed: ${resp.status} - ${errorText}`);
          }

          showNotification("Berhasil", "Reseller berhasil diupdate!", "success");
        } else {
          payload.role = "reseller";

          const resp = await fetch("/api/admin/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify(payload),
          });

          if (!resp.ok) {
            const err = await resp.json().catch(() => null);
            throw new Error(err && err.error ? err.error : "Create failed");
          }

          showNotification("Berhasil", "Reseller berhasil ditambahkan!", "success");
        }
      } else {
        // No token mode - simulate success
        showNotification(
          "Berhasil",
          isEditing
            ? "Reseller berhasil diupdate!"
            : "Reseller berhasil ditambahkan!",
          "success"
        );
      }

      router.push("/admin/resellers");
    } catch (err) {
      showNotification("Error", err.message || "Gagal menyimpan reseller", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        {isEditing ? "Edit Reseller" : "Tambah Reseller Baru"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md space-y-6 border border-gray-100"
      >
        <div className="mb-6">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Nama Toko <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Contoh: Toko Cemilan Jaya"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 focus:border-transparent ${
              errors.name ? "border-red-500" : "border-gray-200"
            }`}
          />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contoh@email.com"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 focus:border-transparent ${
                errors.email ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nomor Telepon <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="081234567890"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 focus:border-transparent ${
                errors.phone ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Alamat <span className="text-red-600">*</span>
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Jl. Contoh No. 123, Kota, Provinsi"
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 focus:border-transparent resize-vertical ${
              errors.address ? "border-red-500" : "border-gray-200"
            }`}
          />
          {errors.address && (
            <p className="text-red-600 text-sm mt-1">{errors.address}</p>
          )}
        </div>

        <div className="mb-6">
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Status <span className="text-red-600">*</span>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-transparent"
          >
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        <div className="mb-6">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={
              isEditing
                ? "Kosongkan jika tidak ingin mengubah password"
                : "Password untuk reseller"
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-transparent"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {submitting
              ? isEditing
                ? "Memperbarui..."
                : "Menambahkan..."
              : isEditing
              ? "Update Reseller"
              : "Tambah Reseller"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/resellers")}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminResellerFormPage;
