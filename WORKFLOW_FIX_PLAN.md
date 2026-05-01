# GitHub Actions Workflow Fix Plan

## Analysis Summary

Analyzed last 50 workflow runs across all workflows. Found 2 failure patterns:

### Pattern 1: CI/CD Pipeline - Schema Parsing Error ✅ FIXED
- **Run**: 25209895452 (2026-05-01 09:38:48)
- **Job**: 🔍 Quality (E2E + Lighthouse)
- **Error**: `SyntaxError: "undefined" is not valid JSON` in `shared/schema.ts:247`
- **Root Cause**: Drizzle ORM couldn't parse `.unique()` constraint on nullable foreign key `blogPosts.questionId`
- **Fix Applied**: Removed `.unique()` constraint (commit 81633e41)
- **Status**: ✅ Fixed - Run 25210029903 succeeded

### Pattern 2: Social & Analytics - Database Connection Error ⚠️ NEEDS FIX
- **Run**: 25206480837 (2026-05-01 07:25:38)
- **Job**: 📈 GitHub Analytics
- **Error**: `ECONNREFUSED ::1:5432` and `127.0.0.1:5432`
- **Root Cause**: GitHub Analytics bot tries to connect to local PostgreSQL but no DB service running in CI
- **Impact**: Scheduled daily analytics collection fails

## Detailed Fix Plan

### Issue: GitHub Analytics Bot Database Connection

#### Problem
```
❌ Fatal error: AggregateError [ECONNREFUSED]:
    at async initializeTable (script/github-analytics-bot.js:23:3)
    at async main (script/github-analytics-bot.js:162:5)
  code: 'ECONNREFUSED',
  Error: connect ECONNREFUSED ::1:5432
  Error: connect ECONNREFUSED 127.0.0.1:5432
```

#### Root Cause Analysis
1. **Script**: `script/github-analytics-bot.js` uses `script/db/pg-client.js`
2. **Client**: Expects PostgreSQL at `localhost:5432`
3. **CI Environment**: No PostgreSQL service configured in workflow
4. **Workflow**: `.github/workflows/social.yml` - analytics job

#### Solution Options

##### Option 1: Add PostgreSQL Service (Recommended)
**Pros**: 
- Proper testing environment
- Matches production setup
- Can test DB operations

**Cons**:
- Slower CI runs
- More complex setup

**Implementation**:
```yaml
analytics:
  name: 📈 GitHub Analytics
  runs-on: ubuntu-latest
  timeout-minutes: 10
  services:
    postgres:
      image: postgres:16
      env:
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: open_interview_test
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
    - name: Setup Database
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/open_interview_test
      run: pnpm db:push
    - name: Collect GitHub Analytics
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/open_interview_test
        GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
        REPO_OWNER: satishkumar-dhule
        REPO_NAME: code-reels
        PAGES_REPO_OWNER: open-interview
        PAGES_REPO_NAME: open-interview.github.io
      run: pnpm run bot:github-analytics
```

##### Option 2: Use Production Database
**Pros**:
- No service setup needed
- Real data collection

**Cons**:
- Security risk (exposes prod credentials)
- No isolation
- Can't test safely

**Implementation**:
```yaml
- name: Collect GitHub Analytics
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}  # Production DB
    GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
    # ... rest
```

##### Option 3: Skip DB in CI, Run Elsewhere
**Pros**:
- Fast CI
- Simple

**Cons**:
- No CI validation
- Need separate cron job

**Implementation**:
```yaml
analytics:
  name: 📈 GitHub Analytics
  if: false  # Disable in CI
  # Or move to separate deployment/cron
```

##### Option 4: Mock/Stub Database for CI
**Pros**:
- Fast
- No external dependencies

**Cons**:
- Doesn't test real DB operations
- More code complexity

**Implementation**:
```javascript
// script/db/pg-client.js
if (process.env.CI && !process.env.DATABASE_URL) {
  // Use in-memory mock or skip DB operations
  export const dbClient = createMockClient();
}
```

### Recommended Approach: Option 1 (PostgreSQL Service)

#### Step-by-Step Implementation

1. **Update `.github/workflows/social.yml`**
   - Add PostgreSQL service to analytics job
   - Add DATABASE_URL env var
   - Add db:push step before analytics

2. **Verify Database Schema**
   - Ensure `github_analytics` table exists in schema
   - Check migrations are up to date

3. **Test Locally**
   ```bash
   # Start local postgres
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16
   
   # Set env
   export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
   
   # Run bot
   pnpm run bot:github-analytics
   ```

4. **Update Documentation**
   - Document DATABASE_URL requirement
   - Add setup instructions for local development

#### Files to Modify

1. `.github/workflows/social.yml` - Add PostgreSQL service
2. `script/github-analytics-bot.js` - Add better error handling
3. `README.md` or `CONTRIBUTING.md` - Document DB setup

#### Validation Steps

1. Push changes to branch
2. Trigger workflow manually: `gh workflow run social.yml --field task=analytics`
3. Monitor logs: `gh run watch`
4. Verify analytics data collected
5. Check no errors in logs

### Additional Improvements

#### 1. Better Error Handling
```javascript
// script/github-analytics-bot.js
try {
  await dbClient.execute(query);
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.error('❌ Database connection failed. Is DATABASE_URL set?');
    console.error('   In CI, ensure PostgreSQL service is configured.');
    process.exit(1);
  }
  throw error;
}
```

#### 2. Environment Validation
```javascript
// script/github-analytics-bot.js
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}
```

#### 3. Graceful Degradation
```javascript
// Option: Skip analytics in CI if DB not available
if (process.env.CI && !process.env.DATABASE_URL) {
  console.log('⏭️ Skipping analytics in CI (no DATABASE_URL)');
  process.exit(0);
}
```

## Success Metrics

- ✅ CI/CD Pipeline: All jobs pass (Build, Quality, Deploy)
- ✅ Social & Analytics: Analytics job completes without errors
- ✅ No ECONNREFUSED errors in logs
- ✅ GitHub analytics data collected and stored
- ✅ All workflows green for 7 consecutive days

## Timeline

- **Immediate**: Schema fix applied ✅
- **Next 1 hour**: Implement PostgreSQL service in social workflow
- **Next 2 hours**: Test and validate
- **Next 24 hours**: Monitor for regressions

## Rollback Plan

If PostgreSQL service causes issues:
1. Revert workflow changes
2. Use Option 3 (disable analytics in CI)
3. Set up separate cron job for analytics collection
4. Investigate alternative solutions

## Notes

- All other workflows (content, deploy-blog, maintenance, community) are stable
- No pattern of failures in other jobs
- CI/CD pipeline now stable after schema fix
- Focus on social workflow analytics job only
