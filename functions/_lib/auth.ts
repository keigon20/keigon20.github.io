// Single-user admin auth: password -> HMAC-signed, expiring session cookie.
export interface Env {
  DB: any; // D1Database
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
}

const COOKIE = 'session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const enc = new TextEncoder();

async function sign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function configured(env: Env) {
  return Boolean(env.ADMIN_PASSWORD && env.SESSION_SECRET && env.SESSION_SECRET.length >= 32);
}

export async function checkPassword(env: Env, password: string): Promise<boolean> {
  if (!configured(env) || typeof password !== 'string') return false;
  // Compare HMACs so the comparison length doesn't leak the password length.
  const [a, b] = await Promise.all([sign(env.SESSION_SECRET, password), sign(env.SESSION_SECRET, env.ADMIN_PASSWORD)]);
  return safeEqual(a, b);
}

export async function sessionCookie(env: Env, request: Request): Promise<string> {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  const value = `${exp}.${await sign(env.SESSION_SECRET, `admin.${exp}`)}`;
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}${secure}`;
}

export const clearCookie = `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;

export async function isAdmin(request: Request, env: Env): Promise<boolean> {
  if (!configured(env)) return false;
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, await sign(env.SESSION_SECRET, `admin.${exp}`));
}

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });

/** Writes must be JSON (blocks simple cross-site form posts) and come from an admin. */
export async function requireAdminWrite(request: Request, env: Env): Promise<Response | null> {
  if (!(request.headers.get('Content-Type') || '').includes('application/json')) return json({ error: 'Expected JSON' }, 415);
  if (!(await isAdmin(request, env))) return json({ error: 'Not signed in' }, 401);
  return null;
}
