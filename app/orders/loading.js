"use client";

import PageLoading from "../components/PageLoading";

export default function OrdersLoading() {
  return (
    <PageLoading
      text="Memuat riwayat pesanan..."
      subText="Mengambil data pesananmu"
      variant="snack"
      size="lg"
    />
  );
}
