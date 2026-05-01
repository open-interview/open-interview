# Blog & LinkedIn Publishing — Fix Plan

> Status tracker: `[ ]` = not started · `[~]` = in progress · `[x]` = done
> Priority levels: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

---

## Root-cause Summary

The blog and LinkedIn publishing systems suffer from three systemic problems:

1. **Two completely incompatible database schemas** — scripts and the Drizzle ORM app disagree on the shape of `blog_posts`.
2. **The frontend never reads from the database** — it reads from a static `posts.json` file that isn't regenerated inside the Replit environment.
3. **The LinkedIn "get latest post" step always fails silently** — because the blog base URL is hardcoded to the wrong domain, causing every post to be skipped.

---

## BLOGGING — Flaws & Fixes

### B-01 · 🔴 · Dual incompatible `blog_posts` schemas

**Flaw:**  
`generate-blog.js` creates `blog_posts` with `id SERIAL PRIMARY KEY, question_id TEXT UNIQUE NOT NULL`.  
`shared/schema.ts` defines `id TEXT PRIMARY KEY` (UUID) with no `question_id` column.  
`mark-post-shared.js` and `get-latest-blog-post.js` use the old SERIAL schema.  
The Drizzle ORM routes and any frontend interactions use the Drizzle schema.  
These two schemas are **completely incompatible** — code targeting one will error when it hits the other.

**Fix:**
- Canonicalize on the Drizzle schema: `id TEXT PRIMARY KEY` (UUID), keep `question_id TEXT` as a regular non-PK column with a unique index.
- Update `shared/schema.ts` to add `questionId` back as a regular nullable column.
- Update `generate-blog.js` `initBlogPostsTable()` and `saveBlogPost()` to use UUID `id` and `question_id` consistent with Drizzle schema.
- Update all scripts that reference `blog_posts` to use the unified schema.
- Add a one-time migration script to convert existing SERIAL `id` rows to UUID `id`.

**Tracking:** `[ ]`

---

### B-02 · 🔴 · Blog API reads from static JSON, not the database

**Flaw:**  
`server/blog-storage.ts` reads from `client/public/data/posts.json`.  
Posts inserted into PostgreSQL by AI generation scripts are **completely invisible** to the frontend.  
In the Replit environment there is no mechanism to regenerate `posts.json`, so the blog is always empty.

**Fix:**
- Rewrite `server/blog-storage.ts` to query the `blog_posts` table via Drizzle ORM directly instead of reading a JSON file.
- Keep the JSON-fallback path only for local static builds (GitHub Pages mode), gated by `process.env.STATIC_BUILD === 'true'`.
- Add a new Drizzle query method for each existing `blogStorage` method: `getAllPosts`, `getPostBySlug`, `getFeaturedPosts`, `searchPosts`, `getRelatedPosts`, `getAllCategories`, `getAllTags`.
- Map the DB column names (snake_case) to the TypeScript interface fields (camelCase) in a single `mapRow()` helper.

**Tracking:** `[ ]`

---

### B-03 · 🔴 · Wrong blog base URL causes all LinkedIn post selection to silently fail

**Flaw:**  
`get-latest-blog-post.js` hardcodes:  
```js
const BLOG_BASE_URL = 'https://openstackdaily.github.io';
```  
But `package.json` lists the homepage as `https://open-interview.github.io/`.  
`isUrlLive()` checks each post's URL before selecting it. Since every URL is constructed with the wrong domain, **all posts fail the liveness check and are skipped** — no post is ever published to LinkedIn.

**Fix:**
- Replace the hardcoded `BLOG_BASE_URL` constant with `process.env.BLOG_BASE_URL` with a sensible fallback from `package.json` homepage.
- Add a startup validation that prints the resolved base URL clearly.
- Add the correct default (`https://open-interview.github.io`) as the fallback.
- Document the env var in `.env.example`.

**Tracking:** `[ ]`

---

### B-04 · 🟠 · DIY YAML frontmatter parser is fragile and loses data

