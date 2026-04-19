# GitHub Actions PostgreSQL Setup Guide

## 1. Current State Analysis

### What exists in `.github/workflows/ci-cd.yml`

The current CI/CD pipeline has three jobs: **build**, **quality**, and **deploy** (staging/production). None of them provision or connect to a database.

- The **build** job runs `pnpm run build` and `pnpm run build:pagefind` — both are static asset builds that call `script/fetch-questions-for-build.js`, which reads from a live database via `DATABASE_URL`.
- The **quality** job runs Playwright E2E tests and Lighthouse audits against a static build served locally — no database connection needed for these tests.
- The **unit test** runner (`vitest`) is not invoked in CI at all currently.

### What the app uses

- **ORM**: Drizzle ORM (`drizzle-orm/node-postgres`) with `pg` driver
- **Schema**: `shared/schema.ts` — 18 tables defined with `pgTable`
- **Config**: `drizzle.config.ts` — dialect `postgresql`, reads `DATABASE_URL`
- **Connection**: `server/db.ts` — `pg.Pool` using `DATABASE_URL` or individual `PG*` env vars
- **Migration script**: `scripts/migrate-sqlite-to-postgres.ts` — migrates from SQLite `local.db` to PostgreSQL

### What's missing

No workflow currently:
- Spins up a PostgreSQL service container
- Runs `drizzle-kit push` or SQL migrations to create the schema
- Runs server-side unit/integration tests that touch the database
- Validates the migration script itself

---

## 2. Gap Analysis

| Requirement | Current State | Gap |
|---|---|---|
| PostgreSQL service in CI | ❌ None | Need `services.postgres` block |
| Schema creation | ❌ None | Need `drizzle-kit push` or migration SQL |
| `DATABASE_URL` env var | ❌ Not set in CI | Need to set from service container |
| Unit/integration tests | ❌ Not run in CI | Need a `test` job |
| Migration script validation | ❌ Not tested | Need to run `migrate-sqlite-to-postgres.ts` in CI |
| Test database isolation | ❌ N/A | Need separate DB per run or per test |

The `build:static` script calls `script/fetch-questions-for-build.js`, which queries the database. In CI this either fails silently or requires a real `DATABASE_URL` secret. A local PostgreSQL service container would allow this to work without external credentials.

---

## 3. Recommended Workflow Changes

Add a `test` job to `ci-cd.yml` that:
1. Starts a PostgreSQL service container
2. Pushes the Drizzle schema
3. Optionally seeds minimal data
4. Runs unit/integration tests

The `build` job should also be updated to use the service container when running `build:static`.

---

## 4. Environment Variable Configuration

### In the workflow (service container values)

```yaml
env:
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/open_interview_test
  PGHOST: localhost
  PGPORT: 5432
  PGUSER: postgres
  PGPASSWORD: postgres
  PGDATABASE: open_interview_test
```

### For production secrets (GitHub repo settings)

Go to **Settings → Secrets and variables → Actions** and add:

| Secret name | Value |
|---|---|
| `DATABASE_URL` | Your production PostgreSQL connection string |
| `PGHOST` | Production host (if not using `DATABASE_URL`) |
| `PGPASSWORD` | Production password |

In the workflow, reference them as `${{ secrets.DATABASE_URL }}`.

### `.env.example` additions needed

```bash
# PostgreSQL (replaces SQLite for production)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/open_interview"
PGHOST="localhost"
PGPORT="5432"
PGUSER="postgres"
PGPASSWORD="postgres"
PGDATABASE="open_interview"
```

---

## 5. Database Initialization / Migration Steps for CI

### Option A: `drizzle-kit push` (recommended for CI)

Pushes the current schema directly without generating migration files. Fast and always in sync with `shared/schema.ts`.

```bash
pnpm exec drizzle-kit push
```

Requires `DATABASE_URL` to be set. Uses `drizzle.config.ts` which already points to `shared/schema.ts`.

### Option B: Run SQL migration files

If you have SQL files in `server/migrations/`:

```bash
psql $DATABASE_URL -f server/migrations/add-user-sessions-table.sql
```

### Option C: Validate the migration script itself

To test `scripts/migrate-sqlite-to-postgres.ts` in CI:

```bash
# Requires local.db to exist (or a test fixture)
pnpm exec tsx scripts/migrate-sqlite-to-postgres.ts
```

