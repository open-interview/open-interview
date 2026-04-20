# Fix Dev Server Module Resolution Error

## The Error
```
Uncaught SyntaxError: The requested module 'main.tsx?t=...' 
does not provide an export named 'default'
```

## Root Cause
This error occurs when:
1. Vite's HMR (Hot Module Replacement) cache gets corrupted
2. Browser cache contains stale module definitions
3. Build artifacts are out of sync

## Solution Steps

### 1. Stop the Dev Server
Press `Ctrl+C` in the terminal running the dev server

### 2. Clear All Caches
```bash
# Clear Vite cache
rm -rf client/node_modules/.vite

# Clear build output
rm -rf client/dist
rm -rf dist

# Clear browser cache (optional but recommended)
# Chrome/Edge: Ctrl+Shift+Delete > Clear cached images and files
# Or use DevTools > Network tab > "Disable cache" checkbox
```

### 3. Restart Dev Server
```bash
npm run dev
```

### 4. Hard Refresh Browser
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`
- **Or**: Open DevTools (F12) > Right-click refresh button > "Empty Cache and Hard Reload"

## Alternative: Full Clean Restart

If the above doesn't work, do a complete clean:

```bash
# Stop dev server (Ctrl+C)

# Clean everything
rm -rf client/node_modules/.vite
rm -rf client/dist
rm -rf dist
rm -rf node_modules/.cache

# Reinstall dependencies (if needed)
npm install

# Restart
npm run dev
```

## Prevention

To avoid this issue in the future:

1. **Always stop the dev server** before making major changes to:
   - Import/export statements
   - Module structure
   - Vite configuration

2. **Use the browser's "Disable cache" option** during development:
   - Open DevTools (F12)
   - Go to Network tab
   - Check "Disable cache"
   - Keep DevTools open while developing

3. **Clear Vite cache periodically**:
   ```bash
   rm -rf client/node_modules/.vite
   ```

## What We Changed

The recent changes that may have triggered this:
- ✅ Changed `QuestionViewer` import to `QuestionViewerGenZ` in App.tsx
- ✅ Cleared Vite cache
- ✅ Cleared dist folder

## Verification

After restarting, you should see:
- ✅ No console errors
- ✅ App loads successfully
- ✅ All Gen Z redesigned pages work
- ✅ Navigation works smoothly

## Still Having Issues?

If the problem persists:

1. Check for TypeScript errors:
   ```bash
   npm run type-check
   ```

2. Check for syntax errors in:
   - `client/src/App.tsx`
   - `client/src/main.tsx`
   - `client/index.html`

3. Try a different browser (to rule out browser-specific issues)

4. Check the browser console for more detailed error messages

## Quick Fix Command

Run this one-liner to clean and restart:
```bash
rm -rf client/node_modules/.vite client/dist dist && npm run dev
```

Then hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R).
