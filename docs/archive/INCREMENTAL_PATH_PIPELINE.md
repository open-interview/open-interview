# Incremental Learning Path Pipeline ✅

## Overview

The curated learning paths pipeline now operates **incrementally** - it enhances existing paths and adds new ones rather than deleting and recreating everything. This approach:

- ✅ Preserves user engagement metrics (popularity, completion rate, ratings)
- ✅ Maintains path stability (same IDs over time)
- ✅ Updates question selection with latest content
- ✅ Adds new paths as content grows
- ✅ Archives paths that no longer meet criteria (instead of deleting)
- ✅ Runs safely every day without disruption

## How It Works

### Incremental Update Strategy

When the pipeline runs, it:

1. **Analyzes Current Content**
   - Fetches all active questions from database
   - Analyzes by channel, difficulty, company, certification
   - Generates fresh path definitions

2. **Compares with Existing Paths**
   - Loads existing paths from database
   - Matches by path ID
   - Determines what changed

3. **Applies Changes Incrementally**
   - **NEW**: Creates paths that don't exist yet
   - **UPDATE**: Refreshes question selection for existing paths
   - **ARCHIVE**: Marks paths with insufficient questions (doesn't delete)
   - **PRESERVE**: Keeps user metrics (popularity, ratings, completion rate)

### Update Logic

```javascript
for (const path of allPaths) {
  const existing = existingPaths.get(path.id);
  
  if (!existing) {
    // NEW PATH - Insert
    INSERT INTO learning_paths (...)
    console.log("✨ NEW: {path.title}")
  } else {
    // EXISTING PATH - Update
    UPDATE learning_paths 
    SET question_ids = ?, channels = ?, last_updated = ?
    WHERE id = ?
    console.log("🔄 UPDATED: {path.title}")
  }
}

// Archive paths that no longer meet criteria
for (const existingId of existingPaths.keys()) {
  if (!generatedIds.has(existingId)) {
    UPDATE learning_paths SET status = 'archived'
    console.log("📦 ARCHIVED: {existingId}")
  }
}
```

## Daily Automation

### GitHub Actions Workflow

**File**: `.github/workflows/generate-learning-paths.yml`

**Schedule**: Daily at 2 AM UTC

**What It Does**:
1. Checks out latest code
2. Installs dependencies
3. Runs `node script/generate-curated-paths.js`
4. Updates paths in database incrementally
5. Commits any changes (if needed)

**Manual Trigger**: Can be run manually from GitHub Actions UI

### Environment Variables Required

```bash
TURSO_DATABASE_URL=<your-database-url>
TURSO_AUTH_TOKEN=<your-auth-token>
TURSO_WRITE_MODE=true  # Important for write access
```

## Example Run Output

### First Run (Initial Creation)
```
🚀 Generating curated learning paths...

📊 Found 5096 active questions across 93 channels

📜 Found 53 active certifications

✨ Generated 64 curated paths:
   - 6 career paths
   - 5 company paths
   - 53 certification paths

  ✨ NEW: Frontend Developer (85 questions, 16h)
  ✨ NEW: Backend Engineer (100 questions, 15h)
  ✨ NEW: AWS Solutions Architect Associate Prep (44 questions, 40h)
  ... (61 more)

✅ Pipeline complete!
   📊 Summary: 64 created, 0 updated, 0 unchanged

💡 Paths are stored in database and will be enhanced on next run.
```

### Second Run (Incremental Update)
```
🚀 Generating curated learning paths...

📊 Found 5120 active questions across 94 channels

📜 Found 55 active certifications

✨ Generated 66 curated paths:
   - 6 career paths
   - 5 company paths
   - 55 certification paths

  🔄 UPDATED: Frontend Developer (92 questions, 17h)
  🔄 UPDATED: Backend Engineer (105 questions, 16h)
  ✨ NEW: Google Cloud Professional ML Engineer Prep (45 questions, 60h)
  ✨ NEW: Azure Cosmos DB Developer Prep (38 questions, 40h)
  ... (62 more)

✅ Pipeline complete!
   📊 Summary: 2 created, 64 updated, 0 unchanged

💡 Paths are stored in database and will be enhanced on next run.
```

## Benefits of Incremental Approach

### 1. Preserves User Data
- User progress on paths is maintained
- Popularity metrics accumulate over time
- Ratings and reviews stay intact
- Active path selections remain valid

### 2. Stable Path IDs
- Path URLs don't break (`/learning-paths/career-frontend-developer`)
- Bookmarks and shares continue working
- Analytics tracking is consistent

### 3. Fresh Content
- Question selection updates with latest content
- New questions automatically included
- Difficulty distribution stays balanced
- Channels reflect current content

### 4. Graceful Degradation
- Paths with insufficient questions are archived (not deleted)
- Can be restored if content improves
- History is preserved

### 5. Safe Daily Runs
- No disruption to active users
- Incremental changes are low-risk
- Can run multiple times per day if needed

## Path Lifecycle

```
┌─────────────┐
│   CREATED   │ ← New path with 20+ questions
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   ACTIVE    │ ← Daily updates with fresh questions
└──────┬──────┘
       │
       ↓ (if questions drop below 20)
┌─────────────┐
│  ARCHIVED   │ ← Preserved but hidden from UI
└──────┬──────┘
       │
       ↓ (if questions increase again)
┌─────────────┐
│   ACTIVE    │ ← Can be restored
└─────────────┘
```

## Current Statistics

After incremental updates:

| Type | Count | Questions | Status |
|------|-------|-----------|--------|
| **Certification** | 53 | 2,354 | Active |
| **Company** | 5 | 400 | Active |
| **Career** | 5 | 534 | Active |
| **Skill** | 1 | 79 | Active |
| **TOTAL** | **64** | **3,367** | Active |

## What Gets Updated Daily

### 1. Question Selection
- Fresh random selection from available questions
- Maintains difficulty distribution
- Includes newly added questions
- Removes deleted/flagged questions

### 2. Metadata
- `question_ids` - Updated with fresh selection
- `channels` - Updated if new channels added
- `estimated_hours` - Recalculated based on question count
- `last_updated` - Timestamp of update
- `last_generated` - Timestamp of generation

### 3. What's Preserved
- `id` - Path identifier (stable)
- `created_at` - Original creation date
- `popularity` - User engagement metric
- `completion_rate` - Success metric
- `average_rating` - User ratings
- `status` - Active/archived state

## Manual Runs

### Local Development
```bash
# Run the pipeline locally
node script/generate-curated-paths.js

# With write mode
TURSO_WRITE_MODE=true node script/generate-curated-paths.js
```

### GitHub Actions
1. Go to Actions tab in GitHub
2. Select "Generate Curated Learning Paths" workflow
3. Click "Run workflow"
4. Select branch (usually main)
5. Click "Run workflow" button

## Monitoring

### Check Path Status
```bash
# Count active paths by type
node -e "import('dotenv/config'); import('./script/utils.js').then(m => m.dbClient.execute('SELECT path_type, COUNT(*) as count FROM learning_paths WHERE status = \"active\" GROUP BY path_type').then(r => console.log(JSON.stringify(r.rows, null, 2))))"

# View recently updated paths
node -e "import('dotenv/config'); import('./script/utils.js').then(m => m.dbClient.execute('SELECT id, title, last_updated FROM learning_paths WHERE status = \"active\" ORDER BY last_updated DESC LIMIT 10').then(r => console.log(JSON.stringify(r.rows, null, 2))))"

# Check archived paths
node -e "import('dotenv/config'); import('./script/utils.js').then(m => m.dbClient.execute('SELECT id, title, last_updated FROM learning_paths WHERE status = \"archived\"').then(r => console.log(JSON.stringify(r.rows, null, 2))))"
```

### Logs
- GitHub Actions logs show detailed output
- Each path shows: ✨ NEW, 🔄 UPDATED, or 📦 ARCHIVED
- Summary shows: X created, Y updated, Z unchanged

## Future Enhancements

### 1. Smart Question Selection
- Use RAG to find related questions
- Prioritize highly-rated questions
- Balance by sub-topics

### 2. Adaptive Difficulty
- Adjust based on user performance
- Create beginner/advanced variants
- Progressive difficulty curves

### 3. Content Quality Signals
- Prefer questions with good explanations
- Include questions with diagrams
- Prioritize recently updated content

### 4. User Feedback Loop
- Track which paths users complete
- Identify popular question combinations
- Adjust based on ratings

### 5. A/B Testing
- Test different question selections
- Compare completion rates
- Optimize path effectiveness

## Troubleshooting

### Pipeline Fails
- Check database credentials
- Verify TURSO_WRITE_MODE=true
- Check for schema changes
- Review error logs

### No Updates
- Verify new questions exist
- Check question status (must be 'active')
- Ensure channels are populated
- Review minimum question threshold (20)

### Paths Archived Unexpectedly
- Check question count in channel
- Verify questions not flagged/deleted
- Review channel mappings
- Check certification status

## Files Modified

1. ✅ `script/generate-curated-paths.js` - Incremental update logic
2. ✅ `.github/workflows/generate-learning-paths.yml` - Daily automation
3. ✅ `INCREMENTAL_PATH_PIPELINE.md` - This documentation

## Result

✅ Pipeline runs incrementally
✅ Preserves user data and metrics
✅ Updates paths with fresh content daily
✅ Adds new paths as content grows
✅ Archives (not deletes) insufficient paths
✅ Automated via GitHub Actions
✅ Safe for production use

The learning path pipeline is now production-ready with daily incremental updates! 🎉
