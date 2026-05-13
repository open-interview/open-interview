# Refactor Progress

Last updated: 2026-05-12T12:45

| Task | Status | Notes |
|------|--------|-------|
| 1. Fix deployment conflicts | ✅ Done | deploy-astro-blog.yml + deploy-blog.yml disabled; ci-cd.yml concurrency → deploy-production |
| 2. Split data/tests.json | ✅ Done | 93 channel files in data/tests/; fetch-questions-for-build.js + generate-tests-from-channels.js updated |
| 3. Split data/blog-posts.json + wipe | ✅ Done | 126 posts split to data/blog-posts/{id}.json; content/posts wiped; blog-storage-local.ts reads directory |
| 4. Remove DB layer from server | ✅ Done | repositories → file reads; routes.ts clean; shared/schema.ts types-only; server/index.ts clean; DB packages removed from package.json |
| 5. Remove DB layer from content pipeline | ✅ Done | All 30+ scripts rewritten to file I/O; script/db/ deleted; pg-client.js dependency eliminated |
| 6. Rewrite content.yml | ✅ Done | 847→450 lines; all postgres services/seed/merge/export jobs removed; simplified to checkout→run→commit |
| 7. Upgrade blog generation prompt | ✅ Done | blog.js prompt now requires realWorldCase, diagrams, code examples, 8+ refs; quality gates added |
| 8. Update build pipeline | ✅ Done | scripts/build-static.mjs created; vite.config.ts blogStaticDataPlugin removed; package.json updated |
| 9. Delete dead code | ✅ Done | new-/, blog-astro/, blog/, orphaned pages, db scripts, migration scripts deleted |
| 10. Fix .gitignore | ✅ Done | SQLite artifacts, blog-data.json, bot-logs added; comment updated |
| 11. Wire daily blog cron | ✅ Done | Added to content.yml at 0 8 * * *; uses opencode/big-pickle |

## Status Key
- ⏳ Pending
- 🔄 In Progress
- ✅ Done
- ❌ Blocked

---

## Task Details

### Task 1 ✅ — Fix deployment conflicts
**Problem:** 3 workflows race to deploy different content to same gh-pages branch with different concurrency groups.
**Files changed:**
- `.github/workflows/deploy-astro-blog.yml` — added `if: false` to build job
- `.github/workflows/deploy-blog.yml` — added `if: false` to deploy job
- `.github/workflows/ci-cd.yml` — concurrency group changed to static `deploy-production`

---

