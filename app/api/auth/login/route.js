import { login } from '../../../lib/auth.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await login(body);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 401 });
  }
}