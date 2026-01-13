# Bot Validation System - Preventing Malformed Questions

## Overview

All bots in the system now have **strict validation** to prevent malformed questions from entering the database. This ensures data quality and prevents issues like multiple-choice JSON in answer fields.

## Validation Module

**Location**: `script/bots/shared/validation.js`

### Key Features

1. **Strict Format Validation**
   - Validates all required fields
   - Checks content length requirements
   - Ensures proper data types

2. **Critical Checks**
   - ❌ **NO JSON in answer field** (most critical)
   - ❌ **NO multiple-choice options in answer**
   - ❌ **NO placeholder content** (TODO, FIXME, etc.)
   - ✅ **Plain text answers only**
   - ✅ **Minimum content length**
   - ✅ **Required fields present**

3. **Auto-Sanitization**
   - Detects JSON in answer field
   - Extracts correct answer text
   - Marks for review if needed

## Validation Rules

### Question Text
- **Required**: Yes
- **Min Length**: 30 characters
- **Max Length**: 2,000 characters
- **Type**: String

### Answer (CRITICAL)
- **Required**: Yes
- **Min Length**: 50 characters
- **Max Length**: 10,000 characters
- **Type**: String (plain text only)
- **Forbidden**: JSON arrays, JSON objects, multiple-choice format
- **Pattern**: Must NOT start with `[{` or `{`

### Explanation
- **Required**: Yes
- **Min Length**: 100 characters
- **Max Length**: 15,000 characters
- **Type**: String

### Channel & SubChannel
- **Required**: Yes
- **Pattern**: Lowercase alphanumeric with hyphens
- **Example**: `kubernetes`, `cloud-native`

### Difficulty
- **Required**: Yes
- **Enum**: `beginner`, `intermediate`, `advanced`

### Tags
- **Required**: Yes
- **Min Items**: 1
- **Max Items**: 10
- **Type**: Array of strings

## Forbidden Patterns

### Placeholder Content
- `TODO`, `FIXME`, `TBD`
- `placeholder`, `lorem ipsum`
- `[insert`, `[add`, `example here`
- `needs work`

### Multiple-Choice in Answer
```javascript
// ❌ WRONG - This will be REJECTED
answer: '[{"id":"a","text":"Option 1","isCorrect":true}]'

// ✅ CORRECT - Plain text answer
answer: 'The correct approach is to use X because Y...'
```

### Irrelevant Content
- Behavioral questions
- "Tell me about yourself"
- "What are your strengths"
- "Why should we hire you"

## Bot Integration

### Creator Bot
**File**: `script/bots/creator-bot.js`

```javascript
import { validateBeforeInsert, sanitizeQuestion } from './shared/validation.js';

async function saveQuestion(content) {
  // Validate before insert
  validateBeforeInsert(content, BOT_NAME);
  
  // Sanitize
  const sanitized = sanitizeQuestion(content);
  
  // Insert into database
  await db.execute({ ... });
}
```

### Processor Bot
**File**: `script/bots/processor-bot.js`

```javascript
import { validateBeforeInsert, sanitizeQuestion } from './shared/validation.js';

async function saveItem(type, item) {
  if (type === 'question') {
    // Validate before update
    validateBeforeInsert(item, BOT_NAME);
    
    // Sanitize
    const sanitized = sanitizeQuestion(item);
    
    // Update database
    await db.execute({ ... });
  }
}
```

### Other Bots
All bots that create or modify questions must:
1. Import validation module
2. Call `validateBeforeInsert()` before database operations
3. Use `sanitizeQuestion()` to clean data
4. Handle validation errors appropriately

## Error Handling

### Validation Failure
When validation fails, the bot will:
1. **Throw an error** with detailed message
2. **Log the failure** with question details
3. **Prevent database insert/update**
4. **Report to monitoring**

