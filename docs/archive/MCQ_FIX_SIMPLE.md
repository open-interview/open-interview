# MCQ Format Fix - Simple Guide

## Problem
Questions with JSON multiple-choice format showing in regular channels.

## Root Cause
Browser cached old data files.

## Solution

### Client-Side Fix
**File**: `client/src/lib/api-client.ts`

1. **Cache Busting**: Added version parameter to force fresh data
2. **Sanitization**: Extracts text from JSON if found

```typescript
// Cache busting
const BUILD_VERSION = '20260113';
fetch(`${url}?v=${BUILD_VERSION}`);

// Sanitization
function sanitizeAnswer(answer) {
  if (answer.startsWith('[{')) {
    const parsed = JSON.parse(answer);
    return parsed.find(opt => opt.isCorrect)?.text || answer;
  }
  return answer;
}
```

## Deploy

```bash
# 1. Build
npm run build

# 2. Deploy
git add .
git commit -m "fix: Add cache busting and sanitization"
git push
```

## Result
✅ Users get clean data automatically  
✅ Old cached data is sanitized  
✅ No manual cache clear needed  

## Verification

```bash
node script/verify-no-mcq-format.js
# Expected: ✅ ALL SYSTEMS CLEAN
```

---

**Status**: Fixed  
**Date**: January 13, 2026
