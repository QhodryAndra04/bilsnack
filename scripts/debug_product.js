/* eslint-env node */
// Debug script to inspect a product's reseller linkage and store_name.
// Usage: node server/scripts/debug_product.js <productId>
const supabase = require('../supabase');

(async () => {
  const productId = process.argv[2] || '2';
  console.log(`Inspecting product id=${productId}`);
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        users:reseller_id (
          id,
          email,
          first_name,
          last_name,
          reseller_profiles (store_name)
        )
      `)
      .eq('id', productId)
      .single();
    if (error) {
      console.error('Error fetching product:', error);
      process.exit(1);
    }
    if (!product) {
      console.log('Product not found');
      process.exit(0);
    }
    const rp = product.users?.reseller_profiles;
    let storeNameRaw = null;
    if (Array.isArray(rp) && rp.length > 0) storeNameRaw = rp[0]?.store_name; else if (rp && typeof rp === 'object') storeNameRaw = rp.store_name;
    const storeName = storeNameRaw && typeof storeNameRaw === 'string' ? storeNameRaw.trim() : null;
    console.log('Product core fields:', {
      id: product.id,
      name: product.name,
      reseller_id: product.reseller_id,
      stored_seller_name: product.seller_name,
      is_approved: product.is_approved,
    });
    console.log('Derived store_name:', storeName);
    if (product.reseller_id && !storeName) {
      console.log('NOTE: reseller_id present but store_name missing -> need reseller_profiles row.');
    } else if (!product.reseller_id) {
      console.log('NOTE: reseller_id is null -> product treated as admin product, sellerName will be BillSnack Store.');
    } else {
      console.log('Store name exists and should appear in frontend as sellerName.');
    }
    process.exit(0);
  } catch (e) {
    console.error('Unexpected error:', e);
    process.exit(1);
  }
})();
