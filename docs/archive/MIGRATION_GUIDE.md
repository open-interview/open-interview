# Migration Guide - Unified Components

## Overview

This guide shows you how to migrate existing code to use unified components. Follow these step-by-step instructions for each component type.

## Quick Reference

```typescript
// Import unified components
import { 
  Card, CardHeader, CardFooter,
  ProgressBar,
  DifficultyBadge,
  Button, MotionButton, IconButton
} from '@/components/unified';
```

## Migration Patterns

### 1. Progress Bar Migration

#### Pattern A: Simple Progress Bar

**Before**:
```typescript
<div className="h-2 bg-muted rounded-full overflow-hidden">
  <div 
    className="h-full bg-primary rounded-full transition-all"
    style={{ width: `${percentage}%` }}
  />
</div>
```

**After**:
```typescript
<ProgressBar current={value} max={total} size="md" />
```

#### Pattern B: Animated Progress Bar

**Before**:
```typescript
<div className="h-1 bg-muted rounded-full overflow-hidden">
  <motion.div
    initial={{ width: 0 }}
    animate={{ width: `${percentage}%` }}
    className="h-full bg-primary rounded-full"
  />
</div>
```

**After**:
```typescript
<ProgressBar 
  current={value} 
  max={total} 
  size="sm" 
  animated={true} 
/>
```

#### Pattern C: Progress Bar with Label

**Before**:
```typescript
<div>
  <div className="flex items-center justify-between text-sm mb-2">
    <span className="text-muted-foreground">Progress</span>
    <span className="font-semibold">{percentage}%</span>
  </div>
  <div className="h-2 bg-muted rounded-full overflow-hidden">
    <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
  </div>
</div>
```

**After**:
```typescript
<ProgressBar 
  current={value} 
  max={total}
  label="Progress"
  showPercentage={true}
/>
```

---

### 2. Difficulty Badge Migration

#### Pattern A: Basic Badge

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

#### Pattern B: Uppercase Badge

**Before**:
```typescript
<span className={`px-2 py-0.5 text-[10px] uppercase rounded ${
  difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
  difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
  'bg-red-500/20 text-red-400'
}`}>
  {difficulty}
</span>
```

**After**:
```typescript
<DifficultyBadge 
  level={difficulty} 
  size="sm" 
  uppercase={true} 
/>
```

#### Pattern C: Badge with Icon

**Before**:
```typescript
<span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
  difficulty === 'beginner' ? 'bg-green-500/10 text-green-600' :
  difficulty === 'intermediate' ? 'bg-yellow-500/10 text-yellow-600' :
  'bg-red-500/10 text-red-600'
}`}>
  <Icon className="w-3 h-3" />
  {difficulty}
</span>
```

**After**:
```typescript
<DifficultyBadge 
  level={difficulty} 
  showIcon={true} 
/>
```

---

### 3. Card Migration

#### Pattern A: Basic Card

**Before**:
```typescript
<div className="bg-card border border-border rounded-xl p-6">
  <h3 className="font-semibold mb-2">{title}</h3>
  <p>{content}</p>
</div>
```

**After**:
```typescript
<Card>
  <h3 className="font-semibold mb-2">{title}</h3>
  <p>{content}</p>
</Card>
```

#### Pattern B: Card with Header

**Before**:
```typescript
<div className="bg-card border border-border rounded-xl p-6">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Icon className="w-5 h-5 text-primary" />
      <h3 className="font-semibold">{title}</h3>
    </div>
    <button>Action</button>
  </div>
  <p>{content}</p>
</div>
```

**After**:
```typescript
<Card>
  <CardHeader 
    title={title}
    icon={<Icon className="w-5 h-5 text-primary" />}
    action={<button>Action</button>}
  />
  <p>{content}</p>
</Card>
```

#### Pattern C: Interactive Card

**Before**:
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer"
  onClick={handleClick}
>
  <p>{content}</p>
</motion.div>
```

**After**:
```typescript
<InteractiveCard 
  onClick={handleClick}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  size="md"
>
  <p>{content}</p>
</InteractiveCard>
```

#### Pattern D: Stat Card

**Before**:
```typescript
<div className="bg-card border border-border rounded-xl p-4">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-sm text-muted-foreground mb-1">Total Questions</p>
      <p className="text-2xl font-bold">1,234</p>
    </div>
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
      <BookOpen className="w-5 h-5 text-primary" />
    </div>
  </div>
</div>
```

