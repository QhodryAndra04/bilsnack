import supabase from '../../lib/supabase';
import * as auth from '../../lib/auth';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const user = auth.verifyToken({ headers: { get: () => `Bearer ${token}` } });

    const url = new URL(request.url);
    const excludeSelf = url.searchParams.get('excludeSelf') === '1';

    let query = supabase
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        username,
        email,
        reseller_profiles (store_name)
      `)
      .eq('role', 'reseller');

    if (excludeSelf) {
      query = query.neq('id', user.id);
    }

    const { data: resellers, error } = await query;

    if (error) throw error;

    return Response.json(resellers);
  } catch (error) {
    console.error('Fetch resellers error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}