# Open Interview — Swipe-Only Redesign Plan

> **Scope**: Massive UI/UX redesign. Strip the app to its learning core.  
> **Mode**: Analysis & planning only. No code changes in this document.  
> **Principle**: Every pixel must earn its place. If it doesn't help you learn, it dies.

---

## 1. Vision

The app becomes a single experience: **a deck of cards you swipe through**.

No landing page. No blog. No voice interviews. No admin panels. No sidebar. No bottom nav. No navbar.

You open the app → you're already studying. That's it.

**Mobile**: One card, full screen. Swipe right = got it, left = again, up = Feynman mode, down = skip.  
**Desktop**: 3–5 cards fanned like a poker hand. Drag to bring forward. Space to flip. Arrow keys to swipe.

---

## 2. What Gets Stripped (and Why)

Every item below is a cognitive tax on the learner. Remove without mercy.

| Feature | Current Files | Why Stripped |
|---|---|---|
| Blog | `blog/`, `PostFaceliftPage`, `BlogHomePage`, `BlogSearchPage` | Content consumption ≠ learning |
| Voice Interview | `VoicePractice`, `VoiceInterview`, `VoiceSession` | Separate product surface |
| Coding Challenges | `ChallengeHome`, `ChallengeWorkspace`, `CodeEditor` | IDE mode ≠ flashcard mode |
| Tests / Simulations | `Tests`, `TestSession` | Not swipe-native |
| Learning Paths (full UI) | `MyPath`, `UnifiedLearningPaths`, `PersonalizedPath` | Replaced by cert/topic filter |
| Admin / Bot panels | `BotActivity`, `EventsDashboard`, `ArtStudio` | Internal tooling |
| History / Audit | `AnswerHistory`, `History` | Available in Profile |
| Badges page | `Badges.tsx` | Folded into Profile |
| Bookmarks page | `Bookmarks.tsx` | Folded into Profile |
| Notifications | `Notifications.tsx` | Stripped entirely |
| Sidebar | `Sidebar.tsx` | Replaced by filter strip |
| Facelift Navbar | `facelift-navbar.tsx` | Replaced by minimal header |
| Mobile Bottom Nav | `UnifiedNav.tsx` | Replaced by swipe gestures |
| Home / Landing | `Home.tsx`, `home-facelift.tsx` | App IS the study session |
| Stats redirect | `StatsRedirect.tsx`, `Stats.tsx` | Folded into Profile |
| WhatsNew | `WhatsNew.tsx` | Gone |
| About | `About.tsx` | Gone |
| Docs | `Documentation.tsx` | Gone |
| AI Companion | `AICompanion*.tsx`, `AIExplainer.tsx` | Out of scope for MVP |
| Background Mascots | `BackgroundMascots.tsx`, `PixelMascot.tsx` | Visual noise |
| Confetti / Celebration | `Confetti.tsx`, `BadgeUnlockCelebration.tsx` | Distraction |
| Achievement Manager | `AchievementNotificationManager.tsx` | Folded into silent XP |
| Marvel Intro | `MarvelIntro.tsx` | Gone |
| Onboarding | `Onboarding.tsx`, `OnboardingFlow.tsx` | Replaced by first-run card |
| Answer Formatting system | `answer-formatting/` | Overkill for card UX |
| InteractiveDiagram / SVG | `InteractiveDiagram.tsx` | Too heavy; inline mermaid only |
| GiscusComments | `GiscusComments.tsx` | Blog-only |
| Manage Subscriptions | `ManageSubscriptions.tsx` | Gone |
| QuestionEditorDemo | `QuestionEditorDemo.tsx` | Dev tool |

**Routes killed**: 35+ routes → **3 routes total**.

---

## 3. What Gets Kept (verbatim)

These files survive **as-is** or with minimal adaptation:

