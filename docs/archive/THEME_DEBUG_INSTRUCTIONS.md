# Theme Debug Instructions

## The Issue
The answer panel appears black even though the code has been fixed to use `bg-background`.

## Possible Causes

### 1. Browser is Still in Dark Mode
The theme toggle might not be working, or you're still in dark mode.

**Check**: Open browser DevTools (F12) and run:
```javascript
console.log('Theme:', document.documentElement.getAttribute('data-theme'));
console.log('Classes:', document.documentElement.className);
console.log('Background color:', getComputedStyle(document.documentElement).getPropertyValue('--background'));
```

**Expected in Light Mode**:
- Theme: `genz-light`
- Classes: should include `genz-light`
- Background: `hsl(0 0% 100%)` or `rgb(255, 255, 255)`

**Expected in Dark Mode**:
- Theme: `genz-dark`
- Classes: should include `genz-dark`
- Background: `hsl(0 0% 0%)` or `rgb(0, 0, 0)`

### 2. Theme Toggle Not Working
The theme toggle button might not be switching themes.

**Fix**: Click the theme toggle button (sun/moon icon) in the bottom right corner.

### 3. CSS Not Loaded
The CSS file might not be loaded or cached.

**Check**: In DevTools, go to Network tab, filter by CSS, and verify `index.css` is loaded.

**Fix**: Hard refresh with `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### 4. CSS Variables Not Applied
The CSS variables might not be reaching the components.

**Check**: In DevTools, inspect the answer panel div and check computed styles:
```javascript
// Select the answer panel
const panel = document.querySelector('.w-1\\/2.overflow-y-auto.p-8');
if (panel) {
  const styles = window.getComputedStyle(panel);
  console.log('Panel background:', styles.backgroundColor);
  console.log('Panel color:', styles.color);
}
```

**Expected in Light Mode**:
- Background: `rgb(255, 255, 255)` (white)
- Color: `rgb(13, 13, 13)` or similar (near black)

**Expected in Dark Mode**:
- Background: `rgb(0, 0, 0)` (black)
- Color: `rgb(255, 255, 255)` (white)

## Manual Theme Switch

If the toggle isn't working, manually switch themes in DevTools console:

### Switch to Light Mode:
```javascript
document.documentElement.setAttribute('data-theme', 'genz-light');
document.documentElement.classList.remove('genz-dark', 'dark');
document.documentElement.classList.add('genz-light', 'light');
localStorage.setItem('theme', 'genz-light');
```

### Switch to Dark Mode:
```javascript
document.documentElement.setAttribute('data-theme', 'genz-dark');
document.documentElement.classList.remove('genz-light', 'light');
document.documentElement.classList.add('genz-dark', 'dark');
localStorage.setItem('theme', 'genz-dark');
```

## Verify the Fix

After switching to light mode, the answer panel should:
1. Have a WHITE background
2. Have DARK text (near black)
3. All cards inside should be visible with light gray backgrounds

## If Still Not Working

### Check for Inline Styles
Some component might have inline styles overriding the CSS:
```javascript
const panel = document.querySelector('.w-1\\/2.overflow-y-auto.p-8');
console.log('Inline style:', panel?.style.cssText);
```

### Check for CSS Specificity Issues
```javascript
const panel = document.querySelector('.w-1\\/2.overflow-y-auto.p-8');
const allRules = [];
for (const sheet of document.styleSheets) {
  try {
    for (const rule of sheet.cssRules) {
      if (rule.selectorText && panel?.matches(rule.selectorText)) {
        allRules.push({
          selector: rule.selectorText,
          background: rule.style.backgroundColor
        });
      }
    }
  } catch (e) {}
}
console.table(allRules.filter(r => r.background));
```

## Files That Were Fixed

1. `client/src/pages/QuestionViewerGenZ.tsx` - Line 403: Changed `bg-white/[0.02]` to `bg-background`
2. `client/src/pages/QuestionViewerGenZ.tsx` - Line 602: Changed `bg-white/[0.02]` to `bg-muted/50`
3. `client/src/pages/BadgesGenZ.tsx` - Line 157: Changed `bg-white/[0.02]` to `bg-muted/20`
4. `client/src/components/SearchModal.tsx` - Added `text-foreground` to buttons
5. `client/src/pages/Bookmarks.tsx` - Added `text-foreground` to titles

## Quick Test

Run this in console to see all theme-related info:
```javascript
console.log({
  theme: document.documentElement.getAttribute('data-theme'),
  classes: document.documentElement.className,
  cssVars: {
    background: getComputedStyle(document.documentElement).getPropertyValue('--background'),
    foreground: getComputedStyle(document.documentElement).getPropertyValue('--foreground'),
    card: getComputedStyle(document.documentElement).getPropertyValue('--card'),
    muted: getComputedStyle(document.documentElement).getPropertyValue('--muted'),
  },
  localStorage: localStorage.getItem('theme')
});
```

This will show you exactly what theme is active and what CSS variables are set.
