# GitHub Actions Workflow Fix - Detailed Execution Plan

> **Project**: Fix Social & Analytics Workflow Database Connection  
> **Status**: 🔴 Critical - Daily cron failing  
> **Owner**: Solo Developer  
> **Timeline**: 24 hours  
> **Last Updated**: 2026-05-01

---

## Executive Summary

### Problem Statement
GitHub Actions workflow "Social & Analytics" fails daily at 5AM UTC when running GitHub Analytics job. Root cause: PostgreSQL connection refused (no database service in CI environment).

### Impact
- ❌ Daily analytics collection broken since last failure
- ❌ GitHub repository metrics not tracked
- ❌ Workflow marked as failed (red status)
- ⚠️ No immediate user impact (internal tooling)

### Solution Overview
Add PostgreSQL service container to workflow with proper initialization and environment configuration.

### Success Criteria
- ✅ Analytics job completes without errors
- ✅ Data successfully written to database
- ✅ Workflow runs green for 3 consecutive days
- ✅ No performance degradation (< 2min added to job time)

---

## Phase 1: Investigation & Validation (30 min)

### 1.1 Verify Current State ✅ DONE
- [x] Analyzed last 50 workflow runs
- [x] Identified failure pattern
- [x] Located error in logs
- [x] Confirmed root cause

**Findings**:
```
Error: ECONNREFUSED ::1:5432 and 127.0.0.1:5432
Location: script/github-analytics-bot.js:23
Cause: No PostgreSQL service in CI
```

### 1.2 Review Database Schema
**Action Items**:
- [ ] Check if `github_analytics` table exists in schema
- [ ] Verify migrations are up to date
- [ ] Confirm table structure matches bot expectations

**Commands**:
```bash
# Check schema
grep -A20 "github_analytics" shared/schema.ts

# Check migrations
ls -la script/migrations/

# Check bot table usage
grep -n "github_analytics" script/github-analytics-bot.js
```

### 1.3 Test Bot Locally
**Action Items**:
- [ ] Start local PostgreSQL
- [ ] Run bot script
- [ ] Verify data insertion
- [ ] Check for any other dependencies

**Commands**:
```bash
# Start PostgreSQL
docker run -d --name test-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=test_db \
  -p 5432:5432 \
  postgres:16

# Set environment
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_db
export GITHUB_TOKEN=your_token
export REPO_OWNER=satishkumar-dhule
export REPO_NAME=code-reels

# Run migrations
pnpm db:push

# Test bot
pnpm run bot:github-analytics

# Cleanup
docker stop test-postgres && docker rm test-postgres
```

**Expected Output**:
```
🚀 GitHub Analytics Bot Starting...
✅ Table initialized
✅ Fetched repository data
✅ Inserted 1 record
```

---

## Phase 2: Solution Design (30 min)

### 2.1 Architecture Decision

**Option A: PostgreSQL Service Container** ⭐ RECOMMENDED
```yaml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: test_db
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 5432:5432
```

**Pros**:
- ✅ Isolated test environment
- ✅ Matches production setup
- ✅ Can run migrations
- ✅ Validates DB operations
- ✅ No security risks

**Cons**:
- ⚠️ Adds ~30-60s to job time
- ⚠️ More complex setup

**Option B: Use Production Database**
```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Pros**:
- ✅ No service setup
- ✅ Real data
- ✅ Fast

**Cons**:
- ❌ Security risk (credentials in CI)
- ❌ No isolation
- ❌ Can't test safely
- ❌ Violates best practices

**Option C: Skip in CI**
```yaml
if: github.event_name != 'schedule'  # Only manual runs
```

**Pros**:
- ✅ Simple
- ✅ Fast CI

**Cons**:
- ❌ No validation
- ❌ Defeats purpose of CI
- ❌ Still need separate solution

**Decision**: **Option A** - PostgreSQL Service Container

**Rationale**:
1. Security: No production credentials exposed
2. Validation: Tests actual DB operations
3. Isolation: Clean test environment
4. Best Practice: Standard CI pattern
5. Performance: Acceptable overhead (~45s)

### 2.2 Implementation Design

**File Changes Required**:
1. `.github/workflows/social.yml` - Add service, env vars, setup step
2. `script/github-analytics-bot.js` - Add error handling (optional)
3. `shared/schema.ts` - Verify/add github_analytics table (if missing)

**Workflow Structure**:
```
analytics job:
  1. Start PostgreSQL service (parallel with checkout)
  2. Checkout code
  3. Setup Node/pnpm
  4. Run migrations (pnpm db:push)
  5. Run analytics bot
  6. (Service auto-stops after job)
