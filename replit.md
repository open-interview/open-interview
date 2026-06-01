# Open Interview — Technical Interview Prep Platform

## Astro Blog — GitHub Pages Static Site

A standalone Astro v4 blog at `blog-astro/` that publishes all 121 transformed posts to `https://open-interview.github.io`.

### Stack
- **Astro v4** — static site generator (`blog-astro/`)
- **Tailwind CSS v4** — via `@tailwindcss/vite` Vite plugin (no `tailwind.config.js` needed)
- **`@tailwindcss/typography`** — prose styling for markdown content
- **Shiki** — syntax highlighting (`github-dark` theme)
- **Mermaid.js** — architecture diagrams rendered client-side
- **`@astrojs/rss`** — RSS 2.0 feed at `/rss.xml`
- Manual sitemap at `/sitemap.xml` (replaces `@astrojs/sitemap` which had a v4 incompatibility)

### Key files
| Path | Purpose |
|------|---------|
| `blog-astro/astro.config.mjs` | Astro config: Tailwind v4 Vite plugin, Shiki |
| `blog-astro/postcss.config.mjs` | Overrides workspace root PostCSS config (prevents Tailwind v3 conflict) |
| `blog-astro/src/content/config.ts` | Content collection schema (Zod) |
| `blog-astro/src/layouts/BaseLayout.astro` | HTML shell, SEO meta, fonts |
| `blog-astro/src/layouts/BlogPost.astro` | Post layout: TOC, reading progress bar, Mermaid, prev/next |
| `blog-astro/src/pages/index.astro` | Blog listing with client-side category filter |
| `blog-astro/src/pages/blog/[slug].astro` | Static post pages |
| `blog-astro/src/pages/tag/[tag].astro` | Per-tag listing pages |
| `blog-astro/src/pages/sitemap.xml.ts` | Auto-generated XML sitemap |
| `blog-astro/src/pages/rss.xml.ts` | RSS 2.0 feed |
| `blog-astro/src/styles/global.css` | Tailwind v4 CSS (`@import "tailwindcss"`, prose overrides) |
| `scripts/export-to-astro.mjs` | JSON → Markdown export (121 posts, Node.js built-ins only) |
| `.github/workflows/deploy-astro-blog.yml` | CI/CD: export → build → GitHub Pages |

### Build pipeline (CI)
```
push to main (blog data or blog-astro/**)
  → node scripts/export-to-astro.mjs          # JSON → 121 .md files
  → cd blog-astro && npm ci && npm run build   # Astro static build (325 pages)
  → upload dist/ → actions/deploy-pages@v4
```

### Local workflow
```bash
# Export posts (re-run after blog-data.json changes)
node scripts/export-to-astro.mjs

# Preview the blog locally
cd blog-astro && npm run dev        # http://localhost:4321
cd blog-astro && npm run build      # produces dist/
cd blog-astro && npm run preview    # serve the dist/
```

### Tailwind v4 / PostCSS conflict fix
The workspace root has a `postcss.config.js` that uses `tailwindcss: {}` (v3 PostCSS syntax).
`blog-astro/postcss.config.mjs` is an intentional empty override that prevents Vite from
picking up the workspace PostCSS config. Tailwind v4 CSS is processed by `@tailwindcss/vite`
(Vite plugin), not PostCSS.

### Generated files (gitignored)
- `blog-astro/src/content/blog/*.md` — rebuilt from `client/public/blog-data.json` in CI
- `blog-astro/dist/` — Astro build output, uploaded to GitHub Pages

---

## Blog Post Transformation (121 posts)

All 121 blog posts in `client/public/blog-data.json` have been batch-transformed into clean, structured markdown.

### Pipeline
- **Script**: `scripts/transform-blog-posts.mjs` — 20 parallel workers, idempotency-guarded
- **Validation**: `scripts/validate-posts.mjs` — 0 errors, 27 minor warnings
- **Original data checkpoint**: git `45530b4d9ee6259dcb0b33f564883560f5fd07c9`

### Stats (final run)
- 121/121 transformed successfully
- 121/121 fully noise-free (no Share This / References / Did you know?)
- 104/121 have bullet lists (term:def paragraphs → `- **Term:** def`)
- 97/121 have `## Key Takeaways` sections
- 119/121 have properly-fenced mermaid diagrams
- 0 errors

