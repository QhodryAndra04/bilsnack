import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';
import { verifyToken, requireAdmin } from '@/app/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = verifyToken(request);
    requireAdmin(user);

    const { id } = params;
    const { tracking_number, tracking_provider, tracking_history } = await request.json();

    if (!tracking_number) {
      return NextResponse.json({ error: 'Tracking number is required' }, { status: 400 });
    }

    // Update order tracking
    const updateData = {
      tracking_number,
      updated_at: new Date().toISOString()
    };

    if (tracking_provider) {
      updateData.tracking_provider = tracking_provider;
    }

    if (tracking_history) {
      updateData.tracking_history = tracking_history;
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order tracking:', error);
      return NextResponse.json({ error: 'Failed to update order tracking' }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error in PUT /api/orders/[id]/tracking:', error);
    const status = error.message === 'Invalid token' || error.message === 'Missing or invalid Authorization header' ? 401 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }
}