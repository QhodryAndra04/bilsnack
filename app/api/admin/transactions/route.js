import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';
import { verifyToken, requireAdmin } from '@/app/lib/auth';

export async function GET(request) {
  try {
    const user = verifyToken(request);
    requireAdmin(user);

    // Get all orders/transactions
    const { data: transactions, error } = await supabase
      .from('orders')
      .select(`
        *,
        users!user_id (
          id,
          first_name,
          last_name,
          email,
          role
        ),
        order_items (
          quantity,
          unit_price,
          total_price,
          products (
            price
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions', details: error.message }, { status: 500 });
    }

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error in GET /api/admin/transactions:', error);
    const status = error.message === 'Invalid token' || error.message === 'Missing or invalid Authorization header' ? 401 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }
}