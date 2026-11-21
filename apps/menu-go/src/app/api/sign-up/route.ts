import { signUp } from '../../../lib/sign-up';

// POST { email, password, name? } -> 201 {} | 400 { fieldErrors } | 409/500 { error }.
// A JSON route (not a server action) because /login lives in the Pages Router.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const { status, ...rest } = await signUp(body as Record<string, unknown>);
  return Response.json(rest, { status });
}
