import supabase from '../../../lib/supabase';
import * as auth from '../../../lib/auth';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const user = auth.verifyToken({ headers: { get: () => `Bearer ${token}` } });

    if (user.role !== 'reseller') {
      return Response.json({ error: 'Reseller privileges required' }, { status: 403 });
    }

    // Get total quantity sold and total earnings from completed transactions
    const { data: sales } = await supabase
      .from('order_items')
      .select('quantity, orders!inner(status), products!inner(reseller_id, price)')
      .eq('products.reseller_id', user.id)
      .eq('orders.status', 'completed');

    const totalSold = sales?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const totalEarnings = sales?.reduce((sum, item) => sum + (item.quantity * item.products.price), 0) || 0;

    return Response.json({
      totalSold,
      totalEarnings,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}