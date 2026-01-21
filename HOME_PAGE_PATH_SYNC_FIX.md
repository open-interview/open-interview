# Curated Paths Static Site Fix - Complete

## Problem
Curated learning paths were not displaying on the `/my-path` page because:
1. The app was trying to fetch from `/api/learning-paths` (backend API)
2. This is a **static site deployed on GitHub Pages** - no backend server
3. The generate script only wrote to database, not to static JSON files

## Solution Implemented

### 1. Modified Generation Script
**File**: `script/generate-curated-paths.js`

Added JSON export functionality:
- Imports `fs` and `path` modules
- Defines `OUTPUT_DIR = 'client/public/data'`
- After database operations, exports all active paths to `client/public/data/learning-paths.json`
- Maps database format to frontend-friendly format

```javascript
// Export to JSON for static site
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const exportResult = await db.execute({
  sql: 'SELECT * FROM learning_paths WHERE status = ? ORDER BY popularity DESC',
  args: ['active']
});
const outputPath = path.join(OUTPUT_DIR, 'learning-paths.json');
fs.writeFileSync(outputPath, JSON.stringify(exportPaths, null, 2));
```

### 2. Updated Frontend Loading
**Files**: 
- `client/src/pages/UnifiedLearningPathsGenZ.tsx`
- `client/src/components/home/GenZHomePage.tsx`

Changed from API fetch to static JSON:
```typescript
// OLD (API - doesn't work on static site)
const response = await fetch('/api/learning-paths');

// NEW (Static JSON - works on GitHub Pages)
const basePath = import.meta.env.BASE_URL || '/';
const response = await fetch(`${basePath}data/learning-paths.json`);
```

Added proper JSON parsing for stringified fields:
```typescript
const questionIds = typeof path.questionIds === 'string' 
  ? JSON.parse(path.questionIds) 
  : path.questionIds;
```

### 3. Updated Tests
**File**: `e2e/curated-paths-loading.spec.ts`

- Changed from waiting for `/api/learning-paths` to `/data/learning-paths.json`
- Updated error handling test from "API errors" to "file not found"
- Tests now validate static JSON loading instead of API calls

## Generated Data

### Statistics
- **Total paths**: 64
- **Career paths**: 6 (Frontend, Backend, Full Stack, DevOps, Data Engineer, System Design)
- **Company paths**: 5 (Google, Amazon, Meta, Microsoft, Apple)
- **Certification paths**: 53 (AWS, Kubernetes, GCP, Azure, HashiCorp, etc.)

### File Location
- **Source**: Database (`learning_paths` table)
- **Export**: `client/public/data/learning-paths.json` (119KB)
- **Accessible at**: `http://localhost:5001/data/learning-paths.json`

### Sample Path Structure
```json
{
  "id": "career-frontend-developer",
  "title": "Frontend Developer",
  "description": "Master React, JavaScript, and modern web development",
  "pathType": "job-title",
  "difficulty": "beginner",
  "estimatedHours": 16,
  "questionIds": "[\"q-123\", \"q-456\", ...]",
  "channels": "[\"frontend\", \"react-native\", \"javascript\"]",
  "tags": "[\"react\", \"javascript\", \"css\"]",
  "learningObjectives": "[\"Build responsive apps\", ...]",
  "milestones": "[{\"title\": \"JS Fundamentals\", \"questionCount\": 25}]"
}
```

## Build Process

### Development
```bash
# Generate paths (writes to DB + JSON)
pnpm run generate:paths

# Dev server serves from client/public/data/
pnpm run dev
```

### Production Build
```bash
# build:static script includes generate-curated-paths.js
pnpm run build:static
```

The `build:static` script runs:
1. `fetch-questions-for-build.js` - Fetch questions from DB
2. `fetch-question-history.js` - Fetch history
3. **`generate-curated-paths.js`** - Generate paths + export JSON ✅
4. `generate-rss.js` - Generate RSS feed
5. `generate-sitemap.js` - Generate sitemap
6. `vite build` - Build React app
7. `generate-pagefind-index.js` - Generate search index
8. `build-pagefind.js` - Build search

## Verification

### Test Script
```bash
node script/test-curated-paths-static.js
```

Output:
```
✅ File exists: client/public/data/learning-paths.json
📊 Total paths: 64
📈 Paths by type:
   - certification: 53
   - company: 5
   - skill: 1
   - job-title: 5
✅ All paths have valid structure
```

### Manual Testing
1. Open `http://localhost:5001/my-path`
2. Should see "64 curated" in header
3. Should see curated paths cards (Frontend, Backend, AWS, etc.)
4. Click on a path to view details
5. Activate a path to see it on home page

### Browser Console
No errors related to:
- ❌ `Failed to fetch /api/learning-paths`
- ❌ `SyntaxError: Unexpected token '<'`
- ❌ `JSON parsing errors`

## Key Differences: Static vs Dynamic

| Aspect | Dynamic (API) | Static (JSON) |
|--------|--------------|---------------|
| Data Source | Database via Express API | Pre-generated JSON file |
| Server Required | Yes (Express on port 3000) | No (Vite serves static files) |
| GitHub Pages | ❌ Not supported | ✅ Fully supported |
| Build Step | Runtime query | Build-time generation |
| Updates | Real-time | Requires rebuild |
| Performance | Network latency | Instant (cached) |

## Files Modified

1. ✅ `script/generate-curated-paths.js` - Added JSON export
2. ✅ `client/src/pages/UnifiedLearningPathsGenZ.tsx` - Load from static JSON
3. ✅ `client/src/components/home/GenZHomePage.tsx` - Load from static JSON
4. ✅ `e2e/curated-paths-loading.spec.ts` - Updated tests
5. ✅ `script/test-curated-paths-static.js` - New validation script

## Status
✅ **COMPLETE** - Curated paths now load correctly on static site

## Next Steps
1. Deploy to GitHub Pages with `pnpm run build:static`
2. Verify paths display on production site
3. Set up daily cron job to regenerate paths (optional)