**Flaw:**  
`parseYamlFrontmatter()` is a hand-rolled 70-line YAML parser that silently drops or corrupts:
- Multi-line quoted string values (only block scalar `|` is handled).
- Values containing colons (e.g. `title: "How X: The Guide"` — the second colon breaks the regex).
- Nested arrays of objects deeper than one level.
- YAML special characters like `&`, `*`, `>`, `!`.

**Fix:**
- Replace the custom parser with the `js-yaml` npm package (already a transitive dependency via `mermaid`; can be directly imported).
- Use `yaml.load()` for parsing and `yaml.dump()` for serialisation inside `savePostAsMDX()`.
- Write a test that round-trips 10 real blog posts through save → parse → compare to catch regressions.

**Tracking:** `[ ]`

---

### B-05 · 🟠 · `client/public/data/posts.json` is missing in Replit; blog always empty

**Flaw:**  
The static blog build pipeline (`scripts/build-content.ts`) generates `posts.json` during GitHub Pages deployments, but this file is not committed to the repo and is not generated in the Replit environment.  
`blog-storage.ts` returns `{ posts: [], categories: [], tags: [] }` silently when the file is missing, making the entire blog tab empty with no error.

**Fix:**
- This is resolved by **B-02** (switch to DB reads). As a stop-gap:
  - Add an explicit startup log warning when `posts.json` is missing in non-static mode.
  - Add a seed script `script/seed-blog-from-mdx.js` that reads MDX files from `content/posts/` and inserts them into the `blog_posts` DB table — so existing MDX content becomes visible via the new DB-backed API immediately.

**Tracking:** `[ ]`

---

### B-06 · 🟠 · Duplicate slug collisions cause uncaught INSERT errors

**Flaw:**  
`generateSlug()` creates slugs from titles but does not check for uniqueness before inserting.  
The DB has a `UNIQUE` constraint on `slug`, so duplicate titles cause an unhandled PostgreSQL error that crashes the generation script mid-run.

**Fix:**
- Before inserting, query `SELECT COUNT(*) FROM blog_posts WHERE slug LIKE ?` to detect collisions.
- Append a numeric suffix (`-2`, `-3`, etc.) until a unique slug is found.
- Add a `generateUniqueSlug(baseSlug, client)` helper function used in both `saveBlogPost()` and `savePostAsMDX()`.

**Tracking:** `[ ]`

---

### B-07 · 🟠 · `MIN_SOURCES` constant defined but never enforced

**Flaw:**  
```js
const MIN_SOURCES = 8; // Defined at top of generate-blog.js
```
After source validation runs, the script logs the count but proceeds even with 0 valid sources. Blog posts can be saved with empty references.

**Fix:**
- After `validateSources()` returns, check `validatedSources.length >= MIN_SOURCES`.
- If fewer than `MIN_SOURCES` valid sources remain, mark the question as `skipped` and try the next candidate (same flow as other skip reasons).
- Surface the skip reason in the structured log output.

**Tracking:** `[ ]`

---

### B-08 · 🟠 · DIY markdown renderer produces broken HTML for complex content

**Flaw:**  
`markdownToHtml()` in `generate-blog.js` is a 200-line regex-based Markdown-to-HTML converter. It fails on:
- Nested lists (renders as flat `<li>` items).
- Consecutive inline formatting (`***bold italic***`).
- Links inside bold/italic text.
- Tables with cells containing pipes (`|`).
- Blockquotes containing other markdown elements.

**Fix:**
- Replace the regex renderer with the `marked` npm package (lightweight, already in ecosystem).
- Configure a custom renderer for code blocks (to keep the existing Mermaid/syntax-highlighting logic).
- The HTML output of `generate-blog.js` used in standalone blog HTML files will immediately improve.

**Tracking:** `[ ]`

---

### B-09 · 🟡 · Source URL validation counts Cloudflare-blocked URLs as valid

**Flaw:**  
```js
return response.ok || response.status === 403 || response.status === 405;
```  
Sites protected by Cloudflare return `403` for bot HEAD requests even when the page no longer exists. This causes dead/changed URLs to pass validation.

