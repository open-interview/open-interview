# LinkedIn Article Publishing Plan

> Publish full-length technical articles natively on LinkedIn using a 10-agent LangGraph pipeline with end-to-end tracking.

---

## End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATOR AGENT                           │
│  Reads blog_posts table → selects candidates → runs pipeline        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
              ┌────────────────▼────────────────┐
              │      CONTENT SELECTOR AGENT      │
              │  Picks best unPublished article  │
              └────────────────┬────────────────┘
                               │
              ┌────────────────▼────────────────┐
              │     ARTICLE FORMATTER AGENT      │
              │  Converts blog JSON → LinkedIn   │
              │  Article HTML/Markdown format    │
              └────────────────┬────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌────────▼────────┐  ┌─────────▼────────┐  ┌────────▼────────┐
│  SEO OPTIMIZER  │  │  IMAGE GENERATOR │  │  QUALITY GATE   │
│  AGENT          │  │  AGENT           │  │  AGENT          │
│  Title, tags,   │  │  Cover image     │  │  Length, links, │
│  summary        │  │  for article     │  │  formatting     │
└────────┬────────┘  └─────────┬────────┘  └────────┬────────┘
         └─────────────────────┼─────────────────────┘
                               │
              ┌────────────────▼────────────────┐
              │        PUBLISHER AGENT           │
              │  POST /rest/articles LinkedIn    │
              └────────────────┬────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌────────▼────────┐  ┌─────────▼────────┐  ┌────────▼────────┐
│  TRACKER AGENT  │  │ RETRY/ERROR      │  │  ENGAGEMENT     │
│  Writes to DB   │  │ HANDLER AGENT    │  │  MONITOR AGENT  │
│  linkedin_      │  │  Retries on 429/ │  │  Polls metrics  │
│  articles table │  │  5xx, logs fails │  │  after 24h      │
└─────────────────┘  └──────────────────┘  └─────────────────┘
```

---

## The 10 Agents

### 1. Orchestrator Agent
**File:** `script/ai/graphs/linkedin-article-graph.js` (root graph)

| | |
|---|---|
| **Role** | Entry point. Reads DB, selects candidate, runs the full pipeline, handles final state |
| **Input** | `{ channel?, limit?, dryRun }` |
| **Output** | `{ success, articleId, url, error }` |
| **Tools** | PostgreSQL client (pg-client.js), all sub-agents via LangGraph edges |
| **Failure** | Logs error, writes `status=failed` to `linkedin_articles`, exits 0 (non-blocking) |

---

### 2. Content Selector Agent
**Node:** `select_content`

| | |
|---|---|
| **Role** | Queries `blog_posts` for unPublished articles, scores by recency + channel priority, picks best candidate |
| **Input** | `{ channel?, excludeIds[] }` |
| **Output** | `{ post: BlogPost, score }` |
| **Tools** | PostgreSQL DB — `SELECT * FROM blog_posts WHERE linkedin_article_id IS NULL ORDER BY created_at DESC LIMIT 20` |
| **Failure** | Returns `{ skip: true, reason: 'no_candidates' }` → Orchestrator exits cleanly |

**Channel priority order:**
```
aws > kubernetes > system-design > devops > terraform > security > machine-learning > generative-ai > ...
```

---

### 3. Article Formatter Agent
**Node:** `format_article`

| | |
|---|---|
| **Role** | Converts blog post JSON (sections, introduction, conclusion) into LinkedIn Article HTML |
| **Input** | `{ post: BlogPost }` |
| **Output** | `{ title, content: string (HTML), summary }` |
| **Tools** | AI (`ai.run('articleFormatter', ...)`) with fallback template |
| **Failure** | Falls back to direct markdown→HTML conversion without AI |

**LinkedIn Article HTML rules:**
- Max 125,000 characters
- Supported tags: `<p>`, `<h1>`–`<h3>`, `<ul>`, `<ol>`, `<li>`, `<strong>`, `<em>`, `<a>`, `<blockquote>`, `<code>`, `<pre>`
- No `<img>` in body (cover image is separate)

---

### 4. SEO Optimizer Agent
**Node:** `optimize_seo`

| | |
|---|---|
| **Role** | Generates optimised title (≤150 chars), subtitle (≤300 chars), and up to 5 hashtags |
| **Input** | `{ post, formattedContent }` |
| **Output** | `{ title, subtitle, hashtags[] }` |
| **Tools** | AI (`ai.run('seoOptimizer', ...)`) |
| **Failure** | Uses `post.title` and `post.meta_description` as-is |

---

### 5. Image Generator Agent
**Node:** `generate_cover_image`

| | |
|---|---|
| **Role** | Creates a cover image for the article (1200×627px recommended by LinkedIn) |
| **Input** | `{ title, channel }` |
| **Output** | `{ imagePath, imageValid }` |
| **Tools** | Existing `generateLinkedInImage()` from `script/ai/utils/linkedin-image-generator.js` |
| **Failure** | Skips cover image, continues without it |

---

### 6. Quality Gate Agent
**Node:** `quality_gate`

| | |
|---|---|
| **Role** | Validates article before publishing: length, required sections, no broken links, no duplicate content |
| **Input** | `{ title, content, subtitle, hashtags }` |
| **Output** | `{ passed: bool, issues[] }` |
| **Tools** | Rule-based checks + optional duplicate check against `linkedin_articles` table |
| **Failure** | If `passed=false` and issues are fixable → routes back to Formatter. Max 2 retries then skip. |

**Checks:**
- Content length: 300–125,000 chars
- Title length: ≤150 chars
- Has at least 2 sections
- No raw `{{placeholder}}` text
- Not already published (check `linkedin_articles` by `question_id`)

---

### 7. Publisher Agent
**Node:** `publish_article`

| | |
|---|---|
| **Role** | Calls LinkedIn Articles API to publish the article |
| **Input** | `{ title, content, subtitle, hashtags, imagePath, authorUrn }` |
| **Output** | `{ articleId, articleUrl, publishedAt }` |
| **Tools** | LinkedIn REST API |
| **Failure** | Routes to Retry/Error Handler Agent |

**API call:**
```http
POST https://api.linkedin.com/rest/articles
LinkedIn-Version: 202506
Authorization: Bearer {token}

