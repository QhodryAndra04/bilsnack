import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase';
import { verifyToken } from '../../../lib/auth';

export async function POST(request) {
  try {
    const decoded = verifyToken(request);
    const userId = decoded.id;

    const body = await request.json();
    const { chat_id, telegram_username } = body;

    if (!chat_id) {
      return NextResponse.json({ error: 'chat_id is required' }, { status: 400 });
    }

    // Check if user is reseller
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || user.role !== 'reseller') {
      return NextResponse.json({ error: 'Only resellers can register Telegram' }, { status: 403 });
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('telegram_users')
      .select('id')
      .eq('user_id', userId)
      .eq('bot_type', 'reseller')
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already registered' }, { status: 400 });
    }

    // Insert
    const { error } = await supabase
      .from('telegram_users')
      .insert({
        user_id: userId,
        chat_id: chat_id,
        telegram_username: telegram_username || null,
        bot_type: 'reseller'
      });

    if (error) throw error;

    return NextResponse.json({ message: 'Registered successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}