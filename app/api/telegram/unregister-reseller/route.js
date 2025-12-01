import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase';
import { verifyToken } from '../../../lib/auth';

export async function DELETE(request) {
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
      return NextResponse.json({ error: 'Only resellers can unregister Telegram' }, { status: 403 });
    }

    // Delete
    const { error } = await supabase
      .from('telegram_users')
      .delete()
      .eq('user_id', userId)
      .eq('bot_type', 'reseller');

    if (error) throw error;

    return NextResponse.json({ message: 'Unregistered successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}