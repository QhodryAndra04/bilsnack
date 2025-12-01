import supabase from '../../../../lib/supabase';
import * as auth from '../../../../lib/auth';

export async function POST(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const user = auth.verifyToken({ headers: { get: () => `Bearer ${token}` } });

    if (user.role !== 'reseller') {
      return Response.json({ error: 'Reseller privileges required' }, { status: 403 });
    }

    const { id: targetId } = await params;

    // Check if connection already exists
    const { data: existing, error: checkError } = await supabase
      .from('reseller_connections')
      .select('id')
      .or(`and(user_a.eq.${user.id},user_b.eq.${targetId}),and(user_a.eq.${targetId},user_b.eq.${user.id})`)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw checkError;
    }

    let connected = false;

    if (existing) {
      // Disconnect: delete the connection
      const { error: deleteError } = await supabase
        .from('reseller_connections')
        .delete()
        .eq('id', existing.id);

      if (deleteError) throw deleteError;
      connected = false;
    } else {
      // Connect: create the connection
      const { error: insertError } = await supabase
        .from('reseller_connections')
        .insert({
          user_a: user.id,
          user_b: targetId,
        });

      if (insertError) throw insertError;
      connected = true;
    }

    return Response.json({ connected });
  } catch (error) {
    console.error('Toggle connect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}