### Task 2 ✅ — Split data/tests.json into per-channel files
**Problem:** 6.8MB monolithic file risks Git limits.
**Files changed:**
- `scripts/split-tests.mjs` — new one-time migration script (already run: 93 files created)
- `script/fetch-questions-for-build.js` — reads data/tests/*.json, merges for build
- `script/generate-tests-from-channels.js` — writes to data/tests/{channelId}.json

---

### Task 3 ✅ — Split data/blog-posts.json + wipe old posts
**Problem:** 1.1MB monolith + 126 low-quality old posts.
**Files changed:**
- `data/blog-posts.json` — deleted
- `content/posts/*.mdx` — all wiped
- `data/blog-posts/` — created with .gitkeep + 126 split files (to be wiped after task 7 generates fresh ones)
- `server/blog-storage-local.ts` — reads directory instead of single file
- `script/fetch-questions-for-build.js` — merges data/blog-posts/*.json for build
- `package.json` — removed `cp data/blog-posts.json` from build:static

---

### Task 4 ✅ — Remove DB layer from server
**Problem:** server/ imports pg/drizzle, requires DATABASE_URL to start.
**Files changed:**
- `server/db.ts` — DELETED
- `server/storage.ts` — DELETED
- `server/blog-storage.ts` — DELETED
- `drizzle.config.ts` — DELETED
- `SCHEMA.sql` — DELETED
- `server/repositories/questions.ts` — REWRITTEN: reads data/questions/{channel}.json
- `server/repositories/certifications.ts` — REWRITTEN: reads data/certifications.json
- `server/repositories/sessions.ts` — REWRITTEN: in-memory sessions + file reads
- `server/routes.ts` — DB imports removed; all inline db. calls replaced with file reads
- `server/index.ts` — closePool() removed; blog-preview mount removed
- `shared/schema.ts` — pgTable definitions removed; TypeScript types only
- `package.json` — removed better-sqlite3, @types/better-sqlite3, @types/connect-pg-simple; removed dead scripts

---

### Task 5 ✅ — Remove DB layer from content pipeline
**Problem:** All bots connect to PostgreSQL; scripts use script/db/pg-client.js.
**Files changed — Deleted:**
- `script/db/` — entire directory (pg-client.js etc.)
- `script/export-data.js`, `script/import-data.js`
- `script/generate-blog-from-rca.js`, `script/generate-blog-from-input.js`, `script/generate-blog-citation-first.js`
- `script/maintenance/clear-old-new-flags.js`
- `script/migrate-sqlite-to-pg.js`, `script/import-all-questions.mjs`, `script/import-questions-db.mjs`
- `script/fix-db-malformed-questions.js`, `script/test-database-retry.js`

**Files changed — Rewritten to file I/O:**
- `script/ai/config.js` — defaultModel → opencode/big-pickle ✅
- `opencode.json` — kiro-gateway removed; model → opencode/big-pickle ✅
- `script/generate-blog.js` — removed client.execute calls, fixed duplicated getBlogStats(), DATABASE_URL refs removed
- `script/generate-question.js` — uses file-based getAllChannelsFromDb() from utils
- `script/utils.js` — removed dbClient dependency; all functions now file-based
- `script/bots/shared/db.js` — replaced pg pool with file helpers (readArray/writeArray/appendToArray)
- `script/bots/shared/ledger.js` — replaced SQL inserts/selects with JSON file appends
- `script/bots/shared/queue.js` — replaced SQL queue with JSON file operations
- `script/bots/shared/runs.js` — replaced SQL runs with JSON file storage
- `script/bots/unified-content-bot.js` — replaced db.execute with file I/O
- `script/bots/creator-bot.js`, `verifier-bot.js`, `analysis-bot.js`, `answer-auditor-bot.js`
- `script/bots/flashcard-bot.js`, `processor-bot.js`, `reconciliation-bot.js`, `session-builder-bot.js`
- 11 script files importing dbClient from utils.js — fixed
- 23 additional files importing from pg-client.js — rewritten or deleted
- `script/ai/utils/history-logger.js`, `script/ai/providers/qdrant-local.js`
- `script/ai/graphs/feedback-processor-graph.js`
- `script/build.ts` — removed DB-related entries from allowlist

---

### Task 6 ✅ — Rewrite content.yml
**Problem:** Every CI run spins up PostgreSQL, imports all data, runs bots, exports back — 15+ min overhead.
**File:** `.github/workflows/content.yml`
**Changes:**
- Deleted `seed-db` job entirely
- Deleted `merge-ingest` job entirely
- Removed all `services: postgres:` blocks from ALL jobs
- Removed all `DATABASE_URL` env vars
- Removed all `SCHEMA.sql`, `psql`, `pg_dump`, artifact download/upload steps
- Removed all `data:export` and `data:import` calls
- Simplified every job: checkout → setup-bot → run script → git add data/... → commit → push
- Removed any OPENAI_API_KEY references
- Reduced from 847 lines to ~450 lines

---

### Task 7 ✅ — Upgrade blog generation prompt
**Problem:** Current blog posts lack real-world cases, diagrams, images, references.
**Files:**
- `script/ai/prompts/templates/blog.js` — schema now requires:
  - `realWorldCase`: { company, incident, year, impact, sourceUrl } — verified URL
  - `diagram`: valid Mermaid code (flowchart/sequence)
  - `diagramType` + `diagramLabel`
  - `images`: min 2 entries { url (Unsplash), alt, caption, placement }
  - `references`: min 8 entries { number, title, url, type }
  - `sections`: Hook → Problem → Real-World Case → Deep Dive → Workflow → Code Example → Lessons Learned
  - `codeExample`: { language, code, explanation }
- `script/ai/services/blog-quality-gates.js` — fails posts missing: diagram, real-world case URL, ≥6 refs, ≥1 code example

---

### Task 8 ✅ — Update build pipeline
**Problem:** vite.config.ts has duplicated blog-parsing logic; build:static is a fragile one-liner.
**Files:**
- `vite.config.ts` — removed blogStaticDataPlugin() entirely
- `scripts/build-static.mjs` — new sequential orchestrator with error handling:
  1. fetch-questions-for-build.js
  2. generate-tests-from-channels.js
  3. fetch-question-history.js
  4. generate-curated-paths.js
  5. export-voice-sessions.js (optional)
  6. generate-interview-intelligence.js (optional)
  7. generate-rss.js (optional)
  8. generate-sitemap.js (optional)
  9. vite build
  10. generate-pagefind-index.js + build-pagefind.js
- `package.json` — build:static → `node scripts/build-static.mjs`; removed dead scripts

---

### Task 9 ✅ — Delete dead code
**Deleted:**
- `new-/` — abandoned sub-project
- `client/src/pages/AllChannelsRedesigned.tsx`, `HomeRedesigned.tsx`, `StatsRedesigned.tsx`
- `client/src/pages/blog/BlogListPage.tsx.backup`
- `client/src/pages/ExtremeQuestionViewer.tsx`
- `blog-output/`, `blog-astro/`, `blog/`
- `script/migrations/`, `script/db/`
- `script/export-data.js`, `script/import-data.js`
- `script/generate-blog-from-rca.js`, `script/generate-blog-from-input.js`, `script/generate-blog-citation-first.js`
- `scripts/migrate-sqlite-to-postgres.ts`, `scripts/import-files-to-db.ts`, `scripts/export-db-to-files.ts`
- `scripts/seed-blog-from-mdx.js`, `scripts/pg-backup.ts`, `scripts/pg-backup.sh`
- `server/blog-storage.ts`
- `script/maintenance/clear-old-new-flags.js`
- `script/migrate-sqlite-to-pg.js`, `script/import-all-questions.mjs`, `script/import-questions-db.mjs`
- `script/fix-db-malformed-questions.js`, `script/test-database-retry.js`

---

### Task 10 ✅ — Fix .gitignore
**Added:**
- `client/public/blog-data.json`
- `client/public/data/blog-posts.json`
- `client/public/data/tests.json`
- `local.db`, `local.db-wal`, `local.db-shm`
- `blog-output/`, `blog-astro/dist/`
- `data/bot-logs/`
**Updated:** comment from "fetched from PostgreSQL" → "Generated at build time from data/"
**Deleted:** `local.db`, `local.db-wal`, `local.db-shm` from repo root

---

### Task 11 ✅ — Wire daily blog cron
**File:** `.github/workflows/content.yml`
**Added job `daily-blog`:**
- Schedule: `0 8 * * *`
- Steps: checkout → setup-bot → generate blog → commit blog post → trigger ci-cd.yml deploy
- Uses `opencode/big-pickle` via OPENCODE_MODEL env var
- No API keys needed
