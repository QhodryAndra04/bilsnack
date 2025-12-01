"use client";

import PageLoading from "../components/PageLoading";

export default function AdminLoading() {
  return (
    <PageLoading
      text="Memuat Admin Panel..."
      subText="Mohon tunggu sebentar"
      variant="snack"
      size="lg"
    />
  );
}
