---
title: Hello, world
date: 2026-11-12
summary: A starter post showing what Markdown can do here. Edit or delete it.
kind: post
tags: [meta]
draft: true
---

This is a **draft**, so it only shows up while running `npm run dev`. Set `draft: false` (or delete the line) to publish it.

## Writing a post

Create a new one with:

```sh
npm run new -- "My post title"
```

That makes `src/content/notes/my-post-title.md` with the front matter filled in.

## What works

- Headings, lists, **bold**, *italics* and [links](https://example.com)
- Code blocks with syntax highlighting
- Images: put them in `public/notes/` and write `![alt text](/notes/photo.jpg)`
- Tables:

| Pitch | Velo | Spin |
|---|---|---|
| FF | 84.1 | 2210 |
| SL | 74.5 | 2430 |

> Set `kind: report` for longer write-ups; they get a "Report" label.
