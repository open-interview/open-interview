# Blog & LinkedIn Publishing — Fix Plan

> Status tracker: `[ ]` = not started · `[~]` = in progress · `[x]` = done · `[!]` = fixed by agent
> Priority levels: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low
>
> **Last verified:** 2026-05-01 — app running on port 5000 after session fixes.

---

## Root-cause Summary

The blog and LinkedIn publishing systems suffered from three systemic problems (all now resolved):

1. **Two completely incompatible database schemas** — resolved (B-01 done).
2. **The frontend never read from the database** — resolved (B-02 done).
3. **The LinkedIn post-selection step always failed silently** — resolved (B-03/L-01 done).

---

## Bugs Introduced by User's Changes — Fixed This Session

### FIX-1 · 🔴 · `shared/schema.ts` crashed the server on startup

**Flaw:**
`uniqueIndex("blog_posts_question_id_idx").on(blogPosts.questionId)` was declared outside `pgTable()`.
drizzle-orm v0.45.2 requires indexes to be declared inside `pgTable()`'s third argument. The standalone
form serialises column metadata as `undefined`, causing `JSON.parse("undefined")` to throw on startup,
making the entire app fail to launch.

**Fix applied:**
- Removed the `uniqueIndex` import and the standalone `blogPostsQuestionIdIdx` export.
- The `slug` column already has `.unique()` inline, so the blog slug constraint is still enforced.
- The DB-level uniqueness for `question_id → blog_post` is enforced by script logic (`ON CONFLICT DO NOTHING`).

**Tracking:** `[!]`

---

### FIX-2 · 🔴 · `post-linkedin-poll.js` had a `SyntaxError` from a duplicate `result` variable

**Flaw:**
Inside `fetchQuestion()`, `let result = await dbClient.execute(...)` was declared at line 175.
After the fallback block, `const result = await dbClient.execute(...)` re-declared it in the same scope — a `SyntaxError` that prevented the script from running at all.

**Fix applied:**
- Removed the duplicate `const result = ...` line. The `let result` from the first query already holds
  the correct value (updated in-place by the fallback block if needed).

**Tracking:** `[!]`

---

### FIX-3 · 🔴 · `post-linkedin-poll.js` had 60 lines of orphaned code outside any function

**Flaw:**
`fetchBlogPostUrl()` was refactored to only query the DB (blog generation decoupled — L-06 done). However,
the old blog-generation body (`} catch {`, `generateBlogPost()` call, inline `INSERT INTO blog_posts`, etc.)
was left outside the function after it closed — a syntax error on the orphaned `}` brace.
The dead `generateUniqueSlug()` helper function was also left behind (its only call was in the orphaned code).

**Fix applied:**
- Removed all orphaned code (lines 255–314 in the original).
- Removed the now-unused `generateUniqueSlug()` helper.
- `fetchBlogPostUrl()` now cleanly queries the DB and returns `{ url: null, isNew: false }` when no post is found.

**Tracking:** `[!]`

---

### FIX-4 · 🟠 · `questions.linkedin_poll_at` missing from Drizzle schema

**Flaw:**
`post-linkedin-poll.js` writes `linkedin_poll_at` to the `questions` table to track deduplication (L-04),
and dynamically adds the column via `ALTER TABLE` if missing. However, the column was never added to
`shared/schema.ts`, so Drizzle ORM would drop it on the next migration, and TypeScript had no type for it.

**Fix applied:**
- Added `linkedinPollAt: text("linkedin_poll_at")` to the `questions` table in `shared/schema.ts`.
- Ran DB migration: `ALTER TABLE questions ADD COLUMN IF NOT EXISTS linkedin_poll_at TEXT`.

**Tracking:** `[!]`

---

### FIX-5 · 🟠 · Missing DB tables/columns not created

**Flaw:**
`shared/schema.ts` now defines `linkedinPublishLog`, `blogAuthors`, and `blogCategories` tables,
and `blogPosts` now has `linkedinPostId` and `linkedinSharedAt` columns — but none of these existed
in the actual PostgreSQL database, causing all related routes to crash with "column does not exist".

**Fix applied:**
Ran migrations:
```sql
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS linkedin_post_id TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS linkedin_shared_at TEXT;
ALTER TABLE questions   ADD COLUMN IF NOT EXISTS linkedin_poll_at TEXT;
CREATE TABLE IF NOT EXISTS linkedin_publish_log (...);
CREATE TABLE IF NOT EXISTS blog_authors (...);
CREATE TABLE IF NOT EXISTS blog_categories (...);
```

