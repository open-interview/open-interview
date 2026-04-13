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
- Uses `@libsql/client` which supports both Turso cloud (libsql://) and local SQLite (file:*.db)
- Local development uses `TURSO_DATABASE_URL=file:local.db`
- Schema defined in `shared/schema.ts`
- To push schema: `TURSO_DATABASE_URL=file:local.db pnpm db:push`

## Environment Variables
- `TURSO_DATABASE_URL` – Database URL (file:local.db for dev, libsql://... for Turso)
- `TURSO_AUTH_TOKEN` – Turso auth token (not needed for local SQLite)
- `TURSO_DATABASE_URL_RO` – Read-only Turso URL (optional, falls back to main URL)
- `TURSO_AUTH_TOKEN_RO` – Read-only token (optional)
- `PORT` – Server port (default: 5000)

## Key Fixes Applied During Import
1. Fixed `import.meta.dirname` (Node 18 compatibility issue) in `vite.config.ts` and `server/vite.ts` – replaced with `fileURLToPath(import.meta.url)` pattern
2. Upgraded Node.js from 18 to 20 (required by Vite 7 which uses `crypto.hash`)
3. Installed missing `nanoid` package
4. Configured local SQLite database for development