---

## 6. Example Workflow YAML

Add this `test` job to `.github/workflows/ci-cd.yml`, after the `build` job:

```yaml
  test:
    name: 🧪 Unit & Integration Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: open_interview_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/open_interview_test
      PGHOST: localhost
      PGPORT: 5432
      PGUSER: postgres
      PGPASSWORD: postgres
      PGDATABASE: open_interview_test

    steps:
      - uses: actions/checkout@v5
      - uses: ./.github/actions/setup-node-pnpm

      - name: Wait for PostgreSQL
        run: |
          until pg_isready -h localhost -p 5432 -U postgres; do
            echo "Waiting for postgres..."; sleep 2
          done

      - name: Push schema
        run: pnpm exec drizzle-kit push --force

      - name: Run unit tests
        run: pnpm exec vitest run

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-${{ github.run_number }}
          path: test-results/
          retention-days: 7
```

### To also use PostgreSQL in the `build` job (for `build:static`)

Add the same `services` block and `env` to the `build` job, then replace the build step:

```yaml
      - name: Build application (with DB)
        run: |
          pnpm exec drizzle-kit push --force
          pnpm run build:static
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/open_interview_ci
          VITE_BASE_URL: '/'
```

### Full updated `build` job with PostgreSQL

```yaml
  build:
    name: 🔨 Build
    runs-on: ubuntu-latest
    timeout-minutes: 20

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: open_interview_ci
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    outputs:
      deploy-staging: ${{ steps.determine-env.outputs.staging }}
      deploy-production: ${{ steps.determine-env.outputs.production }}

    steps:
      - uses: actions/checkout@v5
      - uses: ./.github/actions/setup-node-pnpm

      - name: Determine deployment environments
        id: determine-env
        run: |
          # ... existing logic unchanged ...

      - name: Push schema
        run: pnpm exec drizzle-kit push --force
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/open_interview_ci

      - name: Build application
        run: |
          pnpm run build
          pnpm run build:pagefind
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/open_interview_ci
          VITE_BASE_URL: '/'

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/public
          retention-days: 1
```

---

## 7. Test Isolation and Performance Considerations

### Test isolation

**Per-run isolation** (simplest): Each CI run gets a fresh PostgreSQL container. The `--health-cmd` ensures it's ready before tests start. No cleanup needed — the container is destroyed after the job.

**Per-test isolation** (for integration tests): Wrap each test in a transaction and roll back:

```typescript
// vitest setup file: tests/setup.ts
import { pool } from "../server/db";

let client: pg.PoolClient;

beforeEach(async () => {
  client = await pool.connect();
  await client.query("BEGIN");
});

afterEach(async () => {
  await client.query("ROLLBACK");
  client.release();
});
```

Register in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.ts"],
    environment: "node",
    globals: true,
  },
});
```

**Schema isolation** (for parallel test suites): Create a unique schema per worker:

```typescript
const schema = `test_${process.env.VITEST_WORKER_ID ?? "0"}`;
await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
await pool.query(`SET search_path TO "${schema}"`);
```

### Performance

- Use `postgres:16-alpine` — smaller image, faster pull (~50MB vs ~150MB for full image).
- The `--health-cmd pg_isready` with `--health-retries 5` prevents race conditions without arbitrary `sleep` calls.
- `drizzle-kit push --force` is faster than running individual migration files and stays in sync with the schema automatically.
- Cache `pnpm` store (already handled by `.github/actions/setup-node-pnpm`) — no additional caching needed for PostgreSQL since it starts fresh each run.
- For the `build:static` script, if the database fetch is slow, consider adding a `--timeout` flag or splitting the fetch into a separate cacheable step.

### Avoiding flaky tests

- Always use the health check options on the service container — never rely on a fixed `sleep`.
- Set `connectionTimeoutMillis: 10000` in `pg.Pool` (already set in `server/db.ts`) to surface connection failures quickly.
- Use `ON CONFLICT DO NOTHING` in seed scripts (already used in `migrate-sqlite-to-postgres.ts`) to make seeding idempotent.

### Security

- Never use production `DATABASE_URL` in CI test jobs. Use the local service container credentials.
- Store production credentials only in GitHub Secrets, not in workflow YAML.
- The service container is only accessible within the job's network — it is not exposed externally.
