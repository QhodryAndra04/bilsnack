/*
  seed_order_for_user.js
  - Creates a test order for a specific user ID
  - Use this to test order history functionality
*/
const supabase = require('../lib/supabase');

async function seedOrder() {
  try {
    const userId = 6; // User ID from the log

    // Create a test order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        email: 'test@example.com',
        name: 'Test User',
        phone: '08123456789',
        address: 'Test Address',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postal_code: '12345',
        subtotal: 50000,
        discount: 0,
        delivery_fee: 10000,
        total: 60000,
        status: 'completed',
        metadata: JSON.stringify({
          payment_method: 'qris',
          shipping_method: 'jne',
          seller_id: null,
          seller_name: 'Admin Store',
        }),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) throw orderError;

    console.log('Order created:', order.id);

    // Create order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: 1, // Assuming product ID 1 exists
        name: 'Test Product',
        unit_price: 50000,
        quantity: 1,
        total_price: 50000,
        selected_options: null,
      });

    if (itemsError) throw itemsError;

    console.log('Order items created');

    // Fetch and display the order
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    console.log('Current orders for user', userId, ':', orders.length);
    console.log('Order details:', JSON.stringify(orders[0], null, 2));

  } catch (error) {
    console.error('Error seeding order:', error);
  }
}

if (require.main === module) seedOrder();