### Template structure
```
intro paragraph(s)
## Section Name
prose or - **Term:** definition bullet lists
## <Section> Flow
\`\`\`mermaid ... \`\`\`
## Key Takeaways
- bullet items
## Wrapping Up
conclusion
```

### MarkdownRenderer enhancements (`client/src/components/blog/MarkdownRenderer.tsx`)
- **`## Key Takeaways`** — renders as accent-colored heading with decorative dividers (✦)
- **`> **Case Study —`** blockquotes** — render as teal card callouts with header/body layout
- **Citation removal** — handles comma-separated patterns `2 , 4 .` and `1 , 2 , 6 ,.`
- **`preprocessBlogContent`** — safety-net preprocessing still runs as no-op on clean data

---

# code-reels — Interview Prep Platform

## Events Dashboard

A static events tracking system for all GitHub Actions activity:

- **`client/public/data/events.json`** — Static event log (committed to repo, served as static file)
- **`script/log-event.js`** — Node.js script called by GitHub Actions after each significant step
- **`client/src/pages/EventsDashboard.tsx`** — React page at `/events` with timeline + stats + chart
- Route registered in `App.tsx` at `/events`; nav link added to Sidebar.tsx "Progress" section

### How it works
Each GitHub Actions workflow (ci-cd.yml, social.yml, content.yml) calls `node script/log-event.js` at the end of key jobs with `--type`, `--title`, `--status`, `--workflow`, `--description`, `--meta` flags. The script appends to events.json and the workflow commits it with `[skip ci]`. The static site is rebuilt on the next real push, picking up all events.

### Event types tracked
`deploy`, `bot_run`, `question_added`, `blog_published`, `linkedin_post`, `linkedin_poll`, `analytics`, `maintenance`, `community`, `quality`, `learning_path`, `certification`, `voice_session`, `flashcard`, `challenge`

### v1.1 upgrades
- Each event now carries a `links: [{label, url}]` array with direct references to outputs (blog post, LinkedIn activity, live site, GH Actions run, data files, question channels)
- `script/log-event.js` accepts `--links` JSON flag; auto-appends GitHub Actions run link from `GITHUB_RUN_ID`
- `EventsDashboard.tsx` now has two views: **Timeline** (event cards with inline link chips) and **Audit Table** (full sortable table with CSV export, pagination, expandable detail rows)
- All workflow event hooks updated to pass real resource URLs as links

## Active Recall System

Active recall is embedded across all major learning surfaces. New files added:

- `client/src/components/shared/RecallRatingBar.tsx` — Reusable 4-button (Again/Hard/Good/Easy) recall rating UI
- `client/src/hooks/use-recall-session.ts` — Cross-surface session stat aggregation (sessionStorage)
- `client/src/components/question/RecallGate.tsx` — Frosted gate that hides the answer until user clicks reveal
- `client/src/components/blog/BlogKnowledgeCheck.tsx` — Post-article knowledge check with hints and recall tracking
- `client/src/data/blog-quizzes.ts` — Quiz data (3 questions per post) for 8+ blog posts

### Modified files
- `QuestionViewer.tsx` — "Recall" toggle in toolbar (default ON); hides answer behind RecallGate per question
- `AnswerPanel.tsx` — Self-assessment rating banner appears before TL;DR on every answer
- `Flashcards.tsx` — Rating buttons disabled until card is flipped; recall textarea on back; instruction on front
- `PostDetailPage.tsx` — Knowledge Check section injected after article body (when quiz data exists)
- `VoiceInterview.tsx` — Keywords hidden by default with "Reveal" button; progressive nudge hints during recording

## Architecture

Full-stack TypeScript application:
- **Frontend**: React + Vite (client/)
- **Backend**: Express (server/)
- **Data**: JSON file-based storage (`data/` + `client/public/data/`)
- **Scripts**: 40+ Node.js ESM scripts in `script/` for AI content generation bots, plus consolidated pipeline at `script/pipeline/`

## Data Storage

All data is stored as JSON files. No database service is needed.

- **Source questions**: `data/questions/{channel}.json`
- **Frontend data**: `client/public/data/{channel}.json`
- **Vector embeddings**: `data/vectors/questions.json`
- **Blog posts**: `data/blog-posts.json`
- **Voice sessions**: `client/public/data/voice-sessions.json`

