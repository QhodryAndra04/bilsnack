import supabase from '../../lib/supabase';
import { sanitizeImages, sanitizeColors, sanitizeInStock } from '../../utils/validate';
import * as auth from '../../lib/auth';

export async function GET(request) {
  try {
    const { data: rows, error } = await supabase
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
      .or('reseller_id.is.null,is_approved.eq.true')
      .order('id', { ascending: false });

    if (error) throw error;

    const parsed = (rows || []).map((r) => {
      const images = sanitizeImages(r.images) || [];
      const colors = sanitizeColors(r.colors) || [];
      const rp = r.users?.reseller_profiles;
      let storeNameRaw = null;
      if (Array.isArray(rp)) storeNameRaw = rp[0]?.store_name;
      else if (rp && typeof rp === 'object') storeNameRaw = rp.store_name;
      const storeName = storeNameRaw && typeof storeNameRaw === 'string' ? storeNameRaw.trim() : null;
      const sellerName = r.reseller_id ? (storeName || 'Toko Reseller') : 'BillSnack Store';
      return {
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
        is_approved: r.is_approved === true || r.is_approved === 1,
        colors,
        sellerName,
        resellerId: r.reseller_id,
        createdAt: r.created_at,
      };
    });
    return Response.json(parsed, {
      headers: {
        'Cache-Control': 'public, s-maxage=300', // Cache for 5 minutes
      },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to fetch products' }, { status: 500 });
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
    const { name, description, price, stock, category, images, originalPrice, rating, reviewCount, colors, resellerId } = body;

    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        description: description || null,
        price,
        stock: stock || 0,
        category: category || null,
        images: sanitizeImages(images) || [],
        original_price: originalPrice !== undefined ? originalPrice : null,
        rating: rating !== undefined ? rating : 0,
        review_count: reviewCount !== undefined ? reviewCount : 0,
        colors: sanitizeColors(colors) || [],
        in_stock: Number(stock) > 0,
        reseller_id: resellerId || null,
        is_approved: true,
        seller_name: resellerId ? 'Toko Reseller' : 'BillSnack Store'
      })
      .select(`
        *,
        users:reseller_id (
          first_name,
          last_name,
          email,
          reseller_profiles (store_name)
        )
      `)
      .single();

    if (error) throw error;

    const r = data;
    const rp = r.users?.reseller_profiles;
    let storeNameRaw = null;
    if (Array.isArray(rp)) storeNameRaw = rp[0]?.store_name;
    else if (rp && typeof rp === 'object') storeNameRaw = rp.store_name;
    const storeName = storeNameRaw && typeof storeNameRaw === 'string' ? storeNameRaw.trim() : null;
    const sellerName = r.reseller_id ? (storeName || 'Toko Reseller') : 'BillSnack Store';

    const parsed = {
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      stock: r.stock,
      category: r.category,
      images: r.images || [],
      originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
      rating: r.rating !== null ? Number(r.rating) : 0,
      reviewCount: r.review_count || 0,
      colors: r.colors || [],
      sellerName,
      resellerId: r.reseller_id,
      createdAt: r.created_at,
    };
    return Response.json(parsed, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