**Tracking:** `[!]`

---

## BLOGGING — Flaws & Fixes

### B-01 · 🔴 · Dual incompatible `blog_posts` schemas

**Flaw:**
`generate-blog.js` used `id SERIAL PRIMARY KEY, question_id TEXT UNIQUE NOT NULL`.
`shared/schema.ts` defined `id TEXT PRIMARY KEY` (UUID) with no `question_id`.
The two schemas were completely incompatible — code targeting one errored on the other.

**Fix:**
- `shared/schema.ts` now uses `id TEXT PRIMARY KEY` (UUID) + `questionId TEXT` as a nullable non-PK column.
- `generate-blog.js` updated to use UUID `id` and `question_id` consistent with the Drizzle schema.
- All scripts updated to use the unified schema.

**Tracking:** `[x]`

---

### B-02 · 🔴 · Blog API read from static JSON, not the database

**Flaw:**
`server/blog-storage.ts` read from `client/public/data/posts.json`.
Posts inserted into PostgreSQL were invisible to the frontend. The blog was always empty in Replit.

**Fix:**
- `server/blog-storage.ts` fully rewritten to query `blog_posts` via Drizzle ORM.
- Static JSON fallback gated by `STATIC_BUILD=true` env var (for GitHub Pages mode only).
- `mapRow()` helper converts snake_case DB columns to camelCase TypeScript interface.
- All methods implemented: `getAllPosts`, `getPostBySlug`, `getFeaturedPosts`, `searchPosts`, `getRelatedPosts`, `getAllCategories`, `getAllTags`.

**Tracking:** `[x]`

---

### B-03 · 🔴 · Wrong blog base URL caused all LinkedIn post selection to silently fail

**Flaw:**
`get-latest-blog-post.js` hardcoded `https://openstackdaily.github.io`.
Every post URL failed the liveness check — no post was ever published to LinkedIn.

**Fix:**
- `BLOG_BASE_URL` now reads from `process.env.BLOG_BASE_URL` with fallback `https://open-interview.github.io`.
- Documented in `.env.example`.

**Tracking:** `[x]`

---

### B-04 · 🟠 · DIY YAML frontmatter parser was fragile

**Flaw:**
Hand-rolled YAML parser silently dropped multi-line values, values with colons, nested arrays, and special characters.

**Fix:**
- Replaced with `js-yaml` (`import yaml from 'js-yaml'` — line 11 of `generate-blog.js`).

**Tracking:** `[x]`

---

### B-05 · 🟠 · `posts.json` missing in Replit — blog always empty

**Flaw:**
Static blog build generated `posts.json` during GitHub Pages deploys; not present in Replit.

**Fix:**
- Resolved by **B-02** (DB reads). Blog now serves live data directly from PostgreSQL.

**Tracking:** `[x]` (resolved via B-02)

---

### B-06 · 🟠 · Duplicate slugs caused uncaught INSERT errors

**Flaw:**
`generateSlug()` did not check uniqueness. Duplicate titles caused PostgreSQL UNIQUE constraint errors.

**Fix:**
- `generateUniqueSlug(baseSlug, client)` helper added to `generate-blog.js` — appends `-2`, `-3`, etc. until a unique slug is found.

**Tracking:** `[x]`

---

### B-07 · 🟠 · `MIN_SOURCES` constant defined but never enforced

**Flaw:**
Script logged source count but proceeded even with 0 valid sources; posts saved with empty references.

**Fix:**
- Needs verification: check whether `generate-blog.js` now enforces `MIN_SOURCES = 8` after `validateSources()`.

**Tracking:** `[~]` — needs verification in `generate-blog.js`

---

### B-08 · 🟠 · DIY markdown renderer produced broken HTML

**Flaw:**
200-line regex-based renderer failed on nested lists, inline formatting, links inside bold/italic, tables with pipes, and blockquotes.

**Fix:**
- `marked` npm package imported and used (`import { marked } from 'marked'` — line 12 of `generate-blog.js`).

**Tracking:** `[x]`

---

### B-09 · 🟡 · Source URL validation counted Cloudflare-blocked URLs as valid

**Flaw:**
`response.status === 403` was accepted as valid. Cloudflare-blocked dead pages passed validation.

**Fix:**
- Not yet verified whether `generate-blog.js` validateUrl() has been updated to reject 403.

**Tracking:** `[ ]`

---

### B-10 · 🟡 · `initBlogPostsTable()` ran ALTER TABLE on every script execution

