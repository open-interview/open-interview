# Curated Paths Build Integration

## Issue
After running the build, curated paths were not appearing in the learning paths page. The database was empty even though the generation script existed.

## Root Cause
The `build:static` script in `package.json` was not running `generate-curated-paths.js`, so the database was never populated with curated paths during the build process.

## Solution

### 1. Added Script to Build Process
Updated `package.json` to include curated paths generation in the build pipeline:

```json
"build:static": "node script/fetch-questions-for-build.js && node script/fetch-question-history.js && node script/generate-curated-paths.js && node script/generate-rss.js && node script/generate-sitemap.js && vite build && node script/generate-pagefind-index.js && node script/build-pagefind.js"
```

### 2. Added Standalone Script
Also added a standalone script for manual generation:

```json
"generate:paths": "node script/generate-curated-paths.js"
```

## Generated Paths
The script successfully generated **64 curated paths**:
- **6 career paths**: Frontend Developer, Backend Engineer, Full Stack Developer, DevOps Engineer, Data Engineer, System Design Mastery
- **5 company paths**: Google, Amazon, Meta, Microsoft, Apple
- **53 certification paths**: AWS (11), Kubernetes (10), Google Cloud (6), Azure (8), HashiCorp (3), Linux (2), Docker (1), Data platforms (3), Security (2), ML (1), and more

## Build Order
The build now runs in this order:
1. `fetch-questions-for-build.js` - Fetch questions from database
2. `fetch-question-history.js` - Fetch question history
3. **`generate-curated-paths.js`** - Generate learning paths ✨ NEW
4. `generate-rss.js` - Generate RSS feed
5. `generate-sitemap.js` - Generate sitemap
6. `vite build` - Build the application
7. `generate-pagefind-index.js` - Generate search index
8. `build-pagefind.js` - Build search

## Usage

### Manual Generation
```bash
pnpm run generate:paths
```

### Full Build with Paths
```bash
pnpm run build:static
```

### Daily Updates (GitHub Actions)
The GitHub Actions workflow `.github/workflows/generate-learning-paths.yml` runs daily at 2 AM UTC to keep paths fresh with latest content.

## Result
- Curated paths now populate automatically during build
- 64 paths available immediately after deployment
- Paths update incrementally (NEW/UPDATE/ARCHIVE logic)
- No manual database seeding required

## Files Modified
- `package.json` - Added `generate-curated-paths.js` to build pipeline
