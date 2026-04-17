# Certification Viewer Fix - No Questions Showing

## Problem

When clicking on a certification from the certifications page, no questions are displayed because:

1. **Certifications page** loads from `client/public/data/certifications.json` (53 certifications from database)
2. **Certification viewer page** (`CertificationPracticeGenZ.tsx`) tries to load from `client/src/lib/certifications-config.ts` (hardcoded ~20 certifications)
3. **Mismatch**: Database certifications (like "Snowflake SnowPro Core") don't exist in the hardcoded config
4. **Result**: `getCertificationById()` returns `undefined`, page shows "Certification not found"

## Root Cause

Two separate sources of certification data:
- **Database** → `certifications.json` (53 certs) → Used by certifications listing page
- **Hardcoded Config** → `certifications-config.ts` (~20 certs) → Used by certification viewer page

## Solution Options

### Option 1: Use Channel Viewer Instead (Quick Fix)
Since many certifications (like Snowflake SnowPro Core) are actually channels, redirect to the channel viewer:

```typescript
// In CertificationsGenZ.tsx, change the navigation:
onClick={() => navigate(`/channel/${cert.id}`)}  // Instead of /certification/${cert.id}
```

**Pros**: Works immediately, uses existing channel viewer
**Cons**: Loses certification-specific features (checkpoints, exam mode)

### Option 2: Load Certifications from JSON (Proper Fix)
Modify `CertificationPracticeGenZ.tsx` to load from `certifications.json` instead of hardcoded config:

```typescript
// Add to CertificationPracticeGenZ.tsx
const [certification, setCertification] = useState<Certification | null>(null);

useEffect(() => {
  async function loadCertification() {
    try {
      const basePath = import.meta.env.BASE_URL || '/';
      const response = await fetch(`${basePath}data/certifications.json`);
      const certs = await response.json();
      const cert = certs.find((c: any) => c.id === certificationId);
      
      if (cert) {
        // Map database cert to expected format
        setCertification({
          ...cert,
          channelMappings: cert.channel_mappings ? JSON.parse(cert.channel_mappings) : [
            { channelId: cert.id, weight: 100 }  // Fallback: use cert ID as channel
          ]
        });
      }
    } catch (err) {
      console.error('Failed to load certification:', err);
    }
  }
  
  if (certificationId) {
    loadCertification();
  }
}, [certificationId]);
```

**Pros**: Uses actual database data, supports all 53 certifications
**Cons**: Requires code changes, need to handle channel_mappings format

### Option 3: Hybrid Approach (Recommended)
1. Try loading from JSON first
2. Fallback to hardcoded config if not found
3. If still not found, treat certification ID as a channel ID and redirect

## Recommended Fix

Use **Option 1** for immediate fix, then implement **Option 2** for long-term solution.

### Immediate Fix (5 minutes)

Change the button in `CertificationsGenZ.tsx`:

```typescript
{isStarted && (
  <button
    onClick={() => navigate(`/channel/${cert.id}`)}  // Changed from /certification/
    className="px-6 py-3 bg-muted/50 hover:bg-muted rounded-[16px] border border-border transition-all"
  >
    <ChevronRight className="w-5 h-5" />
  </button>
)}
```

This will use the existing channel viewer which already works perfectly.

### Long-term Fix (30 minutes)

Implement Option 2 to properly support certification-specific features.

## Files to Modify

1. `client/src/pages/CertificationsGenZ.tsx` - Change navigation target
2. `client/src/pages/CertificationPracticeGenZ.tsx` - Load from JSON instead of config (optional)

## Testing

After fix:
1. Go to `/certifications`
2. Click "Start" on any certification
3. Click the arrow button
4. Should see questions from that certification's channel
