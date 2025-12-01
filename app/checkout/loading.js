"use client";

import PageLoading from "../components/PageLoading";

export default function CheckoutLoading() {
  return (
    <PageLoading
      text="Menyiapkan checkout..."
      subText="Memproses pesananmu"
      variant="snack"
      size="lg"
    />
  );
}
