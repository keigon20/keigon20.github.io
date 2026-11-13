import { checkPassword, clearCookie, isAdmin, json, sessionCookie, type Env } from '../_lib/auth';

type Ctx = { request: Request; env: Env };

// GET /api/session — am I signed in?
export const onRequestGet = async ({ request, env }: Ctx) => json({ admin: await isAdmin(request, env) });

// POST /api/session { password } — sign in
export const onRequestPost = async ({ request, env }: Ctx) => {
  if (!(request.headers.get('Content-Type') || '').includes('application/json')) return json({ error: 'Expected JSON' }, 415);
  const body: any = await request.json().catch(() => ({}));
  if (!(await checkPassword(env, body?.password))) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return json({ error: 'Wrong password' }, 401);
  }
  return json({ admin: true }, 200, { 'Set-Cookie': await sessionCookie(env, request) });
};

// DELETE /api/session — sign out
export const onRequestDelete = async () => json({ admin: false }, 200, { 'Set-Cookie': clearCookie });
