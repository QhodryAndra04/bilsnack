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

    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        products!inner (
          id,
          name,
          images,
          reseller_id,
          price
        ),
        orders (
          id,
          created_at,
          user_id
        )
      `)
      .eq('products.reseller_id', user.id);

    if (error) throw error;

    // Aggregate by product
    const productMap = new Map();

    orderItems.forEach(item => {
      const productId = item.products.id;
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          id: productId,
          name: item.products.name,
          price: item.products.price,
          totalQuantitySold: 0,
          orderCount: 0,
          totalRevenue: 0,
          images: item.products.images,
        });
      }
      const product = productMap.get(productId);
      product.totalQuantitySold += item.quantity;
      product.totalRevenue += item.quantity * item.products.price;
      // Count unique orders
      if (!product.orders) product.orders = new Set();
      product.orders.add(item.orders.id);
    });

    const soldProducts = Array.from(productMap.values()).map(p => ({
      ...p,
      orderCount: p.orders.size,
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);

    return Response.json(soldProducts);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}