| File | Why Kept |
|---|---|
| `client/src/lib/spaced-repetition.ts` | Core SM-2 SRS engine — solid, well-tuned |
| `client/src/lib/active-recall.ts` | Recall card generation logic |
| `client/src/types/active-recall.ts` | Card type definitions |
| `client/src/types/index.ts` | Question, Channel, Cert interfaces |
| `client/src/services/api.service.ts` | Data fetching layer |
| `client/src/components/MermaidDiagram.tsx` | Inline diagram rendering for answer backs |
| `client/src/components/shared/RecallRatingBar.tsx` | 4-button SRS rating — reuse as-is |
| `client/src/components/ErrorBoundary.tsx` | Safety net |
| `client/src/context/` (UserPreferences, Credits) | Preference persistence |
| `client/public/data/channels.json` | Channel metadata |
| `client/public/data/certifications.json` | 53 cert definitions |
| `client/public/data/flashcards.json` | Pre-generated flashcard content |
| `client/public/data/*.json` (question data) | Content source |

---

## 4. New Architecture

### 4.1 Routes

```
/              →  redirect to /study
/study         →  SwipeStudy (the entire app)
/study/:filter →  SwipeStudy with pre-selected topic/cert
/profile       →  MinimalProfile
*              →  redirect to /study
```

That's it. Three components, three routes.

### 4.2 Component Tree

```
App.tsx
├── /study → <SwipeStudy />
│   ├── <FilterStrip />          ← thin chip bar: All | Topics | Certs | Mode
│   ├── <CardFan />              ← desktop: fan layout; mobile: single card
│   │   └── <StudyCard />        ← the card itself (flippable, swipeable)
│   │       ├── <CardFront />    ← question / concept
│   │       └── <CardBack />     ← answer + SRS buttons
│   └── <SwipeHints />           ← first-run gesture guide (fades after 3 uses)
│
└── /profile → <MinimalProfile />
    ├── <StreakRing />
    ├── <MasteryGrid />          ← heatmap per channel
    ├── <StatRow />
    └── <CustomCardList />       ← user-created cards
```

### 4.3 State Model

Everything lives in `localStorage`. No backend calls for study state.

```typescript
// Unified card in the swipe queue
interface SwipeCard {
  id: string;
  type: 'question' | 'flashcard' | 'custom';
  mode: 'recall' | 'feynman' | 'palace' | 'standard';
  front: string;               // Question text
  back: string;                // Answer text
  hint?: string;
  mnemonic?: string;           // Memory palace anchor
  palaceImage?: string;        // URL or emoji scene
  codeExample?: string;
  diagram?: string;            // Mermaid string
  channel: string;
  subChannel?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  sourceQuestionId?: string;
  // SRS state (from existing ReviewCard)
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReview: string;
  masteryLevel: number;
}

// Session queue manager
interface StudySession {
  filter: FilterState;
  queue: SwipeCard[];         // Ordered: due cards first, then new
  currentIndex: number;
  reviewedIds: string[];
  startedAt: string;
}

// Filter state (persisted)
interface FilterState {
  scope: 'all' | 'topic' | 'cert' | 'custom';
  channelId?: string;
  certId?: string;
  mode: 'due' | 'browse' | 'new';
  cardType: 'all' | 'questions' | 'flashcards' | 'custom';
}
```

---

## 5. Card System Design

### 5.1 Card Anatomy

Every card has exactly two faces. Front is always shown first.

```
┌──────────────────────────────────┐
│  [channel chip] [difficulty dot]  │  ← 1 line header, minimal
│                                   │
│   FRONT:                          │
│   Question or concept text        │  ← large, centered, max 3 lines
│   (truncated with expand tap)     │
│                                   │
│   [mode badge: Recall/Feynman/    │  ← subtle corner label
│    Palace/Standard]               │
│                                   │
│   ────────── tap to flip ──────── │  ← hint fades after 3 sessions
└──────────────────────────────────┘

[flip → ]

┌──────────────────────────────────┐
│  BACK:                            │
│  Answer (markdown-lite)           │  ← no videos, no full mermaid inline
│  [expand for diagram]             │  ← tap to expand mermaid
│                                   │
│  [Again] [Hard] [Good] [Easy]     │  ← existing RecallRatingBar
│  Next in: 1d  |  3d  |  7d  |21d │  ← interval previews
└──────────────────────────────────┘
```

