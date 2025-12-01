import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";

const ResellerLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  // Prefilled message for WhatsApp contact. It will include the email if the user entered one.
  const prefillResellerMessage = `Halo Admin, saya ingin mendaftar sebagai reseller.\nEmail: ${
    email || ""
  }\nNama Lengkap: \nNama Toko: \nLokasi: \nTerima kasih.`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Harap masukkan email dan kata sandi.");
      return;
    }
    setSubmitting(true);
    try {
      // Call real login via AuthContext which will persist token/user in localStorage
      const data = await login({ email, password });
      // Ensure the logged-in user has reseller role
      if (!data || !data.user || data.user.role !== "reseller") {
        setError(
          "Akun ini bukan reseller. Jika Anda seorang reseller, minta admin untuk menandai akun Anda sebagai reseller."
        );
        setSubmitting(false);
        return;
      }
      router.push("/reseller");
    } catch (err) {
      console.error("Login failed", err);
      setError(
        err && err.message
          ? err.message
          : "Gagal masuk. Periksa kredensial Anda."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-surface dark:bg-[rgb(var(--bg))] px-6 py-12 relative overflow-hidden">
      {/* Decorative Background Elements seperti di homepage */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[rgb(var(--accent))] rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-[rgb(var(--accent))] rounded-full blur-2xl"></div>
        <div className="absolute bottom-40 left-1/3 w-20 h-20 bg-[rgb(var(--accent))] rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-[rgb(var(--accent))] rounded-full blur-lg"></div>
      </div>
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left illustration / promo */}
        <div className="hidden md:flex flex-col items-start justify-center space-y-6 px-6">
          <div className="p-6 rounded-3xl bg-card-yellow border-card-yellow shadow-lg hover:shadow-xl transition-all duration-300">
            <h2 className="text-2xl font-extrabold text-card-yellow">
              Bilsnack
            </h2>
            <p className="text-card-yellow-secondary mt-2">
              Portal khusus untuk mitra reseller kami. Kelola dan jual produk
              dengan mudah.
            </p>
          </div>
          <div className="w-full rounded-xl overflow-hidden shadow-md">
            <img
              src="/hero-food.jpg"
              alt="snack"
              className="w-full object-cover h-64"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Right: auth card */}
        <div className="flex items-center justify-center">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-card-yellow border-card-yellow p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
            suppressHydrationWarning={true}
          >
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-card-yellow">
                Masuk
              </h1>
              <span className="text-sm text-card-yellow-secondary">
                Selamat datang kembali 👋
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium text-card-yellow-secondary mb-1"
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

              <div>
                <label
                  className="block text-sm font-medium text-card-yellow-secondary mb-1"
                  htmlFor="password"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan kata sandi"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:accent-text"
                    suppressHydrationWarning={true}
                  >
                    {showPassword ? "Sembunyikan" : "Tampilkan"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full btn-primary rounded-full py-3 font-semibold disabled:opacity-60"
                disabled={submitting}
                suppressHydrationWarning={true}
              >
                {submitting ? "Memproses..." : "Masuk"}
              </button>

              <p className="text-center text-card-yellow-secondary text-sm mt-4">
                Belum terdaftar sebagai reseller?
                <a
                  href={`https://wa.me/6288973294105?text=${encodeURIComponent(
                    prefillResellerMessage
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-block accent-text font-semibold px-3 py-1 border border-accent/30 rounded-full hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  Hubungi Admin
                </a>
              </p>

              <div className="mt-6 pt-6 border-t border-yellow-200 dark:border-yellow-700/30">
                <p className="text-center text-card-yellow-secondary text-sm mb-3">
                  Kembali ke login pelanggan
                </p>
                <Link
                  href="/login"
                  className="w-full block text-center btn-secondary font-semibold py-2 px-4 rounded-lg"
                >
                  Masuk Sebagai Pelanggan
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResellerLoginPage;
