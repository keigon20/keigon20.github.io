// Usage: npm run new -- "My post title" [--report]
import { existsSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const report = args.includes('--report');
const title = args.filter((a) => a !== '--report').join(' ').trim();
if (!title) {
  console.error('Usage: npm run new -- "My post title" [--report]');
  process.exit(1);
}

const slug = title.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-') || 'post';
const file = `src/content/notes/${slug}.md`;
if (existsSync(file)) {
  console.error(`${file} already exists`);
  process.exit(1);
}

const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local time
writeFileSync(
  file,
  `---
title: ${JSON.stringify(title)}
date: ${today}
summary: ""
kind: ${report ? 'report' : 'post'}
tags: []
draft: true
---

Start writing here.
`,
);
console.log(`Created ${file} (draft). Set draft: false to publish.`);
