# Open Interview — Technical Interview Prep Platform

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
- **Database**: PostgreSQL (Replit built-in)
- **ORM**: Drizzle ORM with `drizzle-orm/node-postgres` dialect
- **Scripts**: 40+ Node.js ESM scripts in `script/` for AI content generation bots

## Database

**PostgreSQL** — provisioned via Replit's built-in database service.

Connection is via the `DATABASE_URL` environment variable (auto-set by Replit).
Individual `PG*` variables (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`) are also available.

### Schema
Defined in `shared/schema.ts` using `drizzle-orm/pg-core`.

To push schema changes:
```bash
npx drizzle-kit push
```

### Key tables
- `questions` — core interview questions
- `flashcards` — spaced-repetition flash cards
- `blog_posts` — generated blog articles
- `certifications` — certification prep content
- `coding_challenges` — coding practice problems
- `learning_paths` — curated learning paths
- `voice_sessions` — voice interview sessions
- `user_sessions` — user progress tracking
- `question_history` — full audit trail of all changes
- `bot_runs` / `bot_ledger` / `work_queue` — bot execution tracking

## Script Utilities

All 40+ scripts share a unified PostgreSQL client via `script/db/pg-client.js`.

This wrapper:
- Converts `?` positional placeholders → PostgreSQL `$1, $2, ...` automatically
- Silently ignores SQLite PRAGMA statements
- Auto-appends `RETURNING id` to bare INSERT statements for `lastInsertRowid` compat
- Works with `DATABASE_URL` or individual `PG*` env vars

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

Previously used SQLite via `@libsql/client` / Turso. Migrated to PostgreSQL to eliminate GitHub LFS dependency on binary `.db` files.

- All `@libsql/client` imports replaced with `pg` / `drizzle-orm/node-postgres`
- All `SQLITE_URL` / `SQLITE_AUTH_TOKEN` references replaced with `DATABASE_URL`
- All Turso-specific workflow env vars removed

## Development

```bash
npm run dev        # Start both Express + Vite servers
npx drizzle-kit push  # Sync schema to database
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Primary PostgreSQL connection string |
| `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE` | Individual connection params |
| `OPENAI_API_KEY` | AI content generation |
| `LINKEDIN_ACCESS_TOKEN` / `LINKEDIN_PERSON_URN` | Social posting |
| `GH_TOKEN` | GitHub Actions cross-repo operations |