**After**:
```typescript
<StatCard
  label="Total Questions"
  value={1234}
  icon={<BookOpen className="w-5 h-5" />}
/>
```

---

---

### 4. Button Migration

#### Pattern A: Primary Button

**Before**:
```typescript
<button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all">
  Click me
</button>
```

**After**:
```typescript
<Button variant="primary" size="md">
  Click me
</Button>
```

#### Pattern B: Secondary/Outline Button

**Before**:
```typescript
<button className="px-4 py-2 border border-border bg-transparent rounded-lg hover:bg-muted/50 transition-all">
  Cancel
</button>
```

**After**:
```typescript
<Button variant="outline" size="md">
  Cancel
</Button>
```

#### Pattern C: Button with Icon

**Before**:
```typescript
<button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2">
  <Plus className="w-4 h-4" />
  Add Item
</button>
```

**After**:
```typescript
<Button 
  variant="primary" 
  icon={<Plus className="w-4 h-4" />}
  iconPosition="left"
>
  Add Item
</Button>
```

#### Pattern D: Loading Button

**Before**:
```typescript
<button 
  disabled={isLoading}
  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2"
>
  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
  {isLoading ? 'Saving...' : 'Save'}
</button>
```

**After**:
```typescript
<Button 
  variant="primary" 
  loading={isLoading}
>
  {isLoading ? 'Saving...' : 'Save'}
</Button>
```

#### Pattern E: Icon-Only Button

**Before**:
```typescript
<button className="w-10 h-10 rounded-lg bg-transparent hover:bg-muted/50 flex items-center justify-center">
  <Settings className="w-5 h-5" />
</button>
```

**After**:
```typescript
<IconButton
  icon={<Settings className="w-5 h-5" />}
  variant="ghost"
  size="md"
  aria-label="Settings"
/>
```

#### Pattern F: Animated Button

**Before**:
```typescript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="px-6 py-3 bg-primary text-primary-foreground rounded-full"
>
  Get Started
</motion.button>
```

**After**:
```typescript
<MotionButton
  variant="primary"
  size="lg"
  rounded="full"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Get Started
</MotionButton>
```

#### Pattern G: Danger/Delete Button

**Before**:
```typescript
<button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
  Delete
</button>
```

**After**:
```typescript
<Button variant="danger" size="md">
  Delete
</Button>
```

#### Pattern H: Full Width Button

**Before**:
```typescript
<button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg">
  Continue
</button>
```

**After**:
```typescript
<Button variant="primary" fullWidth={true}>
  Continue
</Button>
```

## Step-by-Step Migration Process

### Step 1: Import Components

Add imports at the top of your file:

```typescript
import { 
  Card, CardHeader, CardFooter,
  ProgressBar,
  DifficultyBadge,
  Button, MotionButton, IconButton
} from '@/components/unified';
```

### Step 2: Identify Patterns

Search your file for these patterns:
- `bg-card border border-border rounded` → Card
- `bg-muted rounded-full overflow-hidden` → ProgressBar
- `difficulty === 'beginner'` → DifficultyBadge
- `<button className="px-` → Button

### Step 3: Replace One at a Time

Start with the simplest patterns first:
1. DifficultyBadge (easiest)
2. Button (easy)
3. ProgressBar (medium)
4. Card (more complex)

### Step 4: Test

After each replacement:
1. Check TypeScript errors
2. Run build
3. Test in browser
4. Verify functionality

### Step 5: Commit

Commit after each successful migration:
```bash
git add .
git commit -m "refactor: migrate [component] to unified [Component]"
```

---

## Size Mapping

### ProgressBar Sizes

| Old Height | New Size |
|------------|----------|
| `h-1` | `size="xs"` |
| `h-1.5` | `size="sm"` |
| `h-2` | `size="md"` |
| `h-2.5` | `size="lg"` |

### DifficultyBadge Sizes

| Old Classes | New Size |
|-------------|----------|
| `text-[9px] px-1.5 py-0.5` | `size="xs"` |
| `text-[10px] px-2 py-0.5` | `size="sm"` |
| `text-xs px-2 py-1` | `size="md"` |
| `text-sm px-3 py-1.5` | `size="lg"` |

### Card Sizes

| Old Padding | New Size |
|-------------|----------|
| `p-3` | `size="sm"` |
| `p-4` | `size="md"` |
| `p-6` | `size="lg"` |
| `p-8` | `size="xl"` |

### Card Rounded

