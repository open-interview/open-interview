# Theme Troubleshooting Guide

## Issue: Light Mode Not Working

### Root Cause
The `:root` selector in CSS was defining dark theme colors at the highest level, preventing light theme from overriding them.

### Fix Applied
Changed CSS selector specificity:

**Before:**
```css
:root,
[data-theme='genz-dark'],
.genz-dark {
  --background: hsl(0 0% 0%);
  /* ... dark colors */
}

[data-theme='genz-light'],
.genz-light {
  --background: hsl(0 0% 100%);
  /* ... light colors */
}
```

**After:**
```css
:root {
  --background: hsl(0 0% 0%);
  /* ... dark colors as default */
}

:root[data-theme='genz-light'],
:root.genz-light,
html[data-theme='genz-light'],
html.genz-light {
  --background: hsl(0 0% 100%);
  /* ... light colors with higher specificity */
}
```

### How to Test

1. **Hard Refresh**: Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)
2. **Clear Cache**: Open DevTools → Application → Clear Storage → Clear site data
3. **Check HTML Element**: Open DevTools → Elements → Check `<html>` tag
   - Should have `data-theme="genz-light"` and class `genz-light` when in light mode
   - Should have `data-theme="genz-dark"` and class `genz-dark` when in dark mode

4. **Check CSS Variables**: In DevTools Console, run:
   ```javascript
   getComputedStyle(document.documentElement).getPropertyValue('--background')
   ```
   - Dark mode: Should return `hsl(0 0% 0%)` (black)
   - Light mode: Should return `hsl(0 0% 100%)` (white)

### If Still Not Working

1. **Check Browser Cache**:
   - Try in Incognito/Private mode
   - Clear all browser cache
   - Try a different browser

2. **Check Dev Server**:
   - Restart dev server (already done)
   - Check for CSS errors in terminal
   - Verify Vite is serving latest files

3. **Check Theme Toggle**:
   - Open DevTools Console
   - Click theme toggle button
   - Watch for console errors
   - Check if localStorage is being updated:
     ```javascript
     localStorage.getItem('theme')
     ```

4. **Manual Theme Switch**:
   - Open DevTools Console
   - Run:
     ```javascript
     document.documentElement.setAttribute('data-theme', 'genz-light');
     document.documentElement.className = 'genz-light light';
     ```
   - If this works, the issue is with the ThemeContext
   - If this doesn't work, the issue is with CSS specificity

### Expected Behavior

**Dark Mode (Default):**
- Sidebar: Black background
- Main content: Black background
- Text: White
- Primary color: Neon green (#00ff88)

**Light Mode:**
- Sidebar: White/light gray background
- Main content: White background
- Text: Dark gray/black
- Primary color: Darker green (#00d084)

### CSS Specificity Order
1. `:root` - Base dark theme (lowest priority)
2. `:root[data-theme='genz-light']` - Light theme override (highest priority)
3. `html[data-theme='genz-light']` - Fallback for light theme

### Files Modified
- `client/src/index.css` - CSS variable definitions
- `client/src/context/ThemeContext.tsx` - Theme state management (no changes needed)

### Dev Server
- URL: http://localhost:5002/
- Status: Running
- Last restart: Just now

---

**Next Step**: Hard refresh your browser (Cmd+Shift+R) and the light mode should work!
