import supabase from '../../../lib/supabase';
import * as auth from '../../../lib/auth';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const user = auth.verifyToken({ headers: { get: () => `Bearer ${token}` } });

    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        users!reseller_id (
          first_name,
          last_name,
          email,
          reseller_profiles (store_name)
        )
      `)
      .order('id', { ascending: false });

    if (error) throw error;

    return Response.json(products);
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

    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, category, price, stock, description, images, sellerName } = body;

    // Create product (admin products don't have reseller_id)
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name,
        category,
        price,
        stock,
        description,
        images,
        in_stock: stock > 0,
        is_approved: true // Admin products are auto-approved
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to create product' }, { status: 500 });
    }

    return Response.json(product);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}