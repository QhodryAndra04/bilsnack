import supabase from '../../lib/supabase';
import * as auth from '../../lib/auth';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const user = auth.verifyToken({ headers: { get: () => `Bearer ${token}` } });

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return Response.json(orders);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const user = auth.verifyToken({ headers: { get: () => `Bearer ${token}` } });

    const body = await request.json();
    const {
      customer,
      items,
      subtotal,
      discount,
      total,
      paymentMethod,
      shippingMethod,
      sellerId,
      sellerName
    } = body;

    // Validation
    if (!customer || typeof customer !== 'object') {
      return Response.json({ error: 'Customer information is required' }, { status: 400 });
    }
    if (!customer.name || !customer.email || !customer.phone || !customer.address || !customer.city || !customer.postalCode) {
      return Response.json({ error: 'Complete customer information is required' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Order must have at least one item' }, { status: 400 });
    }
    for (const item of items) {
      if (!item.productId || !item.name || !item.unit_price || !item.quantity) {
        return Response.json({ error: 'Each item must have productId, name, unit_price, and quantity' }, { status: 400 });
      }
      if (item.quantity <= 0 || item.unit_price < 0) {
        return Response.json({ error: 'Invalid item quantity or price' }, { status: 400 });
      }
    }
    if (subtotal !== undefined && (isNaN(Number(subtotal)) || Number(subtotal) < 0)) {
      return Response.json({ error: 'Subtotal must be a non-negative number' }, { status: 400 });
    }
    if (total !== undefined && (isNaN(Number(total)) || Number(total) < 0)) {
      return Response.json({ error: 'Total must be a non-negative number' }, { status: 400 });
    }
    if (!paymentMethod || typeof paymentMethod !== 'string') {
      return Response.json({ error: 'Payment method is required' }, { status: 400 });
    }
    if (!shippingMethod || typeof shippingMethod !== 'string') {
      return Response.json({ error: 'Shipping method is required' }, { status: 400 });
    }

    // Calculate total from items if not provided
    let calculatedTotal = total || 0;
    if (!total && items) {
      calculatedTotal = items.reduce((sum, item) => sum + (item.total_price || item.unit_price * item.quantity), 0);
    }

    const shippingAddress = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      province: customer.province,
      postalCode: customer.postalCode,
    };

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        province: customer.province,
        postal_code: customer.postalCode,
        subtotal: subtotal || calculatedTotal,
        discount: discount || 0,
        delivery_fee: 0, // Will be calculated based on shipping method
        total: calculatedTotal,
        status: 'pending',
        metadata: JSON.stringify({
          payment_method: paymentMethod,
          shipping_method: shippingMethod,
          seller_id: sellerId,
          seller_name: sellerName,
        }),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Insert order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      name: item.name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      total_price: item.total_price || item.unit_price * item.quantity,
      selected_options: item.selected_options || null,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return Response.json({ orderId: order.id, order }, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}