# MCQ Options Validation System

## Overview
Automated system to detect and prevent MCQ option JSON from appearing in question summary fields (TLDR, quick answer sections).

## Problem
MCQ options in JSON format like `[{"id":"a","text":"...","isCorrect":true}...]` were potentially visible in:
- TLDR sections
- Quick answer panels  
- Answer summaries before reveal

## Solution

### 1. Detection Scripts

#### `script/fix-options-in-tldr.js`
Scans all questions for MCQ option patterns in the `tldr` field.

```bash
# Dry run (report only)
node script/fix-options-in-tldr.js

# Fix issues in database
node script/fix-options-in-tldr.js --fix
```

**Patterns detected:**
- JSON arrays: `[{"id":"a","text":"..."}...]`
- Option labels: `Option A:`, `Option B:`
- Letter markers: `(A)`, `(B)`, `(C)`, `(D)`

#### `script/check-answer-format.js`
Validates that the `answer` field contains proper explanatory text, not MCQ options.

```bash
# Check for issues
node script/check-answer-format.js

# Auto-fix by extracting correct answer
node script/check-answer-format.js --fix
```

#### `script/find-json-in-fields.js`
Debug tool to inspect question fields for JSON patterns.

```bash
node script/find-json-in-fields.js
```

### 2. E2E Test Suite

#### `e2e/content-quality/tldr-validation.spec.ts`
Automated tests to verify content quality across the application.

**Test Coverage:**
- ✅ TLDR sections don't show MCQ options
- ✅ Quick answer sections are clean
- ✅ Validation across multiple channels (AWS, System Design, Frontend, Backend)
- ✅ Answer panel doesn't leak options before reveal
- ✅ Extreme mode question viewer validation
- ✅ Database content validation via API

```bash
# Run tests
pnpm test:e2e e2e/content-quality/tldr-validation.spec.ts
```

## Current Status

### Database Audit Results
✅ **All Clean** - Scanned 1,340+ questions
- 0 issues found in `tldr` field
- 0 issues found in `answer` field
- No MCQ JSON patterns detected

### UI Rendering
The issue shown in the screenshot appears to be a UI rendering bug where the "TL;DR" tab shows the full `answer` field instead of a summary. This is a frontend issue, not a database issue.

## Prevention

### Content Generation
When generating questions, ensure:
1. `answer` field contains explanatory text, not MCQ options
2. `tldr` field contains a brief summary (1-2 sentences)
3. MCQ options are stored separately (not in text fields)

### Validation Rules
```javascript
// Good - Explanatory answer
answer: "AWS Config with the managed rule restricted-ssh is correct because..."

// Bad - MCQ options in answer
answer: '[{"id":"a","text":"AWS Config...","isCorrect":true}...]'

// Good - Brief summary
tldr: "Use AWS Config's restricted-ssh rule for continuous compliance monitoring"

// Bad - Options in TLDR
tldr: "Option A is correct: AWS Config..."
```

## Maintenance

### Regular Checks
Add to CI/CD pipeline:
```yaml
- name: Validate Content Quality
  run: |
    node script/fix-options-in-tldr.js
    node script/check-answer-format.js
```

### Manual Review
If issues are found:
1. Run detection script to identify problematic questions
2. Review `answer-format-issues.json` report
3. Fix manually or use `--fix` flag
4. Verify with E2E tests

## Related Documentation
- [Content Quality System](./CONTENT_QUALITY_SYSTEM.md)
- [Bot Validation System](./BOT_VALIDATION_SYSTEM.md)
- [MCQ Format Issue Resolution](./MCQ_FORMAT_ISSUE_RESOLUTION.md)
