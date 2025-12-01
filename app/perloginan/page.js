"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          admin: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminUser", JSON.stringify(data.user));
        localStorage.setItem("adminAuth", JSON.stringify({ isLoggedIn: true }));
        router.push("/admin");
      } else {
        setError(data.error || "Email atau password salah");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Mengubah background menjadi putih polos untuk menghilangkan efek "header" dari gradient sebelumnya
    <div className="h-screen flex items-center justify-center bg-white px-6 py-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left illustration / promo */}
        <div className="hidden md:flex flex-col items-start justify-center space-y-6 px-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-yellow-50 to-amber-100 border border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <h2 className="text-2xl font-extrabold text-amber-800">Bilsnack</h2>
            <p className="text-amber-700 mt-2">
              Panel Admin Billsnack - Akses Terbatas.
            </p>
          </div>
          <div className="w-full rounded-xl overflow-hidden shadow-md">
            <img
              src="/hero-food.jpg"
              alt="snack"
              className="w-full object-cover h-48"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Right: admin login card */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md bg-gradient-to-br from-yellow-50 to-amber-100 border border-yellow-200 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-amber-800">
                Panel Admin
              </h1>
              <span className="text-sm text-amber-700">Akses Terbatas 👑</span>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-2">
                  Email Admin
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukan email admin"
                  className="w-full px-4 py-3 border border-yellow-200 bg-white rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-colors text-gray-900 placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-800 mb-2">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi admin"
                  className="w-full px-4 py-3 border border-yellow-200 bg-white rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-colors text-gray-900 placeholder-gray-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold py-3 px-4 rounded-full hover:from-amber-600 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-yellow-200">
              <p className="text-center text-amber-700 text-sm mb-3">
                Kembali ke Toko Billsnack
              </p>
              <Link
                href="/"
                className="w-full block text-center bg-white/50 hover:bg-white/80 border border-yellow-200 text-amber-800 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Kunjungi Toko
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
