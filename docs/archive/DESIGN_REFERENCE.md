# Design Reference Guide
## Visual Design System for Unified Question Views

---

## 🎨 Color Palette

### Base Colors (OLED Optimized)
```
Background Hierarchy:
┌─────────────────────────────────────┐
│ Base Black    hsl(0 0% 0%)          │ ← Deepest background
│ Base Dark     hsl(0 0% 2%)          │ ← Main background
│ Base Darker   hsl(0 0% 4%)          │ ← Subtle elevation
│ Base Card     hsl(0 0% 6.5%)        │ ← Card background
│ Base Elevated hsl(0 0% 8%)          │ ← Highest elevation
└─────────────────────────────────────┘
```

### Text Colors
```
Text Hierarchy:
┌─────────────────────────────────────┐
│ Primary   hsl(0 0% 98%)  ███████    │ ← Main text
│ Secondary hsl(0 0% 75%)  ████       │ ← Secondary text
│ Tertiary  hsl(0 0% 53%)  ██         │ ← Muted text
│ Disabled  hsl(0 0% 35%)  █          │ ← Disabled text
└─────────────────────────────────────┘
```

### Accent Colors
```
Primary Gradient (Cyan → Purple → Pink):
┌─────────────────────────────────────┐
│ ████████████████████████████████    │
│ Cyan    Purple         Pink         │
│ #00D9FF → #A855F7 → #EC4899         │
└─────────────────────────────────────┘

Individual Accents:
• Cyan:   hsl(190 100% 50%)  #00D9FF
• Purple: hsl(270 100% 65%)  #A855F7
• Pink:   hsl(330 100% 65%)  #EC4899
```

### Semantic Colors
```
Success:  hsl(142 76% 36%)  ████  Green
Warning:  hsl(38 92% 50%)   ████  Amber
Error:    hsl(0 84% 60%)    ████  Red
Info:     hsl(199 89% 48%)  ████  Blue
```

### Difficulty Colors
```
Beginner:     Green  ████  Easy, approachable
Intermediate: Amber  ████  Moderate challenge
Advanced:     Red    ████  High difficulty
```

---

## 📐 Layout Structure (iPhone 13: 390x844px)

### Full Screen Layout
```
┌─────────────────────────────────────┐ ← 0px
│ Status Bar (iOS)                    │ 
├─────────────────────────────────────┤ ← 47px (safe-area-top)
│ Metadata Bar                        │
│ • Question counter                  │
│ • Difficulty badge                  │
│ • Timer (if applicable)             │
├─────────────────────────────────────┤ ← 95px
│ Progress Bar                        │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░     │
├─────────────────────────────────────┤ ← 115px
│                                     │
│                                     │
│ Scrollable Content Area             │
│ • Question Panel                    │
│   OR                                │
│ • Answer Panel                      │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤ ← 776px
│ Action Bar                          │
│ [◀] [👁️ Reveal] [🔖] [▶]          │
├─────────────────────────────────────┤ ← 810px
│ Home Indicator (iOS)                │
└─────────────────────────────────────┘ ← 844px (safe-area-bottom)
```

### Spacing Scale
```
4px   ▪        Extra small (xs)
8px   ▪▪       Small (sm)
12px  ▪▪▪      Medium (md)
16px  ▪▪▪▪     Large (lg)
24px  ▪▪▪▪▪▪   Extra large (xl)
32px  ▪▪▪▪▪▪▪▪ 2XL
48px  ▪▪▪▪▪▪▪▪▪▪▪▪ 3XL
```

---

## 🎭 Component Anatomy

### Metadata Bar
```
┌─────────────────────────────────────┐
│ [1/10] [⚡ Intermediate]    [⏱ 5:00]│
│  ↑      ↑                    ↑      │
│  │      │                    │      │
│  │      │                    └─ Timer (test mode)
│  │      └─ Difficulty badge
│  └─ Question counter
└─────────────────────────────────────┘
Height: 48px
Padding: 12px 16px
Background: Card/60% + Backdrop blur
Border: Bottom 1px
```

### Progress Bar
```
┌─────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░ │
│ ●─────────────●───────────●────────●│
│ ↑             ↑           ↑        ↑│
│ Q1            Q2          Q3       Q4│
└─────────────────────────────────────┘
Height: 6px (bar) + 8px (markers)
Padding: 8px 16px
Gradient: Mode-specific color
Animation: Smooth fill + shimmer
```

### Question Panel
```
┌─────────────────────────────────────┐
│ [🟢 Beginner] [🏆 React] [📊]       │ ← Badges
│ #javascript #hooks #state           │ ← Tags
│ Google • Meta • Amazon              │ ← Companies
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✨                              │ │
│ │ What is the purpose of          │ │
│ │ `useEffect` in React?           │ │ ← Question
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⚡ Quick Summary:                   │
│ useEffect handles side effects...   │ ← TLDR
│                                     │
│ [✨ Reveal Answer]                  │ ← CTA
└─────────────────────────────────────┘
Padding: 24px 16px
Card: Gradient border + glow
```

