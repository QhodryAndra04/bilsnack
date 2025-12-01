require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStoreName() {
  try {
    const { data, error } = await supabase
      .from('reseller_profiles')
      .select('*')
      .eq('user_id', 3)
      .single();

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('\n=== RESELLER PROFILE (user_id: 3) ===');
    console.log('Store Name:', data.store_name);
    console.log('Phone:', data.phone);
    console.log('Address:', data.address);
    console.log('Created:', data.created_at);
    console.log('Updated:', data.updated_at);
    console.log('\nFull data:', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('Exception:', err);
  }
}

checkStoreName();
