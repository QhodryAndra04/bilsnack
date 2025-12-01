"use client";

import PageLoading from "../components/PageLoading";

export default function ShopLoading() {
  return (
    <PageLoading
      text="Memuat produk..."
      subText="Mencari cemilan terbaik untukmu"
      variant="snack"
      size="lg"
    />
  );
}