{
  "author": "urn:li:person:XXXX",
  "title": "...",
  "content": "<p>...</p>",
  "visibility": "PUBLIC",
  "distribution": { "feedDistribution": "MAIN_FEED" },
  "coverImage": { "id": "urn:li:image:XXXX" }   // optional
}
```

> **Note:** LinkedIn Articles API requires the `w_long_form_content` OAuth scope in addition to `w_member_social`. Update your LinkedIn app permissions before use.

---

### 8. Tracker Agent
**Node:** `track_article`

| | |
|---|---|
| **Role** | Writes publish result to `linkedin_articles` table and updates `blog_posts.linkedin_article_id` |
| **Input** | `{ post, articleId, articleUrl, publishedAt, status, error? }` |
| **Output** | `{ tracked: bool }` |
| **Tools** | PostgreSQL client (pg-client.js) |
| **Failure** | Logs warning, does not fail the pipeline |

---

### 9. Engagement Monitor Agent
**Node:** `monitor_engagement` (runs as separate scheduled job, not inline)

| | |
|---|---|
| **Role** | Polls LinkedIn Analytics API 24h and 7d after publish for views, likes, comments, shares |
| **Input** | `{ articleId, publishedAt }` — reads from `linkedin_articles WHERE engagement_checked_at IS NULL` |
| **Output** | Updates `linkedin_articles` with engagement metrics |
| **Tools** | `GET https://api.linkedin.com/rest/socialActions/{articleUrn}`, PostgreSQL DB |
| **Failure** | Logs, retries next scheduled run |

---

### 10. Retry/Error Handler Agent
**Node:** `handle_error`

| | |
|---|---|
| **Role** | Handles LinkedIn API errors: rate limits (429), server errors (5xx), auth errors (401/403) |
| **Input** | `{ error, attempt, maxAttempts: 3 }` |
| **Output** | `{ retry: bool, delayMs, fatal: bool }` |
| **Tools** | Exponential backoff: `2000 * 2^attempt` ms |
| **Failure handling** | 429 → wait `Retry-After` header value; 401 → fatal (bad token); 5xx → retry up to 3×; 400 → fatal (bad payload, log for fix) |

---

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS linkedin_articles (
  id                  SERIAL PRIMARY KEY,
  question_id         TEXT UNIQUE NOT NULL,        -- FK to blog_posts.question_id
  article_id          TEXT,                        -- LinkedIn article URN
  article_url         TEXT,
  title               TEXT NOT NULL,
  channel             TEXT,
  status              TEXT DEFAULT 'pending',      -- pending | published | failed | skipped
  error               TEXT,
  published_at        TEXT,
  engagement_checked_at TEXT,
  views               INTEGER DEFAULT 0,
  likes               INTEGER DEFAULT 0,
  comments            INTEGER DEFAULT 0,
  shares              INTEGER DEFAULT 0,
  created_at          TEXT DEFAULT (datetime('now'))
);

-- Add to blog_posts table
ALTER TABLE blog_posts ADD COLUMN linkedin_article_id TEXT;
```

---

## File Structure

```
script/
├── publish-linkedin-article.js          # CLI entry point
├── monitor-linkedin-engagement.js       # Engagement poller (separate cron)
├── ai/
│   └── graphs/
│       └── linkedin-article-graph.js    # LangGraph pipeline (all 10 agents)
└── db/
    └── pg-client.js                     # Already exists ✓

