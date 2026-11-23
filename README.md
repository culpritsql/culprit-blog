# Culprit SQL Blog (`culpritsql.com/blog`)

Code-first engineering blog for [Culprit SQL](https://culpritsql.com/blog/), built with **Astro 5**, **MDX**, **React 19**, and [`@culpritsql/plan-viewer`](https://github.com/culpritsql/culprit-plan-viewer).

## Writing a Post

Add a new `.mdx` file under `src/content/blog/<slug>.mdx` with frontmatter:

```yaml
---
title: "Post Title"
description: "One-sentence plain summary."
pubDate: 2026-11-23
author: "Cristian Pufu"
readingMinutes: 6
tags: ["SQL Server", "PostgreSQL"]
---
```

Interactive execution plans, Before/After diffs, and deadlock graphs parse at build time via `@culpritsql/plans` (Node WebAssembly) and hydrate on scroll via `@culpritsql/plan-viewer` React islands so readers never download a multi-megabyte `.wasm` binary just to read an article.

## Commands

```sh
bun install
bun run dev      # http://localhost:4322/blog/
bun test         # validates frontmatter, links, and prose rules
bun run build    # outputs static HTML, RSS, posts.json, and raw .md files to dist/
```

## License

MIT License. Copyright (c) 2026 Cristian Pufu.
