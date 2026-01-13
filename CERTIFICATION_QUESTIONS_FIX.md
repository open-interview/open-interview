# Certification Questions Fix - Bot System Integration

## Problem Identified
Certification channels (CKA, CKAD, CKS) contained questions with **wrong format**:
- Multiple-choice options stored as JSON strings in the `answer` field
- Should either be test questions (in tests.json) or regular questions with text answers
- Total affected: 32 questions across 3 channels

## Root Cause
Questions were imported or generated with test-question format but stored as regular questions, causing:
1. Wrong rendering in the channel viewer
2. Confusion between test questions and regular questions
3. Poor user experience

## Solution: Bot System Integration

### 1. Quality Gate Added ✅
**File**: `script/fetch-questions-for-build.js`

Added `validateQuestionFormat()` function that checks:
- ❌ Multiple-choice format in answer field
- ❌ Missing or too-short question/answer text
- ❌ Placeholder content (TODO, FIXME, etc.)

**Impact**: Prevents malformed questions from being included in builds

### 2. Bot System Integration ✅
**File**: `script/fix-cert-questions-with-bots.js`

New script that:
1. Scans certification channels for wrong-format questions
2. Adds each problematic question to the work queue
3. Assigns to processor bot for automated fixing
4. Logs all actions to the bot ledger

### 3. Immediate Fix Applied ✅
**File**: `script/fix-certification-question-format.js`

Temporary fix that:
- Removed 32 malformed questions from channel files
- Updated stats for each channel
- Cleaned up all-questions.json

**Results**:
- CKA: 9 questions removed → 2 remaining
- CKAD: 14 questions removed → 1 remaining
- CKS: 9 questions removed → 1 remaining

## How to Use the Bot System

### Step 1: Identify Problems
```bash
node script/fix-cert-questions-with-bots.js
```

This will:
- Scan all certification channels
- Find questions with wrong format
- Add them to the work queue with detailed reasons
- Log actions to the bot ledger

### Step 2: Run Verifier Bot (Optional)
```bash
node script/bots/verifier-bot.js
```

This will:
- Analyze all questions in the queue
- Generate quality scores
- Identify additional issues
- Create improvement recommendations

### Step 3: Run Processor Bot
```bash
node script/bots/processor-bot.js
```

This will:
- Process work queue items
- Apply targeted fixes based on issue types
- Convert questions to proper format
- Update database with corrected versions
- Log all changes to the ledger

### Step 4: Rebuild Data
```bash
node script/fetch-questions-for-build.js
```

This will:
- Fetch questions from database
- Apply quality gate validation
- Generate static JSON files
- Report any rejected questions

## Quality Gate Rules

Questions are **rejected** if they have:
1. **Wrong Format**: Multiple-choice JSON in answer field
2. **Missing Content**: Question or answer too short
3. **Placeholder Content**: Contains TODO, FIXME, TBD, etc.

Rejected questions:
- Are NOT included in the build
- Are logged for review
- Should be fixed via bot system or manually

## Bot System Workflow

```
┌─────────────────────────────────────────────────────────┐
│  1. Identify Problem                                    │
│     └─> fix-cert-questions-with-bots.js                │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  2. Add to Work Queue                                   │
│     └─> work_queue table                               │
│         - itemType: 'question'                          │
│         - action: 'fix_format'                          │
│         - priority: 1 (high)                            │
│         - reason: detailed issue description            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  3. Verifier Bot (Optional)                             │
│     └─> Analyzes and scores questions                  │
│         - Technical accuracy                            │
│         - Completeness                                  │
│         - Clarity                                       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  4. Processor Bot                                       │
│     └─> Applies fixes                                  │
│         - Converts to proper format                     │
│         - Updates database                              │
│         - Logs changes                                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  5. Quality Gate                                        │
│     └─> Validates during build                         │
│         - Rejects malformed questions                   │
│         - Ensures data quality                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  6. Build Output                                        │
│     └─> Clean, validated data                          │
│         - Channel JSON files                            │
│         - all-questions.json                            │
│         - tests.json                                    │
└─────────────────────────────────────────────────────────┘
```

## Files Modified

1. **script/fetch-questions-for-build.js**
   - Added `validateQuestionFormat()` quality gate
   - Filters out malformed questions during build
   - Reports rejected questions

2. **script/fix-cert-questions-with-bots.js** (NEW)
   - Scans for wrong-format questions
   - Adds to work queue
   - Integrates with bot system

3. **script/fix-certification-question-format.js** (NEW)
   - Immediate fix script
   - Removes malformed questions
   - Updates channel stats

4. **client/public/data/cka.json**
   - Removed 9 malformed questions
   - 2 valid questions remaining

5. **client/public/data/ckad.json**
   - Removed 14 malformed questions
   - 1 valid question remaining

6. **client/public/data/cks.json**
   - Removed 9 malformed questions
   - 1 valid question remaining

## Testing

### Verify Quality Gate
```bash
# Should show rejected questions
node script/fetch-questions-for-build.js
```

### Verify Bot Integration
```bash
# Should find and queue problematic questions
node script/fix-cert-questions-with-bots.js

# Check work queue
sqlite3 questions.db "SELECT * FROM work_queue WHERE status='pending';"
```

### Verify Channel Data
```bash
# Should have no wrong-format questions
jq '[.questions[] | select(.answer | startswith("[{"))] | length' client/public/data/cka.json
# Output: 0
```

## Future Prevention

The quality gate in `fetch-questions-for-build.js` will:
- ✅ Automatically reject malformed questions
- ✅ Prevent them from being included in builds
- ✅ Alert developers to fix issues at the source
- ✅ Maintain data quality standards

## Next Steps

1. **Run the bot system** to properly fix the removed questions
2. **Convert them** to either:
   - Proper test questions (in tests.json)
   - Regular questions with text answers
3. **Re-import** the fixed questions to the database
4. **Rebuild** the static data files

## Summary

- ✅ Quality gate added to prevent malformed questions
- ✅ Bot system integration for automated fixing
- ✅ Immediate fix applied (32 questions removed)
- ✅ All certification channels cleaned
- ✅ Build process now validates question format
- ✅ Future issues will be caught automatically
