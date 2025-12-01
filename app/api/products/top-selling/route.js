import supabase from '../../../lib/supabase';
import { sanitizeImages, sanitizeColors } from '../../../utils/validate';

export async function GET(request) {
  try {
    // Get all order items with product info (only approved products)
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        products!inner(
          *,
          users:reseller_id (
            first_name,
            last_name,
            email,
            reseller_profiles (store_name)
          )
        )
      `);

    if (error) throw error;

    // Aggregate by product and filter approved products
    const productMap = {};
    (orderItems || []).forEach(item => {
      const product = item.products;
      const pid = item.product_id;

      // Only include approved reseller products or admin products (null reseller_id)
      if (product && (product.reseller_id === null || product.is_approved === true)) {
        if (!productMap[pid]) {
          productMap[pid] = {
            ...product,
            sold_qty: 0
          };
        }
        productMap[pid].sold_qty += item.quantity || 0;
      }
    });

    const sorted = Object.values(productMap)
      .sort((a, b) => b.sold_qty - a.sold_qty);

    const parsed = sorted.map((r) => {
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
        colors,
        sellerName,
        createdAt: r.created_at,
        soldQty: Number(r.sold_qty || 0),
      };
    });
    return Response.json(parsed);
  } catch (err) {
    console.error('Failed to fetch top-selling products', err);
    return Response.json({ error: 'Failed to fetch top-selling products' }, { status: 500 });
  }
}