### 5.2 Swipe Gesture Map

```
Mobile / Touch:
  → Swipe RIGHT     = Easy (green flash, card flies right)
  → Swipe LEFT      = Again (red flash, card flies left)
  ↑ Swipe UP        = Feynman mode (card flips into text input)
  ↓ Swipe DOWN      = Skip / Bury (card slides down, returns in 10 cards)

Desktop:
  [Space]           = Flip card
  [→] or [D]        = Easy
  [←] or [A]        = Again
  [↑] or [W]        = Hard (no Feynman on keyboard — intentional)
  [↓] or [S]        = Skip
  [E]               = Toggle Feynman mode
  [Scroll]          = Cycle through fan cards
  [Click card]      = Bring to front
  [Drag card]       = Swipe with mouse
```

### 5.3 Card Modes (per card, not per session)

Each card can be in one of 4 modes. Mode is assigned by the queue manager or set by the user.

| Mode | Front | Back | Gesture |
|---|---|---|---|
| **Standard** | Question | Answer + SRS buttons | Any |
| **Recall** | Question, answer hidden | Reveal button → Answer + SRS | Tap to reveal |
| **Feynman** | Question + textarea | "Explain it like you're teaching" prompt, then reveal answer | Swipe up or [E] |
| **Palace** | Question + spatial mnemonic image/scene | Answer + mnemonic reinforcement | Any |

Modes are not mutually exclusive — a card can be in Recall+Palace mode simultaneously.

---

## 6. Learning Techniques Integration

### 6.1 Active Recall (The Fuel for SRS)

**Implementation**: Every card defaults to Recall mode. The answer is always hidden behind a "Reveal" barrier.

- Card front shows question
- A frosted overlay hides the back until user taps/flips
- No "peek" mode — full commitment required
- SRS buttons only appear **after** reveal
- Swiping right/left without revealing counts as "Again" automatically

**Data hook**: `recordReview()` in `spaced-repetition.ts` — already exists, wire to swipe gesture.

**Why it works here**: The swipe gesture itself IS the recall attempt. You must commit (swipe) before you rate. No passive reading.

### 6.2 The Feynman Technique (For Deep Understanding)

**Trigger**: Swipe up on any card, or auto-assigned to cards with `masteryLevel >= 3` (you think you know it — prove it).

**Flow**:
```
1. Front: Question displayed
2. User sees: [Explain this in your own words ↑]
3. Swipe up → card animates to "Feynman mode"
4. Full-screen textarea appears
5. User types their explanation (no character limit, no timer)
6. [Reveal Answer] button appears after 10+ chars typed
7. User compares — rates themselves: [Way off] [Partially] [Nailed it]
8. Feynman ratings map to SRS: again / hard / easy
9. User's typed text is saved to localStorage for self-review
```

**Data stored**:
```typescript
interface FeynmanAttempt {
  cardId: string;
  attempt: string;        // What the user typed
  timestamp: string;
  rating: 'again' | 'hard' | 'easy';
}
// localStorage key: 'oi-feynman-attempts'
```

**In Profile**: Last 10 Feynman attempts shown as "your own words" — a journal of understanding.

### 6.3 The Memory Palace (Method of Loci)

**Concept**: Attach a spatial mnemonic image to a card so the brain files it with a "location."

**Implementation**: Each card can have an optional `palaceImage` — a short visual scene description or emoji sequence that acts as a spatial anchor.

**Flow**:
```
Palace card front:
┌─────────────────────────────────┐
│  🏛️ Kitchen → 🚰 Tap → 💧      │  ← visual anchor (3 emojis)
│                                  │
│  "What is cache invalidation?"  │
│                                  │
│  [visualize the scene...]       │  ← 2s pause cue
└─────────────────────────────────┘
```

