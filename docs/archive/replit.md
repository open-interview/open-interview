# CodeReels – Technical Interview Prep Platform

## Overview
CodeReels (also known as Open Interview) is a comprehensive technical interview preparation platform featuring 1000+ questions across 30+ topics. It includes swipe-based learning, voice interview practice, spaced repetition (SRS), coding challenges, and gamified progress tracking.

## Tech Stack
- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Vite 7
- **Backend**: Express.js + TypeScript (served via tsx)
- **Database**: Turso (LibSQL / SQLite-compatible) with Drizzle ORM
- **Routing**: wouter
- **State**: TanStack Query
- **UI**: Radix UI, Framer Motion, Lucide React
- **Package Manager**: pnpm

## Architecture
This is a **fullstack monorepo** where the Express server serves both:
1. The API endpoints (`/api/*`)
2. The Vite dev server in development (via Vite middleware)

Files are organized as:
- `client/` – React frontend (Vite root)
- `server/` – Express backend (index.ts, routes.ts, db.ts, storage.ts, vite.ts)
- `shared/` – Shared TypeScript schema (Drizzle ORM schema)
- `script/` / `scripts/` – Automation, migration, and data generation scripts

## Running the App
The app runs on **port 5000** via the "Start application" workflow.

Development command: `NODE_ENV=development pnpm tsx server/index.ts`

## Database
- Uses `@libsql/client` with a local SQLite file — no Turso account needed
- Database file: `local.db` (auto-created in project root)
- Schema defined in `shared/schema.ts`
- To push schema changes: `pnpm db:push`

## Environment Variables
- `SQLITE_URL` – Optional SQLite URL (defaults to `file:local.db` if not set)
- `PORT` – Server port (default: 5000)

## Key Fixes Applied During Import
1. Fixed `import.meta.dirname` (Node 18 compatibility issue) in `vite.config.ts` and `server/vite.ts` – replaced with `fileURLToPath(import.meta.url)` pattern
2. Upgraded Node.js from 18 to 20 (required by Vite 7 which uses `crypto.hash`)
3. Installed missing `nanoid` package
4. Configured local SQLite database for development
