# Validation System - Quick Reference

## TL;DR

✅ **All bots and scripts now validate questions before database operations**  
✅ **Zero tolerance for malformed questions**  
✅ **Auto-sanitization for safety**  

## Critical Rule

**NEVER put JSON in the answer field!**

```javascript
// ❌ WRONG
answer: '[{"id":"a","text":"Option 1","isCorrect":true}]'

// ✅ CORRECT
answer: 'The correct approach is to use X because Y...'
```

## Quick Validation Check

```javascript
import { validateQuestion } from './script/bots/shared/validation.js';

const result = validateQuestion(myQuestion);
if (!result.isValid) {
  console.log('Errors:', result.errors);
}
```

## Minimum Requirements

| Field | Min Length | Required |
|-------|------------|----------|
| question | 30 chars | ✅ Yes |
| answer | 50 chars | ✅ Yes |
| explanation | 100 chars | ✅ Yes |
| channel | - | ✅ Yes |
| subChannel | - | ✅ Yes |
| difficulty | - | ✅ Yes |
| tags | 1 item | ✅ Yes |

## Forbidden Content

- ❌ JSON in answer field
- ❌ TODO, FIXME, TBD
- ❌ Placeholder content
- ❌ Behavioral questions

## Where Validation Happens

1. **Creator Bot** - validates on creation
2. **Processor Bot** - validates on updates
3. **Utility Functions** - validates all saves
4. **Build Process** - validates exports

## Test Validation

```bash
# Run test suite
node script/test-validation-system.js

# Check database
node script/fix-db-malformed-questions.js

# Build with quality gate
node script/fetch-questions-for-build.js
```

## Adding Validation to New Code

```javascript
import { validateBeforeInsert, sanitizeQuestion } from './bots/shared/validation.js';

// Before saving
validateBeforeInsert(question, 'my-bot');
const sanitized = sanitizeQuestion(question);

// Then save sanitized version
await db.execute({ ... });
```

## Error Example

```
❌ VALIDATION FAILED - Question rejected:
  ❌ CRITICAL: Answer contains JSON
  ❌ Answer too short (min 50 chars)
```

## Success Example

```
✅ Question q-123 validated and saved successfully
```

## Files to Know

- `script/bots/shared/validation.js` - Core validation
- `script/utils.js` - Utility functions with validation
- `script/test-validation-system.js` - Test suite
- `VALIDATION_SYSTEM_COMPLETE.md` - Full documentation

## Status

✅ **COMPLETE** - All database operations validated  
✅ **TESTED** - All tests passing  
✅ **DOCUMENTED** - Complete documentation available  

---

**Need Help?** Read `VALIDATION_SYSTEM_COMPLETE.md` for full details.
