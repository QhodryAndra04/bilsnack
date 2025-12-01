import supabase from '../../../lib/supabase';
import * as auth from '../../../lib/auth';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const user = auth.verifyToken({ headers: { get: () => `Bearer ${token}` } });

    if (user.role !== 'reseller') {
      return Response.json({ error: 'Reseller privileges required' }, { status: 403 });
    }

    const { data: connections, error } = await supabase
      .from('reseller_connections')
      .select(`
        *,
        connected_user:user_b (
          first_name,
          last_name,
          username,
          reseller_profiles (store_name)
        )
      `)
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

    if (error) throw error;

    const connectionIds = connections.map(c => c.user_a === user.id ? c.user_b : c.user_a);

    return Response.json({ connections: connectionIds });
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

    if (user.role !== 'reseller') {
      return Response.json({ error: 'Reseller privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const { connectedUserId } = body;

    const { data, error } = await supabase
      .from('reseller_connections')
      .insert({
        user_a: user.id,
        user_b: connectedUserId,
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json(data, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}