.github/workflows/
└── social.yml                           # Add new jobs: linkedin-article, engagement-monitor
```

---

## npm Scripts

```json
"linkedin:article":         "node script/publish-linkedin-article.js",
"linkedin:article:dry":     "DRY_RUN=true node script/publish-linkedin-article.js",
"linkedin:engagement":      "node script/monitor-linkedin-engagement.js"
```

---

## Environment Variables / Secrets

| Secret | Description | Where to set |
|--------|-------------|--------------|
| `LINKEDIN_ACCESS_TOKEN` | OAuth token — **must have `w_long_form_content` scope** | GitHub Secrets (already exists, needs scope update) |
| `LINKEDIN_PERSON_URN` | `urn:li:person:XXXX` | GitHub Secrets (already exists ✓) |
| `DATABASE_URL` | Production DB URL | GitHub Secrets (already exists ✓) |

> **Action required:** Regenerate `LINKEDIN_ACCESS_TOKEN` with `w_long_form_content` scope added in your LinkedIn Developer App → Products → "Share on LinkedIn" + "Articles & Newsletter".

---

## GitHub Actions Workflow Jobs

Add to `.github/workflows/social.yml`:

```yaml
linkedin-article:
  name: 📝 LinkedIn Article
  # Runs weekly on Thursdays at 9AM UTC
  if: |
    (github.event.schedule == '0 9 * * 4') ||
    (github.event_name == 'workflow_dispatch' && (inputs.task == 'all' || inputs.task == 'linkedin-article'))
  runs-on: ubuntu-latest
  timeout-minutes: 20
  steps:
    - uses: actions/checkout@v4
    - uses: ./.github/actions/setup-bot
    - name: Publish LinkedIn Article
      env:
        LINKEDIN_ACCESS_TOKEN: ${{ secrets.LINKEDIN_ACCESS_TOKEN }}
        LINKEDIN_PERSON_URN: ${{ secrets.LINKEDIN_PERSON_URN }}
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/openinterview
        DRY_RUN: ${{ inputs.dry_run || 'false' }}
        CHANNEL: ${{ inputs.channel || '' }}
      run: pnpm run linkedin:article

engagement-monitor:
  name: 📊 Engagement Monitor
  # Runs daily at 6AM UTC
  if: |
    (github.event.schedule == '0 6 * * *') ||
    (github.event_name == 'workflow_dispatch' && inputs.task == 'analytics')
  runs-on: ubuntu-latest
  timeout-minutes: 10
  steps:
    - uses: actions/checkout@v4
    - uses: ./.github/actions/setup-bot
    - name: Collect engagement metrics
      env:
        LINKEDIN_ACCESS_TOKEN: ${{ secrets.LINKEDIN_ACCESS_TOKEN }}
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/openinterview
      run: pnpm run linkedin:engagement
```

Add schedule trigger:
```yaml
on:
  schedule:
    - cron: '0 5 * * *'      # existing: daily post
    - cron: '0 15 * * 2'     # existing: weekly poll
    - cron: '0 9 * * 4'      # new: weekly article (Thursday)
    - cron: '0 6 * * *'      # new: daily engagement check
```

---

## Implementation Order

| Phase | Tasks | Agent(s) |
|-------|-------|---------|
| 1 | DB schema migration, pg-client.js integration | Tracker |
| 2 | `linkedin-article-graph.js` skeleton + Orchestrator | Orchestrator |
| 3 | Content Selector + Article Formatter | 2, 3 |
| 4 | SEO Optimizer + Quality Gate | 4, 6 |
| 5 | Image Generator (reuse existing util) | 5 |
| 6 | Publisher Agent (LinkedIn Articles API) | 7 |
| 7 | Retry/Error Handler | 10 |
| 8 | Tracker Agent + DB writes | 8 |
| 9 | CLI entry point + npm scripts + workflow jobs | — |
| 10 | Engagement Monitor (separate script + cron) | 9 |

---

## Tracking Dashboard (CLI)

```bash
# View published articles and engagement
node -e "
import('./script/db/pg-client.js').then(async ({dbClient}) => {
  const r = await dbClient.execute('SELECT title, status, published_at, views, likes FROM linkedin_articles ORDER BY published_at DESC LIMIT 10');
  console.table(r.rows);
});
"
```

---

## Key Constraints

- LinkedIn Articles API is **not available on free developer apps** — requires applying for "Marketing Developer Platform" access or having a Company Page
- Personal profile articles use `urn:li:person:` author; Company page articles use `urn:li:organization:`
- Rate limit: 100 article creates per day per member
- Articles cannot be edited via API after publish (only via LinkedIn UI)
- `w_long_form_content` scope must be explicitly requested and approved by LinkedIn
