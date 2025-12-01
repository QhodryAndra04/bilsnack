"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";
import { showError } from "./utils/swal";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showError("Error", "Harap masukkan email dan kata sandi.");
      return;
    }
    setSubmitting(true);
    try {
      await login({ email, password });
      const redirectTo = searchParams.get('redirect') || "/";
      router.push(redirectTo);
    } catch (err) {
      showError(
        "Login Gagal",
        err && err.message
          ? err.message
          : "Gagal masuk. Periksa kredensial Anda."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-[rgb(var(--bg))] px-3 sm:px-6 py-6 sm:py-12 relative overflow-hidden">
      {/* Decorative Background Elements seperti di homepage */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[rgb(var(--accent))] rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-[rgb(var(--accent))] rounded-full blur-2xl"></div>
        <div className="absolute bottom-40 left-1/3 w-20 h-20 bg-[rgb(var(--accent))] rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-[rgb(var(--accent))] rounded-full blur-lg"></div>
      </div>
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 items-center relative">
        {/* Left illustration / promo */}
        <div className="hidden md:flex flex-col items-start justify-center space-y-6 px-6">
          <div className="p-6 rounded-3xl bg-card-yellow border-card-yellow shadow-lg hover:shadow-xl transition-all duration-300">
            <h2 className="text-2xl font-extrabold text-card-yellow">
              Bilsnack
            </h2>
            <p className="text-card-yellow-secondary mt-2">
              Belanja cemilan favoritmu dengan cepat dan mudah.
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
            className="w-full max-w-md bg-card-yellow border-card-yellow p-5 sm:p-8 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
            suppressHydrationWarning={true}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-card-yellow">
                Masuk
              </h1>
              <span className="text-xs sm:text-sm text-card-yellow-secondary">
                Selamat datang kembali 👋
              </span>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label
                  className="block text-xs sm:text-sm font-medium text-card-yellow-secondary mb-1"
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
                  className="w-full rounded-lg border border-base bg-surface px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base placeholder:text-muted focus:border-accent focus:ring-0 transition-colors"
                  suppressHydrationWarning={true}
                />
              </div>

              <div>
                <label
                  className="block text-xs sm:text-sm font-medium text-card-yellow-secondary mb-1"
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
                    className="w-full rounded-lg border border-base bg-surface px-3 sm:px-4 py-2.5 sm:py-3 pr-20 sm:pr-24 text-sm sm:text-base placeholder:text-muted focus:border-accent focus:ring-0 transition-colors"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-muted hover:accent-text px-2 py-1"
                    suppressHydrationWarning={true}
                  >
                    {showPassword ? "Sembunyikan" : "Tampilkan"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-primary rounded-full py-2.5 sm:py-3 text-sm sm:text-base font-semibold disabled:opacity-60"
                disabled={submitting}
                suppressHydrationWarning={true}
              >
                {submitting ? "Memproses..." : "Masuk"}
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-px flex-1 bg-yellow-200 dark:bg-yellow-700/30" />
                <div className="text-xs sm:text-sm text-card-yellow-secondary whitespace-nowrap">
                  atau masuk dengan
                </div>
                <div className="h-px flex-1 bg-yellow-200 dark:bg-yellow-700/30" />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  aria-label="Masuk dengan Google"
                  className="flex items-center justify-center gap-1.5 sm:gap-2 border border-base py-2 sm:py-2.5 rounded-lg bg-surface hover:bg-surface-alt transition-colors text-sm"
                  suppressHydrationWarning={true}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 533.5 544.3"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  >
                    <path
                      fill="#4285f4"
                      d="M533.5 278.4c0-18.6-1.5-36.6-4.3-54H272v102.3h146.9c-6.3 34-25 62.8-53.4 82v68.2h86.3c50.4-46.4 81.7-114.8 81.7-198.5z"
                    />
                    <path
                      fill="#34a853"
                      d="M272 544.3c72.6 0 133.6-24.1 178.2-65.3l-86.3-68.2c-24 16.1-54.8 25.6-91.9 25.6-70.7 0-130.6-47.7-152.1-111.7H30.1v70.3C74.4 492 166.7 544.3 272 544.3z"
                    />
                    <path
                      fill="#fbbc04"
                      d="M119.9 323.7c-10.6-31.5-10.6-65.6 0-97.1V156.2H30.1c-39.6 77.1-39.6 169.6 0 246.7l89.8-79.2z"
                    />
                    <path
                      fill="#ea4335"
                      d="M272 107.6c39.6 0 75.2 13.6 103.2 40.3l77.4-77.4C405.6 24.2 344.6 0 272 0 166.7 0 74.4 52.3 30.1 133.8l89.8 79.2C141.4 155.3 201.3 107.6 272 107.6z"
                    />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  aria-label="Masuk dengan Twitter"
                  className="flex items-center justify-center gap-1.5 sm:gap-2 border border-base py-2 sm:py-2.5 rounded-lg bg-surface hover:bg-surface-alt transition-colors text-sm"
                  suppressHydrationWarning={true}
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2a10 10 0 100 20 10 10 0 000-20z"
                      fill="#1DA1F2"
                    />
                  </svg>
                  Twitter
                </button>
              </div>

              <p className="text-center text-card-yellow-secondary text-xs sm:text-sm mt-3 sm:mt-4">
                Belum punya akun?
                <Link
                  href="/register"
                  className="ml-1.5 sm:ml-2 inline-block accent-text font-semibold px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm border border-accent/30 rounded-full hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  Daftar
                </Link>
              </p>

              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-yellow-200 dark:border-yellow-700/30">
                <p className="text-center text-card-yellow-secondary text-xs sm:text-sm mb-2 sm:mb-3">
                  Masuk sebagai Reseller?
                </p>
                <Link
                  href="/reseller/login"
                  className="w-full block text-center btn-secondary font-semibold py-2 px-4 text-sm rounded-lg"
                >
                  Masuk Sebagai Reseller
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
