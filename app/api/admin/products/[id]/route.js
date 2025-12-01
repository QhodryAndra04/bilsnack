import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';
import { verifyToken, requireAdmin } from '@/app/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = verifyToken(request);
    requireAdmin(user);

    const { id } = await params;

    // Get product by ID
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        users!products_reseller_id_fkey (
          id,
          first_name,
          last_name,
          email,
          reseller_profiles (
            store_name
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error in GET /api/admin/products/[id]:', error);
    const status = error.message === 'Invalid token' || error.message === 'Missing or invalid Authorization header' ? 401 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = verifyToken(request);
    requireAdmin(user);

    const { id } = await params;
    const updateData = await request.json();

    // Update product
    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error in PUT /api/admin/products/[id]:', error);
    const status = error.message === 'Invalid token' || error.message === 'Missing or invalid Authorization header' ? 401 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = verifyToken(request);
    requireAdmin(user);

    const { id } = await params;

    // Delete product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/products/[id]:', error);
    const status = error.message === 'Invalid token' || error.message === 'Missing or invalid Authorization header' ? 401 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }
}