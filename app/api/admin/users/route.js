import supabase from '../../../lib/supabase';
import * as auth from '../../../lib/auth';
import bcrypt from 'bcrypt';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const user = auth.verifyToken({ headers: { get: () => `Bearer ${token}` } });

    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select(`
        *,
        reseller_profiles (
          store_name,
          phone,
          address
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to include reseller profile fields
    const transformedUsers = users.map(user => ({
      ...user,
      store_name: user.reseller_profiles?.[0]?.store_name || null,
      reseller_phone: user.reseller_profiles?.[0]?.phone || null,
      reseller_address: user.reseller_profiles?.[0]?.address || null,
    }));

    return Response.json(transformedUsers);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
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
    const { email, password, phone, address, store_name, role, firstName, lastName } = body;

    // Handle both old and new field formats
    const first_name = firstName || (store_name ? store_name.split(' ')[0] : '');
    const last_name = lastName || (store_name ? store_name.split(' ').slice(1).join(' ') : '');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        first_name,
        last_name,
        phone,
        address,
        role: role || 'user',
      })
      .select()
      .single();

    if (userError) throw userError;

    // If reseller, create reseller profile
    if (role === 'reseller' && store_name) {
      const { error: profileError } = await supabase
        .from('reseller_profiles')
        .insert({
          user_id: userData.id,
          store_name,
          phone,
          address,
        });

      if (profileError) {
        console.error('Error creating reseller profile:', profileError);
        // Don't throw, user is created
      }
    }

    return Response.json(userData, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}