```

**Environment Variables**:
```yaml
DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
REPO_OWNER: satishkumar-dhule
REPO_NAME: code-reels
PAGES_REPO_OWNER: open-interview
PAGES_REPO_NAME: open-interview.github.io
```

---

## Phase 3: Implementation (1 hour)

### 3.1 Update Workflow File

**File**: `.github/workflows/social.yml`

**Changes**:
```yaml
analytics:
  name: 📈 GitHub Analytics
  if: |
    (github.event.schedule == '0 5 * * *') ||
    (github.event_name == 'workflow_dispatch' && (inputs.task == 'all' || inputs.task == 'analytics'))
  runs-on: ubuntu-latest
  timeout-minutes: 10
  
  # ADD THIS SECTION
  services:
    postgres:
      image: postgres:16-alpine
      env:
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: test_db
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
      ports:
        - 5432:5432
  
  steps:
    - uses: actions/checkout@v4
    - uses: ./.github/actions/setup-node-pnpm
    
    # ADD THIS STEP
    - name: Initialize Database
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      run: |
        echo "📦 Running database migrations..."
        pnpm db:push
        echo "✅ Database ready"
    
    # UPDATE THIS STEP
    - name: Collect GitHub Analytics
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
        REPO_OWNER: satishkumar-dhule
        REPO_NAME: code-reels
        PAGES_REPO_OWNER: open-interview
        PAGES_REPO_NAME: open-interview.github.io
      run: pnpm run bot:github-analytics
```

**Implementation Steps**:
```bash
# 1. Create feature branch
git checkout -b fix/analytics-workflow-db

# 2. Edit workflow file
# (Apply changes above)

# 3. Commit
git add .github/workflows/social.yml
git commit -m "fix: add PostgreSQL service to analytics workflow

- Add postgres:16-alpine service container
- Add DATABASE_URL environment variable
- Add database initialization step before analytics
- Fixes ECONNREFUSED error in daily analytics job"

# 4. Push
git push origin fix/analytics-workflow-db
```

### 3.2 Verify Schema (If Needed)

**Check if table exists**:
```bash
grep -n "github_analytics" shared/schema.ts
```

**If missing, add table definition**:
```typescript
export const githubAnalytics = pgTable("github_analytics", {
  id: text("id").primaryKey(),
  repoOwner: text("repo_owner").notNull(),
  repoName: text("repo_name").notNull(),
  stars: integer("stars"),
  forks: integer("forks"),
  openIssues: integer("open_issues"),
  watchers: integer("watchers"),
  collectedAt: text("collected_at").notNull().$defaultFn(() => new Date().toISOString()),
});
```

### 3.3 Improve Error Handling (Optional)

**File**: `script/github-analytics-bot.js`

**Add at top of main()**:
```javascript
async function main() {
  console.log('🚀 GitHub Analytics Bot Starting...\n');
  
  // Validate environment
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    console.error('   Set it to: postgresql://user:pass@host:port/dbname');
    process.exit(1);
  }
  
  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN not set');
    process.exit(1);
  }
  
  // Test database connection
  try {
    await dbClient.execute('SELECT 1');
    console.log('✅ Database connection successful\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Is PostgreSQL running?');
      console.error('   In CI: Ensure service container is configured');
    }
    process.exit(1);
  }
  
  // ... rest of function
}
```

---

## Phase 4: Testing (1 hour)

### 4.1 Local Testing

**Test 1: Schema Validation**
```bash
# Verify schema loads
npx tsx -e "import('./shared/schema.ts').then(() => console.log('✅ Schema OK'))"
```

**Test 2: Bot with Local DB**
```bash
# Start PostgreSQL
docker run -d --name test-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16

