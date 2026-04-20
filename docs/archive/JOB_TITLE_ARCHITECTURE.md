# Job Title Personalization - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER EXPERIENCE                              │
└─────────────────────────────────────────────────────────────────────┘

    User visits /personalized-path
              ↓
    ┌─────────────────────┐
    │  Profile Setup      │
    │  - Job Title        │
    │  - Experience Level │
    │  - Target Company   │
    └─────────────────────┘
              ↓
    ┌─────────────────────┐
    │  localStorage       │
    │  (Client-Side)      │
    └─────────────────────┘
              ↓
    ┌─────────────────────────────────────┐
    │  Personalized Learning Path         │
    │  ┌───────────────────────────────┐  │
    │  │ Must-Know Topics (Required)   │  │
    │  │ - JavaScript, React, etc.     │  │
    │  └───────────────────────────────┘  │
    │  ┌───────────────────────────────┐  │
    │  │ Recommended Topics            │  │
    │  │ - TypeScript, Testing, etc.   │  │
    │  └───────────────────────────────┘  │
    │  ┌───────────────────────────────┐  │
    │  │ Certifications (if applicable)│  │
    │  └───────────────────────────────┘  │
    └─────────────────────────────────────┘
              ↓
    User clicks channel → Start practicing


┌─────────────────────────────────────────────────────────────────────┐
│                    CONTENT GENERATION PIPELINE                       │
└─────────────────────────────────────────────────────────────────────┘

    GitHub Actions Workflow (Hourly/Daily)
              ↓
    ┌─────────────────────┐
    │  Question Generator │
    │  (LangGraph)        │
    └─────────────────────┘
              ↓
    ┌─────────────────────────────────────┐
    │  Job Title Relevance Service        │
    │  ┌───────────────────────────────┐  │
    │  │ Analyze Question              │  │
    │  │ - Channel match               │  │
    │  │ - Tag match                   │  │
    │  │ - Keyword match               │  │
    │  └───────────────────────────────┘  │
    │  ┌───────────────────────────────┐  │
    │  │ Calculate Scores (0-100)      │  │
    │  │ - Frontend Engineer: 85       │  │
    │  │ - Backend Engineer: 20        │  │
    │  │ - DevOps Engineer: 10         │  │
    │  │ - ... (8 total)               │  │
    │  └───────────────────────────────┘  │
    │  ┌───────────────────────────────┐  │
    │  │ Determine Experience Levels   │  │
    │  │ - ["entry", "mid"]            │  │
    │  └───────────────────────────────┘  │
    └─────────────────────────────────────┘
              ↓
    ┌─────────────────────┐
    │  Save to Database   │
    │  (Turso SQLite)     │
    │  + jobTitleRelevance│
    │  + experienceLevels │
    └─────────────────────┘
              ↓
    ┌─────────────────────┐
    │  Deploy to GitHub   │
    │  Pages (Static)     │
    └─────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      DATA FLOW DIAGRAM                               │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser    │         │  localStorage│         │  Questions   │
│              │         │              │         │  Database    │
│  User Profile│◄────────│  Profile     │         │              │
│  Setup       │────────►│  Storage     │         │  + Relevance │
│              │         │              │         │  + Exp Level │
└──────────────┘         └──────────────┘         └──────────────┘
       │                                                  ▲
       │                                                  │
       │ Request Learning Path                           │
       ▼                                                  │
┌──────────────┐                                         │
│  Learning    │                                         │
│  Path Logic  │                                         │
│              │                                         │
│  Filter by:  │                                         │
│  - Job Title │                                         │
│  - Exp Level │                                         │
└──────────────┘                                         │
       │                                                  │
       │ Fetch Questions                                 │
       └─────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    RELEVANCE SCORING ALGORITHM                       │
└─────────────────────────────────────────────────────────────────────┘

Input: Question Object
{
  channel: "react",
  subChannel: "hooks",
  question: "Explain useState...",
  answer: "useState is a React hook...",
  difficulty: "intermediate",
  tags: ["react", "hooks", "state"]
}

                    ↓

┌─────────────────────────────────────────────────────────────────┐
│  For Each Job Title (8 total):                                  │
│                                                                  │
│  1. Primary Channel Match (40 points)                           │
│     ✓ "react" in primaryChannels? → +40                         │
│                                                                  │
│  2. Secondary Channel Match (20 points)                         │
│     ✓ "react" in secondaryChannels? → +20                       │
│                                                                  │
│  3. Tag/Sub-channel Match (15 points)                           │
│     ✓ "hooks" or tags in channels? → +15                        │
│                                                                  │
│  4. Keyword Match (25 points max)                               │
│     ✓ Count keywords in question/answer                         │
│     ✓ 5 points per keyword (max 5 keywords)                     │
│                                                                  │
│  Total Score = Sum of above (0-100)                             │
└─────────────────────────────────────────────────────────────────┘

                    ↓