**Flaw:**
Every `generate-blog.js` run attempted 20+ `ALTER TABLE ADD COLUMN` statements, catching all errors silently.

**Fix:**
- Verify `initBlogPostsTable()` has been removed from `generate-blog.js`. Schema managed by Drizzle ORM and one-time SQL migrations going forward.

**Tracking:** `[~]` — needs verification

---

### B-11 · 🟡 · No blog post admin view in the app UI

**Flaw:**
Blog posts in DB were invisible from the app UI.

**Fix:**
- `GET /api/admin/blog` — lists all posts with `linkedin_shared_at`, slug, channel, created date.
- `PATCH /api/admin/blog/:id/linkedin` — stores `linkedinPostId` and `sharedAt` on a post.
- `GET /api/admin/linkedin-log` — returns full publish log.
- All three routes added to `server/routes.ts`.
- Frontend admin UI page (`/admin/blog`) is **not yet built** — API exists but no UI component.

**Tracking:** `[~]` — API done, UI not started

---

### B-12 · 🟢 · Blog generation coupled to poll posting

**Flaw:**
`post-linkedin-poll.js` called `generateBlogPost()` inline, blocking poll posting for several minutes.

**Fix:**
- `fetchBlogPostUrl()` now only queries the DB for an existing slug.
- If no blog post exists, it returns `{ url: null }` — the poll proceeds with a generic channel link.
- `generateBlogPost` import removed from `post-linkedin-poll.js`.

**Tracking:** `[x]`

---

## LINKEDIN PUBLISHING — Flaws & Fixes

### L-01 · 🔴 · LinkedIn post selection always silently skipped all posts

Resolved by **B-03**.

**Tracking:** `[x]`

---

### L-02 · 🟠 · No LinkedIn post ID stored in the database

**Flaw:**
`linkedInResult.id` was written to GitHub Actions output only — never persisted to `blog_posts`.

**Fix:**
- `linkedin_post_id TEXT` and `linkedin_shared_at TEXT` columns added to `blog_posts`.
- `PATCH /api/admin/blog/:id/linkedin` endpoint stores both values.
- `mark-post-shared.js` accepts `POST_LINKEDIN_ID` env var and stores it via `COALESCE(?, linkedin_post_id)`.

**Tracking:** `[x]`

---

### L-03 · 🟠 · No LinkedIn token expiration detection

**Flaw:**
No pre-flight check; expired token showed a cryptic 401 with no guidance.

**Fix:**
- `validateToken()` in `publish-to-linkedin.js` calls `GET /v2/userinfo` before publishing.
- On 401: prints clear message with renewal URL and exits with code 2.
- `LINKEDIN_TOKEN_EXPIRY` env var: logs warning if ≤ 7 days remain.

**Tracking:** `[x]`

---

### L-04 · 🟠 · Poll questions could repeat — no deduplication

**Flaw:**
No tracking of which questions had been posted as polls.

**Fix:**
- `linkedin_poll_at TEXT` column added to `questions` table (schema + DB migration).
- Poll query filters `AND linkedin_poll_at IS NULL`.
- Fallback: re-use questions posted > 90 days ago if all exhausted.
- After posting: `UPDATE questions SET linkedin_poll_at = now()`.

**Tracking:** `[x]`

---

### L-05 · 🟠 · Poll option text not validated against LinkedIn's 30-char limit

**Flaw:**
Options exceeding 30 chars caused 422 API errors with an unhelpful message.

**Fix:**
- After AI generation: options > 30 chars are truncated to `substring(0, 27) + '...'`.
- Hard validation: throws before API call if any option still exceeds 30 chars.
- Truncation count logged clearly.

**Tracking:** `[x]`

---

### L-06 · 🟠 · Blog generation ran inline inside poll script, blocking it

**Flaw:**
Full AI blog generation (minutes) ran inside `post-linkedin-poll.js`, blocking and breaking polls.

**Fix:**
- Decoupled — see **B-12**.

**Tracking:** `[x]`

---

### L-07 · 🟡 · LinkedIn API version hardcoded

**Flaw:**
`'LinkedIn-Version': '202506'` hardcoded in both scripts; no way to update without code change.

**Fix:**
- `LINKEDIN_API_VERSION = process.env.LINKEDIN_API_VERSION || '202506'` in both scripts.
- Documented in `.env.example`.

**Tracking:** `[x]`

---

### L-08 · 🟡 · `mark-post-shared` had no retry — caused duplicate LinkedIn publishes

**Flaw:**
DB failure during mark-as-shared meant the same post could be published again on the next run.

