# PostgreSQL Infrastructure Migration Plan

> **Status: VERIFIED** - Last updated: 2026-04-20
> **Verification Sources**: `shared/schema.ts`, `server/db.ts`, `script/db/pg-client.js`, `script/bots/shared/queue.js`, `.github/workflows/content.yml`

## Executive Summary

This document outlines a comprehensive migration plan to improve the PostgreSQL infrastructure used by the actions/job system. Current issues include inefficient connection pooling, manual SQL placeholder handling, and gaps in backup/restore strategy.

## Verification Summary

✅ **Schema Already Defined**: `shared/schema.ts:45-58` contains complete `workQueue` table definition with types exported  
✅ **Dependencies Installed**: `pg@^8.16.3`, `drizzle-orm@^0.39.3`, `drizzle-kit@^0.31.4` present in `package.json`  
✅ **Drizzle Configured**: `drizzle.config.ts` properly set to `postgresql` dialect  
⚠️ **Migration Needed**: 46+ locations using `client.execute()` wrapper in `server/` and 8 locations in `script/bots/shared/queue.js`  

**Key Finding**: Rather than creating schema (already done), focus should be on:
1. Connection pooling optimization (Phase 1)
2. Converting raw SQL to Drizzle queries via repositories (Phase 2)  
3. Improving backup/restore strategy (Phase 3)

## Verification Findings

### Confirmed Existing Infrastructure

| Component | Location | Status | Notes |
|-----------|---------|--------|-------|
| Drizzle ORM | `shared/schema.ts` | ✅ Full | 20+ tables defined with types |
| Drizzle Kit | `drizzle.config.ts` | ✅ Configured | `postgresql` dialect |
| Schema definition | `shared/schema.ts:45-58` | ✅ Complete | `workQueue` with full types |
| Types export | `shared/schema.ts:256-290` | ✅ Complete | All tables have `$inferSelect/Insert` |

### Confirmed Issues Requiring Migration

| File | Lines | Issue | Severity |
|------|-------|-------|--------|
| `server/db.ts` | 22-25 | Manual `?` → `$N` conversion | Medium |
| `script/db/pg-client.js` | 41-43 | Duplicated manual conversion | Medium |
| `script/bots/shared/queue.js` | 24-36 | Legacy `db.execute()` with raw SQL | High |
| `server/db.ts` | 8-18 | Independent pool (max:20) | Low |
| `script/db/pg-client.js` | 22-32 | Independent pool (max:10) | Low |

---

## Phase 1: Connection Pooling & Client Optimization

### 1.1 Current State Analysis

**Files involved:**
- `server/db.ts` - Server pool (max: 20)
- `script/db/pg-client.js` - Bot scripts pool (max: 10)
- `shared/schema.ts` - Drizzle schema

**Code Verification:**

```typescript
// server/db.ts:8-18 - Server pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : undefined,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  max: 20,  // ⚠️ Independent pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

```javascript
// script/db/pg-client.js:22-32 - Bot scripts pool
_pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  max: 10,  // ⚠️ Second independent pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

**Problems identified:**
| Issue | Impact | Location |
|-------|--------|----------|
| Two independent pools | 30 total connections instead of shared pool | server/db.ts:8, script/db/pg-client.js:22 |
| Manual `?` → `$N` conversion | Fragile, reinventing wheel | server/db.ts:22-25, script/db/pg-client.js:41-43 |
| No prepared statement caching | Query parsing overhead each run | Both pools |
| Pool max 20 (server) + 10 (scripts) | Potential 30 connections | Default pg pool behavior |

**Existing Schema (verified in `shared/schema.ts`):**

```typescript
// shared/schema.ts:45-58 - Already fully defined!
export const workQueue = pgTable("work_queue", {
  id: serial("id").primaryKey(),
  itemType: text("item_type").notNull(),
  itemId: text("item_id").notNull(),
  action: text("action").notNull(),
  priority: integer("priority").default(5),
  status: text("status").default("pending"),
  reason: text("reason"),
  createdBy: text("created_by"),
  assignedTo: text("assigned_to"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  processedAt: text("processed_at"),
  result: text("result"),
});

// Types already exported at lines 256-290
export type WorkQueueItem = typeof workQueue.$inferSelect;
export type NewWorkQueueItem = typeof workQueue.$inferInsert;
```

