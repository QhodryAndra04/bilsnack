import supabase from '../../lib/supabase';
import * as auth from '../../lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) return Response.json({ error: 'Product ID required' }, { status: 400 });

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

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const user = auth.verifyToken({ headers: { get: () => `Bearer ${token}` } });

    const body = await request.json();
    const { productId, rating, comment } = body;

    // Validation
    if (!productId || isNaN(Number(productId))) {
      return Response.json({ error: 'Valid product ID is required' }, { status: 400 });
    }
    if (rating === undefined || rating === null || isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return Response.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 });
    }
    if (comment !== undefined && (typeof comment !== 'string' || comment.trim().length === 0)) {
      return Response.json({ error: 'Comment must be a non-empty string if provided' }, { status: 400 });
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        product_id: Number(productId),
        rating: Number(rating),
        comment: comment ? comment.trim() : null,
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json(review, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}