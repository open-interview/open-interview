# Test Question vs Regular Question Clarification

## Issue Report
User reported that "test questions are rendered as non-test questions in channel"

## Investigation Results

### Data Verification ✅
1. **all-questions.json**: 0 test questions (correct)
2. **Channel files** (kubernetes.json, aws.json, etc.): 0 test questions (correct)
3. **tests.json**: 322 test questions, all with proper channel/subChannel fields (correct)

### Key Findings

The data is **correctly separated**:
- Test questions (IDs starting with `tq-`) are ONLY in `tests.json`
- Regular questions (IDs like `q-123`, `gh-45`, etc.) are in channel files
- No mixing of test questions in regular question pools

## Possible Confusion

The user might be confusing:

1. **Question Format**: Some regular questions have multiple-choice format in their answers, which might look like test questions
2. **Question Content**: Some regular questions might be similar to test questions in content
3. **UI Display**: The question viewer might be displaying regular questions in a way that looks like test questions

## What Makes a Test Question Different

### Test Questions (`tq-*`)
- Stored in `tests.json`
- Have `type` field: "single" or "multiple"
- Have `options` array with `isCorrect` flags
- Only accessible via `/test/{channelId}` route
- Used for knowledge assessment

### Regular Questions (`q-*`, `gh-*`, etc.)
- Stored in channel files and `all-questions.json`
- Have `question`, `answer`, `explanation` fields
- May have multiple-choice format in the answer text
- Accessible via `/channel/{channelId}` or `/extreme/channel/{channelId}` routes
- Used for learning and practice

## Recommendation

To help the user, we need to:
1. Identify the specific question they're seeing
2. Check if it's actually a test question in the wrong place, or a regular question that looks like a test question
3. If it's a regular question, explain the difference
4. If it's actually a test question in the wrong place, investigate how it got there

## Next Steps

Please provide:
1. The question ID from the URL or the question text
2. A screenshot showing the full question
3. The route/URL where you're seeing this question

This will help us determine if there's an actual data issue or just confusion about question types.