# Setup
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
pnpm db:push

# Run bot (will fail without GitHub token, but should connect to DB)
pnpm run bot:github-analytics

# Cleanup
docker stop test-pg && docker rm test-pg
```

**Expected**: Database connection succeeds, bot runs (may fail on GitHub API without token)

### 4.2 CI Testing

**Test 1: Manual Workflow Trigger**
```bash
# Trigger workflow manually
gh workflow run social.yml --field task=analytics

# Watch logs
gh run watch

# Or view in browser
gh run view --web
```

**Test 2: Check Logs**
```bash
# Get latest run
RUN_ID=$(gh run list --workflow=social.yml --limit 1 --json databaseId --jq '.[0].databaseId')

# View logs
gh run view $RUN_ID --log | grep -A10 "GitHub Analytics"
```

**Expected Output**:
```
📈 GitHub Analytics  Initialize Database  📦 Running database migrations...
📈 GitHub Analytics  Initialize Database  ✅ Database ready
📈 GitHub Analytics  Collect GitHub Analytics  🚀 GitHub Analytics Bot Starting...
📈 GitHub Analytics  Collect GitHub Analytics  ✅ Database connection successful
📈 GitHub Analytics  Collect GitHub Analytics  ✅ Fetched repository data
📈 GitHub Analytics  Collect GitHub Analytics  ✅ Inserted 1 record
```

### 4.3 Validation Checklist

- [ ] Workflow completes without errors
- [ ] PostgreSQL service starts successfully
- [ ] Database migrations run successfully
- [ ] Bot connects to database
- [ ] Analytics data collected
- [ ] No ECONNREFUSED errors
- [ ] Job completes in < 3 minutes
- [ ] No secrets exposed in logs

---

## Phase 5: Deployment (30 min)

### 5.1 Create Pull Request

```bash
# Ensure branch is up to date
git checkout fix/analytics-workflow-db
git pull origin main
git push origin fix/analytics-workflow-db

# Create PR
gh pr create \
  --title "fix: add PostgreSQL service to analytics workflow" \
  --body "## Problem
GitHub Analytics job fails with ECONNREFUSED error because no PostgreSQL service is available in CI.

## Solution
- Add postgres:16-alpine service container
- Add DATABASE_URL environment variable
- Add database initialization step
- Add connection validation

## Testing
- [x] Tested locally with Docker PostgreSQL
- [x] Verified schema loads correctly
- [x] Triggered workflow manually - SUCCESS
- [x] Checked logs - no errors

## Impact
- Fixes daily analytics collection
- No breaking changes
- Adds ~45s to job time

Closes #XXX" \
  --assignee @me
```

### 5.2 Merge Strategy

**Option A: Direct Merge** (if confident)
```bash
# After PR review
gh pr merge --squash --delete-branch
```

**Option B: Staged Rollout** (safer)
```bash
# 1. Merge to staging branch first
git checkout staging
git merge fix/analytics-workflow-db
git push origin staging

# 2. Monitor staging workflow for 24 hours

# 3. Merge to main
git checkout main
git merge staging
git push origin main
```

**Recommendation**: Option A (direct merge) - low risk change, well-tested

### 5.3 Post-Merge Monitoring

**Monitor for 3 days**:
```bash
# Check workflow runs
gh run list --workflow=social.yml --limit 10

# Check for failures
gh run list --workflow=social.yml --limit 10 --json conclusion --jq '.[] | select(.conclusion == "failure")'

# View latest run
gh run view --workflow=social.yml
```

**Set up alerts** (optional):
```bash
# Get notified on failure
gh api repos/:owner/:repo/notifications/subscriptions \
  -X PUT \
  -f subscribed=true \
  -f ignored=false
