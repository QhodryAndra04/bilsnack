import supabase from '../../../../lib/supabase';

export async function GET(request, { params }) {
  try {
    const { productId } = params;

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        users (
          first_name,
          last_name,
          username
        )
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return Response.json(reviews);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}