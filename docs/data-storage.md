# Data Storage

Open Interview uses a **file-based data storage** approach for the static site. Question data lives in the PostgreSQL database and is exported to JSON files that are committed to the repository. The static site reads these files directly — no database connection needed at runtime.

## How it works

```
PostgreSQL (source of truth)
        │
        │  pnpm run data:export
        ▼
data/questions/          ← committed to git
  ├── aws.json
  ├── kubernetes.json
  ├── system-design.json
  └── ...
        │
        │  vite build
        ▼
client/public/data/      ← generated at build time, NOT committed
  └── (same files, copied/processed by build)
```

The `data/` directory is the **source of truth for static content**. It is committed to the repository so GitHub Actions can build the site without a live database connection.

## Directory structure

```
data/
├── README.md              ← this file's companion
├── questions/             ← one JSON file per topic channel
│   ├── aws.json
│   ├── kubernetes.json
│   └── ...
├── certifications/        ← certification metadata
│   └── index.json
├── learning-paths/        ← curated learning paths
│   └── index.json
└── meta/                  ← stats, channel index, etc.
    └── channels.json
```

Files in `data/` are **<50 MB each** and safe to commit. The full dataset is well within GitHub's file size limits.

## Export / Import workflow

### Export (database → files)

Run this after adding or updating questions in the database:

```bash
pnpm run data:export
```

This calls `script/fetch-questions-for-build.js` and writes JSON files to `data/`. Commit the result.

### Import (files → database)

To seed a fresh local PostgreSQL instance from the committed data files:

```bash
pnpm run data:import
```

This reads from `data/` and inserts rows into the local database. Safe to run multiple times (uses `ON CONFLICT DO NOTHING`).

### Build (files → static site)

The standard build reads from the database (or `data/` if `USE_FILE_DATA=true`):

```bash
pnpm run build:static
```

In GitHub Actions, the build uses the committed `data/` files directly — no `DATABASE_URL` required.

## Local development setup

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8
- PostgreSQL (local instance or Docker)

### Steps

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env and set DATABASE_URL to your local PostgreSQL
   ```

3. **Create the schema**

   ```bash
   pnpm run db:push
   ```

4. **Import data from committed files**

   ```bash
   pnpm run data:import
   ```

5. **Start the dev server**

   ```bash
   pnpm dev
   ```

### Using Docker for PostgreSQL

```bash
docker run -d \
  --name open-interview-db \
  -e POSTGRES_DB=openinterview \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine
```

Then set `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/openinterview` in `.env`.

## GitHub Actions

The CI/CD pipeline uses the committed `data/` files to build the static site without needing a live database:

```yaml
- name: Build static site
  run: pnpm run build:static
  # No DATABASE_URL needed — reads from data/ directory
```

See [github-actions-db-setup.md](./github-actions-db-setup.md) for the full workflow configuration.

## Adding new questions

1. Add questions via the admin UI or generation scripts (`pnpm run generate:question`)
2. Export the updated data: `pnpm run data:export`
3. Commit the updated JSON files in `data/`
4. Open a pull request

The CI pipeline validates question format automatically on every PR.