**Card creation**: When a user creates a custom card, they can optionally add a "palace scene" — a short text or emoji sequence (max 60 chars). The system does not auto-generate these (AI cost, complexity). The user builds their palace manually.

**Why minimal**: Memory Palace is deeply personal — AI-generated palaces don't work as well as user-created ones. We expose the field, not an AI generator.

### 6.4 Advanced Card Creation Rules

Built into the in-card creation flow. Not a separate page — tap `+` in the filter strip.

**Rules enforced in UI**:

1. **One idea per card** — Front limited to 150 chars. If you need more, split into two cards.
2. **Use your own words** — The creation textarea starts with: "How would YOU explain this?" — prefill copy, not copy-paste.
3. **Answer must start with a verb** — Soft validation: shows a yellow dot if the answer doesn't start with an action word (know, use, remember, apply...).
4. **Add a hint** — Optional but prompted. Hint shown before reveal in Recall mode.
5. **Palace scene** — Optional emoji/scene field (max 60 chars).
6. **Tag it** — Required: at least one channel tag. Auto-suggested from content.

**Card creation form** (inline, bottom sheet on mobile, centered modal on desktop):
```
┌─────────────────────────────────┐
│  What's the question/concept?   │
│  ┌────────────────────────────┐ │
│  │ [textarea, 150 char limit] │ │
│  └────────────────────────────┘ │
│                                  │
│  Answer / Explanation            │
│  ┌────────────────────────────┐ │
│  │ [textarea, start w/ verb]  │ │
│  └────────────────────────────┘ │
│                                  │
│  Hint (optional)                 │
│  [___________________________]  │
│                                  │
│  Palace Scene (optional) 🏛️     │
│  [max 60 chars: emoji + scene]  │
│                                  │
│  Topic: [algorithms ▼]          │
│                                  │
│  [Cancel]          [Create Card] │
└─────────────────────────────────┘
```

---

## 7. Desktop Fan Layout

### 7.1 Visual Design

On screens ≥ 1024px, the card stack becomes a visible fan of 3–5 cards.

```
                    ┌──────────┐
               ┌────┤  Card 3  │
          ┌────┤  C2│          │
     ┌────┤  C1│    │(active)  │
     │ C0 │    │    │          │
     │(bg)│    │    │          │
     └────┘    └────┘          │
                               └──────────┘
```

**Physics**:
- Cards fan at 8° increments (card 0: -16°, card 1: -8°, card 2: 0° [front], card 3: +8°, card 4: +16°)
- Perspective: `perspective(1000px)` — slight 3D depth
- Front card is full opacity, z-index highest
- Background cards: 60% opacity, scale 0.92, blur 1px
- Hover over background card: scale 0.96, opacity 80%, cursor pointer

**Interaction**:
- Click background card → it animates to front (spring animation)
- Drag front card → swipe gesture triggers
- Scroll wheel → cycles which card is at front
- Keyboard arrows → standard swipe

**Framer Motion config**:
```typescript
// Fan positions (x offset, y offset, rotation, scale)
const fanPositions = [
  { x: -200, y: 20,  rotate: -16, scale: 0.88, opacity: 0.5 },
  { x: -100, y: 8,   rotate: -8,  scale: 0.93, opacity: 0.65 },
  { x: 0,    y: 0,   rotate: 0,   scale: 1.0,  opacity: 1.0  }, // active
  { x: 100,  y: 8,   rotate: 8,   scale: 0.93, opacity: 0.65 },
  { x: 200,  y: 20,  rotate: 16,  scale: 0.88, opacity: 0.5  },
];
```

**Card size (desktop)**: 420×580px — credit card aspect ratio 1.4:1, big enough to read comfortably.

### 7.2 Responsive Breakpoints

| Screen | Layout | Cards Visible |
|---|---|---|
| < 640px (mobile) | Single card, full screen | 1 |
| 640–1023px (tablet) | Single card, centered | 1 |
| 1024–1279px | Fan: 3 cards | 3 |
| 1280–1535px | Fan: 4 cards | 4 |
| ≥ 1536px | Fan: 5 cards | 5 |

