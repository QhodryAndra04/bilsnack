import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';
import { verifyToken, requireReseller } from '@/app/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = verifyToken(request);
    requireReseller(user);

    const { id } = await params;

    // First check if the product belongs to this reseller
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('reseller_id', user.id)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error in GET /api/products/reseller/[id]:', error);
    const status = error.message === 'Invalid token' || error.message === 'Missing or invalid Authorization header' ? 401 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = verifyToken(request);
    requireReseller(user);

    const { id } = await params;
    const body = await request.json();
    const { name, description, price, stock, category, images } = body;

    // First check if the product belongs to this reseller
    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('reseller_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (existing.reseller_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        name,
        description: description || null,
        price,
        stock: stock || 0,
        category: category || null,
        images: images || [],
        in_stock: Number(stock) > 0,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reseller product:', error);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/products/reseller/[id]:', error);
    const status = error.message === 'Invalid token' || error.message === 'Missing or invalid Authorization header' ? 401 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }
}