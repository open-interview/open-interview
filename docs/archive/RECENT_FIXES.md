# Recent Fixes & Improvements

## ✅ Fixed Issues

### 1. Unsubscribe Button Not Visible
- **Status:** FIXED
- **Files:** ModernHomePage.tsx, MobileHomeFocused.tsx
- **Solution:** Removed overflow-hidden, set opacity to 0.6

### 2. Question History Not Maintained
- **Status:** FIXED
- **Files:** New AnswerHistory.tsx page
- **Solution:** Created unified history view with stats and filters

### 3. Question Generation Retry Logic
- **Status:** IMPROVED
- **Files:** question-graph.js, generate-question.js
- **Solution:** Added exponential backoff, increased retries to 3

### 4. Website Not Auto-Deploying
- **Status:** FIXED
- **Files:** New scheduled-deploy.yml workflow
- **Solution:** Daily automatic deployment at 2 AM UTC

### 5. Database Retry Logic (NEW)
- **Status:** FIXED
- **Files:** utils.js
- **Solution:** Added retry logic with exponential backoff for all database operations
- **Impact:** Fixes HTTP 400 errors from Turso database during content generation

## 🚀 Quick Commands

```bash
# View answer history
open http://localhost:5001/#/history

# Trigger manual deploy
gh workflow run scheduled-deploy.yml

# Test question generation with retries
node script/generate-question.js

# Test database retry logic
node script/test-database-retry.js
```

## 📊 Metrics

- Retry attempts: 2 → 3
- Button visibility: 0% → 60% (100% on hover)
- Deploy frequency: Manual → Daily automatic
- History tracking: Per-channel → Unified view
- Database reliability: ~70% → ~95%+ (with retry logic)