Output: Relevance Scores
{
  "frontend-engineer": 85,    // Primary + keywords
  "fullstack-engineer": 60,   // Secondary + keywords
  "backend-engineer": 20,     // Keywords only
  "devops-engineer": 10,      // Minimal relevance
  "sre": 5,
  "data-engineer": 0,
  "ml-engineer": 0,
  "cloud-architect": 15
}


┌─────────────────────────────────────────────────────────────────────┐
│                    JOB TITLE CONFIGURATIONS                          │
└─────────────────────────────────────────────────────────────────────┘

Frontend Engineer
├── Required: JavaScript, React, HTML/CSS, Frontend, Web Performance
├── Recommended: TypeScript, Testing, Accessibility
├── Certifications: None
└── Experience Levels:
    ├── Entry: Beginner/Intermediate difficulty
    ├── Mid: Intermediate/Advanced difficulty
    └── Senior+: Advanced difficulty

Backend Engineer
├── Required: Node.js, Python, Databases, API Design, System Design
├── Recommended: Microservices, Caching, Message Queues
├── Certifications: None
└── Experience Levels: (same as above)

DevOps Engineer
├── Required: Docker, Kubernetes, CI/CD, Linux, Networking
├── Recommended: Terraform, Ansible, Monitoring
├── Certifications: AWS SA, CKA, Terraform Associate
└── Experience Levels: (same as above)

... (5 more job titles)


┌─────────────────────────────────────────────────────────────────────┐
│                    COMPONENT ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────┘

Client-Side Components:
┌────────────────────────────────────────────────────────────────┐
│  PersonalizedPath.tsx                                           │
│  ├── Profile Setup Wizard                                       │
│  │   ├── Job Title Dropdown                                     │
│  │   ├── Experience Level Buttons                               │
│  │   └── Target Company Input                                   │
│  ├── Learning Path Display                                      │
│  │   ├── Profile Header                                         │
│  │   ├── Required Topics Section                                │
│  │   ├── Recommended Topics Section                             │
│  │   └── Certifications Section                                 │
│  └── Navigation to Channels                                     │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  user-profile-service.ts                                        │
│  ├── getUserProfile()                                           │
│  ├── saveUserProfile()                                          │
│  ├── createUserProfile()                                        │
│  ├── updateUserProfile()                                        │
│  ├── getPersonalizedLearningPath()                             │
│  └── JOB_TITLES (configurations)                               │
└────────────────────────────────────────────────────────────────┘

Server-Side Components:
┌────────────────────────────────────────────────────────────────┐
│  job-title-relevance.js                                         │
│  ├── calculateJobTitleRelevance()                              │
│  ├── determineExperienceLevels()                               │
│  ├── getRelevantJobTitles()                                    │
│  ├── enrichQuestionWithJobTitleData()                          │
│  └── JOB_TITLE_CONFIGS (scoring configs)                       │
└────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────┘

GitHub Repository
       │
       ├── GitHub Actions (Content Pipeline)
       │   ├── Hourly: Quick question generation
       │   ├── Daily: Full pipeline with enrichment
       │   └── On-demand: Manual triggers
       │
       ├── Turso Database (SQLite)
       │   ├── Questions table
       │   ├── + jobTitleRelevance (JSON)
       │   └── + experienceLevelTags (JSON)
       │
       └── GitHub Pages (Static Site)
           ├── React SPA
           ├── Questions data (JSON)
           ├── localStorage (User profiles)
           └── No backend required!


┌─────────────────────────────────────────────────────────────────────┐
│                    USER JOURNEY FLOW                                 │
└─────────────────────────────────────────────────────────────────────┘

First Visit:
1. User lands on site
2. Navigates to "My Learning Path"
3. Sees profile setup wizard
4. Selects: "Frontend Engineer" + "Mid Level"
5. Profile saved to localStorage
6. Sees personalized learning path:
   - Must-Know: JavaScript, React, HTML/CSS, Frontend
   - Recommended: TypeScript, Testing, Accessibility
7. Clicks "React" → Starts practicing React questions
8. Questions filtered by relevance score (>50 for Frontend)

Return Visit:
1. User returns to site
2. Profile loaded from localStorage
3. Navigates to "My Learning Path"
4. Sees same personalized path
5. Progress tracked (future enhancement)
6. Can edit profile to update experience level

