# ✅ Certification Question Count Fix

**Date**: January 21, 2026  
**Issue**: All certifications showing "0 questions" on production site  
**Status**: FIXED ✅

---

## Problem

The certifications page was showing "0 questions" for all certifications because:

1. The `certifications.json` file was being generated from the database
2. The script was reading the `question_count` column from the certifications table
3. This column was not being populated/updated with actual question counts
4. Result: All certifications showed `questionCount: 0`

**Example Before Fix**:
```json
{
  "id": "aws-ai-practitioner",
  "name": "AWS AI Practitioner",
  "questionCount": 0  ← WRONG!
}
```

---

## Solution

Modified `script/fetch-questions-for-build.js` to **dynamically calculate** question counts for each certification by:

1. **Reading channel_mappings** from the certification record
2. **Querying the questions table** to count actual questions in those channels
3. **Fallback strategy**: If no channel_mappings, check if certification ID matches a channel name
4. **Real-time calculation** ensures counts are always accurate

### Implementation

```javascript
// Calculate actual question counts for each certification
const certifications = await Promise.all(certsResult.rows.map(async (row) => {
  let questionCount = 0;
  
  try {
    // First try: Use channel_mappings if they exist
    if (row.channel_mappings) {
      const channelMappings = JSON.parse(row.channel_mappings);
      for (const mapping of channelMappings) {
        const countResult = await client.execute({
          sql: mapping.subChannel 
            ? `SELECT COUNT(*) as count FROM questions WHERE channel = ? AND sub_channel = ? AND status = 'active'`
            : `SELECT COUNT(*) as count FROM questions WHERE channel = ? AND status = 'active'`,
          args: mapping.subChannel ? [mapping.channel, mapping.subChannel] : [mapping.channel]
        });
        questionCount += countResult.rows[0]?.count || 0;
      }
    }
    
    // Fallback: Check if certification ID matches a channel name
    if (questionCount === 0) {
      const countResult = await client.execute({
        sql: `SELECT COUNT(*) as count FROM questions WHERE channel = ? AND status = 'active'`,
        args: [row.id]
      });
      questionCount = countResult.rows[0]?.count || 0;
    }
  } catch (e) {
    console.log(`   ⚠️ Could not calculate question count for ${row.id}: ${e.message}`);
  }
  
  return {
    // ... other fields
    questionCount: questionCount,  // ← CALCULATED DYNAMICALLY
  };
}));
```

---

## Results After Fix

**All 53 certifications now have accurate question counts:**

```bash
$ jq '[.[] | {id, name, questionCount}] | .[0:10]' client/public/data/certifications.json
```

```json
[
  {
    "id": "aws-ai-practitioner",
    "name": "AWS AI Practitioner",
    "questionCount": 60  ← FIXED!
  },
  {
    "id": "aws-networking-specialty",
    "name": "AWS Advanced Networking Specialty",
    "questionCount": 58
  },
  {
    "id": "aws-data-engineer",
    "name": "AWS Data Engineer Associate",
    "questionCount": 57
  },
  {
    "id": "aws-database-specialty",
    "name": "AWS Database Specialty",
    "questionCount": 57
  },
  {
    "id": "aws-devops-pro",
    "name": "AWS DevOps Engineer Professional",
    "questionCount": 59
  }
  // ... 48 more certifications
]
```

**Statistics**:
- ✅ 53 certifications total
- ✅ 0 certifications with questionCount = 0
- ✅ Average: ~59 questions per certification
- ✅ Range: 51-60 questions per certification

---

## Files Modified

### Script Changes
- ✅ `script/fetch-questions-for-build.js` - Added dynamic question count calculation

### Generated Data
- ✅ `client/public/data/certifications.json` - Regenerated with accurate counts (50KB)

---

## Testing

**Local Verification**:
```bash
# Run the build script
node script/fetch-questions-for-build.js

# Verify all certifications have counts > 0
jq '[.[] | select(.questionCount == 0)]' client/public/data/certifications.json
# Output: [] (empty array = all good!)

# Check average
jq '[.[] | .questionCount] | add / length' client/public/data/certifications.json
# Output: 58.68 questions per cert
```

**Production Verification** (after deployment):
1. Visit https://open-interview.github.io/certifications
2. Each certification card should show "XX questions" (not "0 questions")
3. Example: "AWS AI Practitioner" should show "60 questions"

---

## How It Works in Production

When the deployment pipeline runs:

1. **Build Script Runs**: `pnpm run build:static`
2. **Fetches Questions**: `node script/fetch-questions-for-build.js`
3. **Calculates Counts**: For each certification, queries database for actual question count
4. **Generates JSON**: Writes `certifications.json` with accurate counts
5. **Deploys to GitHub Pages**: Static site includes updated JSON
6. **Frontend Loads**: CertificationsGenZ page fetches and displays counts

---

## Why This Approach?

**Advantages**:
1. ✅ **Always Accurate**: Counts reflect actual questions in database
2. ✅ **No Manual Updates**: Automatically recalculates on every build
3. ✅ **Handles Growth**: As questions are added, counts update automatically
4. ✅ **Fallback Strategy**: Works even if channel_mappings are missing
5. ✅ **Build-Time Calculation**: No runtime overhead on frontend

**Alternative Approaches Considered**:
- ❌ Manually updating `question_count` column → Would get stale
- ❌ Calculating on frontend → Would require loading all questions
- ❌ Using API endpoint → Not available on static GitHub Pages

---

## Impact

**Before Fix**:
- ❌ All certifications showed "0 questions"
- ❌ Users couldn't see how much content was available
- ❌ Looked like certifications had no practice questions

**After Fix**:
- ✅ All certifications show accurate question counts (51-60 questions)
- ✅ Users can see substantial content available for each cert
- ✅ Builds confidence in the platform's certification prep offerings

---

## Next Steps

1. **Push Changes**: Commit and push the modified script
2. **Trigger Pipeline**: GitHub Actions will run `build:static`
3. **Verify Production**: Check https://open-interview.github.io/certifications
4. **Monitor**: Ensure counts display correctly on all certification cards

---

## Related Issues Fixed

This fix also addresses:
- ✅ Learning paths showing certification paths with 0 questions
- ✅ Certification prep paths appearing empty
- ✅ Users unable to gauge certification content availability

---

**Status**: ✅ COMPLETE  
**Tested**: ✅ Locally verified  
**Ready for Deploy**: ✅ YES
