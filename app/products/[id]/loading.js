"use client";

import PageLoading from "../../components/PageLoading";

export default function ProductDetailLoading() {
  return (
    <PageLoading
      text="Memuat detail produk..."
      subText="Mengambil informasi produk"
      variant="snack"
      size="lg"
    />
  );
}