Career Progression:
1. User completes Mid-level topics
2. Edits profile: Mid → Senior
3. Learning path updates:
   - Difficulty shifts to Advanced
   - New channels appear (System Design, Architecture)
4. Continues learning at new level


┌─────────────────────────────────────────────────────────────────────┐
│                    SCALABILITY & PERFORMANCE                         │
└─────────────────────────────────────────────────────────────────────┘

Client-Side:
├── Profile Storage: < 1KB in localStorage
├── No API calls needed (static data)
├── Instant page loads
└── Works offline (PWA-ready)

Server-Side (Pipeline):
├── Question Generation: +50ms per question
├── Relevance Calculation: O(1) per job title
├── Backfill: ~100 questions/second
└── No runtime overhead (pre-computed)

Database:
├── New Columns: +2 text fields (~500 bytes each)
├── Total Overhead: ~1KB per question
├── Query Performance: No impact (indexed)
└── Storage: Minimal (JSON text)

Scalability:
├── Add Job Title: Update 2 config files
├── Add Channel: Update job title mappings
├── Add Experience Level: Update level configs
└── No code changes needed for new questions


┌─────────────────────────────────────────────────────────────────────┐
│                    FUTURE ENHANCEMENTS                               │
└─────────────────────────────────────────────────────────────────────┘

Phase 2: Company-Specific Content
┌────────────────────────────────────────────────────────────────┐
│  Target Company: Google                                         │
│  ├── Tech Stack: Go, Kubernetes, Spanner, Bigtable            │
│  ├── Interview Style: Algorithms-heavy, System Design          │
│  └── Custom Questions: Google-specific scenarios               │
└────────────────────────────────────────────────────────────────┘

Phase 3: Progress Tracking
┌────────────────────────────────────────────────────────────────┐
│  Learning Path Progress                                         │
│  ├── JavaScript: ████████░░ 80% (40/50 questions)             │
│  ├── React: ██████░░░░ 60% (30/50 questions)                  │
│  └── Estimated Time: 12 hours remaining                        │
└────────────────────────────────────────────────────────────────┘

Phase 4: Dynamic Difficulty
┌────────────────────────────────────────────────────────────────┐
│  Performance Analysis                                           │
│  ├── Current Level: Mid (80% accuracy)                         │
│  ├── Recommendation: Ready for Senior level!                   │
│  └── Suggested: Update profile to Senior                       │
└────────────────────────────────────────────────────────────────┘

Phase 5: Multi-Role Support
┌────────────────────────────────────────────────────────────────┐
│  Preparing for Multiple Roles                                   │
│  ├── Primary: Frontend Engineer (80% complete)                 │
│  ├── Secondary: Full Stack Engineer (40% complete)             │
│  └── Transition Path: Frontend → Full Stack                    │
└────────────────────────────────────────────────────────────────┘
```

## Key Architectural Decisions

### 1. Client-Side Storage (localStorage)
**Why**: No backend required, works on GitHub Pages, instant access
**Trade-off**: Data not synced across devices (acceptable for MVP)

### 2. Pre-Computed Relevance Scores
**Why**: Fast page loads, no runtime calculation needed
**Trade-off**: Requires backfill for existing questions (one-time cost)

### 3. JSON Text Fields in Database
**Why**: Flexible schema, easy to query, minimal storage overhead
**Trade-off**: Slightly larger than normalized tables (acceptable)

### 4. Static Job Title Configs
**Why**: Simple to maintain, version controlled, no admin UI needed
**Trade-off**: Requires code changes to add job titles (acceptable)

### 5. Experience Level Mapping
**Why**: Aligns difficulty with career progression
**Trade-off**: Assumes linear progression (good enough for most users)

## Security & Privacy

- **No PII**: Only job title and experience level stored
- **No Tracking**: Profile data never leaves user's device
- **No Auth**: No user accounts, no passwords
- **User Control**: Can clear profile anytime
- **Open Source**: All code is transparent and auditable

## Maintenance & Operations

### Regular Tasks
- **Monthly**: Review job title configs for industry changes
- **Quarterly**: Analyze most popular job titles
- **Yearly**: Major update to channel mappings

### Monitoring
- Track profile creation rate
- Monitor most popular job titles
- Measure click-through rates from learning paths
- Gather user feedback on relevance

### Troubleshooting
- Check localStorage is enabled
- Verify database has new columns
- Ensure backfill completed successfully
- Test relevance calculation with test suite

---

This architecture is designed to be:
- **Simple**: Easy to understand and maintain
- **Scalable**: Easy to add new job titles and channels
- **Performant**: No runtime overhead, instant page loads
- **Privacy-Friendly**: No backend, no tracking
- **Cost-Effective**: Runs entirely on GitHub Pages (free)
