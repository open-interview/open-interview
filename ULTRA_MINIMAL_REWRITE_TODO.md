# Ultra-Minimal UI Rewrite - Task Tracker

## Goal
Rewrite the entire UI codebase with 90% less code while maintaining/improving UX.

## Current State
- 234 TSX files total
- 47 page files  
- 173 component files

## Target State (90% reduction)
- ~23 TSX files total
- ~5 page files
- ~17 component files

## New Architecture

### Core Files (in /client/src/ui/)
1. **Layout.tsx** - Universal layout with mobile header, bottom nav, desktop sidebar
2. **Components.tsx** - Reusable UI components (Card, Button, Badge, List, Grid)
3. **States.tsx** - Empty, Loading, Error states
4. **index.ts** - Export all UI components

### Pages (in /client/src/pages/)
- **Home.tsx** - Landing page with feature cards
- **Channels.tsx** - Browse all channels
- **Profile.tsx** - User profile and stats
- **not-found.tsx** - 404 page

### App Structure
- **App.tsx** - Simplified routing with just 4 pages

## Tasks

### Task 1: Rewrite Core Pages
**Assigned to:** Subagent 1
**Files to create/modify:**
- `/client/src/pages/Home.tsx` (ultra-minimal version)
- `/client/src/pages/Channels.tsx` (ultra-minimal version)
- `/client/src/pages/Profile.tsx` (ultra-minimal version)
- `/client/src/pages/not-found.tsx` (ultra-minimal version)

**Requirements:**
- Use new UI components from `/client/src/ui/`
- Maximum 50 lines per page
- Mobile-first design
- Keep only essential functionality

### Task 2: Create Minimal UI Components
**Assigned to:** Subagent 2
**Files to create:**
- `/client/src/ui/Layout.tsx` - Universal layout component
  - Mobile header with back button support
  - Bottom navigation (5 items)
  - Desktop sidebar
  - Slide-out menu
  - Safe area support
  
- `/client/src/ui/Components.tsx` - Reusable components
  - Card (with onClick support)
  - Button (variants: primary, secondary, ghost, danger)
  - Badge (variants: default, primary, success, warning, danger)
  - List (render list of items)
  - Grid (responsive grid)
  - SearchBar
  - FilterChips
  
- `/client/src/ui/States.tsx` - State components
  - Empty (with optional action)
  - Loading
  - Error (with retry)

- `/client/src/ui/index.ts` - Export all

**Requirements:**
- Use CSS variables from design system
- Mobile-first with Tailwind
- Maximum 100 lines per file
- TypeScript types included

### Task 3: Update App.tsx and Routing
**Assigned to:** Subagent 3
**Files to modify:**
- `/client/src/App.tsx` - Simplified app structure

**Requirements:**
- Remove all old imports
- Use only 4 pages (Home, Channels, Profile, NotFound)
- Keep essential providers (Theme, User, Credits, etc.)
- Remove complex routing logic
- Maximum 50 lines

### Task 4: Clean Up Old Components
**Assigned to:** Subagent 4
**Files/directories to delete:**
- `/client/src/components/layout/` (entire directory)
- `/client/src/components/ui/` (entire directory)
- `/client/src/components/mobile/` (entire directory)
- `/client/src/pages/*GenZ.tsx` (all GenZ variants)
- `/client/src/pages/*Redesigned.tsx` (all redesigned variants)
- `/client/src/pages/QuestionViewer.tsx`
- `/client/src/pages/AnswerHistory.tsx`
- `/client/src/pages/Badges.tsx`
- `/client/src/pages/Stats.tsx`
- `/client/src/pages/Tests.tsx`
- `/client/src/pages/Certifications.tsx`
- `/client/src/pages/CodingChallenge.tsx`
- `/client/src/pages/LearningPaths.tsx`
- `/client/src/pages/ReviewSession.tsx`
- `/client/src/pages/VoicePractice.tsx`
- `/client/src/pages/VoiceSession.tsx`
- `/client/src/pages/TrainingMode.tsx`
- `/client/src/pages/Documentation.tsx`
- `/client/src/pages/Notifications.tsx`
- `/client/src/pages/Bookmarks.tsx`
- `/client/src/pages/WhatsNew.tsx`
- `/client/src/pages/About.tsx`
- `/client/src/pages/BotActivity.tsx`
- `/client/src/pages/PersonalizedPath.tsx`
- `/client/src/pages/TestSession.tsx`
- `/client/src/pages/CertificationPractice.tsx`
- `/client/src/pages/CertificationExam.tsx`
- `/client/src/pages/ExtremeQuestionViewer.tsx`

**Requirements:**
- Delete all files carefully
- Keep only the 4 new minimal pages
- Update any remaining imports

## Design System

### Colors (CSS Variables)
- `--background`: hsl(0 0% 0%) - Pure black
- `--foreground`: hsl(0 0% 100%) - White
- `--card`: hsl(0 0% 6%) - Dark gray
- `--primary`: hsl(150 100% 50%) - Neon green
- `--primary-foreground`: hsl(0 0% 0%) - Black
- `--muted`: hsl(0 0% 10%) - Darker gray
- `--muted-foreground`: hsl(0 0% 60%) - Gray text
- `--border`: hsl(0 0% 10%) - Border color
- `--accent-gold`: hsl(45 100% 50%) - Gold for credits

### Typography
- Font: Inter (system fallback)
- Base size: 16px
- Headings: font-bold
- Body: text-sm, text-muted-foreground

### Spacing
- Mobile padding: px-4
- Desktop padding: lg:px-8
- Card padding: p-4
- Grid gap: gap-3
- Border radius: rounded-2xl for cards, rounded-xl for buttons

### Mobile-First Breakpoints
- Mobile: default (no prefix)
- Desktop: lg: prefix

## Status Tracking

- [ ] Task 1: Core pages rewritten
- [ ] Task 2: UI components created
- [ ] Task 3: App.tsx updated
- [ ] Task 4: Old components cleaned up
- [ ] Build successful
- [ ] All pages working

## File Count Target

**Before:**
- Total: 234 files

**After:**
- UI components: 4 files
- Pages: 4 files
- App: 1 file
- Contexts/Hooks: ~15 files (keep existing)
- Total: ~24 files (90% reduction achieved)