---

## 8. Navigation & Organization (Minimal)

### 8.1 Filter Strip

Replaces sidebar, bottom nav, and all channel browsing pages.

A single thin strip (48px tall) pinned to top of the card area:

```
[All] [System Design] [Algorithms] [Frontend] [AWS SAA] [CKA] … [+ More ▾]
          ↑ scrollable horizontally on mobile          ↑ overflow menu
```

**Left side**: scope chips (topic channels + cert channels)  
**Right side**: mode toggles: `[Due]` `[Browse]` `[New]`

- Tapping a chip filters the card queue immediately
- Active chip has a colored underline (channel color from `channels.json`)
- "More ▾" opens a bottom sheet with the full list, grouped: Topics | Certifications
- Selected filter persists across app sessions (localStorage)

### 8.2 Minimal Header (40px)

```
[←]  Open Interview        [streak 🔥 12]  [👤]
```

- `[←]` only appears in Feynman mode (back to card)
- App name = tapping does nothing (prevents accidental navigation)
- Streak counter = visual motivation only
- `[👤]` = navigate to Profile

**No hamburger. No search. No notifications. No settings. No theme toggle.**

### 8.3 Empty State

When the queue is empty (all cards reviewed):

```
┌──────────────────────────────────┐
│                                  │
│    🎯                            │
│    All caught up!                │
│                                  │
│    Next review in 4h 23m         │
│    [Browse more topics]          │
│                                  │
│    Your streak: 12 days 🔥       │
│                                  │
└──────────────────────────────────┘
```

---

## 9. Profile (Minimal)

Single scrollable page. No tabs. No sub-pages.

```
┌──────────────────────────────────┐
│  [←]  Profile                   │
├──────────────────────────────────┤
│                                  │
│  🔥 12-day streak                │
│  ████████░░ 847 XP → Level 9    │
│                                  │
│  ── Mastery ──────────────────── │
│  algorithms    ██████░░  67%    │
│  system-design █████░░░  58%    │
│  devops        ████░░░░  45%    │
│  frontend      ███░░░░░  34%    │
│                                  │
│  ── Stats ─────────────────────  │
│  Total reviewed: 847             │
│  Mastered: 112                   │
│  Feynman attempts: 23            │
│  Custom cards: 7                 │
│  Longest streak: 22 days         │
│                                  │
│  ── My Feynman Journal ─────────  │
│  [last 10 feynman attempts,      │
│   collapsible, read-only]        │
│                                  │
│  ── My Cards ───────────────────  │
│  [list of custom cards, tap      │
│   to edit or delete]             │
│                                  │
│  ── Settings ───────────────────  │
│  Daily goal: [10 ▾] cards/day   │
│  Default mode: [Recall ▾]       │
│  Font size: [M ▾]               │
│                                  │
└──────────────────────────────────┘
```

**What's NOT in Profile**: Badges page, achievements grid, social links, subscription management, bot activity.

---

## 10. Data Layer

### 10.1 SRS Unification

Currently two separate SRS stores:
- `code-reels-srs` — questions
- `code-reels-fc-srs` — flashcards

**Problem**: User's mastery is split across two namespaces with no unified view.

**Solution**: Migrate to a single store `oi-srs-v2` keyed by card ID. Write a migration function that reads both old stores on first load and merges into the new schema.

```typescript
// Migration (runs once on app start)
function migrateSRSStores() {
  const migrated = localStorage.getItem('oi-srs-migrated');
  if (migrated) return;
  
  const old1 = JSON.parse(localStorage.getItem('code-reels-srs') ?? '{}');
  const old2 = JSON.parse(localStorage.getItem('code-reels-fc-srs') ?? '{}');
  const merged = { ...old1, ...old2 };
  localStorage.setItem('oi-srs-v2', JSON.stringify(merged));
  localStorage.setItem('oi-srs-migrated', '1');
}
```

