import { NextResponse } from 'next/server';
import supabase from '../../lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    // Handle Telegram webhook here, e.g., process messages
    // For now, just log and respond
    console.log('Telegram webhook received:', body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}