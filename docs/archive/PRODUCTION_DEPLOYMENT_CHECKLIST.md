# Production Deployment Checklist

## Issues on Production (open-interview.github.io)

### 1. Learning Paths Page
- **Issue**: Shows "0 custom • 0 curated"
- **Cause**: `learning-paths.json` not deployed to production
- **Fix**: Run build and deploy

### 2. Certifications Page  
- **Issue**: Shows "0 questions" for all certifications
- **Cause**: Certification data might be outdated or questions not linked
- **Fix**: Regenerate certifications data and rebuild

### 3. Mobile Navigation
- **Issue**: Bottom nav display broken
- **Cause**: CSS/layout issue on mobile
- **Fix**: Test and fix mobile navigation

## Required Actions

### Step 1: Regenerate All Data
```bash
# Generate curated paths (creates learning-paths.json)
pnpm run generate:paths

# Fetch questions for build
pnpm run fetch:data

# Fetch question history
pnpm run fetch:history
```

### Step 2: Build Static Site
```bash
# Full static build (includes all data generation)
pnpm run build:static
```

This runs:
1. `fetch-questions-for-build.js` - Fetches all questions
2. `fetch-question-history.js` - Fetches history
3. `generate-curated-paths.js` - Generates paths + exports JSON ✅
4. `generate-rss.js` - Generates RSS feed
5. `generate-sitemap.js` - Generates sitemap
6. `vite build` - Builds React app
7. `generate-pagefind-index.js` - Generates search index
8. `build-pagefind.js` - Builds search

### Step 3: Deploy to GitHub Pages
```bash
# Deploy to GitHub Pages
pnpm run deploy:pages
```

Or manually:
```bash
# Push dist/public to gh-pages branch
gh-pages -d dist/public
```

## Files That Must Be in dist/public/data/

### Required JSON Files:
- ✅ `learning-paths.json` (122KB) - Curated paths
- ✅ `certifications.json` (50KB) - Certification metadata
- ✅ `all-questions.json` (609KB) - All questions
- ✅ `[channel].json` - Individual channel questions
- ✅ `bot-monitor.json` - Bot activity
- ✅ `github-analytics.json` - GitHub stats

### Check Files Exist:
```bash
ls -lh dist/public/data/learning-paths.json
ls -lh dist/public/data/certifications.json
```

## Verification Steps

### After Deployment:

1. **Check Learning Paths**
   - Visit: https://open-interview.github.io/learning-paths
   - Should show: "0 custom • 64 curated"
   - Should display: Path cards for AWS, Google, Frontend, etc.

2. **Check Certifications**
   - Visit: https://open-interview.github.io/certifications
   - Should show: "53 certifications to master"
   - Should display: Question counts for each cert

3. **Check Mobile Navigation**
   - Open on mobile device or DevTools mobile view
   - Bottom nav should show: Home, Learn, Practice, Progress
   - All buttons should be clickable

4. **Check Data Loading**
   - Open DevTools Network tab
   - Should see successful requests for:
     - `/data/learning-paths.json` (200 OK)
     - `/data/certifications.json` (200 OK)
   - No 404 errors

## Common Issues

### Issue: "0 curated paths"
**Cause**: `learning-paths.json` not in dist/public/data/
**Fix**: 
```bash
pnpm run generate:paths
pnpm run build
```

### Issue: "0 questions" on certifications
**Cause**: Questions not fetched or linked incorrectly
**Fix**:
```bash
pnpm run fetch:data
pnpm run build
```

### Issue: 404 on JSON files
**Cause**: Files not copied to dist during build
**Fix**: Check vite.config.ts public directory settings

### Issue: Mobile nav broken
**Cause**: CSS not loading or layout issue
**Fix**: Check mobile-specific CSS and test responsive design

## Environment Variables

### For Production Build:
```bash
# .env.production
VITE_BASE_URL=/
NODE_ENV=production
```

### For GitHub Pages:
```bash
# If using custom domain
VITE_BASE_URL=/

# If using github.io subdirectory
VITE_BASE_URL=/repo-name/
```

## Build Output Verification

### Check dist/public structure:
```
dist/public/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
├── data/
│   ├── learning-paths.json ✅
│   ├── certifications.json ✅
│   ├── all-questions.json ✅
│   └── [channels].json
└── pagefind/
    └── [search index]
```

## Testing Locally Before Deploy

### 1. Build and Preview:
```bash
pnpm run build:static
pnpm run preview
```

### 2. Test URLs:
- http://localhost:3333/learning-paths
- http://localhost:3333/certifications
- http://localhost:3333/data/learning-paths.json

### 3. Test Mobile:
- Open DevTools
- Toggle device toolbar (Cmd+Shift+M)
- Test iPhone 13 Pro viewport
- Check bottom navigation

## Deployment Commands

### Full Deployment Flow:
```bash
# 1. Clean previous build
rm -rf dist

# 2. Generate all data
pnpm run generate:paths

# 3. Build static site
pnpm run build:static

# 4. Verify files exist
ls -lh dist/public/data/learning-paths.json
ls -lh dist/public/data/certifications.json

# 5. Test locally
pnpm run preview

# 6. Deploy to GitHub Pages
pnpm run deploy:pages
```

## Post-Deployment Verification

### 1. Check Production URLs:
```bash
# Learning paths JSON
curl https://open-interview.github.io/data/learning-paths.json | jq '. | length'
# Should return: 64

# Certifications JSON
curl https://open-interview.github.io/data/certifications.json | jq '. | length'
# Should return: 53
```

### 2. Check Pages Load:
- ✅ https://open-interview.github.io/
- ✅ https://open-interview.github.io/learning-paths
- ✅ https://open-interview.github.io/certifications
- ✅ https://open-interview.github.io/channels

### 3. Check Mobile:
- Open on actual mobile device
- Test navigation
- Test path activation
- Test certification browsing

## Status

Current Status: **NEEDS DEPLOYMENT**

- ✅ Code changes complete
- ✅ Data generation working locally
- ✅ Files exist in client/public/data/
- ❌ Not deployed to production yet
- ❌ Production showing old data

Next Step: **Run `pnpm run build:static && pnpm run deploy:pages`**
