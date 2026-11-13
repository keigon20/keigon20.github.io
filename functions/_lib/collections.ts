// Declarative collections. Table and column names come only from this file, never from user input.
type Field =
  | { type: 'string'; required?: boolean; max: number; default?: string }
  | { type: 'enum'; values: string[]; default: string }
  | { type: 'bool'; default: boolean }
  | { type: 'int' | 'number'; required?: boolean; min: number; max: number; default?: number | null }
  | { type: 'date'; required?: boolean };

interface Collection {
  table: string;
  order: string;
  fields: Record<string, Field>;
  /** Extra WHERE clause for visitors who aren't signed in. */
  publicWhere?: string;
  /** Generate a unique slug from this field on create. */
  slugFrom?: string;
  touchUpdatedAt?: boolean;
}

export const collections: Record<string, Collection> = {
  posts: {
    table: 'posts',
    order: 'created_at DESC, id DESC',
    publicWhere: 'published = 1',
    slugFrom: 'title',
    touchUpdatedAt: true,
    fields: {
      title: { type: 'string', required: true, max: 200 },
      kind: { type: 'enum', values: ['post', 'report'], default: 'post' },
      body: { type: 'string', max: 200_000, default: '' },
      published: { type: 'bool', default: false },
    },
  },
  concerts: {
    table: 'concerts',
    order: 'date DESC, id DESC',
    fields: {
      artist: { type: 'string', required: true, max: 200 },
      venue: { type: 'string', max: 200, default: '' },
      city: { type: 'string', max: 120, default: '' },
      date: { type: 'date', required: true },
      rating: { type: 'int', min: 1, max: 5, default: null },
      notes: { type: 'string', max: 5000, default: '' },
    },
  },
  rounds: {
    table: 'rounds',
    order: 'date DESC, id DESC',
    fields: {
      date: { type: 'date', required: true },
      course: { type: 'string', required: true, max: 200 },
      tees: { type: 'string', max: 60, default: '' },
      rating: { type: 'number', required: true, min: 50, max: 90 },
      slope: { type: 'int', required: true, min: 55, max: 155 },
      score: { type: 'int', required: true, min: 18, max: 200 },
      pcc: { type: 'int', min: -1, max: 3, default: 0 },
      notes: { type: 'string', max: 2000, default: '' },
    },
  },
};

export function parse(c: Collection, input: any): { values: Record<string, unknown> } | { error: string } {
  if (!input || typeof input !== 'object') return { error: 'Invalid body' };
  const values: Record<string, unknown> = {};
  for (const [name, f] of Object.entries(c.fields)) {
    let v = input[name];
    const empty = v === undefined || v === null || v === '';
    switch (f.type) {
      case 'string':
        if (empty) { if (f.required) return { error: `${name} is required` }; v = f.default ?? ''; break; }
        v = String(v).trim();
        if (f.required && !v) return { error: `${name} is required` };
        if ((v as string).length > f.max) return { error: `${name} is too long` };
        break;
      case 'enum':
        v = empty ? f.default : String(v);
        if (!f.values.includes(v as string)) return { error: `${name} must be one of ${f.values.join(', ')}` };
        break;
      case 'bool':
        v = empty ? (f.default ? 1 : 0) : (v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0);
        break;
      case 'int':
      case 'number': {
        if (empty) { if (f.required) return { error: `${name} is required` }; v = f.default ?? null; break; }
        const n = Number(v);
        if (!Number.isFinite(n) || (f.type === 'int' && !Number.isInteger(n))) return { error: `${name} must be a ${f.type === 'int' ? 'whole number' : 'number'}` };
        if (n < f.min || n > f.max) return { error: `${name} must be between ${f.min} and ${f.max}` };
        v = n;
        break;
      }
      case 'date':
        if (empty) { if (f.required) return { error: `${name} is required` }; v = null; break; }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v)) || Number.isNaN(Date.parse(String(v)))) return { error: `${name} must be YYYY-MM-DD` };
        v = String(v);
        break;
    }
    values[name] = v;
  }
  return { values };
}

export function slugify(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').slice(0, 80) || 'post';
}

export async function uniqueSlug(db: any, table: string, base: string): Promise<string> {
  let slug = base;
  for (let i = 2; await db.prepare(`SELECT 1 FROM ${table} WHERE slug = ?`).bind(slug).first(); i++) slug = `${base}-${i}`;
  return slug;
}
