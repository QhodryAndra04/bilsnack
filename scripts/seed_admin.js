/*
  Seed script to create or update an admin user in the Supabase `users` table.
  Usage (from server folder):
    node scripts/seed_admin.js
  
  Or with custom credentials:
    ADMIN_EMAIL=admin@billsnack.id ADMIN_PASSWORD=admin123 node scripts/seed_admin.js

  This script uses bcrypt to hash the password and the project's Supabase client
*/
require('dotenv').config();
const supabase = require('../supabase');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = process.env.SALT_ROUNDS ? Number(process.env.SALT_ROUNDS) : 10;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@billsnack.id';
// Default password: 'admin123' — override with ADMIN_PASSWORD env var if you prefer
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function upsertAdmin() {
  try {
    console.log('\n🔍 Checking if admin user exists...');
    console.log('Email:', ADMIN_EMAIL);
    
    // Check if admin already exists
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', ADMIN_EMAIL)
      .single();

    // Generate password hash
    const hash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

    if (existingUser && !selectError) {
      // Admin exists, update password and role
      console.log(`\n✓ Admin user exists (id=${existingUser.id}), updating password and role...`);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: hash,
          role: 'admin',
          is_active: true
        })
        .eq('id', existingUser.id);

      if (updateError) throw updateError;
      
      console.log('✓ Admin user updated successfully!');
      console.log('\n📧 Email:', ADMIN_EMAIL);
      console.log('🔑 Password:', ADMIN_PASSWORD);
    } else {
      // Admin doesn't exist, create new
      console.log('\n✓ Admin user not found - creating new admin user...');
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email: ADMIN_EMAIL,
          password_hash: hash,
          first_name: 'Admin',
          last_name: 'BillSnack',
          role: 'admin',
          is_active: true
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      console.log('✓ Admin created successfully with id:', newUser.id);
      console.log('\n📧 Email:', ADMIN_EMAIL);
      console.log('🔑 Password:', ADMIN_PASSWORD);
    }
    
    console.log('\n✅ Done! You can now login with these credentials.\n');
  } catch (err) {
    console.error('\n❌ Failed to upsert admin:', err.message);
    if (err.details) console.error('Details:', err.details);
    if (err.hint) console.error('Hint:', err.hint);
    process.exitCode = 2;
  }
}

if (require.main === module) {
  upsertAdmin()
    .then(() => process.exit(0))
    .catch((e) => { 
      console.error(e); 
      process.exit(1); 
    });
}

