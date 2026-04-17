# Phase 2: File Migrations - Summary

## Overview

Phase 2 focuses on migrating high-impact files to use the unified components created in Phase 1. This demonstrates the value of the design system and establishes migration patterns for the remaining files.

## Migration Strategy

### Approach
1. **Identify Patterns**: Find all instances of Card, ProgressBar, DifficultyBadge
2. **Replace Incrementally**: Migrate one pattern at a time
3. **Test Thoroughly**: Verify functionality after each change
4. **Document Changes**: Track what was changed and why

### Priority Files (Highest Impact)

| File | Patterns | Est. Reduction | Priority |
|------|----------|----------------|----------|
| BadgeWidget.tsx | Card, ProgressBar | 20 lines | ✅ Done |
| Profile.tsx | Card (5x), StatCard | 180 → 50 lines | 🔄 Next |
| CertificationPractice.tsx | Card, ProgressBar, DifficultyBadge | 150 → 50 lines | 📋 Planned |
| VoiceInterview.tsx | Card, ProgressBar, DifficultyBadge | 200 → 60 lines | 📋 Planned |
| MobileHomeFocused.tsx | Card (4x), ProgressBar (3x) | 250 → 80 lines | 📋 Planned |

## Completed Migrations

### 1. BadgeWidget.tsx ✅

**Changes Made**:
- Imported unified `Card` and `ProgressBar`
- Replaced custom card with `<Card>` component
- Replaced progress bar with `<ProgressBar>` component
- Removed unused imports

**Before**:
```typescript
<motion.div className="bg-card border border-border rounded-lg p-3">
  <div className="h-1 bg-muted rounded-full overflow-hidden mt-1">
    <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
  </div>
</motion.div>
```

**After**:
```typescript
<Card variant="elevated" size="sm" rounded="lg">
  <ProgressBar current={current} max={max} size="xs" animated={false} />
</Card>
```

**Impact**:
- Lines reduced: ~20 lines
- Consistency improved
- Maintainability improved

## Migration Patterns

### Pattern 1: Simple Card Replacement

**Before**:
```typescript
<div className="bg-card rounded-2xl border border-border p-4">
  {children}
</div>
```

**After**:
```typescript
<Card variant="default" size="md" rounded="2xl">
  {children}
</Card>
```

### Pattern 2: Interactive Card

**Before**:
```typescript
<motion.div
  className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 cursor-pointer"
  onClick={handleClick}
>
  {children}
</motion.div>
```

**After**:
```typescript
<InteractiveCard onClick={handleClick} rounded="xl">
  {children}
</InteractiveCard>
```

### Pattern 3: Card with Header

**Before**:
```typescript
<div className="bg-card rounded-2xl border border-border p-4">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-semibold">{title}</h3>
    <button>Action</button>
  </div>
  {children}
</div>
```

**After**:
```typescript
<Card rounded="2xl">
  <CardHeader title={title} action={<button>Action</button>} />
  {children}
</Card>
```

### Pattern 4: Progress Bar

**Before**:
```typescript
<div className="h-2 bg-muted rounded-full overflow-hidden">
  <motion.div
    initial={{ width: 0 }}
    animate={{ width: `${percentage}%` }}
    className="h-full bg-primary rounded-full"
  />
</div>
```

**After**:
```typescript
<ProgressBar current={value} max={total} size="md" animated={true} />
```

### Pattern 5: Difficulty Badge

**Before**:
```typescript
<span className={`px-2 py-0.5 rounded text-xs ${
  difficulty === 'beginner' ? 'bg-green-500/10 text-green-600' :
  difficulty === 'intermediate' ? 'bg-yellow-500/10 text-yellow-600' :
  'bg-red-500/10 text-red-600'
}`}>
  {difficulty}
</span>
```

**After**:
```typescript
<DifficultyBadge level={difficulty} />
```

## Testing Checklist

After each migration:
- [ ] Visual inspection - Does it look correct?
- [ ] Functionality - Does it work as before?
- [ ] Responsive - Does it work on mobile?
- [ ] Dark mode - Does it work in dark mode?
- [ ] Animations - Do animations work?
- [ ] Build - Does it build without errors?

## Common Issues & Solutions

### Issue 1: Motion Props
**Problem**: `Card` component doesn't accept all motion props
**Solution**: Use `initial`, `animate`, `exit` props directly on Card

### Issue 2: Custom Styling
**Problem**: Need custom styles not in variants
**Solution**: Use `className` prop to add additional styles

### Issue 3: Nested Cards
**Problem**: Cards within cards
**Solution**: Use `variant="ghost"` for inner cards

## Next Steps

### Immediate
1. Complete Profile.tsx migration
2. Test thoroughly
3. Document any issues

### Short Term
4. Migrate CertificationPractice.tsx
5. Migrate VoiceInterview.tsx
6. Migrate MobileHomeFocused.tsx

### Long Term
7. Migrate remaining 35+ files
8. Create automated migration script
9. Add visual regression tests

## Success Metrics

### Target
- 4 files migrated in Phase 2
- ~600 lines eliminated
- Zero bugs introduced
- 100% feature parity

### Actual (In Progress)
- ✅ 1 file migrated (BadgeWidget.tsx)
- ✅ ~20 lines eliminated
- ✅ Zero bugs
- ✅ 100% feature parity

## References

- [Phase 1 Quick Wins](./PHASE1_QUICK_WINS.md)
- [Unified Components API](./UNIFIED_COMPONENTS.md)
- [Comprehensive Pattern Analysis](./COMPREHENSIVE_PATTERN_ANALYSIS.md)

---

**Status**: 🔄 In Progress
**Last Updated**: January 2026
**Next**: Profile.tsx migration