**Fix:**
- Remove `response.status === 403` from the "valid" criteria.
- Instead, fall back to a GET request with a real `User-Agent` string and check for `response.ok` only.
- Add `response.status === 410` (Gone) as an explicit "invalid" signal.
- Log blocked vs missing separately.

**Tracking:** `[ ]`

---

### B-10 · 🟡 · `initBlogPostsTable()` runs ALTER TABLE on every script execution

**Flaw:**  
Every run of `generate-blog.js` attempts `ALTER TABLE blog_posts ADD COLUMN <name>` for every column in a list of 20+ columns. Each attempt that hits an already-existing column throws an error that is silently caught — but it generates noise, adds latency, and is fragile.

**Fix:**
- Remove `initBlogPostsTable()` from the script entirely.
- Replace with a reference to the canonical Drizzle migration (once B-01 is resolved).
- Run `drizzle-kit generate` once and keep migrations in the `migrations/` folder going forward.

**Tracking:** `[ ]`

---

### B-11 · 🟡 · No blog post admin view in the app UI

**Flaw:**  
Blog posts in the database are entirely invisible from the app UI. There is no way to preview, manage, or check the status of posts through the app.

**Fix:**
- Add a `/admin/blog` route (protected or dev-only) that lists all posts from the DB with their `linkedin_shared_at` status, slug, channel, and created date.
- Add a "Preview" action that renders the post inline.
- Add a "Mark as shared" button to manually trigger the LinkedIn sharing status update.

**Tracking:** `[ ]`

---

### B-12 · 🟢 · `savePostAsMDX()` uses `import.meta.url` for path resolution

**Flaw:**  
```js
const outDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../content/posts');
```  
This breaks when `generate-blog.js` is imported as a module by another script (e.g., `post-linkedin-poll.js` imports `generateBlogPost`).

**Fix:**
- Replace with `path.join(process.cwd(), 'content/posts')` which is stable regardless of import context.

**Tracking:** `[ ]`

---

## LINKEDIN PUBLISHING — Flaws & Fixes

### L-01 · 🔴 · LinkedIn post selection always silently skips all posts (see B-03)

This flaw is described in **B-03** — the wrong `BLOG_BASE_URL` means `isUrlLive()` always returns false, causing the loop to exhaust all 20 candidates and return `null`. No post is ever published. The GitHub Actions step exits with `has_post=false` every time.

**Tracking:** `[ ]` (resolved by B-03)

---

### L-02 · 🟠 · No LinkedIn post ID stored in the database

**Flaw:**  
After a successful publish, `linkedInResult.id` is written to GitHub Actions output only. It is never persisted to the `blog_posts` table.  
This means:
- No audit trail of what was posted and when.
- No way to look up, delete, or edit posts from the app.
- If `mark-post-shared` runs but the LinkedIn API never returned an ID, there is no way to debug.

**Fix:**
- Add a `linkedin_post_id TEXT` column to `blog_posts` in `shared/schema.ts`.
- Expose a new API endpoint `PATCH /api/blog/posts/:id/linkedin` that accepts `{ postId, sharedAt }`.
- Update the GitHub Actions workflow to call this endpoint (or run `mark-post-shared.js` with the post ID) after a successful publish.
- Alternatively, update `mark-post-shared.js` to accept and store the post ID via `POST_LINKEDIN_ID` env var.

**Tracking:** `[ ]`

---

### L-03 · 🟠 · No LinkedIn token expiration detection or rotation

**Flaw:**  
LinkedIn OAuth access tokens expire. The publishing script uses a static `LINKEDIN_ACCESS_TOKEN` with no:
- Pre-flight expiration check.
- Helpful error message when expired (just a generic 401 from the API).
- Guidance on how to refresh the token.