### Key data files
- `client/public/data/channels.json` — channel list with metadata
- `client/public/data/*.json` — per-channel question files (93 channels)
- `certifications` — certification prep content
- `coding_challenges` — coding practice problems
- `learning_paths` — curated learning paths
- `voice_sessions` — voice interview sessions
- `user_sessions` — user progress tracking
- `question_history` — full audit trail of all changes
- `bot_runs` / `bot_ledger` / `work_queue` — bot execution tracking

## Script Utilities

All 40+ scripts use file-based JSON storage via `script/db/db.js` (`getDb()`),
which provides a SQL-like CRUD interface over JSON arrays. No database service needed.

The consolidated content pipeline lives at `script/pipeline/`.

## Blog — Astro Static Site (blog/)

The public engineering blog is a separate Astro v5 workspace that generates a fully static site from the MDX posts in `content/posts/`.

### Structure
```
blog/
  astro.config.mjs       — Astro config (outDir: ../blog-output, mdx, sitemap)
  postcss.config.js      — Empty PostCSS config (avoids picking up root Tailwind)
  src/
    content/config.ts    — Astro Content Layer schema (glob loader → content/posts/*.mdx)
    styles/global.css    — GitHub-dark theme, CSS variables, full dark/light mode
    layouts/
      Layout.astro       — Base layout (dark mode, GA4, Mermaid CDN, OG/Twitter/JSON-LD)
      BlogPost.astro     — Article layout (progress bar, TOC, sources, sharing)
    components/
      Header.astro       — Site header with nav and theme toggle
      ArticleCard.astro  — Post card for index/channel pages
      TableOfContents.astro — TOC extracted from headings
    pages/
      index.astro        — Homepage (hero, filter bar, client-side search)
      404.astro          — Custom 404 page
      feed.xml.js        — RSS 2.0 feed (no @astrojs/rss dep — generates raw XML)
      posts/[id]/[slug]/index.astro — 150 static post routes
      channels/index.astro          — All channels listing
      channels/[channel]/index.astro — Per-channel post list
```

### Content schema (content/posts/*.mdx)
Required: `title`, `slug` | Optional: `id`, `channel`, `category`, `difficulty`, `tags`, `publishedAt`, `createdAt`, `excerpt`, `funFact`, `images[]`, `sources[]`, `author`, `coverImage`, `featured`, `readingTimeMinutes`

The schema uses `.transform()` to derive `id` from `slug` and `channel` from `category` when missing (handles 5 legacy posts).

### MDX content sanitization
150 MDX posts may contain bare prose with `<placeholder>`, `{expression}`, `<=` patterns. A Python sanitization pass at write-time (+ `mdxProseSanitizer` Vite plugin in astro.config.mjs as safety net) escapes all of these in prose sections, preserving fenced code blocks and inline code spans verbatim.

### Build commands
```bash
pnpm blog:build       # Build static site → blog-output/
pnpm blog:dev         # Dev server on port 4321
```

### Output
- **`blog-output/`** — 188 static HTML files (150 posts + 36 channels + index + feeds)
- URL structure: `/posts/{id}/{slug}/` — identical to the old SSG
- CSS: Bundled into `_astro/*.css` (18KB, linked from every page)
- Node.js requirement: >= 18.17.1 (Astro 5; NOT Astro 6 which needs Node 22)

---

## GitHub Actions

All workflows (content.yml, community.yml, maintenance.yml, social.yml, deploy-blog.yml) use:
```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Set the `DATABASE_URL` secret in GitHub → Settings → Secrets to point to your production PostgreSQL instance.

The `lfs: true` checkout option has been removed from all workflows — no binary database files are tracked in the repo.

## Migration History

Previously used SQLite via `@libsql/client` / Turso, then PostgreSQL. Migrated to JSON file-based storage to eliminate database dependencies entirely.

All data now lives as JSON files under `data/` and `client/public/data/`.

## Development

```bash
npm run dev        # Start both Express + Vite servers
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | AI content generation |
| `LINKEDIN_ACCESS_TOKEN` / `LINKEDIN_PERSON_URN` | Social posting |
| `GH_TOKEN` | GitHub Actions cross-repo operations |