| Old Rounded | New Rounded |
|-------------|-------------|
| `rounded-lg` | `rounded="lg"` |
| `rounded-xl` | `rounded="xl"` |
| `rounded-2xl` | `rounded="2xl"` |

### Button Sizes

| Old Classes | New Size |
|-------------|----------|
| `px-2 py-1 text-xs` | `size="xs"` |
| `px-3 py-1.5 text-sm` | `size="sm"` |
| `px-4 py-2 text-sm` | `size="md"` |
| `px-6 py-3 text-base` | `size="lg"` |
| `px-8 py-4 text-lg` | `size="xl"` |

---

## Variant Mapping

### ProgressBar Variants

| Use Case | Variant |
|----------|---------|
| Default progress | `variant="default"` |
| Success/completion | `variant="success"` |
| Warning/attention | `variant="warning"` |
| Error/critical | `variant="danger"` |
| Information | `variant="info"` |

### DifficultyBadge Variants

| Old Style | New Variant |
|-----------|-------------|
| `bg-green-500 text-white` | `variant="solid"` |
| `bg-green-500/10 text-green-600` | `variant="soft"` |
| `border-green-500/30 text-green-600` | `variant="outline"` |
| `text-green-600` | `variant="minimal"` |

### Card Variants

| Old Style | New Variant |
|-----------|-------------|
| `bg-card border border-border` | `variant="default"` |
| `bg-card border shadow-lg` | `variant="elevated"` |
| `bg-transparent border` | `variant="outline"` |
| `bg-transparent` | `variant="ghost"` |

### Button Variants

| Use Case | Variant |
|----------|---------|
| Primary actions (Submit, Save) | `variant="primary"` |
| Secondary actions (Cancel, Back) | `variant="secondary"` |
| Tertiary actions (View, Learn More) | `variant="outline"` |
| Minimal actions (Close, Dismiss) | `variant="ghost"` |
| Destructive actions (Delete, Remove) | `variant="danger"` |
| Positive actions (Confirm, Accept) | `variant="success"` |

---

## Common Mistakes

### ❌ Don't Do This

```typescript
// Don't mix old and new patterns
<div className="bg-card border border-border rounded-xl p-6">
  <ProgressBar current={50} max={100} />
</div>
```

### ✅ Do This Instead

```typescript
// Use unified components consistently
<Card>
  <ProgressBar current={50} max={100} />
</Card>
```

---

## File-Specific Examples

### Example: CertificationPractice.tsx

**Before** (Line 471-475):
```typescript
<span className={`text-xs px-2 py-0.5 rounded ${
  currentTestQuestion?.difficulty === 'beginner' ? 'bg-green-500/10 text-green-500' :
  currentTestQuestion?.difficulty === 'intermediate' ? 'bg-yellow-500/10 text-yellow-500' :
  'bg-red-500/10 text-red-500'
}`}>
  {currentTestQuestion?.difficulty}
</span>
```

**After**:
```typescript
<DifficultyBadge 
  level={currentTestQuestion?.difficulty} 
  size="sm" 
/>
```

**Before** (Line 636-638):
```typescript
<div className="relative flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[200px]">
  <div className="h-full bg-primary rounded-full transition-all" 
       style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} />
</div>
```

**After**:
```typescript
<ProgressBar 
  current={currentIndex + 1} 
  max={totalQuestions}
  size="sm"
  className="flex-1 max-w-[200px]"
/>
```

---

## Testing Checklist

After migration, verify:

- [ ] TypeScript compiles without errors
- [ ] Build succeeds
- [ ] Visual appearance matches original
- [ ] Hover states work correctly
- [ ] Click handlers work (for interactive cards)
- [ ] Animations work (if animated)
- [ ] Responsive design maintained
- [ ] Dark mode works correctly
- [ ] Accessibility maintained

---

## Getting Help

If you encounter issues:

1. Check the [Unified Components Documentation](./UNIFIED_COMPONENTS.md)
2. Review [Phase 1 Quick Wins](./PHASE1_QUICK_WINS.md) for examples
3. Look at [TrainingMode Migration](./MIGRATION_TRAINING_MODE.md) case study
4. Check component source code in `client/src/components/unified/`

---

## Benefits Reminder

After migration, you'll have:

✅ **Consistency** - Same styling across the app
✅ **Maintainability** - Fix bugs in one place
✅ **Type Safety** - Full TypeScript support
✅ **Less Code** - 50-80% reduction in UI code
✅ **Better DX** - Simple, intuitive API

---

**Happy Migrating!** 🚀
