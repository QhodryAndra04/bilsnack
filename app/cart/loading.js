"use client";

import PageLoading from "../components/PageLoading";

export default function CartLoading() {
  return (
    <PageLoading
      text="Memuat keranjang..."
      subText="Menyiapkan pesananmu"
      variant="snack"
      size="lg"
    />
  );
}
