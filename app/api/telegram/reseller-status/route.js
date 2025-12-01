import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase';
import { verifyToken } from '../../../lib/auth';

export async function GET(request) {
  try {
    const decoded = verifyToken(request);
    const userId = decoded.id;

    // Check if user is reseller
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || user.role !== 'reseller') {
      return NextResponse.json({ error: 'Only resellers can check status' }, { status: 403 });
    }

    // Get telegram user
    const { data: telegramUser, error } = await supabase
      .from('telegram_users')
      .select('chat_id, telegram_username')
      .eq('user_id', userId)
      .eq('bot_type', 'reseller')
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found

    const isLinked = !!telegramUser;

    return NextResponse.json({
      is_linked: isLinked,
      chat_id: telegramUser?.chat_id || null,
      telegram_username: telegramUser?.telegram_username || null
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}