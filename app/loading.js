"use client";

import PageLoading from "./components/PageLoading";

export default function Loading() {
  return (
    <PageLoading
      text="Memuat halaman..."
      subText="Mohon tunggu sebentar"
      variant="snack"
      size="lg"
    />
  );
}
