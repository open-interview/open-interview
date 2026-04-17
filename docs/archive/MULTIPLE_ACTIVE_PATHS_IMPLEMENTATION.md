# Multiple Active Learning Paths - Implementation Guide

## Overview
Allow users to activate and track multiple learning paths simultaneously instead of just one.

## Current State
- Users can only have ONE active learning path at a time
- Stored in `localStorage` as `activeLearningPath` (singular)
- Home page shows only one active path card

## Proposed Changes

### 1. Storage Structure Change

**Before:**
```javascript
localStorage.setItem('activeLearningPath', 'path-id');
```

**After:**
```javascript
localStorage.setItem('activeLearningPaths', JSON.stringify(['path-id-1', 'path-id-2', 'path-id-3']));
```

### 2. GenZHomePage.tsx Changes

#### Update Active Path Loading
```typescript
// OLD: Single path
const activePath = (() => {
  const saved = localStorage.getItem('activeLearningPath');
  // ... returns single path or null
})();

// NEW: Multiple paths
const activePaths = (() => {
  try {
    const saved = localStorage.getItem('activeLearningPaths');
    if (!saved) return [];
    
    const pathIds = JSON.parse(saved);
    return pathIds.map(id => {
      // Find path from custom or curated paths
      return findPathById(id);
    }).filter(Boolean);
  } catch {
    return [];
  }
})();
```

#### Update Onboarding Check
```typescript
// OLD
if (!activePath) {
  // Show path selection
}

// NEW
if (activePaths.length === 0) {
  // Show path selection
}
```

#### Update Display Section
```typescript
// OLD: Single card
{activePath && (
  <PathCard path={activePath} />
)}

// NEW: Multiple cards
{activePaths.length > 0 && (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2>Your Active Paths</h2>
      <span>{activePaths.length} active</span>
    </div>
    
    {activePaths.map((path, index) => (
      <PathCard 
        key={path.id}
        path={path}
        index={index}
        onRemove={() => removeActivePath(path.id)}
      />
    ))}
    
    <button onClick={() => navigate('/learning-paths')}>
      Add Another Learning Path
    </button>
  </div>
)}
```

### 3. MyPathGenZ.tsx Changes

#### Update Activate/Deactivate Logic
```typescript
// OLD: Single active path
const activatePath = (pathId: string) => {
  localStorage.setItem('activeLearningPath', pathId);
};

// NEW: Multiple active paths
const togglePathActivation = (pathId: string) => {
  const current = JSON.parse(localStorage.getItem('activeLearningPaths') || '[]');
  
  if (current.includes(pathId)) {
    // Deactivate
    const updated = current.filter(id => id !== pathId);
    localStorage.setItem('activeLearningPaths', JSON.stringify(updated));
  } else {
    // Activate
    const updated = [...current, pathId];
    localStorage.setItem('activeLearningPaths', JSON.stringify(updated));
  }
};
```

#### Update UI Indicators
```typescript
// OLD: Single "Active" badge
{activePath === path.id && <Badge>Active</Badge>}

// NEW: Multiple "Active" badges
{activePaths.includes(path.id) && <Badge>Active</Badge>}

// Button text changes
{activePaths.includes(path.id) ? 'Deactivate' : 'Activate'}
```

### 4. LearningPathsGenZ.tsx Changes

#### Update Path Selection
```typescript
const selectPath = (pathId: string) => {
  const current = JSON.parse(localStorage.getItem('activeLearningPaths') || '[]');
  
  // Add to active paths instead of replacing
  if (!current.includes(pathId)) {
    const updated = [...current, pathId];
    localStorage.setItem('activeLearningPaths', JSON.stringify(updated));
  }
  
  navigate('/');
};
```

## UI/UX Improvements

### Home Page
- Show all active paths in a vertical list
- Each path card shows:
  - Path name and description
  - Progress stats
  - Channels included
  - "Continue Learning" button
  - "Remove" button (X icon)
- Add "Add Another Path" button at bottom

### My Path Page
- Show "Active" badge on all activated paths
- Change button from "Activate" to "Deactivate" for active paths
- Allow clicking to toggle activation
- Show count: "3 paths active"

### Learning Paths Page
- When selecting a path, add it to active paths (don't replace)
- Show which paths are already active
- Allow selecting multiple paths before returning home

## Benefits

1. **Flexibility** - Users can work on multiple goals simultaneously
   - Example: Frontend + Interview Prep + AWS Certification

2. **Better Progress Tracking** - See progress across all active paths

3. **No Context Switching** - Don't lose progress when exploring different paths

4. **Realistic Learning** - Most people learn multiple topics in parallel

## Migration Strategy

### For Existing Users
```typescript
// On app load, migrate old single path to new array format
const migrateLearningPaths = () => {
  const oldPath = localStorage.getItem('activeLearningPath');
  const newPaths = localStorage.getItem('activeLearningPaths');
  
  if (oldPath && !newPaths) {
    // Migrate: wrap single path in array
    localStorage.setItem('activeLearningPaths', JSON.stringify([oldPath]));
    localStorage.removeItem('activeLearningPath');
  }
};
```

## Implementation Checklist

- [ ] Update `GenZHomePage.tsx` to load multiple paths
- [ ] Update `GenZHomePage.tsx` display to show all active paths
- [ ] Update `MyPathGenZ.tsx` activation logic
- [ ] Update `MyPathGenZ.tsx` UI indicators
- [ ] Update `LearningPathsGenZ.tsx` selection logic
- [ ] Add migration code for existing users
- [ ] Add "Remove" functionality to path cards
- [ ] Add "Add Another Path" button
- [ ] Update localStorage keys throughout
- [ ] Test with 0, 1, 3, and 5+ active paths
- [ ] Test migration from old format
- [ ] Update documentation

## Example User Flow

1. **New User**
   - Sees path selection screen
   - Selects "Full-Stack Developer"
   - Home shows 1 active path

2. **Adding More Paths**
   - Clicks "Add Another Learning Path"
   - Goes to Learning Paths page
   - Selects "Interview Prep"
   - Home now shows 2 active paths

3. **Managing Paths**
   - Goes to "My Path" page
   - Sees all paths with "Active" badges
   - Clicks "Deactivate" on one path
   - That path removed from home page

4. **Continuing Learning**
   - Home page shows all active paths
   - Can click "Continue Learning" on any path
   - Progress tracked separately for each

## Technical Notes

- Use `Array.isArray()` checks when reading from localStorage
- Handle edge cases (empty array, invalid JSON, etc.)
- Maintain backward compatibility during migration
- Consider adding a maximum limit (e.g., 5 active paths)
- Add analytics to track how many paths users typically activate

## Future Enhancements

- Path priority/ordering (drag to reorder)
- Path completion percentage across all active paths
- Recommended next path based on completed paths
- Path combinations (e.g., "These paths work well together")
- Weekly focus: highlight one path per week
