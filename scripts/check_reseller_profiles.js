/**
 * Script untuk cek dan update reseller profiles
 * Jalankan: node scripts/check_reseller_profiles.js
 */

require('dotenv').config();
const supabase = require('../supabase');

async function checkResellerProfiles() {
  try {
    console.log('\n=== CHECKING RESELLER PROFILES ===\n');

    // 1. Get all resellers
    const { data: resellers, error: resellersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role')
      .eq('role', 'reseller');

    if (resellersError) throw resellersError;

    console.log(`Found ${resellers?.length || 0} resellers\n`);

    // 2. Check their profiles
    for (const reseller of resellers || []) {
      console.log(`\n📋 Reseller: ${reseller.email} (ID: ${reseller.id})`);
      console.log(`   Name: ${reseller.first_name} ${reseller.last_name}`);

      const { data: profile, error: profileError } = await supabase
        .from('reseller_profiles')
        .select('*')
        .eq('user_id', reseller.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error(`   ❌ Error fetching profile:`, profileError.message);
        continue;
      }

      if (!profile) {
        console.log(`   ⚠️  No reseller profile found`);
        console.log(`   Creating profile with default store name...`);
        
        // Create profile with default store name
        const defaultStoreName = `${reseller.first_name || 'Toko'} ${reseller.last_name || 'Reseller'}`.trim();
        
        const { error: insertError } = await supabase
          .from('reseller_profiles')
          .insert({
            user_id: reseller.id,
            store_name: defaultStoreName,
            phone: null,
            address: null
          });

        if (insertError) {
          console.error(`   ❌ Failed to create profile:`, insertError.message);
        } else {
          console.log(`   ✅ Created profile with store_name: "${defaultStoreName}"`);
        }
      } else {
        console.log(`   Store Name: ${profile.store_name || '(empty)'}`);
        console.log(`   Phone: ${profile.phone || '(empty)'}`);
        console.log(`   Address: ${profile.address || '(empty)'}`);

        // Update if store_name is empty
        if (!profile.store_name || profile.store_name.trim() === '') {
          const defaultStoreName = `${reseller.first_name || 'Toko'} ${reseller.last_name || 'Reseller'}`.trim();
          console.log(`   ⚠️  Store name is empty, updating to: "${defaultStoreName}"`);
          
          const { error: updateError } = await supabase
            .from('reseller_profiles')
            .update({ store_name: defaultStoreName })
            .eq('user_id', reseller.id);

          if (updateError) {
            console.error(`   ❌ Failed to update:`, updateError.message);
          } else {
            console.log(`   ✅ Updated store_name to: "${defaultStoreName}"`);
          }
        } else {
          console.log(`   ✅ Profile OK`);
        }
      }

      // 3. Check products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, seller_name')
        .eq('reseller_id', reseller.id);

      if (productsError) {
        console.error(`   ❌ Error fetching products:`, productsError.message);
      } else {
        console.log(`   Products: ${products?.length || 0}`);
        if (products && products.length > 0) {
          products.slice(0, 3).forEach(p => {
            console.log(`      - ${p.name} (seller_name: ${p.seller_name || 'null'})`);
          });
        }
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log('Check complete! All resellers should now have store names.');
    console.log('\nTo manually set a store name, use:');
    console.log('UPDATE reseller_profiles SET store_name = \'Nama Toko\' WHERE user_id = X;\n');

  } catch (err) {
    console.error('\n❌ Script error:', err);
  }
}

if (require.main === module) {
  checkResellerProfiles()
    .then(() => process.exit(0))
    .catch((e) => { 
      console.error(e); 
      process.exit(1); 
    });
}

module.exports = { checkResellerProfiles };