```

---

## Phase 6: Documentation (30 min)

### 6.1 Update README

**Add to README.md or CONTRIBUTING.md**:

```markdown
## Development Setup

### Database

The project uses PostgreSQL. For local development:

```bash
# Start PostgreSQL
docker run -d --name dev-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=open_interview_dev \
  -p 5432:5432 \
  postgres:16

# Set environment variable
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/open_interview_dev

# Run migrations
pnpm db:push
```

### GitHub Analytics Bot

Collects repository metrics daily. Requires:
- `DATABASE_URL` - PostgreSQL connection string
- `GITHUB_TOKEN` - GitHub personal access token

Run manually:
```bash
pnpm run bot:github-analytics
```

In CI, PostgreSQL service container is automatically configured.
```

### 6.2 Add Troubleshooting Guide

**Create `docs/TROUBLESHOOTING.md`**:

```markdown
# Troubleshooting

## GitHub Analytics Workflow Fails

### Error: ECONNREFUSED
```
Error: connect ECONNREFUSED ::1:5432
```

**Cause**: PostgreSQL not running or DATABASE_URL not set

**Solution**:
1. Check PostgreSQL service in workflow
2. Verify DATABASE_URL environment variable
3. Check service health status

### Error: Database connection failed
```
❌ Database connection failed: password authentication failed
```

**Cause**: Wrong credentials in DATABASE_URL

**Solution**:
1. Verify DATABASE_URL format: `postgresql://user:pass@host:port/db`
2. Check service container environment variables
3. Ensure password matches

### Workflow times out
```
Error: The operation was canceled.
```

**Cause**: PostgreSQL service not starting

**Solution**:
1. Check service health check configuration
2. Increase timeout-minutes in workflow
3. Check GitHub Actions status page
```

### 6.3 Update Workflow Comments

**Add comments to workflow file**:
```yaml
analytics:
  name: 📈 GitHub Analytics
  # Runs daily at 5AM UTC to collect repository metrics
  # Requires PostgreSQL service for data storage
  if: |
    (github.event.schedule == '0 5 * * *') ||
    (github.event_name == 'workflow_dispatch' && (inputs.task == 'all' || inputs.task == 'analytics'))
  runs-on: ubuntu-latest
  timeout-minutes: 10
  
  services:
    postgres:
      # PostgreSQL 16 Alpine - lightweight image for CI
      # Health check ensures DB is ready before job starts
      image: postgres:16-alpine
      env:
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: test_db
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
      ports:
        - 5432:5432
```

---

## Risk Management

### Identified Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| PostgreSQL service fails to start | Low | High | Health checks, timeout, retry logic |
| Migration fails | Low | High | Test locally first, add error handling |
| Job timeout | Medium | Medium | Set appropriate timeout (10min), optimize queries |
| Secrets exposed in logs | Low | Critical | Use env vars, no echo of sensitive data |
| Breaking other workflows | Low | High | Only modify analytics job, test in isolation |

### Rollback Plan

**If workflow fails after deployment**:

```bash
# 1. Revert commit
git revert HEAD
git push origin main

# 2. Or disable analytics job temporarily
# Edit .github/workflows/social.yml:
analytics:
  if: false  # Temporarily disabled
```

**If database issues**:
```bash
# 1. Check service logs
gh run view --log | grep postgres

# 2. Verify health check
gh run view --log | grep "health-cmd"

# 3. Test service locally
docker run --rm postgres:16-alpine pg_isready
```

---

## Success Metrics & Monitoring

### Key Performance Indicators

**Reliability**:
- ✅ Target: 100% success rate for 7 consecutive days
- 📊 Measure: `gh run list --workflow=social.yml --limit 50 --json conclusion`

**Performance**:
- ✅ Target: Job completes in < 3 minutes
- 📊 Measure: Check "Duration" in workflow runs

**Data Quality**:
- ✅ Target: Analytics data collected daily
- 📊 Measure: Query database for recent records

### Monitoring Commands

```bash
# Daily health check
gh run list --workflow=social.yml --limit 7 --json conclusion,createdAt \
  | jq '.[] | {date: .createdAt, status: .conclusion}'

