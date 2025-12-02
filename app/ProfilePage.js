"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./contexts/AuthContext";
import { showSuccess, showError } from "./utils/swal";

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    gender: "",
    address: "",
    postalCode: "",
    city: "",
    province: "",
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username:
          user.username ||
          (user.email
            ? user.email.split("@")[0]
            : user.name
            ? user.name.replace(/\s+/g, "").toLowerCase()
            : ""),
        email: user.email || "",
        phone: user.phone || user.tel || "",
        gender: user.gender || "",
        address: user.address || "",
        postalCode: user.postalCode || "",
        city: user.city || "",
        province: user.province || "",
      });
      if (user.profileImage) {
        setAvatarPreview(user.profileImage);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Error", "File harus berupa gambar.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showError("Error", "Ukuran gambar maksimal 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (avatarPreview) payload.profileImage = avatarPreview;
    else payload.profileImage = null;

    updateProfile(payload);
    showSuccess("Berhasil", "Profil berhasil diperbarui!");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[rgb(var(--surface))] to-[rgb(var(--surface-alt))] flex items-center justify-center px-6 py-12">
        <div className="text-center">
          <div className="w-24 h-24 bg-[rgb(var(--surface-alt))] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-[rgb(var(--text-muted))]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-4">
            Akses Dibatasi
          </h1>
          <p className="text-muted text-lg mb-6 max-w-md mx-auto">
            Silakan masuk ke akun Anda untuk melihat dan mengelola profil
            pribadi.
          </p>
          <a
            href="/login"
            className="btn-primary px-8 py-3 rounded-full font-semibold"
          >
            Masuk Sekarang
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 sm:px-12 lg:px-16 py-12 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-muted mb-8">
        <a
          href="/"
          className="hover:text-[rgb(var(--accent))] dark:hover:text-[rgb(var(--accent))]/80 transition-colors"
        >
          Beranda
        </a>{" "}
        <svg
          className="w-4 h-4 mx-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="m9 18 6-6-6-6"
          />
        </svg>
        <span className="text-[rgb(var(--text))] font-medium">
          Profil Saya
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Summary Card */}
        <div className="lg:col-span-1">
          <div
            className="glass rounded-2xl p-6 shadow-[var(--shadow-xl)]"
            style={{
              background:
                "linear-gradient(135deg, rgb(var(--accent) / 0.15) 0%, rgb(var(--accent) / 0.1) 50%, rgb(var(--accent) / 0.15) 100%)",
              border: "1px solid rgb(var(--accent) / 0.2)",
            }}
          >
            <div className="text-center">
              <div className="relative inline-block">
                <div
                  className="w-32 h-32 rounded-full overflow-hidden border-4 border-[rgb(var(--surface))] flex items-center justify-center shadow-[var(--shadow-lg)] mx-auto"
                  style={{
                    background:
                      "linear-gradient(to bottom right, rgb(var(--avatar-yellow-from)), rgb(var(--avatar-yellow-to)))",
                  }}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-4xl font-bold text-[rgb(var(--accent))]">
                      {user.firstName?.[0]?.toUpperCase() ||
                        user.email?.[0]?.toUpperCase() ||
                        "U"}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-[rgb(var(--surface))] flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-bold text-primary mt-4 mb-1">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-primary text-sm mb-4">{user.email}</p>

              <div className="space-y-2 flex flex-col items-center">
                <div className="flex items-center justify-center text-xs text-verified bg-verified px-3 py-1 rounded-full border border-verified backdrop-blur-sm w-fit">
                  <svg
                    className="w-3 h-3 mr-1 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Akun Terverifikasi
                </div>
                <div className="flex items-center justify-center text-xs text-secure bg-secure px-3 py-1 rounded-full border border-secure backdrop-blur-sm w-fit">
                  <svg
                    className="w-3 h-3 mr-1 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Data Aman
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-2">
          <div
            className="glass rounded-2xl shadow-[var(--shadow-xl)] overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgb(var(--accent) / 0.15) 0%, rgb(var(--accent) / 0.1) 50%, rgb(var(--accent) / 0.15) 100%)",
              border: "1px solid rgb(var(--accent) / 0.2)",
            }}
          >
            <div className="bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent-hover))] px-6 py-4">
              <h1 className="text-2xl font-bold text-white flex items-center">
                <svg
                  className="w-6 h-6 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Informasi Pribadi
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                Kelola data profil Anda dengan aman
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Avatar Section */}
              <div className="bg-surface border border-base rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-gradient">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Foto Profil
                </h3>
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-alt border-2 border-base flex items-center justify-center shadow-[var(--shadow-md)]">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-2xl font-bold text-muted">
                          {user.firstName?.[0]?.toUpperCase() ||
                            user.email?.[0]?.toUpperCase() ||
                            "U"}
                        </div>
                      )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 bg-accent rounded-full p-2 shadow-[var(--shadow-lg)] border-2 border-[rgb(var(--surface))] cursor-pointer hover:bg-accent-hover transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </label>
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() =>
                          fileInputRef.current && fileInputRef.current.click()
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-primary rounded-lg font-medium transition-colors"
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
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        Unggah Foto
                      </button>
                      {avatarPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-red-400/50 text-red-500 hover:bg-red-500/10 rounded-lg font-medium transition-colors"
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
                      )}
                    </div>
                    <p className="text-sm text-muted">
                      Format: JPG, PNG, atau GIF. Maksimal 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-surface border border-base rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center text-gradient">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m0 0l-2-2m2 2l2-2m6-6v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6a2 2 0 012-2h8a2 2 0 012 2z"
                    />
                  </svg>
                  Data Pribadi
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">
                      Nama Depan
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-muted"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName || ""}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-3 border border-base rounded-lg bg-surface placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                        placeholder="Masukkan nama depan"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">
                      Nama Belakang
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-muted"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName || ""}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-3 border border-base rounded-lg bg-surface placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                        placeholder="Masukkan nama belakang"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-muted mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-muted"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-3 border border-base rounded-lg bg-surface placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                      placeholder="Masukkan username Anda"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-muted mb-2">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-muted"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-3 border border-base rounded-lg bg-surface placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                      placeholder="Masukkan alamat email"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-muted mb-2">
                    Nomor Telepon
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-muted"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-3 border border-base rounded-lg bg-surface placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                      placeholder="Masukkan nomor telepon Anda"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-muted mb-3">
                    Jenis Kelamin
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="Laki-laki"
                        checked={formData.gender === "Laki-laki"}
                        onChange={handleChange}
                        className="w-4 h-4 text-accent border-base focus:ring-accent/20 focus:ring-2"
                        required
                      />
                      <span className="ml-2 text-sm">Laki-laki</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="Perempuan"
                        checked={formData.gender === "Perempuan"}
                        onChange={handleChange}
                        className="w-4 h-4 text-accent border-base focus:ring-accent/20 focus:ring-2"
                        required
                      />
                      <span className="ml-2 text-sm">Perempuan</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-muted mb-2">
                    Alamat
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-muted"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <textarea
                      name="address"
                      value={formData.address || ""}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-10 pr-3 py-3 border border-base rounded-lg bg-surface placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 resize-none"
                      placeholder="Masukkan alamat lengkap Anda"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">
                      Kode Pos
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-muted"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 21v-4a4 4 0 014-4h5a4 4 0 014 4v4M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.85M8 11a4 4 0 100-8 4 4 0 000 8z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode || ""}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-3 border border-base rounded-lg bg-surface placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                        placeholder="12345"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">
                      Kota/Kecamatan
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-muted"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="city"
                        value={formData.city || ""}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-3 border border-base rounded-lg bg-surface placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                        placeholder="Jakarta"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">
                      Provinsi
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-muted"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="province"
                        value={formData.province || ""}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-3 border border-base rounded-lg bg-surface placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                        placeholder="DKI Jakarta"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-base">
                <div className="text-sm text-muted">
                  Pastikan semua data sudah benar sebelum menyimpan perubahan
                </div>
                <button
                  type="submit"
                  className="btn-primary px-6 py-3 rounded-lg font-semibold shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-xl)] transition-all duration-200 transform hover:-translate-y-0.5 text-center"
                >
                  Perbarui Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
