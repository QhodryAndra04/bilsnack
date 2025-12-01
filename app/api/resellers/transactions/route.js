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

    // Get transactions for products sold by this reseller
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        products!inner (
          name,
          reseller_id,
          price
        ),
        orders (
          id,
          order_number,
          status,
          payment_method,
          created_at,
          users (
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('products.reseller_id', user.id);

    if (error) {
      console.error('Error fetching transactions:', error);
      return Response.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Group by order to avoid duplicates
    const orderMap = new Map();
    orderItems?.forEach(item => {
      const order = item.orders;
      if (!orderMap.has(order.id)) {
        orderMap.set(order.id, {
          ...order,
          order_items: [item]
        });
      } else {
        orderMap.get(order.id).order_items.push(item);
      }
    });

    const transactions = Array.from(orderMap.values()).sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );

    return Response.json(transactions);
  } catch (error) {
    console.error('Error in GET /api/resellers/transactions:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}