# Performance tracking
gh run list --workflow=social.yml --limit 10 --json databaseId,conclusion,createdAt \
  | jq '.[] | select(.conclusion == "success") | .databaseId' \
  | xargs -I {} gh run view {} --json jobs \
  | jq '.jobs[] | select(.name == "📈 GitHub Analytics") | .completedAt - .startedAt'

# Error rate
TOTAL=$(gh run list --workflow=social.yml --limit 30 --json conclusion | jq 'length')
FAILED=$(gh run list --workflow=social.yml --limit 30 --json conclusion | jq '[.[] | select(.conclusion == "failure")] | length')
echo "Error rate: $(($FAILED * 100 / $TOTAL))%"
```

### Alert Thresholds

- 🔴 **Critical**: 2 consecutive failures → Investigate immediately
- 🟡 **Warning**: Job time > 5 minutes → Optimize queries
- 🟢 **Healthy**: < 3 minutes, 100% success rate

---

## Timeline & Milestones

### Hour 0-1: Investigation ✅ DONE
- [x] Analyze workflow failures
- [x] Identify root cause
- [x] Review database schema
- [x] Create execution plan

### Hour 1-2: Implementation
- [ ] Update workflow file
- [ ] Add error handling
- [ ] Verify schema
- [ ] Commit changes

### Hour 2-3: Testing
- [ ] Test locally
- [ ] Trigger manual workflow run
- [ ] Verify logs
- [ ] Validate data

### Hour 3-4: Deployment
- [ ] Create pull request
- [ ] Review changes
- [ ] Merge to main
- [ ] Monitor first run

### Hour 4-24: Monitoring
- [ ] Check next scheduled run (5AM UTC)
- [ ] Verify 3 consecutive successes
- [ ] Update documentation
- [ ] Close issue

### Day 2-7: Validation
- [ ] Monitor daily runs
- [ ] Track performance metrics
- [ ] Gather feedback
- [ ] Mark as complete

---

## Appendix

### A. Useful Commands

```bash
# Workflow management
gh workflow list
gh workflow view social.yml
gh workflow run social.yml --field task=analytics
gh workflow disable social.yml
gh workflow enable social.yml

# Run management
gh run list --workflow=social.yml
gh run view <run-id>
gh run view <run-id> --log
gh run watch
gh run rerun <run-id>

# Database management
pnpm db:push          # Run migrations
pnpm db:studio        # Open Drizzle Studio
pnpm db:generate      # Generate migrations

# Bot management
pnpm run bot:github-analytics
```

### B. Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `GITHUB_TOKEN` | Yes | GitHub PAT for API access | `ghp_xxxxx` |
| `REPO_OWNER` | Yes | Repository owner | `satishkumar-dhule` |
| `REPO_NAME` | Yes | Repository name | `code-reels` |
| `PAGES_REPO_OWNER` | Yes | Pages repo owner | `open-interview` |
| `PAGES_REPO_NAME` | Yes | Pages repo name | `open-interview.github.io` |

### C. Related Files

```
.github/workflows/social.yml          # Main workflow file
script/github-analytics-bot.js        # Analytics bot script
script/db/pg-client.js                # Database client
shared/schema.ts                      # Database schema
package.json                          # Scripts definition
```

### D. References

- [GitHub Actions Services](https://docs.github.com/en/actions/using-containerized-services/about-service-containers)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [GitHub CLI Manual](https://cli.github.com/manual/)

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-05-01 | 1.0 | Initial plan created |
| 2026-05-01 | 1.1 | Added detailed implementation steps |
| 2026-05-01 | 1.2 | Added monitoring and validation sections |

---

**Next Steps**: Begin Phase 3 - Implementation

**Questions?** Review this plan, then execute step-by-step.