Example error:
```
❌ VALIDATION FAILED - Question rejected by creator:
  ❌ CRITICAL: Answer contains JSON/multiple-choice format
  ❌ Answer too short (min 50 chars)
  ❌ Contains placeholder content: TODO

Question ID: q-123
Question: What is Kubernetes?...
```

### Auto-Sanitization
When JSON is detected in answer field:
```
⚠️  Question q-123 had JSON in answer field - sanitized automatically
```

The bot will:
1. Extract the correct answer text
2. Replace JSON with plain text
3. Mark question as sanitized
4. Log the action

## Testing Validation

### Test Script
```bash
# Test validation rules
node script/bots/shared/validation.test.js
```

### Manual Testing
```javascript
import { validateQuestion } from './script/bots/shared/validation.js';

const question = {
  question: 'What is Kubernetes?',
  answer: '[{"id":"a","text":"Container orchestration","isCorrect":true}]',
  // ... other fields
};

const result = validateQuestion(question);
console.log(result);
// { isValid: false, errors: ['CRITICAL: Answer contains JSON...'] }
```

## Monitoring

### Validation Metrics
- Total validations performed
- Validation failures by bot
- Most common validation errors
- Auto-sanitization count

### Alerts
- Critical validation failures
- High sanitization rate
- Repeated validation errors from same bot

## Best Practices

### For Bot Developers

1. **Always validate before database operations**
   ```javascript
   validateBeforeInsert(question, 'my-bot');
   ```

2. **Handle validation errors gracefully**
   ```javascript
   try {
     validateBeforeInsert(question, BOT_NAME);
   } catch (error) {
     console.error('Validation failed:', error.message);
     // Log, report, or fix the issue
     throw error;
   }
   ```

3. **Use sanitization for safety**
   ```javascript
   const sanitized = sanitizeQuestion(question);
   // Use sanitized version for database
   ```

4. **Test with edge cases**
   - Empty strings
   - Very long content
   - JSON in answer field
   - Placeholder content
   - Missing required fields

### For Content Creators

1. **Use plain text for answers**
   - Write explanatory text
   - Include code examples in markdown
   - Use proper formatting

2. **Multiple-choice questions belong in tests**
   - Regular questions: Plain text Q&A
   - Test questions: Structured format in tests.json

3. **Avoid placeholder content**
   - Complete all fields before submission
   - No TODO or FIXME markers
   - Real content only

## Migration Guide

### Updating Existing Bots

1. **Import validation module**
   ```javascript
   import { validateBeforeInsert, sanitizeQuestion } from './shared/validation.js';
   ```

2. **Add validation before database operations**
   ```javascript
   // Before INSERT
   validateBeforeInsert(question, BOT_NAME);
   
   // Before UPDATE
   validateBeforeInsert(updatedQuestion, BOT_NAME);
   ```

3. **Add sanitization**
   ```javascript
   const sanitized = sanitizeQuestion(question);
   // Use sanitized version
   ```

4. **Test thoroughly**
   - Run bot with validation enabled
   - Check for validation failures
   - Verify data quality

## Troubleshooting

### Common Issues

**Issue**: Bot fails with "Answer contains JSON"
- **Cause**: Multiple-choice format in answer field
- **Fix**: Use plain text answer or create test question

**Issue**: "Answer too short"
- **Cause**: Answer less than 50 characters
- **Fix**: Provide more detailed explanation

**Issue**: "Contains placeholder content"
- **Cause**: TODO, FIXME, etc. in content
- **Fix**: Complete the content before submission

**Issue**: "Channel must be lowercase"
- **Cause**: Uppercase or special characters in channel
- **Fix**: Use lowercase with hyphens only

## Summary

✅ **All bots now validate before database operations**  
✅ **Strict rules prevent malformed questions**  
✅ **Auto-sanitization for safety**  
✅ **Clear error messages for debugging**  
✅ **Monitoring and alerts for issues**  

**Result**: No more malformed questions in the database!
