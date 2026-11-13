import { getCollection, type CollectionEntry } from 'astro:content';

export type Note = CollectionEntry<'notes'>;

/** Published notes, newest first. Drafts are included only in dev. */
export async function getNotes(): Promise<Note[]> {
  const all = await getCollection('notes', ({ data }) => import.meta.env.DEV || !data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export const readingMinutes = (body = '') => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 220));

export const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** Serializable summary passed to the desktop's Notes app. */
export interface NoteSummary {
  slug: string;
  title: string;
  date: string;
  summary: string;
  kind: 'post' | 'report';
  tags: string[];
  draft: boolean;
  minutes: number;
  html: string;
}

export const toSummary = (n: Note): NoteSummary => ({
  slug: n.id,
  title: n.data.title,
  date: fmtDate(n.data.date),
  summary: n.data.summary ?? '',
  kind: n.data.kind,
  tags: n.data.tags,
  draft: n.data.draft,
  minutes: readingMinutes(n.body),
  html: n.rendered?.html ?? '',
});
