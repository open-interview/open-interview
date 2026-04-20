# Theme Visibility - Complete Fix with Tests

## Critical Issues Found and Fixed

### 1. Question Viewer Answer Panel - BLACK BACKGROUND
**Location**: `client/src/pages/QuestionViewerGenZ.tsx` line 404

**Problem**: The answer panel container had `bg-white/[0.02]` which is 2% opacity white. This appears as nearly black in both themes, making all content invisible.

**Fix**:
```tsx
// Before - WRONG
<div className="w-1/2 overflow-y-auto p-8 bg-white/[0.02]">

// After - CORRECT
<div className="w-1/2 overflow-y-auto p-8 bg-background">
```

### 2. Question Viewer Expanded Section
**Location**: `client/src/pages/QuestionViewerGenZ.tsx` line 602

**Problem**: Similar issue with `bg-white/[0.02]`

**Fix**:
```tsx
// Before
className="border-b border-border bg-white/[0.02] backdrop-blur-xl overflow-hidden"

// After
className="border-b border-border bg-muted/50 backdrop-blur-xl overflow-hidden"
```

### 3. Badges Page - Locked Badges
**Location**: `client/src/pages/BadgesGenZ.tsx` line 157

**Problem**: Locked badges used `bg-white/[0.02] border-white/5` making them invisible

**Fix**:
```tsx
// Before
isUnlocked
  ? 'bg-muted/50 border-border'
  : 'bg-white/[0.02] border-white/5 opacity-50'

// After
isUnlocked
  ? 'bg-muted/50 border-border'
  : 'bg-muted/20 border-border/50 opacity-50'
```

### 4. Search Modal Empty State Buttons
**Location**: `client/src/components/SearchModal.tsx`

**Problem**: Missing text color on example search buttons

**Fix**:
```tsx
// Before
className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 border border-border rounded-full transition-colors active:scale-95"

// After
className="px-4 py-2 text-sm text-foreground bg-muted hover:bg-muted/80 border border-border rounded-full transition-colors active:scale-95"
```

### 5. Bookmarks Page Question Titles
**Location**: `client/src/pages/Bookmarks.tsx`

**Problem**: Missing explicit text color on question titles

**Fix**:
```tsx
// Before
<h3 className="font-medium text-sm sm:text-base line-clamp-2 mb-2">

// After
<h3 className="font-medium text-foreground text-sm sm:text-base line-clamp-2 mb-2">
```

## Root Cause Analysis

The main issue was using **ultra-low opacity overlays** (`bg-white/[0.02]`) which:
1. Appear as nearly black in all themes
2. Don't adapt to theme changes
3. Create invisible content areas

## Correct Approach

Always use theme-aware CSS variables:
- `bg-background` - Main background color
- `bg-card` - Card background
- `bg-muted` - Muted/secondary background
- `text-foreground` - Main text color
- `text-muted-foreground` - Secondary text color
- `border-border` - Border color

## UI Tests Created

Created `e2e/theme-visibility.spec.ts` with tests for:
1. ✅ Search modal text visibility in light mode
2. ✅ Search modal text visibility in dark mode
3. ✅ Question viewer answer panel visibility in light mode
4. ✅ Bookmarks page visibility in light mode
5. ✅ Learning paths page visibility in light mode

## Running the Tests

```bash
# Run all theme visibility tests
pnpm exec playwright test e2e/theme-visibility.spec.ts

# Run with UI
pnpm exec playwright test e2e/theme-visibility.spec.ts --ui

# Run specific test
pnpm exec playwright test e2e/theme-visibility.spec.ts -g "Search modal text visible in light mode"
```

## Files Modified

1. `client/src/pages/QuestionViewerGenZ.tsx` - Fixed answer panel background (2 locations)
2. `client/src/pages/BadgesGenZ.tsx` - Fixed locked badge background
3. `client/src/components/SearchModal.tsx` - Fixed button text color
4. `client/src/pages/Bookmarks.tsx` - Fixed question title text color
5. `e2e/theme-visibility.spec.ts` - NEW: UI tests for theme visibility

## Theme Color Reference

### Dark Mode (genz-dark)
```css
--background: hsl(0 0% 0%);        /* pure black */
--foreground: hsl(0 0% 100%);      /* white */
--card: hsl(0 0% 6%);              /* dark gray */
--muted: hsl(0 0% 10%);            /* darker gray */
--muted-foreground: hsl(0 0% 40%); /* gray */
--border: hsl(0 0% 10%);           /* dark border */
--primary: hsl(150 100% 50%);      /* neon green */
```

### Light Mode (genz-light)
```css
--background: hsl(0 0% 100%);      /* pure white */
--foreground: hsl(0 0% 5%);        /* near black */
--card: hsl(0 0% 97%);             /* light gray */
--muted: hsl(0 0% 93%);            /* lighter gray */
--muted-foreground: hsl(0 0% 35%); /* dark gray */
--border: hsl(0 0% 85%);           /* light border */
--primary: hsl(150 70% 40%);       /* vibrant green */
```

## Verification Steps

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+Shift+R)
3. **Test in both themes**:
   - Open question viewer → Check answer panel is visible
   - Open search (Cmd+K) → Check buttons are visible
   - Open bookmarks → Check cards are visible
   - Open badges → Check locked badges are visible

## Before vs After

### Before (BROKEN)
- Answer panel: Black background with invisible text
- Search buttons: Black boxes with no text
- Locked badges: Invisible on dark background

### After (FIXED)
- Answer panel: Proper theme background with visible text
- Search buttons: Visible with readable text
- Locked badges: Visible with proper opacity

## Result

✅ All hardcoded low-opacity backgrounds removed
✅ All components use theme-aware colors
✅ Text visible in both dark and light modes
✅ UI tests created to prevent regression
✅ No TypeScript errors

## Prevention

To prevent this issue in the future:
1. **Never use** `bg-white/[0.02]` or similar ultra-low opacity
2. **Always use** theme CSS variables
3. **Run tests** before committing theme changes
4. **Test manually** in both light and dark modes