**Fix:**
- Add a `validateToken()` step that calls `GET https://api.linkedin.com/v2/userinfo` before attempting to publish.
- On 401, print a clear message: `"LinkedIn token expired. Generate a new token at: https://www.linkedin.com/developers/apps"` and exit with code 2 (distinct from other errors).
- Add a `LINKEDIN_TOKEN_EXPIRY` env var (set when the token is created). Log a warning in the days before expiry.
- Document the token refresh process in `README` or a `docs/linkedin-setup.md`.

**Tracking:** `[ ]`

---

### L-04 · 🟠 · Poll questions can repeat — no deduplication tracking

**Flaw:**  
`post-linkedin-poll.js` selects questions with `WHERE channel IN (...) AND status = 'active'` and `ORDER BY RANDOM()`. No tracking exists of which questions have already been posted as polls. The same question can be picked on consecutive runs.

**Fix:**
- Add a `linkedin_poll_at TEXT` column to the `questions` table in `shared/schema.ts`.
- After successfully posting a poll, update `questions SET linkedin_poll_at = now() WHERE id = ?`.
- Filter poll candidates with `AND linkedin_poll_at IS NULL`.
- If the table is exhausted (all questions posted), reset the oldest batch (those posted > 90 days ago).

**Tracking:** `[ ]`

---

### L-05 · 🟠 · Poll option length not validated against LinkedIn's 30-char limit

**Flaw:**  
`MAX_POLL_OPTIONS = 4` is validated but individual option text is not checked against LinkedIn's hard limit of 30 characters per option. The LinkedIn API returns a 422 error that crashes the publish with an unhelpful message.

**Fix:**
- After AI generation of poll options, validate each option: `option.length <= 30`.
- If any option exceeds 30 chars, truncate with `option.substring(0, 27) + '...'` or regenerate.
- Add an explicit validation step with a clear log message before the API call.

**Tracking:** `[ ]`

---

### L-06 · 🟠 · Poll post triggers full AI blog generation inline, blocking the poll

**Flaw:**  
When no blog post exists for a selected question, `post-linkedin-poll.js` calls `generateBlogPost()` inline:
```js
import { generateBlogPost } from './ai/graphs/blog-graph.js';
// ...
const blogResult = await generateBlogPost(question); // minutes of AI calls
```  
This blocks the poll posting for several minutes, and if blog generation fails (AI API error, timeout), the entire poll is abandoned.

**Fix:**
- Decouple poll posting from blog generation completely.
- The poll "Deep Dive" link should be optional — fall back to a generic channel URL (`/channels/{channelId}`) if no blog post exists.
- Remove the `generateBlogPost` import from the poll script entirely.
- Run blog generation and poll posting as separate independent GitHub Actions jobs.

**Tracking:** `[ ]`

---

### L-07 · 🟡 · LinkedIn API version hardcoded to `202506`

**Flaw:**  
Both `publish-to-linkedin.js` and `post-linkedin-poll.js` hardcode:  
```js
'LinkedIn-Version': '202506'
```  
LinkedIn deprecates API versions on a rolling 12-month cycle. When deprecated, all API calls return 400/410 errors.

**Fix:**
- Extract to a single constant: `LINKEDIN_API_VERSION = process.env.LINKEDIN_API_VERSION || '202506'`.
- Document the env var so it can be bumped without a code change.
- Add a startup log that prints the API version being used.

**Tracking:** `[ ]`

---

### L-08 · 🟡 · `mark-post-shared` has no retry on failure — causes duplicate publishes

**Flaw:**  
After a successful LinkedIn publish, the GitHub Actions step runs `mark-post-shared.js`. If this step fails (DB connection timeout, network error), the `linkedin_shared_at` field is never set. The next scheduled run picks the same post again and publishes a duplicate.

**Fix:**
- Add 3 retries with exponential backoff inside `markAsShared()`.
- Make the GitHub Actions `mark-post-shared` step have `continue-on-error: false` and alert on failure.
- Add an idempotency check: before marking, verify the post wasn't already marked by checking `linkedin_shared_at IS NOT NULL`.

**Tracking:** `[ ]`

---

