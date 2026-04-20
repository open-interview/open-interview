# GitHub Workflows Consolidation

## Summary

Consolidated 14 workflows into 11 by merging related functionality and removing redundancies.

## Changes Made

### ✅ Consolidated Workflows (6 → 3)

#### 1. **content-generation.yml** (NEW)
**Merged:** `content-pipeline.yml` + `hourly-generator.yml`

**Purpose:** Unified content generation with two modes:
- **Hourly Mode** (0 * * * *): Quick question generation, prioritizes empty channels
- **Daily Mode** (0 2 * * *): Full pipeline (creator → analysis → verifier → processor → generators)

**Benefits:**
- Single workflow for all content generation
- Eliminates duplicate question generation logic
- Clearer scheduling and mode separation
- Reduced maintenance overhead

#### 2. **issue-processing.yml** (NEW)
**Merged:** `issue-processor.yml` + `cross-repo-issue-sync.yml`

**Purpose:** Unified issue processing for local and external repos
- Processes local GitHub issues with `bot:processor` label
- Fetches and processes issues from external repos
- Automatic cleanup of stale in-progress labels

**Benefits:**
- Single source of truth for issue processing
- Shared processor bot logic
- Consolidated scheduling (15min external, 30min local)
- Prevents circular processing loops

#### 3. **social-media.yml** (NEW)
**Merged:** `social-analytics.yml` + `linkedin-poll.yml`

**Purpose:** All social media and analytics tasks
- LinkedIn blog post sharing (5 AM UTC)
- LinkedIn poll posting (10 AM UTC)
- GitHub analytics collection

**Benefits:**
- All social media tasks in one place
- Shared LinkedIn credentials and setup
- Unified scheduling and monitoring

### ✅ Kept As-Is (8 workflows)

These workflows remain unchanged as they serve distinct purposes:

1. **deploy-app.yml** - Main app deployment (staging + production)
2. **deploy-blog.yml** - Blog site deployment
3. **duplicate-check.yml** - Weekly duplicate detection
4. **daily-maintenance.yml** - Daily cleanup tasks
5. **manual-blog.yml** - Manual blog post generation
6. **manual-e2e.yml** - Manual E2E test runs
7. **manual-intake.yml** - Manual question intake
8. **setup-labels.yml** - One-time label setup

## Workflow Organization

### By Schedule

| Time | Workflow | Purpose |
|------|----------|---------|
| Every 15 min | issue-processing.yml | External issue sync |
| Every 30 min | issue-processing.yml | Local issue processing |
| Every hour | content-generation.yml | Quick question generation |
| Daily 2 AM | content-generation.yml | Full content pipeline |
| Daily 2 AM | daily-maintenance.yml | Cleanup tasks |
| Daily 4 AM | deploy-blog.yml | Blog deployment |
| Daily 5 AM | social-media.yml | LinkedIn posts + analytics |
| Daily 10 AM | social-media.yml | LinkedIn polls |
| Weekly Sun | duplicate-check.yml | Duplicate detection |
| On push | deploy-app.yml | App deployment |

### By Category

**Content Generation:**
- content-generation.yml (hourly + daily)
- duplicate-check.yml (weekly)
- daily-maintenance.yml (daily)

**Deployment:**
- deploy-app.yml (on push)
- deploy-blog.yml (daily)

**Issue Management:**
- issue-processing.yml (15min + 30min)

**Social & Analytics:**
- social-media.yml (daily)

**Manual Operations:**
- manual-blog.yml
- manual-e2e.yml
- manual-intake.yml

**Setup:**
- setup-labels.yml

## Benefits

1. **Reduced Redundancy**: Eliminated duplicate logic across 6 workflows
2. **Clearer Organization**: Related tasks grouped together
3. **Easier Maintenance**: Fewer files to update
4. **Better Scheduling**: Clear separation of hourly vs daily tasks
5. **Unified Monitoring**: Single summary for related tasks
6. **Consistent Patterns**: Shared setup actions and environment variables

## Migration Notes

- All functionality preserved, just reorganized
- Schedule times unchanged
- All secrets and environment variables remain the same
- Manual workflow triggers still available with same inputs
- No changes needed to scripts or bot code

## Testing Recommendations

1. Monitor first hourly run of content-generation.yml
2. Verify issue-processing.yml handles both local and external issues
3. Check social-media.yml posts and polls correctly
4. Ensure all manual workflows still function
5. Validate deployment workflows unchanged
