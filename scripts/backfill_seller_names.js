/* Backfill seller_name for existing reseller products (strict store_name only) */
/* eslint-env node */
const supabase = require('../supabase');

(async () => {
  console.log('Starting strict backfill of seller_name (store_name only)...');
  const { data: products, error: fetchErr } = await supabase
    .from('products')
    .select('id,reseller_id,seller_name')
    .is('seller_name', null)
    .not('reseller_id', 'is', null);

  if (fetchErr) {
    console.error('Failed fetching products needing backfill', fetchErr);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('No products require seller_name backfill.');
    process.exit(0);
  }

  console.log(`Found ${products.length} products to update.`);

  let updated = 0;
  for (const p of products) {
    const resellerId = p.reseller_id;
    const { data: rp, error: rpErr } = await supabase
      .from('reseller_profiles')
      .select('store_name')
      .eq('user_id', resellerId);
    if (rpErr) {
      console.error(`Failed fetching reseller profile for product ${p.id}`, rpErr);
      continue;
    }
    let storeName = null;
    if (Array.isArray(rp) && rp.length > 0) storeName = rp[0]?.store_name; else if (rp && typeof rp === 'object') storeName = rp.store_name;
    storeName = (storeName && typeof storeName === 'string') ? storeName.trim() : null;
    const sellerNamePersist = storeName || 'Toko Reseller';

    const { error: updErr } = await supabase
      .from('products')
      .update({ seller_name: sellerNamePersist })
      .eq('id', p.id);

    if (updErr) {
      console.error(`Failed to update product ${p.id}`, updErr);
    } else {
      updated += 1;
      console.log(`Updated product ${p.id} -> seller_name='${sellerNamePersist}'`);
    }
  }

  console.log(`Backfill complete. Updated ${updated} products.`);
  process.exit(0);
})();
