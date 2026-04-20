# Bookmarks & Search Modal - Text Visibility Fix

## Issues Fixed

### 1. Search Modal - Empty State Buttons
**Problem**: The example search term buttons ("react hooks", "tag:system-design", etc.) had no text color, appearing as black boxes in light mode.

**Fix**: Added explicit `text-foreground` class to buttons
```tsx
// Before
className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 border border-border rounded-full transition-colors active:scale-95"

// After
className="px-4 py-2 text-sm text-foreground bg-muted hover:bg-muted/80 border border-border rounded-full transition-colors active:scale-95"
```

### 2. Bookmarks Page - Question Title
**Problem**: Question titles in bookmark cards were missing explicit text color, potentially invisible in light mode.

**Fix**: Added explicit `text-foreground` class to question title
```tsx
// Before
<h3 className="font-medium text-sm sm:text-base line-clamp-2 mb-2">

// After
<h3 className="font-medium text-foreground text-sm sm:text-base line-clamp-2 mb-2">
```

## Files Modified
1. `client/src/components/SearchModal.tsx` - Fixed empty state button text
2. `client/src/pages/Bookmarks.tsx` - Fixed question title text

## Theme Colors Used

### Dark Mode (genz-dark)
- `--foreground`: `hsl(0 0% 100%)` - white text
- `--muted`: `hsl(0 0% 10%)` - dark gray background
- `--border`: `hsl(0 0% 10%)` - dark border

### Light Mode (genz-light)
- `--foreground`: `hsl(0 0% 5%)` - near black text
- `--muted`: `hsl(0 0% 93%)` - light gray background
- `--border`: `hsl(0 0% 85%)` - light border

## Testing Checklist

### Search Modal
- [x] Empty state "Type to search" text visible
- [x] Example search buttons visible and readable
- [x] Example search buttons have proper text color
- [x] Buttons work when clicked

### Bookmarks Page
- [x] Page title visible
- [x] Bookmark count visible
- [x] Filter dropdowns readable
- [x] Question titles visible in cards
- [x] Channel names visible
- [x] Difficulty badges visible
- [x] Company names visible
- [x] Action buttons visible

## Result
✅ All text now visible in both dark and light modes
✅ Proper contrast maintained
✅ No TypeScript errors
✅ Theme-aware styling throughout

## Additional Notes

The bookmark card in the screenshot appeared dark because:
1. The card uses `bg-card` which is theme-aware
2. In dark mode: `--card: hsl(0 0% 6%)` (dark gray)
3. In light mode: `--card: hsl(0 0% 97%)` (light gray)

The question title now has explicit `text-foreground` to ensure visibility in both themes.
