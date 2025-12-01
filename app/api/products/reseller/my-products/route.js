import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';
import { verifyToken, requireReseller } from '@/app/lib/auth';

export async function GET(request) {
  try {
    const user = verifyToken(request);
    requireReseller(user);

    // Get products owned by this reseller
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('reseller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reseller products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error in GET /api/products/reseller/my-products:', error);
    const status = error.message === 'Invalid token' || error.message === 'Missing or invalid Authorization header' ? 401 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request) {
  try {
    const user = verifyToken(request);
    requireReseller(user);

    const body = await request.json();
    const { name, description, price, stock, category, images } = body;

    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        description: description || null,
        price,
        stock: stock || 0,
        category: category || null,
        images: images || [],
        in_stock: Number(stock) > 0,
        reseller_id: user.id,
        is_approved: false, // Reseller products need approval
        seller_name: 'Toko Reseller'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reseller product:', error);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/products/reseller/my-products:', error);
    const status = error.message === 'Invalid token' || error.message === 'Missing or invalid Authorization header' ? 401 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }
}