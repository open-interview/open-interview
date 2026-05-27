# Open Interview — Agent Guide

## Project overview

React SPA (Vite + React 19 + wouter + Tailwind CSS + shadcn/ui) delivering technical interview prep with 1000+ questions across 40+ topics. Deployed to GitHub Pages as a **static site**. The Express server + SQLite only exist for local dev — the static build (`pnpm build:static`) generates everything from file-based data in `data/`.

## Commands

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Vite dev server (HMR, **no data pipeline** — tests/learning paths empty) |
| `pnpm build:static` | Full static build: fetch data → generate tests/paths → Vite build → route shells → search index |
| `pnpm preview` | Serve `dist/public` on `:3333` |
| `pnpm check` | Typecheck via `tsc --noEmit` |
| `pnpm test` | Playwright E2E via `bash run-playwright.sh test` (wrapper sets `LD_LIBRARY_PATH` for NixOS Chromium) |
| `pnpm vitest run` | Unit tests (vitest, jsdom) |

**Important:** `pnpm dev` skips the entire data generation pipeline. Pages that depend on `tests.json`, `learning-paths.json`, `blog-posts.json`, etc. will be empty. Always use `pnpm build:static && pnpm preview` to verify real behavior.

## Architecture

- **Frontend entry:** `client/src/main.tsx` → `App.tsx` (wouter router with React.lazy pages)
- **Backend entry (local dev only):** `server/routes.ts` (Express, file-based repos in `server/repositories/`)
- **Shared types:** `shared/schema.ts`
- **Data source of truth:** `data/questions/`, `data/tests/`, `data/certifications.json`, `data/blog-posts/`, `data/vectors/`, etc.
- **Build orchestrator:** `scripts/build-static.mjs` — runs these steps in order:
  1. Read questions from `data/questions/*.json` (local files, no remote API call)
  2. Generate tests from channels
  3. Generate learning paths
  4. Vite build (`client/` → `dist/public/`)
  5. Generate static route shells (SPA prerender)
  6. Generate Pagefind search index
- **Vite config:** `vite.config.ts` — root is `client/`, output `dist/public/`, path aliases `@/` → `client/src/`, `@shared/` → `shared/`
- **Monorepo:** `packages/tech-svg-generator/` and `blog/` (separate Astro site)

## Path aliases

- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

## Codebase quirks

- `pnpm run build:static` is the **only** way to produce the real site. It runs ~8 sequential scripts then Vite.
- Generated assets (`client/public/data/*`, `client/public/blog-data.json`) are gitignored — they are produced at build time.
- `pnpm run dev:server` starts the Express server (used by Playwright tests as the webServer target).
- Playwright config in `playwright.config.ts` uses `run-playwright.sh` wrapper — do not call `pnpm exec playwright` directly (NixOS `LD_LIBRARY_PATH`).
- Unit tests run via vitest (`vitest.config.ts`), E2E via Playwright. Two different test systems.
- The `blog/` package is a separate Astro site with its own `pnpm --filter @openinterview/blog` commands.
- The repo has a large `todo.md` with 102+ known UI/UX issues. Do not assume the app is in a polished state.

## Question generation

Questions live in `data/questions/*.json`. The build step (`script/fetch-questions-for-build.js`) reads them locally — **no remote API call**. Of 62 channel files, only 8 general-topic channels have questions (algorithms, backend, behavioral, database, devops, frontend, generative-ai, system-design). The 54 certification-specific channels are empty `[]` stubs.

To generate questions for a channel, run:
```
node script/generate-certification-questions.js <channel-id>
```
or batch-generate with:
```
node script/gen-questions-batch.js
```
These use AI (OpenRouter/local via `VITE_OPENROUTER_COOKIE` or `opencode`) and write to `data/questions/<channel-id>.json`. See `.env.example` for AI configuration.

## Known pitfalls
- Five notification/reward systems coexist (CreditsContext, AchievementContext, BadgeContext, rewardStorage, NotificationsContext). Expect overlapping state.
- Routes like `/review` have known loading failures. `/docs` shows internal developer docs, not user-facing help.
- Multiple pages exceed 800 lines (VoiceInterview.tsx: 1457, Documentation.tsx: 1453).
- The mobile bottom nav (`UnifiedNav.tsx`) has a `getActiveSection()` bug — no tab id matches `'progress'`.
