"use client";

import PageLoading from "../components/PageLoading";

export default function ResellerLoading() {
  return (
    <PageLoading
      text="Memuat Reseller Panel..."
      subText="Mohon tunggu sebentar"
      variant="snack"
      size="lg"
    />
  );
}
