import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';
import { verifyToken, requireAdmin } from '@/app/lib/auth';

export async function GET(request) {
  try {
    const user = verifyToken(request);
    requireAdmin(user);

    // Get all resellers (users with role 'reseller')
    const { data: resellers, error } = await supabase
      .from('users')
      .select(`
        *,
        reseller_profiles (store_name)
      `)
      .eq('role', 'reseller')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resellers:', error);
      return NextResponse.json({ error: 'Failed to fetch resellers', details: error.message }, { status: 500 });
    }

    // Calculate real statistics for each reseller
    const resellersWithStats = await Promise.all(
      resellers.map(async (reseller) => {
        // Count products for this reseller
        const { count: totalProducts, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('reseller_id', reseller.id);

        // Calculate total sales (sum of quantities from order_items for this reseller's products)
        const { data: orderItems, error: salesError } = await supabase
          .from('order_items')
          .select('quantity')
          .in('product_id',
            (await supabase
              .from('products')
              .select('id')
              .eq('reseller_id', reseller.id)
            ).data?.map(p => p.id) || []
          );

        const totalSales = orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

        return {
          ...reseller,
          totalProducts: totalProducts || 0,
          totalSales: totalSales
        };
      })
    );

    return NextResponse.json(resellersWithStats);
  } catch (error) {
    console.error('Error in GET /api/admin/resellers:', error);
    const status = error.message === 'Invalid token' || error.message === 'Missing or invalid Authorization header' ? 401 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PUT(request) {
  try {
    const user = verifyToken(request);
    requireAdmin(user);

    const body = await request.json();
    const { id, is_active } = body;

    const { data, error } = await supabase
      .from('users')
      .update({ is_active })
      .eq('id', id)
      .eq('role', 'reseller')
      .select();

    if (error) {
      console.error('Error updating reseller:', error);
      return NextResponse.json({ error: 'Failed to update reseller', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error in PUT /api/admin/resellers:', error);
    const status = error.message === 'Invalid token' || error.message === 'Missing or invalid Authorization header' ? 401 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(request) {
  try {
    const user = verifyToken(request);
    requireAdmin(user);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Reseller ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .eq('role', 'reseller');

    if (error) {
      console.error('Error deleting reseller:', error);
      return NextResponse.json({ error: 'Failed to delete reseller', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Reseller deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/resellers:', error);
    const status = error.message === 'Invalid token' || error.message === 'Missing or invalid Authorization header' ? 401 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }
}