### Answer Panel
```
┌─────────────────────────────────────┐
│ [📖 Answer] [📊 Diagram] [👶 ELI5]  │ ← Tabs
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📖 Answer                       │ │
│ │ ─────────────────────────────── │ │
│ │                                 │ │
│ │ useEffect is a React Hook...    │ │
│ │                                 │ │
│ │ ```javascript                   │ │
│ │ useEffect(() => {               │ │
│ │   // side effect               │ │
│ │ }, [dependencies]);             │ │
│ │ ```                             │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💡 Explanation                  │ │
│ │ ─────────────────────────────── │ │
│ │ The useEffect hook...           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [🔗 View Original Source]           │
└─────────────────────────────────────┘
Padding: 24px 16px
Tabs: Horizontal scroll
Sections: Collapsible
```

### Action Bar
```
┌─────────────────────────────────────┐
│ [◀]  [👁️ Reveal Answer] [🔖]  [▶] │
│  ↑         ↑              ↑      ↑  │
│  │         │              │      │  │
│  │         │              │      └─ Next (gradient)
│  │         │              └─ Bookmark
│  │         └─ Primary action (gradient)
│  └─ Previous
└─────────────────────────────────────┘
Height: 68px + safe-area-bottom
Padding: 12px 16px
Background: Card/80% + Backdrop blur
Border: Top 1px
```

---

## 🎬 Animations

### Page Transitions
```
Question → Answer:
┌─────────┐         ┌─────────┐
│Question │  ───→   │ Answer  │
│  Panel  │         │  Panel  │
└─────────┘         └─────────┘
   ↓                    ↓
opacity: 1 → 0      opacity: 0 → 1
x: 0 → -50px        x: 50px → 0
duration: 300ms     duration: 300ms
```

### Progress Bar Fill
```
Empty → Filled:
░░░░░░░░░░░░░░░░░░░░  →  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░
0%                        50%
duration: 500ms
easing: ease-out
+ shimmer effect
```

### Button Press
```
Normal → Pressed:
┌─────────┐         ┌────────┐
│ Button  │  ───→   │ Button │
└─────────┘         └────────┘
scale: 1.0          scale: 0.98
duration: 150ms
```

### Timer Pulse (Low Time)
```
Normal → Pulse → Normal:
[⏱ 0:30]  →  [⏱ 0:30]  →  [⏱ 0:30]
scale: 1.0    scale: 1.05   scale: 1.0
duration: 500ms
repeat: infinite
```

### Gradient Shift
```
Background gradient animation:
position: 0% 50%  →  100% 50%  →  0% 50%
duration: 8s
repeat: infinite
easing: ease
```

---

## 🎯 Mode-Specific Styling

### Browse Mode
```
Accent: Cyan (#00D9FF)
Background: Cyan/5% gradient
Buttons: Cyan gradient
Glow: Cyan shadow
Pace: Relaxed
Auto-reveal: Optional
```

### Test Mode
```
Accent: Amber (#F59E0B)
Background: Amber/5% gradient
Buttons: Amber gradient
Glow: Amber shadow
Pace: Timed
Timer: Prominent
```

### Interview Mode
```
Accent: Purple (#A855F7)
Background: Purple/5% gradient
Buttons: Purple gradient
Glow: Purple shadow
Pace: Thoughtful
Focus: Thinking time
```

### Certification Mode
```
Accent: Blue (#3B82F6)
Background: Blue/5% gradient
Buttons: Blue gradient
Glow: Blue shadow
Pace: Exam-like
Timer: Critical
```

### Review Mode
```
Accent: Green (#10B981)
Background: Green/5% gradient
Buttons: Green gradient
Glow: Green shadow
Pace: SRS-optimized
Focus: Retention
```

---

## 📱 Touch Targets

### Minimum Sizes
```
All interactive elements:
┌────────────────┐
│                │
│   44 x 44 px   │ ← iOS minimum
│                │
└────────────────┘

Comfortable sizes:
┌────────────────┐
│                │
│   48 x 48 px   │ ← Recommended
│                │
└────────────────┘
```

### Button Sizes
```
Small:   36px height (icon only)
Medium:  44px height (icon + text)
Large:   52px height (primary CTA)
```

### Spacing Between Targets
```
Minimum: 8px
Recommended: 12px
Comfortable: 16px
```

---

## 🔤 Typography

### Font Families
```
Sans-serif: Inter
Monospace:  JetBrains Mono

Fallbacks:
Sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
Mono: 'SF Mono', Monaco, Consolas
```

