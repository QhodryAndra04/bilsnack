/* eslint-env node */
// Assign a reseller (user_id) to an existing product and set seller_name from reseller_profiles.store_name.
// Usage: node server/scripts/assign_reseller_to_product.js <productId> <resellerUserId>
const supabase = require('../supabase');

(async () => {
  const productId = process.argv[2];
  const resellerUserId = process.argv[3];
  if (!productId || !resellerUserId) {
    console.error('Usage: node server/scripts/assign_reseller_to_product.js <productId> <resellerUserId>');
    process.exit(1);
  }
  console.log(`Assigning reseller user_id=${resellerUserId} to product id=${productId}`);
  try {
    // Verify product exists
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    if (prodErr || !product) {
      console.error('Product not found or fetch error:', prodErr);
      process.exit(1);
    }

    // Fetch store_name
    const { data: rp, error: rpErr } = await supabase
      .from('reseller_profiles')
      .select('store_name')
      .eq('user_id', resellerUserId);
    if (rpErr) {
      console.error('Error fetching reseller profile:', rpErr);
      process.exit(1);
    }
    let storeNameRaw = null;
    if (Array.isArray(rp) && rp.length > 0) storeNameRaw = rp[0]?.store_name; else if (rp && typeof rp === 'object') storeNameRaw = rp.store_name;
    const storeName = storeNameRaw && typeof storeNameRaw === 'string' ? storeNameRaw.trim() : null;
    const sellerNamePersist = storeName || 'Toko Reseller';

    const { error: updErr } = await supabase
      .from('products')
      .update({ reseller_id: resellerUserId, seller_name: sellerNamePersist })
      .eq('id', productId);
    if (updErr) {
      console.error('Failed updating product:', updErr);
      process.exit(1);
    }
    console.log(`✓ Updated product ${productId} reseller_id=${resellerUserId}, seller_name='${sellerNamePersist}'`);
    process.exit(0);
  } catch (e) {
    console.error('Unexpected error:', e);
    process.exit(1);
  }
})();
