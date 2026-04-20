# 🚀 Duplicate Prevention - Quick Start

Quick reference for using the duplicate prevention system.

## TL;DR

**Before creating ANY content, run:**
```javascript
import { checkDuplicateBeforeCreate } from './ai/services/duplicate-prevention.js';

const check = await checkDuplicateBeforeCreate(content, 'question');
if (check.isDuplicate) {
  throw new Error('Duplicate detected');
}
```

## Common Commands

```bash
# Check for duplicates
ppnpm run check:duplicates

# Check specific channel
node script/check-duplicates.js --channel=aws

# Auto-fix duplicates
ppnpm run check:duplicates:fix

# Run reconciliation
ppnpm run bot:reconcile

# Sync vector DB
ppnpm run vector:sync
```

## Integration Examples

### Creator Bot (Already Integrated ✅)

```javascript
// In validateNode() - automatic
const duplicateCheck = await checkDuplicateBeforeCreate(content, contentType);
if (duplicateCheck.isDuplicate) {
  return { error: 'Duplicate detected', skipSave: true };
}
```

### Manual Content Creation

```javascript
import { checkDuplicateBeforeCreate } from './ai/services/duplicate-prevention.js';

async function createQuestion(data) {
  // Check for duplicates
  const check = await checkDuplicateBeforeCreate(data, 'question');
  
  // Handle result
  if (check.isDuplicate) {
    console.error('Duplicate:', check.duplicates);
    return { success: false, error: check.message };
  }
  
  // Safe to create
  await saveToDatabase(data);
  return { success: true };
}
```

### Content Modification

```javascript
import { checkDuplicateBeforeModify } from './ai/services/duplicate-prevention.js';

async function updateQuestion(id, updates) {
  const check = await checkDuplicateBeforeModify(id, updates, 'question');
  
  if (check.isDuplicate) {
    return { success: false, error: 'Would create duplicate' };
  }
  
  await updateDatabase(id, updates);
  return { success: true };
}
```

### Batch Import

```javascript
import { batchCheckDuplicates } from './ai/services/duplicate-prevention.js';

async function bulkImport(items) {
  // Check all items
  const batchResult = await batchCheckDuplicates(items, 'question');
  
  // Filter out duplicates
  const safeItems = batchResult.results
    .filter(r => !r.isDuplicate)
    .map(r => r.item);
  
  // Import only unique items
  await importToDatabase(safeItems);
  
  console.log(`Imported ${safeItems.length}/${items.length} items`);
  console.log(`Skipped ${batchResult.summary.duplicates} duplicates`);
}
```

## Thresholds

| Similarity | Action |
|------------|--------|
| ≥90% | REJECT - Duplicate |
| 80-89% | REVIEW - Very similar |
| 70-79% | REVIEW - Similar |
| 60-69% | CAUTION - Related |
| <60% | CREATE - Unique |

## Response Format

```javascript
{
  isDuplicate: boolean,
  duplicates: [
    { id: 'q-123', similarity: 0.92, content: '...' }
  ],
  verySimilar: [...],
  similar: [...],
  related: [...],
  recommendation: 'reject' | 'review' | 'create_with_caution' | 'create',
  message: 'Human-readable message',
  totalFound: 5,
  thresholds: { duplicate: 0.90, ... }
}
```

## Handling Recommendations

```javascript
switch (check.recommendation) {
  case 'reject':
    // Definite duplicate - do not create
    throw new Error('Duplicate content');
  
  case 'review':
    // Manual review needed
    await queueForReview(content, check.duplicates);
    break;
  
  case 'create_with_caution':
    // Proceed but log warning
    console.warn('Similar content exists');
    await createContent(content);
    break;
  
  case 'create':
    // Safe to create
    await createContent(content);
    break;
}
```

## CLI Usage

### Basic Check
```bash
pnpm run check:duplicates
```

### With Options
```bash
# Specific channel
node script/check-duplicates.js --channel=system-design

# Specific content type
node script/check-duplicates.js --type=challenge

# Limit scan
node script/check-duplicates.js --limit=100

# Generate report
node script/check-duplicates.js --report

# Auto-fix
pnpm run check:duplicates:fix
```

## GitHub Actions

### Manual Trigger
1. Go to Actions tab
2. Select "🔍 Duplicate Detection"
3. Click "Run workflow"
4. Configure and run

### Automated
- Runs every Sunday at midnight UTC
- Generates report
- Creates issue if duplicates found

## Troubleshooting

### Vector DB Not Available
**Error:** "Vector DB search failed"
**Solution:** System automatically falls back to text search. To fix:
```bash
pnpm run vector:sync
```

### Too Many False Positives
**Solution:** Increase thresholds in `duplicate-prevention.js`:
```javascript
const THRESHOLDS = {
  question: {
    duplicate: 0.92,  // Increase from 0.90
    // ...
  }
};
```

### Duplicates Slipping Through
**Solution:** 
1. Lower thresholds
2. Sync vector DB: `pnpm run vector:sync`
3. Run manual scan: `pnpm run check:duplicates`

## Monitoring

### Check Duplicate Stats
```sql
SELECT 
  content_type,
  COUNT(*) as checks,
  SUM(is_duplicate) as duplicates,
  ROUND(SUM(is_duplicate) * 100.0 / COUNT(*), 2) as rate
FROM duplicate_checks
WHERE timestamp > datetime('now', '-7 days')
GROUP BY content_type;
```

### Recent Duplicates
```sql
SELECT *
FROM duplicate_checks
WHERE is_duplicate = 1
ORDER BY created_at DESC
LIMIT 10;
```

## Best Practices

✅ **DO:**
- Always check before creating
- Respect recommendations
- Monitor weekly reports
- Keep vector DB synced

❌ **DON'T:**
- Skip duplicate checks
- Override without review
- Ignore duplicate reports
- Let vector DB get out of sync

## Need Help?

- Full docs: [DUPLICATE_PREVENTION.md](./DUPLICATE_PREVENTION.md)
- System overview: [CONTENT_QUALITY_SYSTEM.md](./CONTENT_QUALITY_SYSTEM.md)
- Reconciliation: [RECONCILIATION_BOT.md](./RECONCILIATION_BOT.md)