### Type Scale
```
Display:  36px  Bold    Headings
Title:    24px  Bold    Section titles
Large:    20px  Semibold Emphasis
Body:     16px  Regular  Main text
Small:    14px  Regular  Secondary
Tiny:     12px  Medium   Labels
```

### Line Heights
```
Tight:    1.2  (headings)
Normal:   1.5  (body)
Relaxed:  1.75 (long-form)
```

### Font Weights
```
Regular:  400
Medium:   500
Semibold: 600
Bold:     700
```

---

## 🎨 Visual Effects

### Shadows
```
Small:  0 2px 8px rgba(0,0,0,0.4)
Medium: 0 8px 24px rgba(0,0,0,0.5)
Large:  0 16px 48px rgba(0,0,0,0.6)
XL:     0 24px 64px rgba(0,0,0,0.7)
```

### Glows
```
Cyan:    0 0 40px hsla(190,100%,50%,0.3)
Purple:  0 0 40px hsla(270,100%,65%,0.3)
Pink:    0 0 40px hsla(330,100%,65%,0.3)
Success: 0 0 40px hsla(142,76%,46%,0.3)
Warning: 0 0 40px hsla(38,92%,60%,0.3)
Error:   0 0 40px hsla(0,84%,60%,0.3)
```

### Gradients
```
Primary:
linear-gradient(135deg, 
  #00D9FF 0%,    ← Cyan
  #A855F7 50%,   ← Purple
  #EC4899 100%   ← Pink
)

Success:
linear-gradient(135deg,
  #059669 0%,    ← Green dark
  #10B981 100%   ← Green light
)

Warning:
linear-gradient(135deg,
  #D97706 0%,    ← Amber dark
  #F59E0B 100%   ← Amber light
)

Error:
linear-gradient(135deg,
  #DC2626 0%,    ← Red dark
  #EF4444 100%   ← Red light
)
```

### Blur Effects
```
Backdrop blur: 20px (glass effect)
Strong blur:   24px (modal backdrop)
```

---

## 🎭 Component States

### Button States
```
Default:  bg-gradient, shadow-md
Hover:    shadow-lg, glow, translateY(-2px)
Active:   scale(0.98)
Disabled: opacity-30, cursor-not-allowed
```

### Card States
```
Default:  border-subtle, shadow-sm
Hover:    border-default, shadow-md, translateY(-2px)
Active:   border-strong
```

### Input States
```
Default:  border-subtle
Focus:    border-accent, ring-accent/10
Error:    border-error, ring-error/10
Disabled: opacity-50, cursor-not-allowed
```

---

## 📐 Border Radius

### Scale
```
Small:  8px   (badges, tags)
Medium: 12px  (inputs, small cards)
Large:  16px  (buttons, cards)
XL:     24px  (large cards, panels)
Full:   9999px (pills, avatars)
```

---

## 🎨 Code Syntax Highlighting

### Theme: VS Code Dark Plus
```javascript
// Keywords: Purple
const function = () => {
  // Strings: Orange
  const text = "Hello World";
  
  // Numbers: Light green
  const num = 42;
  
  // Comments: Gray
  // This is a comment
  
  // Functions: Yellow
  console.log(text);
};
```

### Code Block Styling
```
Background: Black/40%
Border radius: 16px
Padding: 16px
Font: JetBrains Mono
Size: 14px
Line height: 1.6
Copy button: Top-right, fade in on hover
```

---

## 🎯 Accessibility

### Color Contrast
```
Text on background:
• Primary text:   21:1 (AAA)
• Secondary text: 7:1  (AA)
• Tertiary text:  4.5:1 (AA)

Interactive elements:
• Buttons:        4.5:1 (AA)
• Links:          4.5:1 (AA)
• Icons:          3:1   (AA)
```

### Focus Indicators
```
Visible focus ring:
• Width: 3px
• Color: Accent color
• Offset: 2px
• Style: Solid
```

### Touch Targets
```
Minimum: 44x44px (iOS)
Spacing: 8px minimum
```

---

## 📱 Responsive Breakpoints

```
Mobile:   < 640px   (iPhone 13: 390px)
Tablet:   640-1023px
Desktop:  ≥ 1024px

Safe areas:
• Top:    env(safe-area-inset-top)
• Bottom: env(safe-area-inset-bottom)
• Left:   env(safe-area-inset-left)
• Right:  env(safe-area-inset-right)
```

---

## 🎉 Summary

This design system provides:
- ✅ Consistent visual language
- ✅ Mobile-first approach
- ✅ Premium aesthetics
- ✅ Accessible design
- ✅ Smooth animations
- ✅ Clear hierarchy
- ✅ Touch-optimized
- ✅ OLED-friendly

Use this reference when implementing or customizing the unified question views.