### 10.2 Queue Manager

The queue manager is the brain of the swipe interface. It runs client-side.

```typescript
class StudyQueue {
  buildQueue(filter: FilterState): SwipeCard[] {
    // 1. Load cards matching filter
    const candidates = this.loadCandidates(filter);
    
    // 2. Classify: due, new, review
    const due    = candidates.filter(c => this.isDue(c));
    const newCards = candidates.filter(c => this.isNew(c));
    const review = candidates.filter(c => !this.isDue(c) && !this.isNew(c));
    
    // 3. Order: due first, then new (max 10/session), then review
    const newBatch = newCards.slice(0, filter.mode === 'browse' ? 50 : 10);
    
    // 4. Interleave: every 5 due cards, insert 1 Feynman card
    //    (cards at masteryLevel >= 3 get auto-assigned Feynman mode)
    return this.interleave([...due, ...newBatch], review, filter);
  }
  
  // Feynman injection: every 5th card in queue gets promoted to Feynman mode
  // if masteryLevel >= 3. Challenges the user's "I know this" assumption.
  private assignModes(cards: SwipeCard[]): SwipeCard[] { ... }
}
```

### 10.3 Adapter Pattern (Question → SwipeCard)

Both Questions and DbFlashcards adapt to a unified SwipeCard:

```typescript
function questionToSwipeCard(q: Question, srsState: ReviewCard): SwipeCard {
  return {
    id: q.id,
    type: 'question',
    mode: srsState.masteryLevel >= 3 ? 'feynman' : 'recall',
    front: q.question,
    back: q.answer,
    hint: q.tldr ?? undefined,
    diagram: q.diagram ?? undefined,
    channel: q.channel,
    subChannel: q.subChannel,
    difficulty: q.difficulty,
    tags: q.tags,
    // SRS state
    ...srsState,
  };
}

function flashcardToSwipeCard(fc: DbFlashcard, srsState: ReviewCard): SwipeCard {
  return {
    id: fc.id,
    type: 'flashcard',
    mode: 'recall',
    front: fc.front,
    back: fc.back,
    hint: fc.hint ?? undefined,
    mnemonic: fc.mnemonic ?? undefined,
    channel: fc.channel ?? 'general',
    difficulty: 'intermediate',
    tags: [],
    ...srsState,
  };
}
```

---

## 11. Migration Path

### Phase 1: Skeleton (no deletions yet)
Add new routes alongside old ones. Build `SwipeStudy` and `MinimalProfile` as new pages. `FilterStrip`, `CardFan`, `StudyCard` as new components.

### Phase 2: Wire data
Connect `StudyQueue` to existing SRS + question data. Test all card modes. Verify SRS migration.

### Phase 3: Strip navigation
Replace sidebar, bottom nav, facelift navbar with minimal 40px header + filter strip. Old routes still work.

### Phase 4: Delete pages
Remove the 35+ stripped pages. Delete imports. Kill dead routes. Add redirects: all old routes → `/study`.

### Phase 5: Delete components
Remove stripped components directory by directory. Run TypeScript check after each deletion wave.

### Phase 6: Style consolidation
Remove `facelift/` CSS overrides. Consolidate to a single, minimal theme. Remove unused shadcn components.

**Why this order?** Additive first, destructive last. At every step the app is functional.

---

## 12. Gap Analysis & Mitigations

