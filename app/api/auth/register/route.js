import { register } from '../../../lib/auth.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await register(body);
    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}