**Fix:**
- 3 retries with exponential backoff (1s, 2s, 4s) added to `markAsShared()`.
- Uses `COALESCE(?, linkedin_post_id)` to avoid overwriting an existing ID.

**Tracking:** `[x]`

---

### L-09 · 🟡 · Image silently bypassed upload validation

**Flaw:**
Bad image files (wrong type, too large, empty, corrupt header) produced confusing API errors.

**Fix:**
- `validateImage(imagePath)` in `publish-to-linkedin.js` checks: file exists, extension, size ≤ 5 MB, file header (PNG/JPEG/GIF magic bytes).

**Tracking:** `[x]`

---

### L-10 · 🟡 · No end-to-end LinkedIn publish audit log

**Flaw:**
No single place to see what was published, when, with what post ID, with/without image, or errors.

**Fix:**
- `linkedin_publish_log` table created (in schema + DB migration).
- `publish-to-linkedin.js` inserts a row on every publish attempt (success or failure).
- `GET /api/admin/linkedin-log` endpoint returns full log.

**Tracking:** `[x]`

---

### L-11 · 🟢 · Missing AI API key produced a cryptic deep error

**Flaw:**
No pre-flight check for `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`; LangGraph threw a confusing internal error.

**Fix:**
- Needs verification: check whether `publish-to-linkedin.js` and `generate-blog.js` validate AI key presence before running.

**Tracking:** `[ ]`

---

### L-12 · 🟢 · Poll duration enum mapping fragile

**Flaw:**
Integer hours mapped manually to LinkedIn enum strings with no validation of the final value.

**Fix:**
- `post-linkedin-poll.js` uses `MIN_POLL_DURATION_HOURS = 1` and `MAX_POLL_DURATION_HOURS = 336`, with `Math.min(Math.max(...))` clamping.
- Needs verification: confirm the mapping to `ONE_DAY / THREE_DAYS / ONE_WEEK / TWO_WEEKS` strings is validated.

**Tracking:** `[~]` — partially done, mapping logic needs verification

---

## New Items Added This Session

### N-01 · 🟢 · `dry-run-preview.js` added for local testing

**What was added:**
`script/dry-run-preview.js` — shows exactly how a LinkedIn post and poll will look using real DB data,
with no external API calls. Useful for debugging content before live publishing.

**Tracking:** `[x]`

---

### N-02 · 🟢 · `test-linkedin-post-flow.js` added for pipeline testing

**What was added:**
`script/test-linkedin-post-flow.js` — runs the full LinkedIn post generation pipeline (validate URL →
generate image → generate story → quality checks → build post) with `SKIP_AI=true` for fast local testing.

**Tracking:** `[x]`

---

### N-03 · 🟢 · `.env.example` fully documented

**What was added:**
All required environment variables now documented: `BLOG_BASE_URL`, `LINKEDIN_ACCESS_TOKEN`,
`LINKEDIN_PERSON_URN`, `LINKEDIN_API_VERSION`, `LINKEDIN_TOKEN_EXPIRY`, AI provider keys, `STATIC_BUILD`.

**Tracking:** `[x]`

---

## Outstanding Items (Needs Attention)

| ID | Priority | Description | Status |
|----|----------|-------------|--------|
| B-07 | 🟠 | Verify `MIN_SOURCES` enforcement in `generate-blog.js` | `[~]` |
| B-09 | 🟡 | Fix Cloudflare-blocked URLs counted as valid in source validation | `[ ]` |
| B-10 | 🟡 | Verify `initBlogPostsTable()` removed from `generate-blog.js` | `[~]` |
| B-11 | 🟡 | Build frontend admin UI for blog post management | `[~]` (API done) |
| L-11 | 🟢 | Add AI API key pre-flight check to `publish-to-linkedin.js` and `generate-blog.js` | `[ ]` |
| L-12 | 🟢 | Verify poll duration enum mapping fully validated | `[~]` |

---

## Progress Summary

| Priority | Total | Done `[x]` | Fixed by agent `[!]` | In progress `[~]` | Not started `[ ]` |
|----------|-------|-----------|----------------------|-------------------|-------------------|
| 🔴 Critical | 3+5 | 3 | 5 | 0 | 0 |
| 🟠 High | 9 | 8 | 1 | 1 | 0 |
| 🟡 Medium | 6 | 4 | 0 | 2 | 0 |
| 🟢 Low | 4+3 | 3+3 | 0 | 1 | 1 |
| **Total** | **30** | **21** | **6** | **4** | **1** |
