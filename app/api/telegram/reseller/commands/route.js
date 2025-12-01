import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const commands = [
      { command: '/start', description: 'Mulai bot reseller dan tampilkan bantuan' },
      { command: '/produk_saya', description: 'Lihat produk saya' },
      { command: '/stok', description: 'Lihat stok produk saya' },
      { command: '/penjualan', description: 'Lihat informasi penjualan' },
      { command: '/pesanan', description: 'Lihat pesanan' },
      { command: '/bantuan', description: 'Tampilkan bantuan' },
      { command: '/help', description: 'Tampilkan bantuan' },
    ];

    return NextResponse.json({ commands });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}