### L-09 · 🟡 · Image generation silently falls back to no-image without clear logging

**Flaw:**  
If image generation fails (e.g., `sharp` native binary issue), the script silently falls back to article-link format:
```js
} catch (imageError) {
  console.error('\n⚠️ Image upload failed:', imageError.message);
  console.log('   Falling back to article link...');
```  
Operators don't know whether a post was published with or without an image unless they check GitHub Actions logs.

**Fix:**
- Add the `with_image` flag to the `mark-post-shared` update so it's stored in the DB.
- Add a Slack/webhook notification (or GitHub Actions annotation) when fallback mode is used.
- Log image generation failure reason prominently.

**Tracking:** `[ ]`

---

### L-10 · 🟡 · No end-to-end publish audit log

**Flaw:**  
There is no single place to see: which posts were published, when, with what LinkedIn post ID, whether with image, and whether any errors occurred.

**Fix:**
- Create a `linkedin_publish_log` table:
  ```sql
  id SERIAL PRIMARY KEY,
  blog_post_id TEXT,
  linkedin_post_id TEXT,
  published_at TEXT,
  with_image BOOLEAN,
  post_type TEXT, -- 'article' | 'poll' | 'usecase-poll'
  error TEXT,
  created_at TEXT
  ```
- Insert a row at each publish attempt (success or failure).
- Add a `/api/admin/linkedin-log` endpoint and a simple admin UI table to display it.

**Tracking:** `[ ]`

---

### L-11 · 🟢 · Missing AI API key produces cryptic error in `generateLinkedInPost()`

**Flaw:**  
If `OPENAI_API_KEY` (or the configured AI provider key) is not set, `generateLinkedInPost()` throws a deep error from inside the LangChain/LangGraph stack that is not surfaced as a clear "missing API key" message.

**Fix:**
- Add a pre-flight check in both `publish-to-linkedin.js` and `generate-blog.js`:
  ```js
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.error('❌ No AI API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.');
    process.exit(1);
  }
  ```
- Print which AI provider is being used at startup.

**Tracking:** `[ ]`

---

### L-12 · 🟢 · Poll duration enum mapping is fragile

**Flaw:**  
The code manually maps an integer hour value to LinkedIn poll duration strings (`ONE_DAY`, `THREE_DAYS`, `ONE_WEEK`, `TWO_WEEKS`). If LinkedIn adds or renames enum values, the mapping silently sends an invalid value.

**Fix:**
- Define the enum map as a constant with explicit comments:
  ```js
  const POLL_DURATION_MAP = {
    ONE_DAY: 24,
    THREE_DAYS: 72,
    ONE_WEEK: 168,
    TWO_WEEKS: 336,
  };
  ```
- Validate the resolved enum value before sending to the API.
- Default to `ONE_WEEK` if the input falls between two thresholds.

**Tracking:** `[ ]`

---

## Implementation Order

The following order minimises blockers and maximises impact per fix:

| Step | Fix IDs | Reason |
|------|---------|--------|
| 1 | B-01, B-02 | Foundation — unified schema and live DB reads unblock everything else |
| 2 | B-03, L-01 | Fix wrong URL — LinkedIn publishing becomes functional immediately |
| 3 | B-05 | Seed MDX content into DB so blog is populated |
| 4 | L-02, L-08 | Audit trail and duplicate-prevention before any live publishing |
| 5 | B-06, B-07 | Correctness guards in generation pipeline |
| 6 | L-04, L-05 | Poll quality and deduplication |
| 7 | L-03 | Token management before scaling publishing |
| 8 | B-04, B-08 | YAML and markdown renderer reliability |
| 9 | L-06, L-07 | Decoupling and API version resilience |
| 10 | B-09, B-10, B-12, L-09, L-10, L-11, L-12 | Polish, logging, and cleanup |
| 11 | B-11 | Admin UI (nice-to-have) |

---

## Summary Count

| Priority | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟠 High | 9 |
| 🟡 Medium | 6 |
| 🟢 Low | 4 |
| **Total** | **22** |
