import supabase from '../../../lib/supabase';
import { sanitizeImages, sanitizeColors } from '../../../utils/validate';
import * as auth from '../../../lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { data: r, error } = await supabase
      .from('products')
      .select(`
        *,
        users:reseller_id (
          first_name,
          last_name,
          email,
          reseller_profiles (store_name)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !r) return Response.json({ error: 'Product not found' }, { status: 404 });

    // Hide unapproved reseller products from public
    if (r.reseller_id && !r.is_approved) return Response.json({ error: 'Product not found' }, { status: 404 });

    const images = sanitizeImages(r.images) || [];
    const colors = sanitizeColors(r.colors) || [];
    const rp = r.users?.reseller_profiles;
    let storeNameRaw = null;
    if (Array.isArray(rp)) storeNameRaw = rp[0]?.store_name;
    else if (rp && typeof rp === 'object') storeNameRaw = rp.store_name;
    const storeName = storeNameRaw && typeof storeNameRaw === 'string' ? storeNameRaw.trim() : null;
    const sellerName = r.reseller_id ? (storeName || 'Toko Reseller') : 'BillSnack Store';

    const out = {
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      stock: r.stock,
      category: r.category,
      images,
      originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
      rating: r.rating !== null ? Number(r.rating) : 0,
      reviewCount: r.review_count || 0,
      colors,
      is_approved: r.is_approved === true,
      sellerName,
      resellerId: r.reseller_id,
      createdAt: r.created_at,
    };
    return Response.json(out);
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const user = auth.verifyToken({ headers: { get: () => `Bearer ${token}` } });

    const { id } = await params;

    // Check if product exists and get its reseller_id
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('reseller_id')
      .eq('id', id)
      .single();

    if (fetchError || !product) return Response.json({ error: 'Product not found' }, { status: 404 });

    // Allow admin or the reseller who owns the product
    if (user.role !== 'admin' && !(user.role === 'reseller' && product.reseller_id === user.id)) {
      return Response.json({ error: 'Insufficient privileges' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, stock, category, images, originalPrice, rating, reviewCount, colors, resellerId, isApproved, in_stock } = body;

    const updates = {
      name,
      description: description || null,
      price,
      stock,
      category: category || null,
      images: sanitizeImages(images) || [],
      original_price: originalPrice !== undefined ? originalPrice : null,
      rating: rating !== undefined ? rating : 0,
      review_count: reviewCount !== undefined ? reviewCount : 0,
      colors: sanitizeColors(colors) || [],
      in_stock: in_stock !== undefined ? in_stock : (Number(stock) > 0),
      reseller_id: resellerId || null,
      is_approved: isApproved === true,
    };

    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const user = auth.verifyToken({ headers: { get: () => `Bearer ${token}` } });

    const { id } = await params;

    // Check if product exists and get its reseller_id
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('reseller_id')
      .eq('id', id)
      .single();

    if (fetchError || !product) return Response.json({ error: 'Product not found' }, { status: 404 });

    // Allow admin or the reseller who owns the product
    if (user.role !== 'admin' && !(user.role === 'reseller' && product.reseller_id === user.id)) {
      return Response.json({ error: 'Insufficient privileges' }, { status: 403 });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}