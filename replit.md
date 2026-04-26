# code-reels — Interview Prep Platform

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
