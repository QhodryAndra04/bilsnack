"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";
import { useNotification } from "./contexts/NotificationContext";

const RegisterPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = React.useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showNotification("Error", "File harus berupa gambar", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showNotification("Error", "Ukuran gambar maksimal 2MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => setAvatarPreview(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { register } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      showNotification("Error", "Harap isi nama depan, nama belakang, email, dan password.", "error");
      return;
    }

    try {
      setLoading(true);
      // Call AuthContext.register which talks to backend
      const payload = {
        email,
        password,
        firstName,
        lastName,
        username,
        phone,
        gender,
      };
      if (avatarPreview) payload.profileImage = avatarPreview;
      await register(payload);
      router.push("/");
    } catch (err) {
      showNotification("Pendaftaran Gagal", err.message || "Pendaftaran gagal", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="flex items-center justify-center">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg bg-surface-alt border border-base p-8 rounded-2xl shadow-xl"
            suppressHydrationWarning={true}
          >
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gradient">
                Buat Akun
              </h1>
              <p className="text-muted mt-1">
                Gabung sekarang dan nikmati promo spesial!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  className="block text-sm font-medium text-muted mb-1"
                  htmlFor="firstName"
                >
                  Nama Depan
                </label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="Nama depan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-base bg-surface px-4 py-3 placeholder:text-muted focus:border-accent focus:ring-0 transition-colors"
                  suppressHydrationWarning={true}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-muted mb-1"
                  htmlFor="lastName"
                >
                  Nama Belakang
                </label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Nama belakang"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-base bg-surface px-4 py-3 placeholder:text-muted focus:border-accent focus:ring-0 transition-colors"
                  suppressHydrationWarning={true}
                />
              </div>
            </div>

            <div className="mb-4 flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-alt border border-base flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-muted">No Image</div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  suppressHydrationWarning={true}
                />
              </div>
              <div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current && fileInputRef.current.click()
                    }
                    className="px-3 py-2 btn-primary rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-accent/40"
                    suppressHydrationWarning={true}
                  >
                    Unggah
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3 py-2 border border-base rounded-md bg-surface hover:bg-surface-alt transition-colors text-muted"
                    suppressHydrationWarning={true}
                  >
                    Hapus
                  </button>
                </div>
                <p className="text-sm text-muted mt-2">
                  Format: JPG/PNG, max 2MB
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label
                className="block text-sm font-medium text-muted mb-1"
                htmlFor="username"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-lg border border-base bg-surface px-4 py-3 placeholder:text-muted focus:border-accent focus:ring-0 transition-colors"
                suppressHydrationWarning={true}
              />
            </div>

            <div className="mb-4">
              <label
                className="block text-sm font-medium text-muted mb-1"
                htmlFor="email"
              >
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="nama@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-base bg-surface px-4 py-3 placeholder:text-muted focus:border-accent focus:ring-0 transition-colors"
                suppressHydrationWarning={true}
              />
            </div>

            <div className="mb-4">
              <label
                className="block text-sm font-medium text-muted mb-1"
                htmlFor="phone"
              >
                Nomor Telepon
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="08xxxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-base bg-surface px-4 py-3 placeholder:text-muted focus:border-accent focus:ring-0 transition-colors"
                suppressHydrationWarning={true}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-muted mb-1">
                Jenis Kelamin
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="Laki-laki"
                    checked={gender === "Laki-laki"}
                    onChange={(e) => setGender(e.target.value)}
                    className=""
                    required
                    suppressHydrationWarning={true}
                  />{" "}
                  Laki-laki
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="Perempuan"
                    checked={gender === "Perempuan"}
                    onChange={(e) => setGender(e.target.value)}
                    className=""
                    required
                    suppressHydrationWarning={true}
                  />{" "}
                  Perempuan
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label
                className="block text-sm font-medium text-muted mb-1"
                htmlFor="password"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-base bg-surface px-4 py-3 pr-12 placeholder:text-muted focus:border-accent focus:ring-0 transition-colors"
                  suppressHydrationWarning={true}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-pressed={showPassword}
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted hover:accent-text"
                  suppressHydrationWarning={true}
                >
                  {showPassword ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
              <p className="text-xs text-muted mt-2">
                Gunakan kombinasi huruf, angka, dan simbol untuk keamanan lebih
                baik.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary rounded-full py-3 font-semibold disabled:opacity-60"
              suppressHydrationWarning={true}
            >
              {loading ? "Mendaftarkan..." : "Daftar"}
            </button>

            <p className="text-center text-muted text-sm mt-6">
              Sudah punya akun?
              <Link
                href="/login"
                className="ml-2 inline-block accent-text font-semibold px-3 py-1 border border-accent/30 rounded-full hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                Masuk
              </Link>
            </p>
          </form>
        </div>

        <div className="hidden md:flex flex-col items-start justify-center px-6">
          <div className="p-6 rounded-3xl bg-surface-alt border border-base shadow-md">
            <h3 className="text-xl font-bold accent-text">
              Nikmati kemudahan belanja
            </h3>
            <p className="text-muted mt-2">
              Daftar untuk akses lebih cepat, riwayat pesanan, dan penawaran
              eksklusif.
            </p>
          </div>
          <div className="mt-6 w-full rounded-xl overflow-hidden shadow-md">
            <img
              src="/register-illustration.jpg"
              alt="register"
              className="w-full object-cover h-64"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
