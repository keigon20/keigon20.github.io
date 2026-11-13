import { collections, parse, slugify, uniqueSlug } from '../../_lib/collections';
import { isAdmin, json, requireAdminWrite, type Env } from '../../_lib/auth';

type Ctx = { request: Request; env: Env; params: { collection: string } };

// GET /api/:collection — list (drafts included only for the admin)
export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const c = collections[params.collection];
  if (!c) return json({ error: 'Not found' }, 404);
  const admin = await isAdmin(request, env);
  const where = !admin && c.publicWhere ? `WHERE ${c.publicWhere}` : '';
  const { results } = await env.DB.prepare(`SELECT * FROM ${c.table} ${where} ORDER BY ${c.order}`).all();
  return json({ items: results, admin });
};

// POST /api/:collection — create
export const onRequestPost = async ({ request, env, params }: Ctx) => {
  const c = collections[params.collection];
  if (!c) return json({ error: 'Not found' }, 404);
  const denied = await requireAdminWrite(request, env);
  if (denied) return denied;

  const parsed = parse(c, await request.json().catch(() => null));
  if ('error' in parsed) return json({ error: parsed.error }, 400);
  const values = { ...parsed.values };
  if (c.slugFrom) values.slug = await uniqueSlug(env.DB, c.table, slugify(String(values[c.slugFrom])));

  const cols = Object.keys(values);
  const row = await env.DB.prepare(
    `INSERT INTO ${c.table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')}) RETURNING *`,
  ).bind(...Object.values(values)).first();
  return json({ item: row }, 201);
};
