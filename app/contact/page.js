"use client";

import React from "react";

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[rgb(var(--surface))] via-[rgb(var(--surface-alt))] to-[rgb(var(--bg))] py-6 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[rgb(var(--text))] mb-2 sm:mb-4">
            Hubungi Kami
          </h1>
          <p className="text-sm sm:text-lg text-[rgb(var(--text-muted))]">
            Ada pertanyaan? Kami siap membantu Anda!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          {/* Contact Information */}
          <div className="bg-[rgb(var(--surface))] rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-300 border border-[rgb(var(--border))]">
            <h2 className="text-xl sm:text-2xl font-semibold text-[rgb(var(--text))] mb-4 sm:mb-6">
              Informasi Kontak
            </h2>

            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[rgb(var(--accent))]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[rgb(var(--accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-[rgb(var(--text))]">Email</h3>
                  <p className="text-sm sm:text-base text-[rgb(var(--text-muted))] break-all">support@bilsnack.id</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[rgb(var(--accent))]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[rgb(var(--accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-[rgb(var(--text))]">Telepon</h3>
                  <p className="text-sm sm:text-base text-[rgb(var(--text-muted))]">+62 812-3456-7890</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[rgb(var(--accent))]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[rgb(var(--accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-[rgb(var(--text))]">Alamat</h3>
                  <p className="text-sm sm:text-base text-[rgb(var(--text-muted))]">
                    Jl. Cemilan No. 123<br />
                    Jakarta Selatan, DKI Jakarta<br />
                    Indonesia 12345
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-[rgb(var(--surface))] rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-300 border border-[rgb(var(--border))]">
            <h2 className="text-xl sm:text-2xl font-semibold text-[rgb(var(--text))] mb-4 sm:mb-6">
              Kirim Pesan
            </h2>

            <form className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-[rgb(var(--text-muted))] mb-1 sm:mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-[rgb(var(--border))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))]/50 focus:border-[rgb(var(--accent))] bg-[rgb(var(--surface-alt))] text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-muted))]"
                  placeholder="Masukkan nama Anda"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-[rgb(var(--text-muted))] mb-1 sm:mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-[rgb(var(--border))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))]/50 focus:border-[rgb(var(--accent))] bg-[rgb(var(--surface-alt))] text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-muted))]"
                  placeholder="Masukkan email Anda"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-xs sm:text-sm font-medium text-[rgb(var(--text-muted))] mb-1 sm:mb-2">
                  Subjek
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-[rgb(var(--border))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))]/50 focus:border-[rgb(var(--accent))] bg-[rgb(var(--surface-alt))] text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-muted))]"
                  placeholder="Subjek pesan"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs sm:text-sm font-medium text-[rgb(var(--text-muted))] mb-1 sm:mb-2">
                  Pesan
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-[rgb(var(--border))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))]/50 focus:border-[rgb(var(--accent))] bg-[rgb(var(--surface-alt))] text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-muted))] resize-none"
                  placeholder="Tulis pesan Anda di sini..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-2.5 sm:py-3 px-6 rounded-lg font-semibold text-sm sm:text-base shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-xl)] transform hover:-translate-y-0.5"
              >
                Kirim Pesan
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;