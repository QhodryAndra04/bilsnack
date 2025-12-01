"use client";

import PageLoading from "../components/PageLoading";

export default function ProfileLoading() {
  return (
    <PageLoading
      text="Memuat profil..."
      subText="Mengambil data profilmu"
      variant="snack"
      size="lg"
    />
  );
}