| Gap | Risk | Mitigation |
|---|---|---|
| **No swipe library** | framer-motion drag exists but needs gesture direction detection | Use `PanInfo.offset.x/y` in `onDragEnd` to determine swipe direction. Threshold: `|offset| > 80px`. |
| **Feynman mode needs keyboard focus** | On mobile, textarea auto-focus shows keyboard and shifts card layout | Use `scrollIntoView` + fixed card height in Feynman mode. Card doesn't resize; textarea expands inside fixed bounds. |
| **Fan layout z-index battles** | Cards overlapping incorrectly during drag | Use `useMotionValue` for z-index; dragged card gets `zIndex: 100`, others get their fan position index. |
| **SRS migration data loss** | Old `code-reels-srs` data not migrating correctly | Migration runs on first render, verifies key count before deleting old stores. Old stores deleted only after `oi-srs-migrated` flag set. Keep old stores for 30 days as fallback. |
| **Empty flashcards.json** | We deleted all data — flashcards.json may be empty | Queue falls back to questions-only mode gracefully. Profile shows "0 flashcards" not an error. |
| **Memory Palace image source** | No image CDN, AI generation too expensive | Emoji-only palace scenes (text field, max 60 chars). No image upload in v1. Users build palaces with emoji sequences. |
| **Desktop drag feels wrong** | Mouse drag ≠ touch swipe physics | Apply `dragElastic: 0.1` and `dragMomentum: false` for desktop. Touch gets momentum. Detected via `pointer: coarse` media query. |
| **Card text overflow** | Long questions (200+ chars) overflow card front | Max 3 lines displayed. Truncated with "…" + tap to expand inline (no modal). Expansion uses `layout` animation. |
| **Diagram rendering on card back** | Full Mermaid render is heavy/slow on every card flip | Render diagram lazily — only when back is visible. Wrap in `<Suspense>`. Show "view diagram" button first; inline renders on tap. |
| **Feynman text storage grows unbounded** | localStorage fills up | Keep max 100 Feynman attempts. FIFO eviction. Show count in Profile. |
| **Custom cards lack server sync** | Custom cards in localStorage only — lost on new device | In Profile: "Export my cards" downloads `oi-cards.json`. "Import cards" reads the file. No cloud sync in v1. |
| **Filter strip overflow on mobile** | 53 certs + 8 topics = 61 chips → overflow | Show only 5 most-used chips on mobile. "+" opens full-screen topic picker (replaces `AllChannels` page). |
| **Cert questions mixed with topic questions** | Cert channels have different question structures | `questionToSwipeCard` checks `channel` against cert list and adds a `certId` field. Filter strip groups them separately. |
| **SRS "again" cards re-appear too fast** | Card swiped left appears after only 10 cards — feels repetitive | Minimum re-appearance: after `Math.max(10, queue.length * 0.3)` cards. Configurable in Profile settings. |
| **No undo / swipe back** | Accidental swipe with no recovery | Shake animation after any swipe: "Undo" toast appears for 3s. Tap to undo last rating. One level deep only. |
| **svg-pan-zoom missing** | Vite build error already logged | Install `svg-pan-zoom` properly OR remove `InteractiveDiagram.tsx` entirely (it's on the strip list). Removing is cleaner. |
| **XP/Credits context still imported** | Credits context used in many components | Keep `CreditsContext` but strip its UI. XP still tracked, shown only in Profile streak ring. |
| **TypeScript errors during strip** | Removing pages breaks imports in App.tsx | Delete in phases. Use `// @ts-ignore` as a temporary bridge during Phase 3–4. Clean after Phase 5. |

---

## 13. Milestones

### M1 — Swipe Core (Week 1)
- [ ] `SwipeCard` component with flip animation (framer-motion)
- [ ] `CardFan` component (desktop fan, mobile single)
- [ ] Swipe gesture detection (left/right/up/down)
- [ ] Connect to existing question data (questions from channels.json)
- [ ] SRS rating wired to swipe direction
- [ ] `/study` route live alongside existing routes

**Acceptance**: Can swipe through 10 system-design questions with SRS ratings persisting.

### M2 — Card Modes (Week 1–2)
- [ ] Recall mode (answer hidden until tap)
- [ ] Feynman mode (textarea + compare)
- [ ] Memory Palace mode (mnemonic field shown)
- [ ] Mode indicator badge on card
- [ ] Auto-assign Feynman to `masteryLevel >= 3` cards

**Acceptance**: Feynman attempt is saved to localStorage and visible in Profile.

### M3 — Filter Strip + Organization (Week 2)
- [ ] FilterStrip component (horizontal scrolling chips)
- [ ] Topic chips from channels.json
- [ ] Cert chips from certifications.json
- [ ] Mode toggle: Due / Browse / New
- [ ] Full-screen topic picker (replaces AllChannels)
- [ ] Filter persists across sessions

**Acceptance**: Filtering by AWS SAA shows only cert-relevant cards.

### M4 — Minimal Profile (Week 2)
- [ ] Streak ring + XP bar
- [ ] Mastery per channel (%)
- [ ] Stats row
- [ ] Feynman journal (last 10 attempts)
- [ ] Custom cards list
- [ ] Settings: daily goal, default mode, font size

**Acceptance**: Profile loads with real SRS data.

### M5 — Custom Card Creation (Week 3)
- [ ] `+` button in FilterStrip
- [ ] Card creation bottom sheet / modal
- [ ] Validation (length, verb check, required tag)
- [ ] Custom cards enter the queue immediately
- [ ] Export / Import (Profile > My Cards)

**Acceptance**: Create a card, swipe it, rate it, see mastery in Profile.

### M6 — Desktop Fan (Week 3)
- [ ] Fan positions calculated per breakpoint
- [ ] Click background card → brings to front
- [ ] Scroll wheel cycles fan
- [ ] Keyboard shortcuts (Space, arrows, E)
- [ ] Mouse drag triggers swipe

**Acceptance**: Desktop fan with 4 visible cards, all interactions working.

### M7 — Strip & Clean (Week 4)
- [ ] Delete 35+ pages
- [ ] Kill 30+ routes
- [ ] Replace Sidebar + BottomNav + FaceliftNavbar with minimal header
- [ ] SRS migration from old stores
- [ ] TypeScript clean build (zero errors)
- [ ] Bundle size target: < 400KB gzipped (down from current ~800KB est.)

**Acceptance**: `npm run build` passes. App has 3 routes. No dead imports.

### M8 — Polish (Week 4)
- [ ] Undo toast (3s after swipe)
- [ ] First-run gesture hints (fades after 3 sessions)
- [ ] Empty state (all caught up)
- [ ] Haptic feedback (mobile, `navigator.vibrate`)
- [ ] Reduced motion support (`prefers-reduced-motion`)
- [ ] Dark mode only (eliminate theme toggle)

---

## 14. Non-Goals (v1)

These are explicitly out of scope to keep cognitive load low during development:

- AI-generated Memory Palace scenes
- Cloud sync of custom cards
- Social / leaderboard features
- Push notifications for review reminders
- Audio / voice on cards
- Collaborative decks
- Import from Anki
- Card statistics graphs (beyond mastery %)
- Multiple simultaneous sessions
- Offline PWA (cards are already in localStorage — it mostly works)

---

## 15. Design Tokens (Minimal Palette)

Strip the current glassmorphism overload to a focused set:

```css
/* Surfaces */
--bg-app:        #0a0a0a;   /* near-black background */
--bg-card:       #141414;   /* card surface */
--bg-card-hover: #1c1c1c;   /* card hover */
--border:        #2a2a2a;   /* subtle borders */

/* Text */
--text-primary:  #f5f5f5;
--text-secondary:#a0a0a0;
--text-muted:    #5a5a5a;

/* Swipe feedback */
--swipe-easy:   #22c55e;    /* green — right */
--swipe-again:  #ef4444;    /* red — left */
--swipe-hard:   #f59e0b;    /* amber — up (hard) */
--swipe-skip:   #6366f1;    /* indigo — down (skip) */

/* Channel accent (from channels.json .color field) */
/* Applied as left border on card, not background fill */

/* Typography: single font */
/* Inter (already loaded) — no decorative fonts */
```

**No gradients. No glassmorphism. No shadows > 2px.** Cards float by z-index and scale, not shadows.

---

*Plan authored: 2026-05-19*  
*Status: Ready for M1 implementation*  
*Decision checkpoint after M3: validate with real study session before proceeding to strip phase.*
