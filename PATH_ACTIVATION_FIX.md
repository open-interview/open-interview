# Learning Path Activation Fix

## Issue
When activating a curated path from the modal, the path doesn't appear in the "Active Paths" section after page reload. The user sees the path ID saved in localStorage but the path itself doesn't show up.

## Root Cause
The `activePaths` getter (line ~180) tries to find paths synchronously:
```typescript
const activePaths = (() => {
  try {
    const saved = localStorage.getItem('activeLearningPaths');
    if (saved) {
      const pathIds = JSON.parse(saved);
      return pathIds.map((id: string) => {
        const custom = customPaths.find(p => p.id === id);
        if (custom) return { ...custom, type: 'custom' };
        const curated = curatedPaths.find(p => p.id === id);  // ❌ curatedPaths might be empty!
        if (curated) return { ...curated, type: 'curated' };
        return null;
      }).filter(Boolean);
    }
  } catch {}
  return [];
})();
```

The problem: `curatedPaths` is loaded asynchronously from the API (line ~120), so when the component first renders after page reload, `curatedPaths` is still an empty array `[]`. This means the activated path won't be found.

## Solution
Convert `activePaths` from a computed value to a state variable that updates when `curatedPaths` loads:

```typescript
// Replace the activePaths getter with state
const [activePaths, setActivePaths] = useState<any[]>([]);

// Add useEffect to update activePaths when customPaths or curatedPaths change
useEffect(() => {
  try {
    const saved = localStorage.getItem('activeLearningPaths');
    if (saved) {
      const pathIds = JSON.parse(saved);
      const paths = pathIds.map((id: string) => {
        const custom = customPaths.find(p => p.id === id);
        if (custom) return { ...custom, type: 'custom' };
        const curated = curatedPaths.find(p => p.id === id);
        if (curated) return { ...curated, type: 'curated' };
        return null;
      }).filter(Boolean);
      setActivePaths(paths);
    } else {
      setActivePaths([]);
    }
  } catch {
    setActivePaths([]);
  }
}, [customPaths, curatedPaths]);
```

This ensures that:
1. When `curatedPaths` loads from the API, `activePaths` is recalculated
2. The activated path will appear in the "Active Paths" section
3. The path data is available for rendering

## Files to Modify
- `client/src/pages/UnifiedLearningPathsGenZ.tsx` (line ~180)
