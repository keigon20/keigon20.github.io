import { collections, parse } from '../../_lib/collections';
import { isAdmin, json, requireAdminWrite, type Env } from '../../_lib/auth';

type Ctx = { request: Request; env: Env; params: { collection: string; id: string } };

function lookup(params: Ctx['params']) {
  const c = collections[params.collection];
  const id = Number(params.id);
  return c && Number.isInteger(id) && id > 0 ? { c, id } : null;
}

// GET /api/:collection/:id (posts also accept a slug)
export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const c = collections[params.collection];
  if (!c) return json({ error: 'Not found' }, 404);
  const byId = /^\d+$/.test(params.id);
  if (!byId && !c.slugFrom) return json({ error: 'Not found' }, 404);
  const admin = await isAdmin(request, env);
  const extra = !admin && c.publicWhere ? ` AND ${c.publicWhere}` : '';
  const row = await env.DB.prepare(`SELECT * FROM ${c.table} WHERE ${byId ? 'id' : 'slug'} = ?${extra}`)
    .bind(byId ? Number(params.id) : params.id).first();
  return row ? json({ item: row }) : json({ error: 'Not found' }, 404);
};

// PUT /api/:collection/:id — full update
export const onRequestPut = async ({ request, env, params }: Ctx) => {
  const t = lookup(params);
  if (!t) return json({ error: 'Not found' }, 404);
  const denied = await requireAdminWrite(request, env);
  if (denied) return denied;

  const parsed = parse(t.c, await request.json().catch(() => null));
  if ('error' in parsed) return json({ error: parsed.error }, 400);
  const cols = Object.keys(parsed.values);
  const set = cols.map((k) => `${k} = ?`).concat(t.c.touchUpdatedAt ? ["updated_at = datetime('now')"] : []).join(', ');
  const row = await env.DB.prepare(`UPDATE ${t.c.table} SET ${set} WHERE id = ? RETURNING *`)
    .bind(...Object.values(parsed.values), t.id).first();
  return row ? json({ item: row }) : json({ error: 'Not found' }, 404);
};

// DELETE /api/:collection/:id
export const onRequestDelete = async ({ request, env, params }: Ctx) => {
  const t = lookup(params);
  if (!t) return json({ error: 'Not found' }, 404);
  if (!(await isAdmin(request, env))) return json({ error: 'Not signed in' }, 401);
  await env.DB.prepare(`DELETE FROM ${t.c.table} WHERE id = ?`).bind(t.id).run();
  return json({ ok: true });
};
