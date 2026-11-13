import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Blog posts and reports: one Markdown file per entry in src/content/notes/.
// The file name becomes the URL: src/content/notes/my-post.md -> /notes/my-post
const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
    kind: z.enum(['post', 'report']).default('post'),
    tags: z.array(z.string()).default([]),
    // Drafts show up in `npm run dev` but are left out of the built site.
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes };
