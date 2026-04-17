# Unified Design System - Quick Reference

## Import Statement
```typescript
import {
  Card, CardHeader, CardFooter,
  ProgressBar,
  DifficultyBadge,
  Button,
  QuestionCard,
  MetricCard,
  EmptyState
} from '@/components/unified';
```

## Component Cheat Sheet

### Card
```typescript
<Card variant="default" size="md" rounded="xl">
  <CardHeader title="Title" icon={<Icon />} action={<Button />} />
  <p>Content</p>
  <CardFooter><Button>Action</Button></CardFooter>
</Card>
```

### ProgressBar
```typescript
<ProgressBar 
  current={75} 
  max={100}
  size="md"
  variant="success"
  showPercentage={true}
  label="Progress"
/>
```

### DifficultyBadge
```typescript
<DifficultyBadge 
  level="intermediate"
  size="md"
  showIcon={true}
/>
```

### Button
```typescript
<Button 
  variant="primary" 
  size="md"
  loading={false}
  icon={<Icon />}
  fullWidth={false}
>
  Click me
</Button>
```

### QuestionCard
```typescript
<QuestionCard
  question={question}
  variant="detailed"
  showDifficulty={true}
  showProgress={true}
  questionNumber={1}
  totalQuestions={100}
/>
```

### MetricCard
```typescript
<MetricCard
  icon={<Icon />}
  value={1234}
  label="Total"
  variant="success"
  trend={12}
/>
```

### EmptyState
```typescript
<EmptyState
  icon={<Icon />}
  title="No items"
  description="Description here"
  action={<Button>Action</Button>}
  size="lg"
/>
```

## Variant Quick Reference

### Card Variants
- `default` - Standard card
- `elevated` - With shadow
- `outline` - Transparent with border
- `ghost` - No background

### ProgressBar Variants
- `default` - Primary color
- `success` - Green
- `warning` - Yellow
- `danger` - Red
- `info` - Blue

### Button Variants
- `primary` - Main actions
- `secondary` - Secondary actions
- `outline` - Tertiary actions
- `ghost` - Minimal actions
- `danger` - Destructive actions
- `success` - Positive actions

### MetricCard Variants
- `default` - Standard metric
- `success` - Green (positive)
- `warning` - Yellow (caution)
- `danger` - Red (negative)
- `info` - Blue (information)

### EmptyState Variants
- `default` - Standard empty state
- `info` - Information
- `warning` - Warning
- `error` - Error state
- `success` - Success state

## Size Quick Reference

### Sizes Available
- `xs` - Extra small
- `sm` - Small
- `md` - Medium (default)
- `lg` - Large
- `xl` - Extra large

## Color to Variant Mapping

| Color Classes | Variant | Component |
|---------------|---------|-----------|
| `text-green-*` + `bg-green-*/10` | `success` | MetricCard |
| `text-red-*` + `bg-red-*/10` | `danger` | MetricCard |
| `text-yellow-*` + `bg-yellow-*/10` | `warning` | MetricCard |
| `text-blue-*` + `bg-blue-*/10` | `info` | MetricCard |
| `text-cyan-*` + `bg-cyan-*/10` | `info` | MetricCard |
| `text-orange-*` + `bg-orange-*/10` | `warning` | MetricCard |
| `text-purple-*` + `bg-purple-*/10` | `default` | MetricCard |

## Migration Checklist

- [ ] Identify duplicate pattern
- [ ] Choose appropriate unified component
- [ ] Map props (colors → variants)
- [ ] Replace instance
- [ ] Update imports
- [ ] Run diagnostics
- [ ] Build and test
- [ ] Verify visually
- [ ] Commit changes

## Common Patterns

### Replace Custom Metric
```typescript
// Before
<div className="bg-card border border-border rounded-xl p-4">
  <div className="w-10 h-10 rounded-xl bg-primary/10 ...">
    <Icon />
  </div>
  <div className="text-2xl font-bold">{value}</div>
  <div className="text-sm text-muted-foreground">{label}</div>
</div>

// After
<MetricCard icon={<Icon />} value={value} label={label} />
```

### Replace Custom Empty State
```typescript
// Before
<div className="text-center py-16">
  <div className="w-16 h-16 rounded-full bg-muted ...">
    <Icon />
  </div>
  <h2>{title}</h2>
  <p>{description}</p>
  <button>{action}</button>
</div>

// After
<EmptyState 
  icon={<Icon />} 
  title={title} 
  description={description}
  action={<Button>{action}</Button>}
/>
```

## Documentation Links

- **Migration Guide**: `docs/MIGRATION_GUIDE.md`
- **Component API**: `docs/UNIFIED_COMPONENTS.md`
- **Pattern Analysis**: `docs/COMPREHENSIVE_PATTERN_ANALYSIS.md`
- **Complete Summary**: `UNIFIED_DESIGN_SYSTEM_COMPLETE.md`

## Build Commands

```bash
# Check diagnostics
pnpm run build

# Development
pnpm run dev

# Type check
npx tsc --noEmit
```

## Support

For questions or issues:
1. Check `docs/MIGRATION_GUIDE.md`
2. Review `PHASE_4_PROGRESS.md` for examples
3. See component source in `client/src/components/unified/`

---

**Quick Stats**:
- 7 components, 25+ variants
- 1,610 lines of reusable code
- 90+ files ready for migration
- ~8 minutes average per file

