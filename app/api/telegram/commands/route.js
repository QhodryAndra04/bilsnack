import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const commands = [
      { command: '/start', description: 'Mulai bot dan tampilkan bantuan' },
      { command: '/stock', description: 'Lihat semua produk & stock' },
      { command: '/harga [nama_barang]', description: 'Cek harga produk' },
      { command: '/cek_barang [nama]', description: 'Cek detail produk' },
      { command: '/stock_tersedia', description: 'Lihat produk yang tersedia' },
      { command: '/stock_habis', description: 'Lihat produk yang habis' },
      { command: '/bantuan', description: 'Tampilkan bantuan' },
      { command: '/help', description: 'Tampilkan bantuan' },
    ];

    return NextResponse.json({ commands });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}