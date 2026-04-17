# Gen Z Answer Panel - Theme Color Fix

## Issue
Text was invisible in light mode because hardcoded colors (white text on white background) were used instead of theme-aware CSS variables.

## What Was Fixed

### 1. Quick Answer Tab Content
- **Before**: `text-white` (invisible in light mode)
- **After**: `text-foreground` (adapts to theme)

### 2. ELI5 Tab Content
- **Before**: `text-white` (invisible in light mode)
- **After**: `text-foreground` (adapts to theme)

### 3. Markdown Rendering
All markdown elements now use theme-aware colors:

#### Paragraphs & Headings
- `text-white` → `text-foreground`
- `border-white/10` → `border-border`

#### Lists
- Bullet color: `text-[#00ff88]` → `text-primary`
- Text color: `text-white` → `text-foreground`

#### Links
- `text-[#00ff88]` → `text-primary`
- Hover: `text-[#00ff88]/80` → `text-primary/80`

#### Blockquotes
- Background: `bg-[#00ff88]/5` → `bg-primary/5`
- Text: `text-[#a0a0a0]` → `text-muted-foreground`

#### Tables
- Header background: `bg-white/3` → `bg-muted`
- Borders: `border-white/10` → `border-border`
- Text: `text-white` → `text-foreground`

### 4. UI Components

#### Tab Headers
- Active tab: `text-[#00ff88] bg-[#00ff88]/10` → `text-primary bg-primary/10`
- Inactive tab: `text-[#a0a0a0]` → `text-muted-foreground`
- Hover: `hover:text-white` → `hover:text-foreground`
- Border: `border-white/10` → `border-border`
- Background: `bg-white/3/30` → `bg-muted/30`

#### Code Blocks
- Border: `border-white/10` → `border-border`
- Background: `bg-white/5` → `bg-muted/50`
- Header background: `bg-white/3` → `bg-muted`
- Language label: `text-[#00ff88]` → `text-primary`
- Copy button: `text-[#a0a0a0]` → `text-muted-foreground`

#### Expandable Cards
- Default background: `bg-white/5` → `bg-card`
- Default border: `border-white/10` → `border-border`
- Default icon: `text-[#a0a0a0]` → `text-muted-foreground`
- Title: `text-white` → `text-foreground`
- Badge background: `bg-[#00ff88]/20` → `bg-primary/20`
- Badge text: `text-[#00ff88]` → `text-primary`
- Chevron: `text-[#a0a0a0]` → `text-muted-foreground`

#### Tags
- Background: `bg-white/3` → `bg-muted`
- Text: `text-[#a0a0a0]` → `text-muted-foreground`
- Border: `border-white/10` → `border-border`
- Icon: `text-[#00ff88]` → `text-primary`

#### Reference Links
- Source button:
  - Background: `bg-white/5` → `bg-muted`
  - Hover: `hover:bg-white/3` → `hover:bg-muted/80`
  - Border: `border-white/10` → `border-border`
  - Icon: `text-[#00ff88]` → `text-primary`
  - Text: `text-white` → `text-foreground`
- Blog button:
  - Background: `bg-[#00ff88]/10` → `bg-primary/10`
  - Hover: `hover:bg-[#00ff88]/20` → `hover:bg-primary/20`
  - Icon & text: `text-[#00ff88]` → `text-primary`

#### Loading Message
- Background: `bg-white/5` → `bg-muted/50`
- Border: `border-white/10` → `border-border`
- Text: `text-[#a0a0a0]` → `text-muted-foreground`

#### Main Container
- Background: `bg-white/5` → `bg-card`
- Border: `border-white/10` → `border-border`

## Theme Variables Used

### Dark Mode (genz-dark)
- `--foreground`: `hsl(0 0% 100%)` (white)
- `--background`: `hsl(0 0% 0%)` (pure black)
- `--card`: `hsl(0 0% 6%)` (dark gray)
- `--primary`: `hsl(150 100% 50%)` (neon green)
- `--muted-foreground`: `hsl(0 0% 40%)` (gray)
- `--border`: `hsl(0 0% 10%)` (dark border)

### Light Mode (genz-light)
- `--foreground`: `hsl(0 0% 5%)` (near black)
- `--background`: `hsl(0 0% 100%)` (pure white)
- `--card`: `hsl(0 0% 97%)` (light gray)
- `--primary`: `hsl(150 70% 40%)` (vibrant green)
- `--muted-foreground`: `hsl(0 0% 35%)` (dark gray)
- `--border`: `hsl(0 0% 85%)` (light border)

## Testing Checklist
- [x] Quick Answer tab text visible in both themes
- [x] ELI5 tab text visible in both themes
- [x] Markdown paragraphs readable
- [x] Markdown headings visible
- [x] List items readable
- [x] Links visible and clickable
- [x] Code blocks readable
- [x] Tables readable
- [x] Tab headers visible
- [x] Expandable cards readable
- [x] Tags visible
- [x] Reference links visible
- [x] No TypeScript errors

## Result
✅ All text is now visible in both dark and light modes
✅ Theme switching works seamlessly
✅ Maintains Gen Z aesthetic with proper contrast
✅ No hardcoded colors remaining

## Files Modified
- `client/src/components/question/GenZAnswerPanel.tsx`

## Related Issues
- Fixes invisible text in light mode
- Improves accessibility with proper contrast ratios
- Maintains consistency with theme system
