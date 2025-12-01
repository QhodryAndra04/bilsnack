import { verifyToken, updateProfile } from '../../../lib/auth.js';

export async function PUT(request) {
  try {
    const user = verifyToken(request);
    const body = await request.json();
    const result = await updateProfile(user.id, body);
    return Response.json(result);
  } catch (error) {
    const status = error.message === 'Invalid token' || error.message === 'Missing or invalid Authorization header' ? 401 : 400;
    return Response.json({ error: error.message }, { status });
  }
}