### 1.2 Recommended Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application                         │
│  ┌─────────────────┐    ┌─────────────────────────┐   │
│  │   Server API    │    │   Bot Scripts           │   │
│  │   (server/)     │    │   (script/bots/)        │   │
│  └────────┬────────┘    └───────────┬─────────────┘   │
│           │                        │                  │
│           └───────┬──────────────┬─┘                  │
│                   ▼                                    │
│           ┌───────────────┐                           │
│           │   PgBouncer    │  (connection pooler)     │
│           │  :6432        │                           │
│           └───────┬───────┘                           │
│                   ▼                                    │
│           ┌───────────────┐                           │
│           │ PostgreSQL    │                           │
│           │  :5432        │                           │
│           └───────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Implementation Steps

#### Step 1.3.1: Add PgBouncer Docker Compose

**File: `docker-compose.yml`**
```yaml
version: '3.8'

services:
  pgbouncer:
    image: edoburu/pgbouncer:latest
    environment:
      DATABASE_URL: "postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}"
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 200
      DEFAULT_POOL_SIZE: 20
      MIN_POOL_SIZE: 5
      RESERVE_POOL_SIZE: 5
      MAX_DB_CONNECTIONS: 100
    ports:
      - "6432:5432"
    depends_on:
      - postgres
    healthcheck:
      test: ["CMD", "pgbouncer", "-h", "localhost", "-p", "6432", "-d", "postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: openinterview
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

#### Step 1.3.2: Update Connection Strings

**Environment variables to update:**
```bash
# Before
DATABASE_URL=postgres://postgres:postgres@localhost:5432/openinterview

# After (via PgBouncer)
DATABASE_URL=postgres://postgres:postgres@localhost:6432/openinterview
```

**Files to update:**
1. `.env` - Application environment
2. `.env.local` - Local development
3. `.github/workflows/content.yml` - CI pipeline (line 75, 91, etc.)

#### Step 1.3.3: Consolidate to Single Pool

**Create unified client: `lib/db/pool.ts`**
```typescript
import pg from 'pg';

const { Pool } = pg;

let _pool: pg.Pool | null = null;

export function getPool config = () {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // PgBouncer handles connection pooling
      max: 10,  // Reduced since PgBouncer manages
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    
    _pool.on('error', (err) => {
      console.error('[pool] Unexpected error:', err.message);
    });
  }
  return _pool;
}

export function closePool(): Promise<void> {
  return _pool?.end() ?? Promise.resolve();
}
```

**Deprecate old clients (migration):**
1. `server/db.ts` → Migrate to use `lib/db/pool.ts`
2. `script/db/pg-client.js` → Migrate to use `lib/db/pool.ts`

---

## Phase 2: Query Builder Migration

> **⚠️ REQUIRES CLARIFICATION**: The migration plan suggests adding schema definitions, but **the schema already exists fully defined** in `shared/schema.ts:45-58` with proper types exported. The primary migration needed is **using Drizzle queries** instead of raw SQL with manual placeholder conversion.

### 2.1 Current State

**Manual SQL with placeholder conversion (verified):**
```typescript
// server/db.ts:22-25
function convertPlaceholders(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}
```

**Legacy queue execution (verified at script/bots/shared/queue.js):**
```javascript
// Current: script/bots/shared/queue.js:23-36
const existing = await db.execute({
  sql: `SELECT id FROM work_queue 
        WHERE item_type = ? AND item_id = ? AND action = ? AND status = 'pending'`,
  args: [itemType, itemId, action]
});

