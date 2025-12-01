import supabase from '../../../../lib/supabase';
import * as auth from '../../../../lib/auth';

export async function DELETE(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const user = auth.verifyToken({ headers: { get: () => `Bearer ${token}` } });

    if (user.role !== 'reseller') {
      return Response.json({ error: 'Reseller privileges required' }, { status: 403 });
    }

    const { id } = params;

    const { error } = await supabase
      .from('reseller_connections')
      .delete()
      .eq('id', id)
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`); // Ensure ownership

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}