# Test Questions Channel Fix

## Problem
Test questions were being rendered with incorrect channel information (showing "APP-ENVIRONMENT" instead of the actual channel like "AWS"). This was because test questions in the database only stored a `questionId` reference to the original question, but didn't include the `channel` and `subChannel` fields.

## Root Cause
1. **Data Issue**: Test questions in `tests.json` were missing `channel` and `subChannel` fields
2. **Build Script Issue**: The `fetch-questions-for-build.js` script wasn't enriching test questions with data from original questions

## Solution

### 1. Fixed Existing Data
Created and ran `script/fix-test-questions-data.js` to:
- Load all questions from `all-questions.json`
- Load all tests from `tests.json`
- Enrich each test question with `channel` and `subChannel` from the original question
- Save the fixed data back to `tests.json`

**Results:**
- Fixed 622 fields across 11 tests
- 11 original questions not found (likely deleted or renamed)

### 2. Fixed Missing Questions
Created and ran `script/fix-missing-test-questions.js` to:
- Set default `channel` based on the test's channelId for questions without originals
- Set default `subChannel` to "general" for missing questions
- Ensure all test questions have valid channel/subChannel fields

**Results:**
- Fixed 22 additional fields
- All test questions now have valid channel and subChannel data

### 3. Fixed Build Script
Updated `script/fetch-questions-for-build.js` to:
- Create a map of all questions for quick lookup
- Enrich test questions with `channel` and `subChannel` during the build process
- Fall back to test's channelId if original question not found
- Ensure future builds will include these fields automatically

## Verification

Before fix:
```json
{
  "id": "tq-q-216",
  "questionId": "q-216",
  "question": "How would you implement...",
  "type": "single",
  "difficulty": "intermediate"
}
```

After fix:
```json
{
  "id": "tq-q-216",
  "questionId": "q-216",
  "channel": "aws",
  "subChannel": "database",
  "question": "How would you implement...",
  "type": "single",
  "difficulty": "intermediate"
}
```

**Final Status:**
- ✅ All 322 test questions across 11 tests now have valid channel and subChannel data
- ✅ 0 questions missing channel field
- ✅ 0 questions missing subChannel field
- ✅ Build script updated to prevent future issues

## Files Modified
1. `client/public/data/tests.json` - Fixed test data with channel/subChannel fields (all 322 test questions now have valid data)
2. `dist/public/data/tests.json` - Copied fixed data to dist folder
3. `script/fetch-questions-for-build.js` - Updated to enrich test questions during build
4. `script/fix-test-questions-data.js` - New script to fix existing data (can be run again if needed)
5. `script/fix-missing-test-questions.js` - New script to set defaults for missing questions

## Testing
To verify the fix:
1. Navigate to any test session (e.g., `/test/aws`)
2. Start the test
3. Check that questions display the correct channel badge (e.g., "database", "networking", "compute")
4. Verify no questions show "APP-ENVIRONMENT" or other incorrect channel names

## Future Prevention
The build script now automatically enriches test questions with channel/subChannel data, so this issue won't occur in future builds.