const result = await db.execute({
  sql: `INSERT INTO work_queue (item_type, item_id, action, priority, reason, created_by, assigned_to, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  args: [itemType, itemId, action, priority, reason, createdBy, assignedTo, new Date().toISOString()]
});
```

### 2.2 Migration to Drizzle ORM

**Target: Use Drizzle's query builder instead of raw SQL**

**Before (current):**
```typescript
await db.execute({
  sql: `SELECT id FROM work_queue 
        WHERE item_type = ? AND item_id = ? AND status = 'pending'`,
  args: [itemType, itemId]
});
```

**After (Drizzle):**
```typescript
import { workQueue } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

await db
  .select({ id: workQueue.id })
  .from(workQueue)
  .where(
    and(
      eq(workQueue.itemType, itemType),
      eq(workQueue.itemId, itemId),
      eq(workQueue.status, 'pending')
    )
  );
```

### 2.3 Implementation Steps

> **✅ SKIP**: Schema is already fully defined in `shared/schema.ts:45-58`

**Existing schema (no changes needed):**
```typescript
// Already exists at shared/schema.ts:45-58
export const workQueue = pgTable("work_queue", {
  id: serial("id").primaryKey(),
  itemType: text("item_type").notNull(),
  itemId: text("item_id").notNull(),
  action: text("action").notNull(),
  priority: integer("priority").default(5),
  status: text("status").default("pending"),
  reason: text("reason"),
  createdBy: text("created_by"),
  assignedTo: text("assigned_to"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  processedAt: text("processed_at"),
  result: text("result"),
});

// Already exported at ~line 270
export type WorkQueueItem = typeof workQueue.$inferSelect;
export type NewWorkQueueItem = typeof workQueue.$inferInsert;
```

#### Step 2.3.1: Create Repository Layer

**File: `lib/repositories/work-queue.ts`**
```typescript
import { db } from './db';
import { workQueue } from '@shared/schema';
import { eq, and, asc, inArray } from 'drizzle-orm';

export const workQueueRepo = {
  async findPending(limit = 10, assignedTo?: string) {
    let query = db
      .select()
      .from(workQueue)
      .where(eq(workQueue.status, 'pending'))
      .orderBy(asc(workQueue.priority), asc(workQueue.createdAt))
      .limit(limit);

    if (assignedTo) {
      query = db
        .select()
        .from(workQueue)
        .where(
          and(
            eq(workQueue.status, 'pending'),
            eq(workQueue.assignedTo, assignedTo)
          )
        )
        .orderBy(asc(workQueue.priority), asc(workQueue.createdAt))
        .limit(limit);
    }

    return query.execute();
  },

  async markProcessing(ids: number[]) {
    return db
      .update(workQueue)
      .set({ status: 'processing' })
      .where(inArray(workQueue.id, ids));
  },

  async markCompleted(id: number, result?: object) {
    return db
      .update(workQueue)
      .set({
        status: 'completed',
        processedAt: new Date().toISOString(),
        result: result ? JSON.stringify(result) : null,
      })
      .where(eq(workQueue.id, id));
  },

  async insert(data: { itemType: string; itemId: string; action: string; priority?: number; reason?: string; createdBy?: string; assignedTo?: string }) {
    return db.insert(workQueue).values({
      ...data,
      createdAt: new Date().toISOString(),
    }).returning({ id: workQueue.id });
  }
};
```

#### Step 2.3.2: Migrate Queue Functions

**File: `script/bots/shared/queue.js` - Update to use repository**

```javascript
// Before: script/bots/shared/queue.js:23-36
const existing = await db.execute({
  sql: `SELECT id FROM work_queue WHERE item_type = ? AND item_id = ? AND action = ? AND status = 'pending'`,
  args: [itemType, itemId, action]
});

// After: Use workQueueRepo
import { workQueueRepo } from '../../lib/repositories/work-queue.js';

const existing = await workQueueRepo.findByItemTypeItemIdAction(itemType, itemId, action);
```

**Complete migration mapping:**

| Function | Before (raw SQL) | After (Drizzle) |
|----------|-----------------|-----------------|
| `addToQueue()` | `db.execute(INSERT...)` | `workQueueRepo.insert()` |
| `getNextWorkItem()` | `db.execute(SELECT...)` | `workQueueRepo.findPending()` |
| `completeWorkItem()` | `db.execute(UPDATE...)` | `workQueueRepo.markCompleted()` |
| `failWorkItem()` | `db.execute(UPDATE...)` | `workQueueRepo.markFailed()` |
| `getBatchWorkItems()` | `db.execute(SELECT...)` | `workQueueRepo.findPending(batchSize)` |
| `addBatchToQueue()` | Loop with `db.execute()` | `workQueueRepo.insertMany()` |

---

## Phase 3: Backup & Restore Strategy

### 3.1 Current Gaps

| Gap | Risk | Location |
|-----|------|----------|
| No schema dumps | Can't restore structure alone | .github/workflows/content.yml:93 |
| Uncompressed dumps | Large artifact sizes | Same |
| No versioning | No rollback point | GitHub artifacts (1-day TTL) |
| Single table dumps | Not atomic | Same |

### 3.2 Recommended Strategy

#### Step 3.2.1: Enhanced Dump Scripts

**File: `scripts/backup.sh`**
```bash
#!/bin/bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATABASE_URL="${DATABASE_URL:-postgres://postgres:localhost:6432/openinterview}"

mkdir -p "$BACKUP_DIR"

# Tables to backup
TABLES=(
  "questions"
  "certifications"
  "channel_mappings"
  "voice_sessions"
  "learning_paths"
  "flashcards"
  "bot_ledger"
  "bot_runs"
  "blog_posts"
  "tests"
  "bot_state"
)

echo "[backup] Starting backup at $TIMESTAMP"

# Schema dump (once, for all tables)
echo "[backup] Dumping schema..."
pg_dump "$DATABASE_URL" \
  --schema-only \
  --no-owner \
  --no-privileges \
  --schema=public \
  > "$BACKUP_DIR/schema-$TIMESTAMP.sql"

# Data dumps (compressed)
for table in "${TABLES[@]}"; do
  echo "[backup] Dumping $table..."
  pg_dump "$DATABASE_URL" \
    --data-only \
    --no-owner \
    --no-privileges \
    -t "$table" | gzip \
    > "$BACKUP_DIR/${table}-$TIMESTAMP.sql.gz
done

# Combined full dump (for quick restore)
echo "[backup] Creating full dump..."
pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --file="$BACKUP_DIR/full-$TIMESTAMP.sql"

# Create manifest
cat > "$BACKUP_DIR/manifest-$TIMESTAMP.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "tables": $(printf '%s\n' "${TABLES[@]}" | jq -R . | jq -s .),
  "schema_size": $(stat -f%z "$BACKUP_DIR/schema-$TIMESTAMP.sql" 2>/dev/null || stat -c%s "$BACKUP_DIR/schema-$TIMESTAMP.sql"),
  "created_at": "$(date -Iseconds)"
}
EOF

echo "[backup] Complete: $BACKUP_DIR/*-$TIMESTAMP.*"
echo "[backup] Total size: $(du -ch $BACKUP_DIR/*-$TIMESTAMP.* | tail -1 | cut -f1)"
```

#### Step 3.2.2: Restore Script

**File: `scripts/restore.sh`**
```bash
#!/bin/bash
set -euo pipefail

TIMESTAMP="${1:-latest}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATABASE_URL="${DATABASE_URL:-postgres://postgres:localhost:6432/openinterview}"

if [ "$TIMESTAMP" = "latest" ]; then
  TIMESTAMP=$(ls -1 "$BACKUP_DIR"/*-*.sql.gz 2>/dev/null | \
    sed 's/.*-\([0-9-]*\)\.sql.gz/\1/' | \
    sort -r | head -1)
fi

echo "[restore] Restoring from $TIMESTAMP"

# Restore schema first
echo "[restore] Restoring schema..."
psql "$DATABASE_URL" -f "$BACKUP_DIR/schema-$TIMESTAMP.sql"

# Restore tables
for table in questions certifications channel_mappings voice_sessions learning_paths flashcards bot_ledger bot_runs blog_posts tests bot_state; do
  if [ -f "$BACKUP_DIR/${table}-$TIMESTAMP.sql.gz" ]; then
    echo "[restore] Restoring $table..."
    gunzip -c "$BACKUP_DIR/${table}-$TIMESTAMP.sql.gz" | \
      psql "$DATABASE_URL"
  fi
done

echo "[restore] Complete"
```

#### Step 3.2.3: Update GitHub Workflow

**File: `.github/workflows/backup.yml`**
```yaml
name: 💾 Database Backup

on:
  schedule:
    - cron: '0 3 * * *'  # Daily 3AM
  workflow_dispatch:
    inputs:
      timestamp:
        description: 'Restore from timestamp'
        required: false

jobs:
  backup:
    name: 📦 Create Backup
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      
      - name: Setup PostgreSQL
        uses: pg-action/setup-postgres@v1
        with:
          postgresql-version: 15
          
      - name: Run backup
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
        run: ./scripts/backup.sh
        
      - name: Upload to S3
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
          
      - name: S3 sync
        run: |
          aws s3 sync ./backups s3://${{ secrets.S3_BUCKET }}/backups/ \
            --storage-class STANDARD_IA \
            --expires $(date -d "+30 days" -Iseconds) \
            --metadata "timestamp=$(date +%Y%m%d-%H%M%S)"
            
  restore:
    name: ♻️ Restore Backup
    if: github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      
      - name: Download from S3
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
          
      - name: S3 sync down
        run: aws s3 sync s3://${{ secrets.S3_BUCKET }}/backups/ ./backups/
        
      - name: Setup PostgreSQL
        uses: pg-action/setup-postgresql@v1
        with:
          postgresql-version: 15
          
      - name: Restore
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
        run: ./scripts/restore.sh ${{ github.event.inputs.timestamp }}
```

---

## Phase 4: Job Queue Optimization

### 4.1 Current Implementation

**Work queue stored in PostgreSQL:**
- `script/bots/shared/queue.js` - Queue management
- `script/bots/shared/db.js` - Bot tables

**Issues:**
| Issue | Impact |
|-------|--------|
| Polling-based | Wastes connections |
| No native retry/backoff | Manual implementation |
| No dead-letter queue | Failed jobs lost |
| No rate limiting | Can overwhelm |

### 4.2 Option A: Keep PostgreSQL + Improvements

**File: `lib queues/job-queue.ts`**
```typescript
import { db } from './db';
import { workQueue } from '@shared/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

interface JobOptions {
  priority?: number;
  maxRetries?: number;
  backoffMs?: number;
  timeoutMs?: number;
}

export class JobQueue {
  constructor(private options: JobOptions = {}) {
    this.options = {
      maxRetries: 3,
      backoffMs: 1000,
      timeoutMs: 30000,
      ...options
    };
  }

  async enqueue<T>(type: string, id: string, payload: T, options?: JobOptions) {
    const merged = { ...this.options, ...options };
    
    return db.insert(workQueue).values({
      itemType: type,
      itemId: id,
      action: JSON.stringify(payload),
      priority: merged.priority ?? 5,
      status: 'pending',
      createdAt: new Date(),
    }).returning({ id: workQueue.id });
  }

  async process<T>(
    handler: (job: { type: string; id: string; payload: T }) => Promise<void>,
    options?: { concurrency?: number; batchSize?: number }
  ) {
    const batchSize = options?.batchSize ?? 10;
    
    // Atomic fetch + lock
    const jobs = await db
      .select()
      .from(workQueue)
      .where(
        and(
          eq(workQueue.status, 'pending'),
          sql`created_at < NOW() - INTERVAL '5 seconds'`
        )
      )
      .orderBy(workQueue.priority, workQueue.createdAt)
      .limit(batchSize)
      .for('update skip locked')
      .execute();

    if (jobs.length === 0) return;

    // Mark as processing
    const ids = jobs.map(j => j.id);
    await db
      .update(workQueue)
      .set({ status: 'processing' })
      .where(inArray(workQueue.id, ids));

    // Process with retry logic
    const results = await Promise.allSettled(
      jobs.map(async (job) => {
        const payload = JSON.parse(job.action);
        
        try {
          await handler({ type: job.itemType, id: job.itemId, payload });
          
          await db
            .update(workQueue)
            .set({ status: 'completed', processedAt: new Date() })
            .where(eq(workQueue.id, job.id));
        } catch (error) {
          await this.handleFailure(job.id, error);
        }
      })
    );

    return results;
  }

  private async handleFailure(jobId: number, error: Error) {
    const job = await db
      .select({ attempts: workQueue.attempts })
      .from(workQueue)
      .where(eq(workQueue.id, jobId))
      .execute();

    const attempts = (job.attempts ?? 0) + 1;
    const maxRetries = this.options.maxRetries ?? 3;

    if (attempts >= maxRetries) {
      await db
        .update(workQueue)
        .set({ status: 'failed', processedAt: new Date() })
        .where(eq(workQueue.id, jobId));
    } else {
      // Exponential backoff
      const delay = this.options.backoffMs! * Math.pow(2, attempts);
      await db
        .update(workQueue)
        .set({ 
          status: 'pending',
          attempts,
          // scheduled_at = NOW() + delay would need column
        })
        .where(eq(workQueue.id, jobId));
    }
  }
}
```

### 4.3 Option B: Redis + Bull Queue

**Migration to Redis if preferred:**

```typescript
import Queue from 'bull';

interface JobData {
  type: string;
  id: string;
  payload: unknown;
}

export const jobQueue = new Queue<JobData>('job-queue', process.env.REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
  settings: {
    maxStalledCount: 2,
    stalledInterval: 5000,
  },
});

// Producer
await jobQueue.add('content-generation', { questionId, data });

// Consumer
jobQueue.process(async (job) => {
  const { type, id } = job.data;
  // Process job
});
```

**Required Redis setup:**
```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes

volumes:
  redis_data:
```

---

## Phase 5: Migration Checklist

### Phase 1: Connection Pooling
- [x] Dependencies already installed: `pg@^8.16.3`, `drizzle-orm@^0.39.3`
- [ ] Add `docker-compose.yml` with PgBouncer (optional for dev, recommended for production)
- [ ] Update `.env` files with port 6432 (if using PgBouncer)
- [ ] Update `.github/workflows/content.yml`
- [ ] Test local development
- [ ] Verify CI works

### Phase 2: Query Builder Migration

> **CRITICAL GAP IDENTIFIED**: The server uses a custom `client.execute()` wrapper in `server/db.ts` that handles:
> 1. Placeholder conversion (`?` → `$N`)
> 2. PRAGMA statement filtering (SQLite compatibility)
> 3. Automatic `RETURNING id` for INSERTs
> 4. `lastInsertRowid` extraction
> 
> This wrapper is used **46+ times** across `server/routes.ts` and `server/storage.ts`

#### 2.1 Current State - Server Usage

**Verified usage locations:**
- `server/storage.ts`: 22, 36, 51 - User storage operations
- `server/routes.ts`: 56, 85, 112, 130, 149, 188, 206, 281, 295, 326, 342, 401, 423, 440, 481, 534, 596, 610, 629, 681, 694, 701, 786, 799, 818, 831, 844, 877, 896, 910, 943, 951, 970, 1006, 1031, 1048, 1072, 1082, 1095, 1117, 1130, 1153, 1163 - API route handlers

**Example from `server/storage.ts:22-25`:**
```typescript
const result = await client.execute({
  sql: "SELECT id, username, password FROM users WHERE id = $1",
  args: [id]
});
```

**Example from `server/db.ts:27-52` - The wrapper being used:**
```typescript
export const client = {
  execute: async (sqlOrObj: string | { sql: string; args?: any[] }) => {
    // ... placeholder conversion, PRAGMA handling, RETURNING logic
  }
};
```

#### 2.2 Migration Strategy

**Option A: Repository per Entity** (Recommended)
Create typed repositories for each table that encapsulate all database operations:

**Option B: Query Builder Direct Usage** 
Use Drizzle's query builder directly in services/storage

**Option C: Enhanced Client Wrapper**
Improve the existing client to use Drizzle under the hood while preserving API

**Recommended: Option A + C Hybrid**
1. Keep `client.execute()` for backward compatibility during migration
2. Create repositories for new features
3. Gradually migrate existing usage

#### 2.3 Implementation Steps

##### Step 2.3.1: Create Base Repository Pattern

**File: `lib/repositories/base.ts`**
```typescript
import { db } from './db';
import { eq, and, or, not, isNull, isNotNull, asc, desc, sql } from 'drizzle-orm';
import { type PgColumn, type PgTableWithColumns } from 'drizzle-orm/pg-core';

export abstract class BaseRepository<T extends PgTableWithColumns> {
  protected constructor(protected table: T) {}

  protected whereEquals<K extends keyof T['_']['columns']>(
    column: PgColumn<K, T['_']['tableName'], unknown>,
    value: T['_']['columns'][K]
  ) {
    return eq(column, value);
  }

  // Common query builders
  select() {
    return db.select().from(this.table);
  }

  insert(values: typeof this.table.$inferInsert) {
    return db.insert(this.table).values(values);
  }

  update(values: Partial<typeof this.table.$inferUpdate>) {
    return db.update(this.table).set(values);
  }

  delete() {
    return db.delete(this.table);
  }
}
```

##### Step 2.3.2: Create User Repository

**File: `lib/repositories/user.ts`**
```typescript
import { BaseRepository } from './base';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class UserRepository extends BaseRepository<typeof users> {
  constructor() {
    super(users);
  }

  async findById(id: string) {
    const result = await this.select()
      .where(eq(users.id, id))
      .limit(1)
      .execute();
    return result[0] ?? null;
  }

  async findByUsername(username: string) {
    const result = await this.select()
      .where(eq(users.username, username))
      .limit(1)
      .execute();
    return result[0] ?? null;
  }

  async create(user: { username: string; password: string }) {
    const result = await this.insert({
      id: crypto.randomUUID(),
      ...user,
    }).returning();
    return result[0];
  }
}

// Singleton instance
export const userRepo = new UserRepository();
```

##### Step 2.3.3: Create Work Queue Repository (Updated)

**File: `lib/repositories/work-queue.ts`**
```typescript
import { BaseRepository } from './base';
import { workQueue } from '@shared/schema';
import { eq, and, asc, inArray, sql } from 'drizzle-orm';

export class WorkQueueRepository extends BaseRepository<typeof workQueue> {
  constructor() {
    super(workQueue);
  }

  async findPending(limit = 10, assignedTo?: string) {
    let query = this.select()
      .where(eq(workQueue.status, 'pending'))
      .orderBy(asc(workQueue.priority), asc(workQueue.createdAt))
      .limit(limit);

    if (assignedTo) {
      query = this.select()
        .where(
          and(
            eq(workQueue.status, 'pending'),
            eq(workQueue.assignedTo, assignedTo)
          )
        )
        .orderBy(asc(workQueue.priority), asc(workQueue.createdAt))
        .limit(limit);
    }

    return query.execute();
  }

  async findByItemTypeItemIdAction(
    itemType: string,
    itemId: string,
    action: string
  ) {
    const result = await this.select()
      .where(
        and(
          eq(workQueue.itemType, itemType),
          eq(workQueue.itemId, itemId),
          eq(workQueue.action, action),
          eq(workQueue.status, 'pending')
        )
      )
      .execute();
    return result[0] ?? null;
  }

  async markProcessing(ids: number[]) {
    if (ids.length === 0) return;
    await this.update({ status: 'processing' })
      .where(inArray(workQueue.id, ids))
      .execute();
  }

  async markCompleted(id: number, result?: object) {
    await this.update({
      status: 'completed',
      processedAt: new Date().toISOString(),
      result: result ? JSON.stringify(result) : null,
    })
    .where(eq(workQueue.id, id))
    .execute();
  }

  async markFailed(id: number, error: string) {
    await this.update({
      status: 'failed',
      processedAt: new Date().toISOString(),
      result: JSON.stringify({ error }),
    })
    .where(eq(workQueue.id, id))
    .execute();
  }

  async insert(data: {
    itemType: string;
    itemId: string;
    action: string;
    priority?: number;
    reason?: string;
    createdBy?: string;
    assignedTo?: string;
  }) {
    const result = await this.insert({
      ...data,
      createdAt: new Date().toISOString(),
    }).returning({ id: workQueue.id });
    return result[0];
  }

  async insertMany(items: Array<{
    itemType: string;
    itemId: string;
    action: string;
    priority?: number;
    reason?: string;
    createdBy?: string;
    assignedTo?: string;
  }>) {
    const values = items.map(item => ({
      ...item,
      createdAt: new Date().toISOString(),
    }));
    
    const result = await this.insert(values)
      .returning({ id: workQueue.id })
      .execute();
    return result.map(r => r.id);
  }
}

// Singleton instance
export const workQueueRepo = new WorkQueueRepository();
```

##### Step 2.3.4: Update Storage to Use Repository

**File: `server/storage.ts` - Gradual migration**
```typescript
import { client } from "./db";
import { userRepo } from "../../lib/repositories/user"; // NEW

export class PostgresStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    // Option 1: Keep existing for now (zero risk)
    // const result = await client.execute({
    //   sql: "SELECT id, username, password FROM users WHERE id = $1",
    //   args: [id]
    // });
    
    // Option 2: Use repository (recommended for new code)
    const user = await userRepo.findById(id);
    return user ? {
      id: user.id,
      username: user.username,
      password: user.password
    } : undefined;
  }

  // ... similar for other methods
}
```

##### Step 2.3.5: Migrate Queue.js to Use Repository

**File: `script/bots/shared/queue.js`**
```javascript
// Add at top
import { workQueueRepo } from '../../../lib/repositories/work-queue.js';

// Replace all db.execute calls with repository methods
// Example:
const existing = await workQueueRepo.findByItemTypeItemIdAction(
  itemType, itemId, action
);
```

#### 2.4 Backward Compatibility Strategy

During migration, maintain both pathways:

1. **New code**: Use repositories exclusively
2. **Existing code**: Keep `client.execute()` but deprecate
3. **Eventual cleanup**: Remove `client.execute()` after full migration

**Migration order:**
1. `lib/repositories/` - Create base + specific repositories
2. `script/bots/shared/queue.js` - Migrate to use workQueueRepo
3. `server/storage.ts` - Migrate to use userRepo (and others)
4. `server/routes.ts` - Migrate route handlers to use repositories
5. `server/db.ts` - Deprecate `client.execute()` wrapper

### Phase 3: Backup Strategy
- [ ] Create `scripts/backup.sh`
- [ ] Create `scripts/restore.sh`
- [ ] Create `.github/workflows/backup.yml`
- [ ] Configure S3 bucket (if using cloud backup)
- [ ] Test backup/restore locally

### Phase 4: Job Queue (Optional)
- [ ] Implement JobQueue class
- [ ] Add retry/backoff logic
- [ ] Add dead-letter handling
- [ ] Or: Redis + Bull migration

### Phase 5: Cleanup
- [ ] Deprecate `server/db.ts` manual pool (keep, migrate usage to unified pool)
- [ ] Deprecate `script/db/pg-client.js` duplicate pool (keep, migrate usage to unified pool)
- [ ] Remove manual placeholder conversion from both files
- [ ] Update documentation
- [ ] Archive old scripts

---

## Rollback Plan

### If Issues Occur

| Scenario | Rollback Action |
|----------|----------------|
| PgBouncer connection issues | Revert to direct connections (port 5432) |
| Drizzle query errors | Keep legacy executor, fix incrementally |
| Backup failures | Use previous artifact from GitHub releases |
| Job queue issues | Revert to synchronous processing |

### Quick Rollback Commands

```bash
# Revert to direct connection
DATABASE_URL=postgres://postgres:postgres@localhost:5432/openinterview

# Revert old client
git checkout HEAD~1 -- server/db.ts script/db/pg-client.js

# Use previous artifact
gh run list --status completed | head -5
gh run download <run-id> db-baseline
```

---

## Timeline Estimate

| Phase | Effort | Duration | Status |
|-------|--------|----------|---------|
| Phase 1: Connection Pooling | 2-4 hours | 1 day | Ready |
| Phase 2: Query Builder | 2-4 hours | 1-2 days | Schema ready, need repo |
| Phase 3: Backup Strategy | 2-4 hours | 1-2 days | Ready |
| Phase 4: Job Queue | 4-8 hours | 2-3 days | Optional |
| Phase 5: Cleanup | 1-2 hours | 1 day | After phases 1-4 |
| **Total** | **11-22 hours** | **6-9 days** | |

---

## Verified Dependencies

From `package.json` (lines 258, 273, 317):

```json
{
  "dependencies": {
    "pg": "^8.16.3",
    "drizzle-orm": "^0.39.3",
    "drizzle-zod": "^0.7.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.4"
  }
}
```

### Migration Path Summary

```
Current Architecture:
┌─────────────────────────────────────┐
│          Application Layer          │
│  ┌─────────────┐ ┌─────────────┐   │
│  │  server/    │ │  script/    │   │
│  │  routes.ts  │ │  bots/      │   │
│  │  storage.ts │ │  shared/    │   │
│  │  db.ts      │ │  queue.js   │   │
│  └─────┬──────┘ └──────┬──────┘   │
│        │              │          │
│        ▼              ▼          │
│   ┌─────────────┐ ┌─────────────┐ │
│   │ client.execute() │ │ client.execute() │ │
│   │ (46+ calls)    │ │ (8 calls)      │ │
│   └─────┬──────┘ └──────┬──────┘ │
│         │               │          │
│         └───────────────┘          │
│                  ▼                 │
│          ┌─────────────┐          │
│          │ PostgreSQL  │          │
│          │    :5432    │          │
│          └─────────────┘          │
└─────────────────────────────────────┘

Target Architecture (Phase 1-2):
┌─────────────────────────────────────┐
│          Application Layer          │
│  ┌─────────────┐ ┌─────────────┐   │
│  │  server/    │ │  script/    │   │
│  │  UserRepo   │ │  WorkQueue  │   │
│  │  WorkQueue  │ │  Repo       │   │
│  │  Repo ...   │ │  ...        │   │
│  └─────┬──────┘ └──────┬──────┘   │
│        │              │          │
│        ▼              ▼          │
│   ┌─────────────┐ ┌─────────────┐ │
│   │   Drizzle   │ │   Drizzle   │ │
│   │  Queries    │ │  Queries    │ │
│   └─────┬──────┘ └──────┬──────┘ │
│         │               │          │
│         └───────────────┘          │
│                  ▼                 │
│          ┌─────────────┐          │
│          │ PostgreSQL  │          │
│          │    :5432    │          │
│          └─────────────┘          │
└─────────────────────────────────────┘

Target Architecture (Phase 3+):
┌─────────────────────────────────────┐
│          Application Layer          │
│  ┌─────────────┐ ┌─────────────┐   │
│  │  server/    │ │  script/    │   │
│  │  Repos...   │ │  Repos...   │   │
│  └─────┬──────┘ └──────┬──────┘   │
│        │              │          │
│        ▼              ▼          │
│   ┌─────────────┐ ┌─────────────┐ │
│   │   PgBouncer │ │   PgBouncer │ │
│   │  (optional) │ │  (optional) │ │
│   │    :6432    │ │    :6432    │ │
│   └─────┬──────┘ └──────┬──────┘ │
│         │               │          │
│         └───────────────┘          │
│                  ▼                 │
│          ┌─────────────┐          │
│          │ PostgreSQL  │          │
│          │    :5432    │          │
│          └─────────────┘          │
└─────────────────────────────────────┘
```

---

## Appendix: Environment Variables

```bash
# Required
DATABASE_URL=postgres://[user]:[password]@[host]:[port]/[database]

# Individual (if not using DATABASE_URL)
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=openinterview

# PgBouncer (optional)
PGBOUNCER_HOST=localhost
PGBOUNCER_PORT=6432

# Redis (if using Bull)
REDIS_URL=redis://localhost:6379

# Backup
BACKUP_DIR=./backups
S3_BUCKET=your-bucket-name
```

---

## References

- [PgBouncer Documentation](https://www.pgbouncer.org/config.html)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Bull Queue](https://github.com/optimalhq/bull)
- [pg_dump documentation](https://www.postgresql.org/docs/current/app-pgdump.html)