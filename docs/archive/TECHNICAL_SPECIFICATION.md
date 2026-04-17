# Interview Buddy AI - Technical Specification Document

**Version:** 1.0
**Last Updated:** 2026-02-05
**Target Implementation:** AI Code Generation (OpenCode/Claude/GPT)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Data Models](#4-data-models)
5. [Core Features Specification](#5-core-features-specification)
6. [Component Architecture](#6-component-architecture)
7. [AI Integration Details](#7-ai-integration-details)
8. [Gamification System](#8-gamification-system)
9. [Voice Integration](#9-voice-integration)
10. [State Management](#10-state-management)
11. [Routing & Navigation](#11-routing--navigation)
12. [UI/UX Specifications](#12-uiux-specifications)
13. [Performance Requirements](#13-performance-requirements)
14. [Security & Privacy](#14-security--privacy)
15. [Testing Strategy](#15-testing-strategy)
16. [Deployment & Build](#16-deployment--build)
17. [Implementation Phases](#17-implementation-phases)
18. [File Structure](#18-file-structure)
19. [Code Examples & Patterns](#19-code-examples--patterns)
20. [Migration from Existing System](#20-migration-from-existing-system)

---

## 1. Executive Summary

### 1.1 Project Overview

**Interview Buddy AI** is a browser-based, AI-powered interview preparation platform that provides conversational learning through local LLM inference. The system runs entirely in the browser using WebLLM (Llama 3.2 3B) and Kokoro TTS for voice synthesis, eliminating the need for backend AI API calls.

### 1.2 Key Objectives

- **Zero-latency AI responses**: All AI processing happens locally in the browser
- **Conversational learning**: Natural dialogue-based interview practice
- **Gamification**: Make interview prep engaging and addictive
- **Offline-first**: Full PWA functionality after initial load
- **Voice-first**: Natural voice conversations with AI interviewer
- **Freemium model**: Free tier with premium features

### 1.3 Target Metrics

- **Time to Interactive**: < 3 seconds (excluding model loading)
- **Model Load Time**: < 15 seconds on 4G connection
- **AI Response Time**: < 2 seconds for text, < 4 seconds for voice
- **Offline Capability**: 100% functional after first load
- **Bundle Size**: < 500KB initial, ~2GB with model cache
- **User Engagement**: 30+ min average session duration

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       BROWSER RUNTIME                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    UI Layer (React 19)                │   │
│  │  - Chat Interface                                     │   │
│  │  - Dashboard                                          │   │
│  │  - Mock Interview UI                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↕                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Application Logic Layer                  │   │
│  │  - Conversation Manager                               │   │
│  │  - Question Selection Engine (RAG)                    │   │
│  │  - Evaluation Engine                                  │   │
│  │  - Gamification Engine                                │   │
│  │  - Progress Tracker                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↕                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 AI Inference Layer                    │   │
│  │  ┌────────────────┐  ┌─────────────────────────┐     │   │
│  │  │ WebLLM Engine  │  │ Answer Evaluator         │     │   │
│  │  │ (Llama 3.2 3B) │  │ (Prompt Engineering)     │     │   │
│  │  └────────────────┘  └─────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↕                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Voice Layer                          │   │
│  │  ┌───────────────┐  ┌─────────────────────────┐      │   │
│  │  │ Kokoro TTS    │  │ Web Speech API (STT)    │      │   │
│  │  └───────────────┘  └─────────────────────────┘      │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↕                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 Data Persistence Layer                │   │
│  │  ┌───────────────┐  ┌─────────────────────────┐      │   │
│  │  │ IndexedDB     │  │ SQLite WASM (Questions) │      │   │
│  │  │ (Dexie.js)    │  │                         │      │   │
│  │  │ - Progress    │  │ - 1000+ questions       │      │   │
│  │  │ - Convs       │  │ - Relationships         │      │   │
│  │  │ - Profile     │  │ - Metadata              │      │   │
│  │  └───────────────┘  └─────────────────────────┘      │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↕                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Service Worker (Offline Support)           │   │
│  │  - Cache AI model (~1.8GB)                            │   │
│  │  - Cache questions DB (~50MB)                         │   │
│  │  - Cache app assets                                   │   │
│  │  - Background sync                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              ↕
              ┌───────────────────────────────┐
              │   Optional Cloud Services     │
              │  (Premium Features Only)      │
              ├───────────────────────────────┤
              │ - Supabase (Auth & Sync)      │
              │ - PostHog (Analytics)         │
              │ - Stripe (Payments)           │
              └───────────────────────────────┘
```

### 2.2 Data Flow Architecture

```
User Input (Voice/Text)
        ↓
[Voice Recognition / Text Input]
        ↓
[Conversation Manager]
        ↓
[WebLLM Answer Evaluation] ←─── [Question DB + Context]
        ↓
[Evaluation Result + Follow-up Decision]
        ↓
┌───────────────┬──────────────┬─────────────┐
│               │              │             │
[Incomplete]  [Complete]  [Excellent]    [Poor]
│               │              │             │
├→ Follow-up   ├→ Next Q     ├→ Bonus XP   ├→ Hint
│   Question    │  + Feedback  │  + Badge    │   Suggestion
│               │              │             │
└───────────────┴──────────────┴─────────────┘
        ↓
[Update Progress & Gamification State]
        ↓
[Save to IndexedDB]
        ↓
[Render UI Update]
```

### 2.3 Component Communication

```
┌─────────────────┐
│   AppContext    │  Global state provider
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┬────────────┐
    │         │          │          │            │
[UserStore] [ConvStore] [GameStore] [ProgressStore] [AIStore]
    │         │          │          │            │
    └────┬────┴──────────┴──────────┴────────────┘
         │
    ┌────┴────────────────────────────────────┐
    │                                         │
[ChatInterface] [Dashboard] [MockInterview]  [Settings]
```

---

## 3. Technology Stack

### 3.1 Core Technologies

```json
{
  "runtime": "Browser (Chrome 120+, Safari 17+, Firefox 120+)",
  "framework": "React 19.0.0",
  "language": "TypeScript 5.4+",
  "bundler": "Vite 7.0.0",
  "packageManager": "pnpm 9.0+"
}
```

### 3.2 Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@mlc-ai/web-llm": "^0.2.46",
    "kokoro-js": "^1.0.0",
    "dexie": "^3.2.7",
    "dexie-react-hooks": "^1.1.7",
    "@tanstack/react-query": "^5.28.0",
    "@tanstack/react-router": "^1.29.0",
    "zustand": "^4.5.2",
    "framer-motion": "^11.0.28",
    "sql.js": "^1.10.3",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "lucide-react": "^0.363.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.2",
    "tailwindcss": "^4.0.0",
    "sonner": "^1.4.41",
    "marked": "^12.0.1",
    "date-fns": "^3.3.1"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.2.1",
    "vite-plugin-pwa": "^0.19.8",
    "typescript": "^5.4.2",
    "vitest": "^1.4.0",
    "@playwright/test": "^1.42.1",
    "eslint": "^8.57.0",
    "prettier": "^3.2.5"
  }
}
```

### 3.3 AI Models

**Primary Model:**
```
Model: Llama-3.2-3B-Instruct-q4f16_1-MLC
Size: ~1.8GB
Quantization: 4-bit
Context Window: 8192 tokens
Performance: ~15 tokens/sec on M1 Mac, ~8 tokens/sec on mobile
```

**Fallback Model (Mobile):**
```
Model: Phi-3-mini-4k-instruct-q4f16_1-MLC
Size: ~800MB
Quantization: 4-bit
Context Window: 4096 tokens
Performance: ~20 tokens/sec on mobile
```

### 3.4 Voice Technologies

**Text-to-Speech:**
```
Primary: Kokoro TTS (Japanese quality, multiple voices)
Fallback: Web Speech API (browser native)
```

**Speech-to-Text:**
```
Primary: Web Speech API (Chrome/Safari)
Fallback: Text input
```

---

## 4. Data Models

### 4.1 IndexedDB Schema (Dexie.js)

```typescript
// src/db/schema.ts

import Dexie, { Table } from 'dexie';

// ============================================================
// User Profile
// ============================================================
export interface UserProfile {
  id: string; // UUID
  username?: string;
  email?: string;

  // Onboarding data
  targetCompanies: string[]; // ["Google", "Meta", "Amazon"]
  targetRole: string; // "Senior Backend Engineer"
  experienceLevel: 'entry' | 'mid' | 'senior' | 'staff' | 'principal';
  interviewDate?: Date;
  weeklyGoalMinutes: number; // Default: 300 (5 hours)

  // Gamification
  xp: number;
  level: number;
  credits: number;
  streak: number;
  lastActiveDate: Date;

  // Preferences
  voiceEnabled: boolean;
  aiVoice: 'professional-female' | 'professional-male' | 'casual-female' | 'casual-male';
  difficulty: 'adaptive' | 'easy' | 'medium' | 'hard';
  theme: 'dark' | 'light' | 'system';

  // Premium
  isPremium: boolean;
  premiumExpiresAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// Conversation History
// ============================================================
export interface Conversation {
  id: string; // UUID
  userId: string; // FK to UserProfile

  // Question context
  questionId: string; // FK to questions table
  questionText: string;
  expectedAnswer: string;
  expectedKeyPoints: string[]; // From question.answer parsing

  // User response
  userAnswer: string; // Full transcript or text
  responseMode: 'voice' | 'text';

  // AI interaction
  aiFollowups: Array<{
    prompt: string;
    userResponse: string;
    timestamp: Date;
  }>;

  // Evaluation
  score: number; // 0-100
  keyPointsCovered: string[];
  keyPointsMissing: string[];

  feedback: {
    strengths: string[];
    improvements: string[];
    overallComment: string;
  };

  // Performance metrics
  timeSpent: number; // seconds
  hintsUsed: number;
  attemptsCount: number;

  // Metadata
  sessionId?: string; // For mock interviews
  timestamp: Date;
}

// ============================================================
// User Progress (Per Question)
// ============================================================
export interface Progress {
  id: string; // questionId (PK)
  userId: string;

  // Performance tracking
  attempts: number;
  bestScore: number;
  averageScore: number;
  lastScore: number;

  // SRS scheduling
  lastAttempt: Date;
  nextReview: Date;
  interval: number; // days
  easeFactor: number; // SM-2 algorithm
  repetitions: number;

  // Status
  status: 'new' | 'learning' | 'reviewing' | 'mastered';
  mastered: boolean;

  // Weak points
  weakKeyPoints: string[];
  needsVoicePractice: boolean;

  // Metadata
  firstSeenAt: Date;
  lastUpdatedAt: Date;
}

// ============================================================
// Daily Stats
// ============================================================
export interface DailyStats {
  id: string; // date string YYYY-MM-DD
  userId: string;
  date: Date;

  // Activity
  questionsAnswered: number;
  questionsCorrect: number;
  questionsSkipped: number;

  // Performance
  averageScore: number;
  totalScore: number;

  // Gamification
  xpEarned: number;
  creditsEarned: number;
  badgesUnlocked: string[];

  // Time
  timeSpent: number; // seconds
  sessionsCount: number;

  // Streak
  streakActive: boolean;
  streakCount: number;
}

// ============================================================
// Achievements
// ============================================================
export interface Achievement {
  id: string; // unique achievement ID
  userId: string;

  // Achievement details
  achievementId: string; // Reference to achievement definition
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

  // Progress
  progress: number; // 0-100
  threshold: number; // Required value
  currentValue: number;

  // Status
  unlocked: boolean;
  unlockedAt?: Date;
  seen: boolean; // User has seen the unlock animation

  // Rewards
  xpReward: number;
  creditsReward: number;
}

// ============================================================
// Mock Interview Sessions
// ============================================================
export interface MockInterviewSession {
  id: string; // UUID
  userId: string;

  // Session config
  type: 'system-design' | 'coding' | 'behavioral' | 'mixed';
  company: string; // "Google", "Meta", etc.
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number; // minutes

  // Questions
  questionIds: string[];
  currentQuestionIndex: number;

  // Results
  overallScore: number;
  breakdown: {
    problemSolving: number;
    communication: number;
    technicalDepth: number;
    systemDesign?: number;
    behavioralSTAR?: number;
  };

  // Conversations (array of conversation IDs)
  conversationIds: string[];

  // Status
  status: 'in-progress' | 'completed' | 'abandoned';
  startedAt: Date;
  completedAt?: Date;

  // Feedback
  detailedFeedback: {
    strengths: string[];
    improvements: string[];
    recommendedNext: string[];
  };
}

// ============================================================
// Daily Quests
// ============================================================
export interface DailyQuest {
  id: string; // date + quest type
  userId: string;
  date: Date;

  // Quest details
  questType: 'daily-easy' | 'daily-medium' | 'daily-hard' | 'daily-boss';
  title: string;
  description: string;

  // Requirements
  requiredQuestions: number;
  requiredScore: number; // average
  timeLimit?: number; // minutes

  // Progress
  questionsCompleted: number;
  currentAverageScore: number;

  // Status
  status: 'available' | 'in-progress' | 'completed' | 'failed' | 'expired';

  // Rewards
  xpReward: number;
  creditsReward: number;

  // Timestamps
  completedAt?: Date;
  expiresAt: Date;
}

// ============================================================
// App Settings
// ============================================================
export interface AppSettings {
  id: string; // 'settings' (singleton)
  userId: string;

  // Model preferences
  preferredModel: 'llama-3.2-3b' | 'phi-3-mini';
  modelLoadStrategy: 'eager' | 'lazy' | 'on-demand';

  // Performance
  enableAnimations: boolean;
  reducedMotion: boolean;
  offlineMode: boolean;

  // Privacy
  allowAnalytics: boolean;
  allowCrashReports: boolean;

  // Notifications
  enableNotifications: boolean;
  streakReminders: boolean;
  questReminders: boolean;

  // AI behavior
  aiPersonality: 'professional' | 'friendly' | 'tough' | 'encouraging';
  followUpQuestions: boolean;
  detailedFeedback: boolean;

  updatedAt: Date;
}

// ============================================================
// Dexie Database Class
// ============================================================
export class InterviewBuddyDB extends Dexie {
  userProfiles!: Table<UserProfile>;
  conversations!: Table<Conversation>;
  progress!: Table<Progress>;
  dailyStats!: Table<DailyStats>;
  achievements!: Table<Achievement>;
  mockInterviewSessions!: Table<MockInterviewSession>;
  dailyQuests!: Table<DailyQuest>;
  appSettings!: Table<AppSettings>;

  constructor() {
    super('InterviewBuddyDB');

    this.version(1).stores({
      userProfiles: 'id, email, lastActiveDate',
      conversations: 'id, userId, questionId, timestamp, sessionId',
      progress: 'id, userId, status, nextReview, mastered',
      dailyStats: 'id, userId, date',
      achievements: 'id, userId, achievementId, unlocked',
      mockInterviewSessions: 'id, userId, status, startedAt',
      dailyQuests: 'id, userId, date, status',
      appSettings: 'id, userId'
    });
  }
}

export const db = new InterviewBuddyDB();
```

### 4.2 Question Database Schema (SQLite)

Keep existing schema from Turso database:

```sql
-- This is READ-ONLY data loaded from existing DB
-- Bundled with app or fetched on first load

CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT,
  diagram TEXT,
  difficulty TEXT CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
  tags JSON, -- Array of strings
  channel TEXT NOT NULL,
  subChannel TEXT,
  sourceUrl TEXT,
  videos JSON, -- {shortVideo, longVideo}
  companies JSON, -- Array of strings
  eli5 TEXT,
  tldr TEXT,
  relevanceScore INTEGER DEFAULT 50,
  relevanceDetails JSON,
  jobTitleRelevance JSON, -- {jobTitle: score}
  experienceLevelTags JSON, -- ['entry', 'mid', 'senior']
  voiceKeywords JSON, -- Array of mandatory keywords
  voiceSuitable INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  isNew INTEGER DEFAULT 0,
  lastUpdated TEXT,
  createdAt TEXT
);

CREATE TABLE questionRelationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sourceQuestionId TEXT,
  targetQuestionId TEXT,
  relationshipType TEXT CHECK(relationshipType IN ('prerequisite', 'follow_up', 'related', 'deeper_dive')),
  strength INTEGER DEFAULT 50,
  createdAt TEXT,
  FOREIGN KEY (sourceQuestionId) REFERENCES questions(id),
  FOREIGN KEY (targetQuestionId) REFERENCES questions(id)
);

CREATE INDEX idx_questions_channel ON questions(channel);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_companies ON questions(companies);
CREATE INDEX idx_questions_voiceSuitable ON questions(voiceSuitable);
CREATE INDEX idx_relationships_source ON questionRelationships(sourceQuestionId);
CREATE INDEX idx_relationships_target ON questionRelationships(targetQuestionId);
```

---

## 5. Core Features Specification

### 5.1 Onboarding Flow

**Screens:**

1. **Welcome Screen**
   - Display: App logo, tagline, "Get Started" button
   - No account required initially
   - Skip to guest mode option

2. **Goal Setting**
   - Input: Target companies (multi-select)
   - Input: Target role (dropdown or text)
   - Input: Experience level (entry/mid/senior/staff)
   - Input: Interview date (optional date picker)
   - Save to `UserProfile` in IndexedDB

3. **Model Download**
   - Show: Download progress for WebLLM model
   - Display: Model size, estimated time
   - Allow: Continue in background
   - Fallback: Smaller model if user on mobile/slow connection

4. **Quick Assessment** (Optional)
   - Ask: 3 quick questions to gauge current level
   - Evaluate: Using WebLLM
   - Personalize: Initial question recommendations

**Implementation:**

```typescript
// src/features/onboarding/OnboardingFlow.tsx

export const OnboardingFlow: React.FC = () => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});

  const steps = [
    <WelcomeScreen onNext={() => setStep(1)} />,
    <GoalSetting onChange={setProfile} onNext={() => setStep(2)} />,
    <ModelDownload onComplete={() => setStep(3)} />,
    <QuickAssessment profile={profile} onComplete={handleComplete} />
  ];

  return (
    <AnimatePresence mode="wait">
      {steps[step]}
    </AnimatePresence>
  );
};
```

### 5.2 Conversational Learning Interface

**Requirements:**

- Chat-style UI with message bubbles
- AI avatar with speaking indicator animation
- Real-time streaming text from WebLLM
- Voice input with waveform visualization
- Text input as fallback
- Hint system (costs credits)
- Skip functionality (costs more credits)
- Real-time evaluation feedback
- Smooth animations between messages

**User Flow:**

```
1. AI asks question
   ↓
2. User responds (voice or text)
   ↓
3. WebLLM evaluates answer
   ↓
4. If incomplete:
   → AI asks follow-up
   → Loop to step 2

5. If complete:
   → Show score & feedback
   → Update progress
   → Offer: next question, review, practice more
```

**Component Structure:**

```typescript
// src/features/chat/ChatInterface.tsx

interface Message {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
  type: 'question' | 'answer' | 'followup' | 'feedback';
  metadata?: {
    score?: number;
    keyPoints?: string[];
    isStreaming?: boolean;
  };
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const { generateResponse, evaluateAnswer } = useWebLLM();
  const { speak } = useKokoroTTS();
  const { startRecording, stopRecording } = useVoiceRecording();
  const { selectNextQuestion } = useQuestionSelector();

  // Initialize conversation
  useEffect(() => {
    initConversation();
  }, []);

  const initConversation = async () => {
    const question = await selectNextQuestion();
    setCurrentQuestion(question);

    const aiMessage: Message = {
      id: generateId(),
      role: 'ai',
      content: question.question,
      timestamp: new Date(),
      type: 'question'
    };

    setMessages([aiMessage]);
    speak(question.question);
  };

  const handleUserSubmit = async (answer: string) => {
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: answer,
      timestamp: new Date(),
      type: 'answer'
    };
    setMessages(prev => [...prev, userMessage]);

    // Evaluate with WebLLM
    setIsAIThinking(true);
    const evaluation = await evaluateAnswer(
      currentQuestion!,
      answer,
      messages // Context of previous follow-ups
    );
    setIsAIThinking(false);

    // Handle evaluation result
    if (evaluation.isComplete) {
      // Show final feedback
      showFeedback(evaluation);
      updateProgress(currentQuestion!.id, evaluation.score);
      offerNextQuestion();
    } else {
      // Ask follow-up
      const followUpMessage: Message = {
        id: generateId(),
        role: 'ai',
        content: evaluation.followUpQuestion,
        timestamp: new Date(),
        type: 'followup',
        metadata: {
          keyPoints: evaluation.coveredKeyPoints
        }
      };
      setMessages(prev => [...prev, followUpMessage]);
      speak(evaluation.followUpQuestion);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <ChatHeader question={currentQuestion} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isAIThinking && <ThinkingIndicator />}
      </div>

      {/* Input */}
      <ChatInput
        value={userInput}
        onChange={setUserInput}
        onSubmit={handleUserSubmit}
        onVoiceStart={() => startRecording()}
        onVoiceEnd={async () => {
          const transcript = await stopRecording();
          handleUserSubmit(transcript);
        }}
        isRecording={isRecording}
      />

      {/* Actions */}
      <div className="p-4 flex gap-2">
        <Button variant="ghost" onClick={handleHint}>
          💡 Hint (-10 credits)
        </Button>
        <Button variant="ghost" onClick={handleSkip}>
          ⏭️ Skip (-50 credits)
        </Button>
      </div>
    </div>
  );
};
```

### 5.3 Question Selection Engine (RAG)

**Algorithm:**

```typescript
// src/features/questions/QuestionSelector.ts

interface SelectionContext {
  userProfile: UserProfile;
  progress: Map<string, Progress>;
  recentQuestions: string[]; // Last 20 question IDs
  sessionType: 'daily' | 'weak-area' | 'mock-interview' | 'review';
  targetCompany?: string;
}

export class QuestionSelector {
  constructor(
    private questionsDB: SQLiteDB,
    private progressDB: IndexedDB
  ) {}

  async selectNextQuestion(context: SelectionContext): Promise<Question> {
    // Step 1: Get candidate questions
    const candidates = await this.getCandidates(context);

    // Step 2: Score each candidate
    const scored = candidates.map(q => ({
      question: q,
      score: this.calculateScore(q, context)
    }));

    // Step 3: Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Step 4: Add randomness to top 10 (avoid predictability)
    const topCandidates = scored.slice(0, 10);
    const selected = this.weightedRandom(topCandidates);

    return selected.question;
  }

  private async getCandidates(context: SelectionContext): Promise<Question[]> {
    const filters: string[] = [];
    const params: any = {};

    // Filter by experience level
    filters.push(`experienceLevelTags LIKE :experienceLevel`);
    params.experienceLevel = `%${context.userProfile.experienceLevel}%`;

    // Filter by target company if specified
    if (context.targetCompany) {
      filters.push(`companies LIKE :company`);
      params.company = `%${context.targetCompany}%`;
    }

    // Exclude recently asked questions
    if (context.recentQuestions.length > 0) {
      filters.push(`id NOT IN (${context.recentQuestions.map(() => '?').join(',')})`);
    }

    // Filter by session type
    if (context.sessionType === 'review') {
      // Get questions due for review
      const dueQuestions = await this.getDueForReview(context.userProfile.id);
      filters.push(`id IN (${dueQuestions.map(() => '?').join(',')})`);
    } else if (context.sessionType === 'weak-area') {
      // Get questions from weak areas
      const weakAreas = await this.getWeakAreas(context.userProfile.id);
      filters.push(`channel IN (${weakAreas.map(() => '?').join(',')})`);
    }

    const query = `
      SELECT * FROM questions
      WHERE ${filters.join(' AND ')}
      AND status = 'active'
      LIMIT 100
    `;

    return this.questionsDB.query(query, params);
  }

  private calculateScore(question: Question, context: SelectionContext): number {
    let score = 0;

    // 1. Job title relevance (0-40 points)
    const jobRelevance = question.jobTitleRelevance?.[context.userProfile.targetRole] || 50;
    score += (jobRelevance / 100) * 40;

    // 2. Interview relevance (0-30 points)
    score += (question.relevanceScore / 100) * 30;

    // 3. Prerequisite readiness (0-20 points)
    const prerequisiteScore = this.checkPrerequisites(question.id, context.progress);
    score += prerequisiteScore * 20;

    // 4. Spaced repetition timing (0-10 points)
    const srsScore = this.calculateSRSScore(question.id, context.progress);
    score += srsScore * 10;

    // 5. Weak area bonus (+10 points)
    if (this.isWeakArea(question, context)) {
      score += 10;
    }

    // 6. Company match bonus (+10 points)
    if (context.targetCompany && question.companies?.includes(context.targetCompany)) {
      score += 10;
    }

    // 7. Diversity penalty (avoid same channel repeatedly)
    const recentChannels = this.getRecentChannels(context.recentQuestions);
    if (recentChannels.filter(c => c === question.channel).length > 2) {
      score -= 15;
    }

    return score;
  }

  private checkPrerequisites(questionId: string, progress: Map<string, Progress>): number {
    const prerequisites = this.getPrerequisites(questionId);
    if (prerequisites.length === 0) return 1.0; // No prerequisites

    const masteredCount = prerequisites.filter(preqId =>
      progress.get(preqId)?.mastered
    ).length;

    return masteredCount / prerequisites.length;
  }

  private calculateSRSScore(questionId: string, progress: Map<string, Progress>): number {
    const prog = progress.get(questionId);
    if (!prog) return 0.5; // New question, medium priority

    const daysSinceReview = daysBetween(new Date(), prog.nextReview);

    if (daysSinceReview >= 0) return 1.0; // Due for review
    if (daysSinceReview >= -1) return 0.8; // Due soon
    if (daysSinceReview >= -3) return 0.5; // Not due yet
    return 0.2; // Recently reviewed
  }

  private weightedRandom(candidates: Array<{question: Question; score: number}>): {question: Question; score: number} {
    const totalScore = candidates.reduce((sum, c) => sum + c.score, 0);
    let random = Math.random() * totalScore;

    for (const candidate of candidates) {
      random -= candidate.score;
      if (random <= 0) return candidate;
    }

    return candidates[0]; // Fallback
  }
}
```

### 5.4 Answer Evaluation Engine

**Prompt Engineering:**

```typescript
// src/features/ai/AnswerEvaluator.ts

export interface EvaluationResult {
  isComplete: boolean;
  score: number; // 0-100
  coveredKeyPoints: string[];
  missingKeyPoints: string[];
  followUpQuestion?: string;
  feedback: {
    strengths: string[];
    improvements: string[];
    overallComment: string;
  };
  detailedBreakdown: {
    technicalAccuracy: number;
    completeness: number;
    clarity: number;
    depth: number;
  };
}

export class AnswerEvaluator {
  constructor(private webLLM: WebLLMEngine) {}

  async evaluateAnswer(
    question: Question,
    userAnswer: string,
    conversationHistory: Array<{prompt: string; response: string}> = []
  ): Promise<EvaluationResult> {

    const prompt = this.buildEvaluationPrompt(question, userAnswer, conversationHistory);
    const rawResponse = await this.webLLM.generate(prompt);
    const parsed = this.parseEvaluationResponse(rawResponse);

    return parsed;
  }

  private buildEvaluationPrompt(
    question: Question,
    userAnswer: string,
    history: Array<{prompt: string; response: string}>
  ): string {
    const keyPoints = this.extractKeyPoints(question.answer);
    const conversationContext = this.formatHistory(history);

    return `You are an expert technical interviewer evaluating a candidate's answer.

QUESTION:
${question.question}

EXPECTED KEY POINTS:
${keyPoints.map((kp, i) => `${i + 1}. ${kp}`).join('\n')}

MODEL ANSWER:
${question.answer}

${conversationContext ? `PREVIOUS CONVERSATION:\n${conversationContext}\n\n` : ''}

CANDIDATE'S ANSWER:
${userAnswer}

EVALUATION CRITERIA:
1. Technical Accuracy: Is the information correct?
2. Completeness: How many key points were covered?
3. Clarity: Is the explanation clear and well-structured?
4. Depth: Does it show deep understanding or just surface level?

RESPOND IN THIS EXACT JSON FORMAT:
{
  "isComplete": boolean,
  "score": number (0-100),
  "coveredKeyPoints": ["point1", "point2"],
  "missingKeyPoints": ["point3", "point4"],
  "followUpQuestion": "string (only if isComplete is false)",
  "feedback": {
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"],
    "overallComment": "string"
  },
  "detailedBreakdown": {
    "technicalAccuracy": number (0-100),
    "completeness": number (0-100),
    "clarity": number (0-100),
    "depth": number (0-100)
  }
}

GUIDELINES:
- If candidate covered <60% of key points, isComplete = false and provide followUpQuestion
- If candidate made technical errors, reduce technicalAccuracy score
- Be encouraging but honest in feedback
- For senior roles, expect deeper explanations
- Follow-up questions should guide toward missing key points without giving away the answer

RESPOND ONLY WITH THE JSON, NO ADDITIONAL TEXT:`;
  }

  private extractKeyPoints(modelAnswer: string): string[] {
    // Parse model answer to extract key points
    // Look for numbered lists, bullet points, or split by sentences

    const points: string[] = [];

    // Try numbered list first
    const numberedMatch = modelAnswer.match(/\d+\.\s+([^\n]+)/g);
    if (numberedMatch && numberedMatch.length >= 3) {
      return numberedMatch.map(m => m.replace(/^\d+\.\s+/, '').trim());
    }

    // Try bullet points
    const bulletMatch = modelAnswer.match(/[-•*]\s+([^\n]+)/g);
    if (bulletMatch && bulletMatch.length >= 3) {
      return bulletMatch.map(m => m.replace(/^[-•*]\s+/, '').trim());
    }

    // Fallback: split by sentences, take first 5
    const sentences = modelAnswer.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 5).map(s => s.trim());
  }

  private formatHistory(history: Array<{prompt: string; response: string}>): string {
    if (history.length === 0) return '';

    return history
      .map(h => `INTERVIEWER: ${h.prompt}\nCANDIDATE: ${h.response}`)
      .join('\n\n');
  }

  private parseEvaluationResponse(rawResponse: string): EvaluationResult {
    try {
      // Extract JSON from response (in case LLM added extra text)
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate structure
      if (typeof parsed.isComplete !== 'boolean') {
        throw new Error('Invalid evaluation format');
      }

      return parsed as EvaluationResult;
    } catch (error) {
      console.error('Failed to parse evaluation:', error);

      // Fallback: basic evaluation
      return {
        isComplete: true,
        score: 50,
        coveredKeyPoints: [],
        missingKeyPoints: [],
        feedback: {
          strengths: ['You provided an answer'],
          improvements: ['Try to be more detailed'],
          overallComment: 'Good effort, but could use more detail.'
        },
        detailedBreakdown: {
          technicalAccuracy: 50,
          completeness: 50,
          clarity: 50,
          depth: 50
        }
      };
    }
  }
}
```

---

## 6. Component Architecture

### 6.1 Component Hierarchy

```
src/
├── App.tsx                          # Root component
├── main.tsx                         # Entry point
│
├── features/                        # Feature-based organization
│   │
│   ├── onboarding/
│   │   ├── OnboardingFlow.tsx
│   │   ├── WelcomeScreen.tsx
│   │   ├── GoalSetting.tsx
│   │   ├── ModelDownload.tsx
│   │   └── QuickAssessment.tsx
│   │
│   ├── chat/
│   │   ├── ChatInterface.tsx        # Main conversation UI
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatHeader.tsx
│   │   ├── ThinkingIndicator.tsx
│   │   ├── FeedbackPanel.tsx
│   │   └── HintSystem.tsx
│   │
│   ├── dashboard/
│   │   ├── Dashboard.tsx            # Main progress dashboard
│   │   ├── StatsOverview.tsx
│   │   ├── SkillBreakdown.tsx
│   │   ├── DailyQuests.tsx
│   │   ├── StreakDisplay.tsx
│   │   └── RecommendedActions.tsx
│   │
│   ├── mock-interview/
│   │   ├── MockInterviewSetup.tsx
│   │   ├── MockInterviewRoom.tsx
│   │   ├── InterviewTimer.tsx
│   │   ├── LiveScorecard.tsx
│   │   └── InterviewReport.tsx
│   │
│   ├── gamification/
│   │   ├── LevelProgress.tsx
│   │   ├── AchievementsList.tsx
│   │   ├── AchievementUnlockModal.tsx
│   │   ├── CreditsDisplay.tsx
│   │   └── BadgeCollection.tsx
│   │
│   ├── voice/
│   │   ├── VoiceRecorder.tsx
│   │   ├── WaveformVisualizer.tsx
│   │   ├── VoiceSettings.tsx
│   │   └── TTSPlayer.tsx
│   │
│   ├── profile/
│   │   ├── ProfilePage.tsx
│   │   ├── SettingsPanel.tsx
│   │   ├── TargetCompanies.tsx
│   │   └── InterviewDateTracker.tsx
│   │
│   └── premium/
│       ├── PremiumUpsell.tsx
│       ├── PaymentFlow.tsx
│       └── PremiumFeatures.tsx
│
├── components/                      # Shared components
│   ├── ui/                          # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── progress.tsx
│   │   ├── avatar.tsx
│   │   ├── card.tsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Navigation.tsx
│   │   ├── BottomNav.tsx
│   │   └── Header.tsx
│   │
│   └── common/
│       ├── Loading.tsx
│       ├── ErrorBoundary.tsx
│       ├── ConfettiEffect.tsx
│       └── ParticleEffect.tsx
│
├── lib/                             # Core libraries
│   ├── ai/
│   │   ├── webllm.ts               # WebLLM wrapper
│   │   ├── answer-evaluator.ts     # Answer evaluation
│   │   ├── prompts.ts              # Prompt templates
│   │   └── model-manager.ts        # Model loading/caching
│   │
│   ├── voice/
│   │   ├── kokoro-tts.ts           # TTS integration
│   │   ├── speech-recognition.ts   # STT integration
│   │   └── audio-utils.ts
│   │
│   ├── questions/
│   │   ├── question-selector.ts    # RAG engine
│   │   ├── question-db.ts          # SQLite wrapper
│   │   └── question-parser.ts
│   │
│   ├── gamification/
│   │   ├── xp-calculator.ts
│   │   ├── level-system.ts
│   │   ├── achievement-engine.ts
│   │   ├── credits-manager.ts
│   │   └── srs-algorithm.ts        # SM-2 implementation
│   │
│   └── utils/
│       ├── db.ts                   # IndexedDB wrapper (Dexie)
│       ├── storage.ts
│       ├── analytics.ts
│       └── date-utils.ts
│
├── hooks/                          # Custom React hooks
│   ├── useWebLLM.ts
│   ├── useVoiceRecording.ts
│   ├── useKokoroTTS.ts
│   ├── useQuestionSelector.ts
│   ├── useProgress.ts
│   ├── useGamification.ts
│   ├── useAchievements.ts
│   ├── useConversation.ts
│   └── useMockInterview.ts
│
├── store/                          # Zustand stores
│   ├── userStore.ts
│   ├── conversationStore.ts
│   ├── gamificationStore.ts
│   ├── progressStore.ts
│   ├── aiStore.ts
│   └── settingsStore.ts
│
├── types/                          # TypeScript definitions
│   ├── database.ts
│   ├── ai.ts
│   ├── gamification.ts
│   ├── question.ts
│   └── user.ts
│
└── styles/
    ├── globals.css
    ├── animations.css
    └── themes.css
```

### 6.2 Key Component Specifications

#### ChatInterface Component

```typescript
// src/features/chat/ChatInterface.tsx

interface ChatInterfaceProps {
  sessionType?: 'daily' | 'weak-area' | 'mock-interview' | 'review';
  targetCompany?: string;
  questionIds?: string[]; // For mock interviews with predefined questions
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  sessionType = 'daily',
  targetCompany,
  questionIds
}) => {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [sessionStartTime] = useState(Date.now());

  // Hooks
  const { selectNextQuestion } = useQuestionSelector();
  const { evaluateAnswer } = useWebLLM();
  const { speak, isSpeaking } = useKokoroTTS();
  const { updateProgress, saveConversation } = useProgress();
  const { awardXP, awardCredits, checkAchievements } = useGamification();
  const userProfile = useUserStore(state => state.profile);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize conversation
  useEffect(() => {
    initConversation();

    return () => {
      // Cleanup: save conversation on unmount
      if (currentQuestion && conversationHistory.length > 0) {
        savePartialConversation();
      }
    };
  }, []);

  const initConversation = async () => {
    try {
      const question = questionIds
        ? await getQuestionById(questionIds[0])
        : await selectNextQuestion({
            userProfile,
            sessionType,
            targetCompany
          });

      setCurrentQuestion(question);

      const aiMessage = createAIMessage(
        getRandomGreeting() + ' ' + question.question,
        'question'
      );

      setMessages([aiMessage]);

      if (userProfile.voiceEnabled) {
        speak(aiMessage.content);
      }
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      // Show error UI
    }
  };

  const handleUserSubmit = async (answer: string, mode: 'voice' | 'text') => {
    if (!currentQuestion) return;

    // Add user message to UI
    const userMessage = createUserMessage(answer);
    setMessages(prev => [...prev, userMessage]);

    // Add to conversation history
    setConversationHistory(prev => [...prev, {
      prompt: messages[messages.length - 1].content,
      response: answer,
      timestamp: new Date()
    }]);

    // Show thinking indicator
    setIsAIThinking(true);

    try {
      // Evaluate with WebLLM
      const evaluation = await evaluateAnswer(
        currentQuestion,
        answer,
        conversationHistory
      );

      setIsAIThinking(false);

      if (evaluation.isComplete) {
        await handleCompleteAnswer(evaluation, answer, mode);
      } else {
        await handleIncompleteAnswer(evaluation);
      }

    } catch (error) {
      console.error('Evaluation failed:', error);
      setIsAIThinking(false);
      showErrorMessage('Something went wrong. Please try again.');
    }
  };

  const handleCompleteAnswer = async (
    evaluation: EvaluationResult,
    answer: string,
    mode: 'voice' | 'text'
  ) => {
    // Show feedback message
    const feedbackMessage = createAIMessage(
      formatFeedback(evaluation),
      'feedback',
      { score: evaluation.score, evaluation }
    );
    setMessages(prev => [...prev, feedbackMessage]);

    if (userProfile.voiceEnabled) {
      speak(evaluation.feedback.overallComment);
    }

    // Calculate time spent
    const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);

    // Save conversation
    await saveConversation({
      questionId: currentQuestion!.id,
      questionText: currentQuestion!.question,
      userAnswer: answer,
      responseMode: mode,
      aiFollowups: conversationHistory,
      score: evaluation.score,
      feedback: evaluation.feedback,
      keyPointsCovered: evaluation.coveredKeyPoints,
      keyPointsMissing: evaluation.missingKeyPoints,
      timeSpent
    });

    // Update progress
    await updateProgress(currentQuestion!.id, {
      score: evaluation.score,
      completed: true,
      timeSpent
    });

    // Award gamification rewards
    const xpEarned = calculateXP(evaluation.score, timeSpent);
    const creditsEarned = calculateCredits(evaluation.score);

    await awardXP(xpEarned);
    await awardCredits(creditsEarned);

    // Check for achievements
    await checkAchievements();

    // Show rewards
    showRewardAnimation(xpEarned, creditsEarned);

    // Offer next action
    showNextActions();
  };

  const handleIncompleteAnswer = async (evaluation: EvaluationResult) => {
    const followUpMessage = createAIMessage(
      evaluation.followUpQuestion!,
      'followup',
      {
        coveredKeyPoints: evaluation.coveredKeyPoints,
        progress: (evaluation.coveredKeyPoints.length /
                  (evaluation.coveredKeyPoints.length + evaluation.missingKeyPoints.length)) * 100
      }
    );

    setMessages(prev => [...prev, followUpMessage]);

    if (userProfile.voiceEnabled) {
      speak(evaluation.followUpQuestion!);
    }
  };

  const handleHint = async () => {
    const profile = useUserStore.getState().profile;

    if (profile.credits < 10) {
      showInsufficientCreditsModal();
      return;
    }

    // Deduct credits
    await awardCredits(-10);

    // Generate hint using WebLLM
    const hint = await generateHint(currentQuestion!, conversationHistory);

    const hintMessage = createAIMessage(
      `💡 Hint: ${hint}`,
      'hint'
    );

    setMessages(prev => [...prev, hintMessage]);
    speak(hint);
  };

  const handleSkip = async () => {
    const profile = useUserStore.getState().profile;

    if (profile.credits < 50) {
      showInsufficientCreditsModal();
      return;
    }

    // Confirm skip
    const confirmed = await showConfirmDialog(
      'Skip this question?',
      'This will cost 50 credits and mark the question as skipped.'
    );

    if (!confirmed) return;

    // Deduct credits
    await awardCredits(-50);

    // Save as skipped
    await updateProgress(currentQuestion!.id, {
      score: 0,
      skipped: true
    });

    // Load next question
    initConversation();
  };

  const showNextActions = () => {
    const actionsMessage: Message = {
      id: generateId(),
      role: 'ai',
      content: 'What would you like to do next?',
      timestamp: new Date(),
      type: 'actions',
      metadata: {
        actions: [
          { label: 'Next Question', action: 'next', icon: '➡️' },
          { label: 'Practice Similar', action: 'similar', icon: '🔄' },
          { label: 'Review Answer', action: 'review', icon: '📖' },
          { label: 'Take a Break', action: 'break', icon: '☕' }
        ]
      }
    };

    setMessages(prev => [...prev, actionsMessage]);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-purple-950 to-black">
      {/* Header */}
      <ChatHeader
        question={currentQuestion}
        sessionType={sessionType}
        onClose={handleClose}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MessageBubble message={msg} />
            </motion.div>
          ))}
        </AnimatePresence>

        {isAIThinking && <ThinkingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-purple-800 bg-black/50 backdrop-blur">
        <ChatInput
          onSubmit={(text) => handleUserSubmit(text, 'text')}
          onVoiceSubmit={(text) => handleUserSubmit(text, 'voice')}
          disabled={isAIThinking || isSpeaking}
          placeholder="Type your answer or hold to speak..."
        />

        {/* Action Buttons */}
        <div className="flex gap-2 px-4 pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHint}
            className="text-purple-400"
          >
            💡 Hint (-10 credits)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-red-400"
          >
            ⏭️ Skip (-50 credits)
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function createAIMessage(content: string, type: Message['type'], metadata?: any): Message {
  return {
    id: generateId(),
    role: 'ai',
    content,
    timestamp: new Date(),
    type,
    metadata
  };
}

function createUserMessage(content: string): Message {
  return {
    id: generateId(),
    role: 'user',
    content,
    timestamp: new Date(),
    type: 'answer'
  };
}

function formatFeedback(evaluation: EvaluationResult): string {
  return `
🎉 Great work! Your score: ${evaluation.score}/100

💪 Strengths:
${evaluation.feedback.strengths.map(s => `• ${s}`).join('\n')}

🎯 Areas to improve:
${evaluation.feedback.improvements.map(i => `• ${i}`).join('\n')}

${evaluation.feedback.overallComment}
  `.trim();
}

function calculateXP(score: number, timeSpent: number): number {
  let xp = Math.floor(score / 2); // Base XP

  // Bonus for perfect score
  if (score === 100) xp += 50;

  // Bonus for speed (if under 5 minutes)
  if (timeSpent < 300) xp += 25;

  return xp;
}

function calculateCredits(score: number): number {
  if (score >= 90) return 50;
  if (score >= 75) return 30;
  if (score >= 60) return 20;
  return 10;
}

function getRandomGreeting(): string {
  const greetings = [
    "Let's get started!",
    "Ready for your next question?",
    "Here's an interesting one for you:",
    "Time to level up!",
    "Let's dive in:"
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}
```

---

## 7. AI Integration Details

### 7.1 WebLLM Setup

```typescript
// src/lib/ai/webllm.ts

import { CreateMLCEngine } from '@mlc-ai/web-llm';
import type { ChatCompletionMessageParam, MLCEngine } from '@mlc-ai/web-llm';

export interface WebLLMConfig {
  modelId: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

export class WebLLMManager {
  private engine: MLCEngine | null = null;
  private isLoading = false;
  private loadProgress = 0;
  private loadCallbacks: Array<(progress: number) => void> = [];

  constructor(private config: WebLLMConfig) {}

  async initialize(onProgress?: (progress: number) => void): Promise<void> {
    if (this.engine) {
      console.log('WebLLM already initialized');
      return;
    }

    if (this.isLoading) {
      console.log('WebLLM is already loading');
      if (onProgress) {
        this.loadCallbacks.push(onProgress);
      }
      return;
    }

    this.isLoading = true;

    if (onProgress) {
      this.loadCallbacks.push(onProgress);
    }

    try {
      console.log('Initializing WebLLM with model:', this.config.modelId);

      this.engine = await CreateMLCEngine(this.config.modelId, {
        initProgressCallback: (progress) => {
          this.loadProgress = progress.progress * 100;
          console.log(`Loading model: ${this.loadProgress.toFixed(1)}%`);

          // Notify all callbacks
          this.loadCallbacks.forEach(cb => cb(this.loadProgress));
        }
      });

      console.log('WebLLM initialized successfully');
      this.isLoading = false;
      this.loadCallbacks = [];

    } catch (error) {
      console.error('Failed to initialize WebLLM:', error);
      this.isLoading = false;
      this.loadCallbacks = [];
      throw error;
    }
  }

  async generate(
    messages: ChatCompletionMessageParam[],
    options?: Partial<WebLLMConfig>
  ): Promise<string> {
    if (!this.engine) {
      throw new Error('WebLLM not initialized. Call initialize() first.');
    }

    try {
      const response = await this.engine.chat.completions.create({
        messages,
        temperature: options?.temperature ?? this.config.temperature,
        max_tokens: options?.maxTokens ?? this.config.maxTokens,
        top_p: options?.topP ?? this.config.topP,
        stream: false
      });

      return response.choices[0].message.content || '';

    } catch (error) {
      console.error('WebLLM generation failed:', error);
      throw error;
    }
  }

  async generateStream(
    messages: ChatCompletionMessageParam[],
    onChunk: (chunk: string) => void,
    options?: Partial<WebLLMConfig>
  ): Promise<void> {
    if (!this.engine) {
      throw new Error('WebLLM not initialized. Call initialize() first.');
    }

    try {
      const response = await this.engine.chat.completions.create({
        messages,
        temperature: options?.temperature ?? this.config.temperature,
        max_tokens: options?.maxTokens ?? this.config.maxTokens,
        top_p: options?.topP ?? this.config.topP,
        stream: true
      });

      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          onChunk(content);
        }
      }

    } catch (error) {
      console.error('WebLLM streaming failed:', error);
      throw error;
    }
  }

  async resetChat(): Promise<void> {
    if (this.engine) {
      await this.engine.resetChat();
    }
  }

  isReady(): boolean {
    return this.engine !== null && !this.isLoading;
  }

  getLoadProgress(): number {
    return this.loadProgress;
  }
}

// Singleton instance
let webLLMInstance: WebLLMManager | null = null;

export function getWebLLM(): WebLLMManager {
  if (!webLLMInstance) {
    // Detect device capability and choose model
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const modelId = isMobile
      ? 'Phi-3-mini-4k-instruct-q4f16_1-MLC'
      : 'Llama-3.2-3B-Instruct-q4f16_1-MLC';

    webLLMInstance = new WebLLMManager({
      modelId,
      temperature: 0.7,
      maxTokens: 1024,
      topP: 0.9
    });
  }

  return webLLMInstance;
}
```

### 7.2 Custom Hook for WebLLM

```typescript
// src/hooks/useWebLLM.ts

import { useState, useEffect, useCallback } from 'react';
import { getWebLLM } from '@/lib/ai/webllm';
import { AnswerEvaluator, type EvaluationResult } from '@/lib/ai/answer-evaluator';
import type { Question } from '@/types/question';

export function useWebLLM() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const webLLM = getWebLLM();
  const evaluator = new AnswerEvaluator(webLLM);

  useEffect(() => {
    // Auto-initialize on mount
    if (!webLLM.isReady() && !isInitializing) {
      initializeModel();
    }
  }, []);

  const initializeModel = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    try {
      await webLLM.initialize((progress) => {
        setLoadProgress(progress);
      });

      setIsReady(true);
    } catch (err) {
      console.error('Failed to initialize model:', err);
      setError(err instanceof Error ? err.message : 'Failed to load AI model');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const evaluateAnswer = useCallback(async (
    question: Question,
    userAnswer: string,
    conversationHistory: Array<{prompt: string; response: string}> = []
  ): Promise<EvaluationResult> => {
    if (!isReady) {
      throw new Error('Model not ready');
    }

    return evaluator.evaluateAnswer(question, userAnswer, conversationHistory);
  }, [isReady]);

  const generateFollowUp = useCallback(async (
    question: Question,
    userAnswer: string,
    missingPoints: string[]
  ): Promise<string> => {
    if (!isReady) {
      throw new Error('Model not ready');
    }

    return evaluator.generateFollowUp(question, userAnswer, missingPoints);
  }, [isReady]);

  const generateHint = useCallback(async (
    question: Question,
    conversationHistory: Array<{prompt: string; response: string}>
  ): Promise<string> => {
    if (!isReady) {
      throw new Error('Model not ready');
    }

    const messages = [
      {
        role: 'system' as const,
        content: 'You are a helpful interview coach. Provide hints without giving away the full answer.'
      },
      {
        role: 'user' as const,
        content: `Question: ${question.question}\n\nProvide a helpful hint (max 2 sentences) that guides without revealing the answer.`
      }
    ];

    return webLLM.generate(messages);
  }, [isReady]);

  return {
    isInitializing,
    isReady,
    loadProgress,
    error,
    initializeModel,
    evaluateAnswer,
    generateFollowUp,
    generateHint
  };
}
```

---

## 8. Gamification System

### 8.1 XP & Leveling

```typescript
// src/lib/gamification/level-system.ts

export interface LevelConfig {
  level: number;
  requiredXP: number;
  title: string;
  badge: string;
  rewards: {
    credits: number;
    unlockedFeatures?: string[];
  };
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  { level: 1, requiredXP: 0, title: 'Novice', badge: '🌱', rewards: { credits: 100 } },
  { level: 2, requiredXP: 100, title: 'Learner', badge: '📚', rewards: { credits: 150 } },
  { level: 3, requiredXP: 250, title: 'Student', badge: '🎓', rewards: { credits: 200 } },
  { level: 4, requiredXP: 500, title: 'Practitioner', badge: '🔧', rewards: { credits: 250 } },
  { level: 5, requiredXP: 850, title: 'Intermediate', badge: '⚡', rewards: { credits: 300, unlockedFeatures: ['mock-interview'] } },
  { level: 6, requiredXP: 1300, title: 'Advanced', badge: '🚀', rewards: { credits: 400 } },
  { level: 7, requiredXP: 1850, title: 'Expert', badge: '💎', rewards: { credits: 500 } },
  { level: 8, requiredXP: 2500, title: 'Master', badge: '👑', rewards: { credits: 750 } },
  { level: 9, requiredXP: 3300, title: 'Guru', badge: '🧙', rewards: { credits: 1000 } },
  { level: 10, requiredXP: 4300, title: 'Interview Master', badge: '🏆', rewards: { credits: 1500 } }
];

export class LevelSystem {
  static getLevelFromXP(xp: number): number {
    for (let i = LEVEL_CONFIGS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_CONFIGS[i].requiredXP) {
        return LEVEL_CONFIGS[i].level;
      }
    }
    return 1;
  }

  static getProgressToNextLevel(xp: number): {
    currentLevel: number;
    nextLevel: number;
    currentXP: number;
    requiredXP: number;
    progress: number;
  } {
    const currentLevel = this.getLevelFromXP(xp);
    const currentLevelConfig = LEVEL_CONFIGS[currentLevel - 1];
    const nextLevelConfig = LEVEL_CONFIGS[currentLevel];

    if (!nextLevelConfig) {
      // Max level
      return {
        currentLevel,
        nextLevel: currentLevel,
        currentXP: xp,
        requiredXP: currentLevelConfig.requiredXP,
        progress: 100
      };
    }

    const currentXP = xp - currentLevelConfig.requiredXP;
    const requiredXP = nextLevelConfig.requiredXP - currentLevelConfig.requiredXP;
    const progress = (currentXP / requiredXP) * 100;

    return {
      currentLevel,
      nextLevel: nextLevelConfig.level,
      currentXP,
      requiredXP,
      progress: Math.min(progress, 100)
    };
  }

  static calculateXPReward(score: number, timeSpent: number, difficulty: string): number {
    let baseXP = Math.floor(score / 2); // 0-50 XP based on score

    // Difficulty multiplier
    const difficultyMultiplier = {
      'beginner': 1.0,
      'intermediate': 1.5,
      'advanced': 2.0
    }[difficulty] || 1.0;

    baseXP = Math.floor(baseXP * difficultyMultiplier);

    // Perfect score bonus
    if (score === 100) {
      baseXP += 50;
    }

    // Speed bonus (if completed in under 5 minutes)
    if (timeSpent < 300) {
      baseXP += 25;
    }

    // First attempt bonus
    // (would need to check if first attempt from progress data)

    return baseXP;
  }
}
```

### 8.2 Achievement System

```typescript
// src/lib/gamification/achievement-engine.ts

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  type: 'progress' | 'streak' | 'performance' | 'milestone' | 'social';
  condition: (stats: UserStats) => boolean;
  threshold: number;
  getCurrentValue: (stats: UserStats) => number;
  rewards: {
    xp: number;
    credits: number;
  };
  hidden?: boolean; // Secret achievement
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Progress achievements
  {
    id: 'first-question',
    name: 'First Steps',
    description: 'Answer your first question',
    icon: '🎯',
    tier: 'bronze',
    type: 'progress',
    threshold: 1,
    getCurrentValue: (stats) => stats.totalQuestionsAnswered,
    condition: (stats) => stats.totalQuestionsAnswered >= 1,
    rewards: { xp: 50, credits: 25 }
  },
  {
    id: '10-questions',
    name: 'Getting Started',
    description: 'Answer 10 questions',
    icon: '📝',
    tier: 'bronze',
    type: 'progress',
    threshold: 10,
    getCurrentValue: (stats) => stats.totalQuestionsAnswered,
    condition: (stats) => stats.totalQuestionsAnswered >= 10,
    rewards: { xp: 100, credits: 50 }
  },
  {
    id: '50-questions',
    name: 'Dedicated Learner',
    description: 'Answer 50 questions',
    icon: '📚',
    tier: 'silver',
    type: 'progress',
    threshold: 50,
    getCurrentValue: (stats) => stats.totalQuestionsAnswered,
    condition: (stats) => stats.totalQuestionsAnswered >= 50,
    rewards: { xp: 250, credits: 100 }
  },

  // Streak achievements
  {
    id: 'streak-3',
    name: 'Momentum Builder',
    description: '3 day streak',
    icon: '🔥',
    tier: 'bronze',
    type: 'streak',
    threshold: 3,
    getCurrentValue: (stats) => stats.currentStreak,
    condition: (stats) => stats.currentStreak >= 3,
    rewards: { xp: 100, credits: 50 }
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: '7 day streak',
    icon: '🔥🔥',
    tier: 'silver',
    type: 'streak',
    threshold: 7,
    getCurrentValue: (stats) => stats.currentStreak,
    condition: (stats) => stats.currentStreak >= 7,
    rewards: { xp: 300, credits: 150 }
  },
  {
    id: 'streak-30',
    name: 'Unstoppable',
    description: '30 day streak',
    icon: '🔥🔥🔥',
    tier: 'gold',
    type: 'streak',
    threshold: 30,
    getCurrentValue: (stats) => stats.currentStreak,
    condition: (stats) => stats.currentStreak >= 30,
    rewards: { xp: 1000, credits: 500 }
  },

  // Performance achievements
  {
    id: 'perfect-score',
    name: 'Perfectionist',
    description: 'Score 100% on a question',
    icon: '💯',
    tier: 'bronze',
    type: 'performance',
    threshold: 1,
    getCurrentValue: (stats) => stats.perfectScores,
    condition: (stats) => stats.perfectScores >= 1,
    rewards: { xp: 100, credits: 50 }
  },
  {
    id: 'perfect-streak-5',
    name: 'On Fire',
    description: '5 perfect scores in a row',
    icon: '🌟',
    tier: 'gold',
    type: 'performance',
    threshold: 5,
    getCurrentValue: (stats) => stats.currentPerfectStreak,
    condition: (stats) => stats.currentPerfectStreak >= 5,
    rewards: { xp: 500, credits: 250 }
  },

  // Voice achievements
  {
    id: 'voice-first',
    name: 'Finding Your Voice',
    description: 'Answer using voice for the first time',
    icon: '🎤',
    tier: 'bronze',
    type: 'milestone',
    threshold: 1,
    getCurrentValue: (stats) => stats.voiceAnswers,
    condition: (stats) => stats.voiceAnswers >= 1,
    rewards: { xp: 75, credits: 50 }
  },
  {
    id: 'voice-50',
    name: 'Voice Master',
    description: 'Answer 50 questions using voice',
    icon: '🎙️',
    tier: 'silver',
    type: 'progress',
    threshold: 50,
    getCurrentValue: (stats) => stats.voiceAnswers,
    condition: (stats) => stats.voiceAnswers >= 50,
    rewards: { xp: 300, credits: 150 }
  },

  // Mock interview achievements
  {
    id: 'first-mock',
    name: 'Breaking the Ice',
    description: 'Complete your first mock interview',
    icon: '🎭',
    tier: 'bronze',
    type: 'milestone',
    threshold: 1,
    getCurrentValue: (stats) => stats.mockInterviewsCompleted,
    condition: (stats) => stats.mockInterviewsCompleted >= 1,
    rewards: { xp: 200, credits: 100 }
  },
  {
    id: 'mock-pass',
    name: 'Interview Ready',
    description: 'Pass a mock interview with 75%+',
    icon: '✅',
    tier: 'silver',
    type: 'performance',
    threshold: 75,
    getCurrentValue: (stats) => stats.bestMockScore,
    condition: (stats) => stats.bestMockScore >= 75,
    rewards: { xp: 500, credits: 250 }
  },

  // Hidden/secret achievements
  {
    id: 'midnight-learner',
    name: 'Night Owl',
    description: 'Answer a question after midnight',
    icon: '🦉',
    tier: 'bronze',
    type: 'milestone',
    threshold: 1,
    getCurrentValue: (stats) => stats.midnightAnswers,
    condition: (stats) => stats.midnightAnswers >= 1,
    rewards: { xp: 50, credits: 25 },
    hidden: true
  }
];

export class AchievementEngine {
  static checkAchievements(stats: UserStats, unlockedAchievements: Set<string>): string[] {
    const newlyUnlocked: string[] = [];

    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      // Skip if already unlocked
      if (unlockedAchievements.has(achievement.id)) {
        continue;
      }

      // Check condition
      if (achievement.condition(stats)) {
        newlyUnlocked.push(achievement.id);
      }
    }

    return newlyUnlocked;
  }

  static getAchievementProgress(achievementId: string, stats: UserStats): number {
    const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === achievementId);
    if (!achievement) return 0;

    const currentValue = achievement.getCurrentValue(stats);
    return Math.min((currentValue / achievement.threshold) * 100, 100);
  }
}

export interface UserStats {
  totalQuestionsAnswered: number;
  currentStreak: number;
  perfectScores: number;
  currentPerfectStreak: number;
  voiceAnswers: number;
  mockInterviewsCompleted: number;
  bestMockScore: number;
  midnightAnswers: number;
  // Add more as needed
}
```

---

## 9. Voice Integration

### 9.1 Kokoro TTS Integration

```typescript
// src/lib/voice/kokoro-tts.ts

import Kokoro from 'kokoro-js';

export interface TTSConfig {
  voice: 'af' | 'af_bella' | 'af_sarah' | 'am_adam' | 'am_michael';
  speed: number; // 0.5 - 2.0
  lang: 'en-us' | 'en-gb';
}

export class KokoroTTSManager {
  private kokoro: any = null;
  private audioContext: AudioContext | null = null;
  private currentAudio: AudioBufferSourceNode | null = null;
  private isSpeaking = false;

  constructor(private config: TTSConfig) {}

  async initialize(): Promise<void> {
    if (this.kokoro) return;

    try {
      this.kokoro = new Kokoro();
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Kokoro TTS initialized');
    } catch (error) {
      console.error('Failed to initialize Kokoro TTS:', error);
      throw error;
    }
  }

  async speak(text: string, config?: Partial<TTSConfig>): Promise<void> {
    if (!this.kokoro || !this.audioContext) {
      await this.initialize();
    }

    // Stop any currently playing audio
    this.stop();

    this.isSpeaking = true;

    try {
      const voice = config?.voice || this.config.voice;
      const speed = config?.speed || this.config.speed;

      // Generate audio
      const audioData = await this.kokoro.generate(text, {
        voice,
        speed,
        lang: config?.lang || this.config.lang
      });

      // Play audio
      await this.playAudio(audioData);

    } catch (error) {
      console.error('TTS generation failed:', error);
      throw error;
    } finally {
      this.isSpeaking = false;
    }
  }

  private async playAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) return;

    return new Promise((resolve, reject) => {
      this.audioContext!.decodeAudioData(
        audioData,
        (buffer) => {
          const source = this.audioContext!.createBufferSource();
          source.buffer = buffer;
          source.connect(this.audioContext!.destination);

          source.onended = () => {
            this.currentAudio = null;
            resolve();
          };

          source.start(0);
          this.currentAudio = source;
        },
        (error) => {
          console.error('Failed to decode audio:', error);
          reject(error);
        }
      );
    });
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.stop();
      this.currentAudio = null;
      this.isSpeaking = false;
    }
  }

  pause(): void {
    if (this.audioContext) {
      this.audioContext.suspend();
    }
  }

  resume(): void {
    if (this.audioContext) {
      this.audioContext.resume();
    }
  }

  isPlaying(): boolean {
    return this.isSpeaking;
  }
}
```

### 9.2 Speech Recognition (Web Speech API)

```typescript
// src/lib/voice/speech-recognition.ts

export interface SpeechRecognitionConfig {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export class SpeechRecognitionManager {
  private recognition: any = null;
  private isListening = false;
  private transcript = '';

  constructor(private config: SpeechRecognitionConfig) {
    this.initializeRecognition();
  }

  private initializeRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition ||
                             (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.config.lang;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
  }

  async start(
    onInterim?: (text: string) => void,
    onFinal?: (text: string) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    if (this.isListening) {
      console.warn('Already listening');
      return;
    }

    this.transcript = '';
    this.isListening = true;

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript && onInterim) {
        onInterim(interimTranscript);
      }

      if (finalTranscript) {
        this.transcript += finalTranscript;
        if (onFinal) {
          onFinal(this.transcript.trim());
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;

      if (onError) {
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
    } catch (error) {
      this.isListening = false;
      throw error;
    }
  }

  stop(): string {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }

    return this.transcript.trim();
  }

  abort(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
      this.isListening = false;
      this.transcript = '';
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  getTranscript(): string {
    return this.transcript.trim();
  }
}
```

### 9.3 Voice Recording Hook

```typescript
// src/hooks/useVoiceRecording.ts

import { useState, useRef, useCallback } from 'react';
import { SpeechRecognitionManager } from '@/lib/voice/speech-recognition';

export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionManager | null>(null);

  // Initialize on first use
  const getRecognition = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognitionManager({
        lang: 'en-US',
        continuous: true,
        interimResults: true,
        maxAlternatives: 1
      });
    }
    return recognitionRef.current;
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');

    try {
      const recognition = getRecognition();

      await recognition.start(
        // onInterim
        (interim) => {
          setInterimTranscript(interim);
        },
        // onFinal
        (final) => {
          setTranscript(final);
          setInterimTranscript('');
        },
        // onError
        (err) => {
          setError(err);
          setIsRecording(false);
        }
      );

      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setIsRecording(false);
    }
  }, [getRecognition]);

  const stopRecording = useCallback((): string => {
    if (recognitionRef.current) {
      const finalTranscript = recognitionRef.current.stop();
      setTranscript(finalTranscript);
      setInterimTranscript('');
      setIsRecording(false);
      return finalTranscript;
    }
    return '';
  }, []);

  const abortRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      setTranscript('');
      setInterimTranscript('');
      setIsRecording(false);
    }
  }, []);

  return {
    isRecording,
    transcript,
    interimTranscript,
    error,
    startRecording,
    stopRecording,
    abortRecording
  };
}
```

---

## 10. State Management

### 10.1 Zustand Stores

```typescript
// src/store/userStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile } from '@/types/database';
import { db } from '@/lib/utils/db';

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  awardXP: (amount: number) => Promise<void>;
  awardCredits: (amount: number) => Promise<void>;
  updateStreak: () => Promise<void>;
  setTargetCompanies: (companies: string[]) => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: false,
      error: null,

      loadProfile: async () => {
        set({ isLoading: true, error: null });

        try {
          const profiles = await db.userProfiles.toArray();

          if (profiles.length === 0) {
            // Create default profile
            const newProfile: UserProfile = {
              id: crypto.randomUUID(),
              targetCompanies: [],
              targetRole: '',
              experienceLevel: 'mid',
              weeklyGoalMinutes: 300,
              xp: 0,
              level: 1,
              credits: 100, // Starting credits
              streak: 0,
              lastActiveDate: new Date(),
              voiceEnabled: true,
              aiVoice: 'professional-female',
              difficulty: 'adaptive',
              theme: 'dark',
              isPremium: false,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            await db.userProfiles.add(newProfile);
            set({ profile: newProfile, isLoading: false });
          } else {
            set({ profile: profiles[0], isLoading: false });
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
          set({ error: 'Failed to load profile', isLoading: false });
        }
      },

      updateProfile: async (updates) => {
        const { profile } = get();
        if (!profile) return;

        const updatedProfile = {
          ...profile,
          ...updates,
          updatedAt: new Date()
        };

        await db.userProfiles.update(profile.id, updatedProfile);
        set({ profile: updatedProfile });
      },

      awardXP: async (amount) => {
        const { profile } = get();
        if (!profile) return;

        const newXP = profile.xp + amount;
        const newLevel = LevelSystem.getLevelFromXP(newXP);

        // Check if leveled up
        const leveledUp = newLevel > profile.level;

        await get().updateProfile({
          xp: newXP,
          level: newLevel
        });

        // Award level-up rewards
        if (leveledUp) {
          const levelConfig = LEVEL_CONFIGS.find(l => l.level === newLevel);
          if (levelConfig) {
            await get().awardCredits(levelConfig.rewards.credits);
            // Show level-up animation
            // Unlock features if any
          }
        }
      },

      awardCredits: async (amount) => {
        const { profile } = get();
        if (!profile) return;

        const newCredits = Math.max(0, profile.credits + amount);
        await get().updateProfile({ credits: newCredits });
      },

      updateStreak: async () => {
        const { profile } = get();
        if (!profile) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastActive = new Date(profile.lastActiveDate);
        lastActive.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

        let newStreak = profile.streak;

        if (daysDiff === 0) {
          // Same day, no change
        } else if (daysDiff === 1) {
          // Consecutive day, increment streak
          newStreak += 1;
        } else {
          // Streak broken
          newStreak = 1;
        }

        await get().updateProfile({
          streak: newStreak,
          lastActiveDate: new Date()
        });
      },

      setTargetCompanies: async (companies) => {
        await get().updateProfile({ targetCompanies: companies });
      }
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
```

---

**(This document continues with sections 11-20 covering Routing, UI Specifications, Performance, Security, Testing, Deployment, Implementation Phases, File Structure, Code Examples, and Migration. Due to length constraints, I'll provide these in a follow-up or you can request specific sections.)**

---

## Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Set up project with Vite + React 19 + TypeScript
- [ ] Configure Tailwind CSS 4 + shadcn/ui
- [ ] Set up IndexedDB with Dexie
- [ ] Integrate WebLLM with progress callbacks
- [ ] Create basic chat interface
- [ ] Implement onboarding flow
- [ ] Build question selection algorithm

### Phase 2: Core Features (Week 3-4)
- [ ] Implement answer evaluation with WebLLM
- [ ] Add voice recording (Web Speech API)
- [ ] Integrate Kokoro TTS
- [ ] Build gamification system (XP, levels, credits)
- [ ] Create dashboard with progress tracking
- [ ] Implement daily quests

### Phase 3: Advanced Features (Week 5-6)
- [ ] Build mock interview mode
- [ ] Add achievement system
- [ ] Implement SRS algorithm
- [ ] Create detailed analytics
- [ ] Add premium features
- [ ] Integrate payment system (Stripe)

### Phase 4: Polish & Launch (Week 7-8)
- [ ] Optimize performance
- [ ] Add PWA support (offline mode)
- [ ] Implement service worker
- [ ] Add analytics (PostHog)
- [ ] User testing
- [ ] Bug fixes
- [ ] Deploy to production

---

---

## 11. Routing & Navigation

### 11.1 Route Structure

```typescript
// src/routes.tsx

import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Lazy load pages
const OnboardingFlow = lazy(() => import('@/features/onboarding/OnboardingFlow'));
const Dashboard = lazy(() => import('@/features/dashboard/Dashboard'));
const ChatInterface = lazy(() => import('@/features/chat/ChatInterface'));
const MockInterviewSetup = lazy(() => import('@/features/mock-interview/MockInterviewSetup'));
const MockInterviewRoom = lazy(() => import('@/features/mock-interview/MockInterviewRoom'));
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'));
const BadgesPage = lazy(() => import('@/features/gamification/BadgesPage'));
const PremiumPage = lazy(() => import('@/features/premium/PremiumPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'onboarding',
        element: <OnboardingFlow />
      },
      {
        path: 'learn',
        element: <ChatInterface sessionType="daily" />
      },
      {
        path: 'learn/weak-areas',
        element: <ChatInterface sessionType="weak-area" />
      },
      {
        path: 'learn/review',
        element: <ChatInterface sessionType="review" />
      },
      {
        path: 'mock-interview',
        children: [
          {
            index: true,
            element: <MockInterviewSetup />
          },
          {
            path: ':sessionId',
            element: <MockInterviewRoom />
          }
        ]
      },
      {
        path: 'profile',
        element: <ProfilePage />
      },
      {
        path: 'achievements',
        element: <BadgesPage />
      },
      {
        path: 'premium',
        element: <PremiumPage />
      }
    ]
  }
]);
```

### 11.2 Navigation Component

```typescript
// src/components/layout/BottomNav.tsx

import { Home, MessageSquare, Trophy, Target, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: MessageSquare, label: 'Learn', path: '/learn' },
    { icon: Target, label: 'Mock', path: '/mock-interview' },
    { icon: Trophy, label: 'Badges', path: '/achievements' },
    { icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-purple-800 z-50">
      <div className="flex items-center justify-around h-16 max-w-screen-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-colors",
                isActive ? "text-purple-400" : "text-gray-400 hover:text-purple-300"
              )}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
```

---

## 12. UI/UX Specifications

### 12.1 Design System

**Color Palette:**

```css
/* tailwind.config.ts */

const colors = {
  // Primary (Purple/Blue gradient)
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065'
  },

  // Accent (Cyan for success/positive)
  accent: {
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2'
  },

  // Gamification colors
  xp: '#fbbf24',      // Amber for XP
  credits: '#a78bfa',  // Purple for credits
  level: '#10b981',    // Green for level up
  streak: '#ef4444',   // Red/orange for streak fire

  // Difficulty colors
  beginner: '#10b981',
  intermediate: '#f59e0b',
  advanced: '#ef4444'
};
```

**Typography:**

```css
/* Font families */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Font sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

**Spacing:**

```css
/* Use Tailwind's default 4px base scale */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
```

**Animations:**

```css
/* src/styles/animations.css */

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5); }
  50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.8); }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

@keyframes level-up {
  0% { transform: scale(0.5) rotate(0deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
  100% { transform: scale(1) rotate(360deg); opacity: 1; }
}

.float { animation: float 3s ease-in-out infinite; }
.pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
.shimmer { animation: shimmer 2s linear infinite; }
```

### 12.2 Component Styling Guidelines

**Message Bubbles:**

```typescript
// AI Message (left-aligned)
<div className="flex items-start gap-3 max-w-[85%]">
  <Avatar className="w-10 h-10">
    <AvatarImage src="/ai-avatar.png" />
  </Avatar>
  <div className="bg-purple-900/50 backdrop-blur rounded-2xl rounded-tl-none p-4 border border-purple-700">
    <p className="text-gray-100">{message.content}</p>
  </div>
</div>

// User Message (right-aligned)
<div className="flex items-start gap-3 max-w-[85%] ml-auto">
  <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl rounded-tr-none p-4">
    <p className="text-white">{message.content}</p>
  </div>
</div>
```

**Progress Bars:**

```typescript
<div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden">
  <motion.div
    className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-blue-500"
    initial={{ width: 0 }}
    animate={{ width: `${progress}%` }}
    transition={{ duration: 0.5, ease: "easeOut" }}
  />
  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent shimmer" />
</div>
```

**Buttons:**

```typescript
// Primary button
<Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all">
  Start Learning
</Button>

// Secondary button
<Button variant="outline" className="border-purple-600 text-purple-400 hover:bg-purple-900/30">
  Skip
</Button>

// Ghost button
<Button variant="ghost" className="text-gray-400 hover:text-purple-400 hover:bg-purple-900/20">
  Hint
</Button>
```

**Cards:**

```typescript
<Card className="bg-gradient-to-br from-purple-950/50 to-blue-950/50 backdrop-blur border border-purple-800/50 hover:border-purple-600 transition-all">
  <CardHeader>
    <CardTitle className="text-xl font-bold text-purple-300">Daily Quest</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### 12.3 Responsive Design

**Breakpoints:**

```typescript
// Mobile-first approach
sm: '640px',   // Small devices
md: '768px',   // Tablets
lg: '1024px',  // Laptops
xl: '1280px',  // Desktops
```

**Mobile Optimizations:**

- Bottom navigation bar (thumb-friendly)
- Large tap targets (min 44px)
- Swipe gestures for navigation
- Pull-to-refresh
- Haptic feedback on interactions
- Voice-first interface
- Minimal text input

---

## 13. Performance Requirements

### 13.1 Core Web Vitals Targets

```
LCP (Largest Contentful Paint): < 2.5s
FID (First Input Delay): < 100ms
CLS (Cumulative Layout Shift): < 0.1
```

### 13.2 Performance Optimizations

**1. Code Splitting:**

```typescript
// Route-based splitting (already shown in routing)

// Component-level splitting
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

**2. WebLLM Model Loading:**

```typescript
// Lazy load model on demand
// Show progress indicator during load
// Cache in service worker for offline use

const modelLoadStrategy = userProfile.isPremium ? 'eager' : 'lazy';

if (modelLoadStrategy === 'eager') {
  // Load on app start (premium users)
  initializeModel();
} else {
  // Load when user starts learning (free users)
  // Show "Preparing AI..." screen
}
```

**3. IndexedDB Optimization:**

```typescript
// Use indexes for fast queries
// Batch writes
// Use transactions for related operations

// Batch update example
await db.transaction('rw', db.progress, db.dailyStats, async () => {
  await db.progress.bulkPut(progressUpdates);
  await db.dailyStats.put(todayStats);
});
```

**4. Image Optimization:**

```typescript
// Use WebP format with fallbacks
// Lazy load images below the fold
// Use srcset for responsive images

<img
  src="/avatar.webp"
  srcSet="/avatar-sm.webp 1x, /avatar-md.webp 2x"
  loading="lazy"
  alt="AI Avatar"
/>
```

**5. Virtual Scrolling:**

```typescript
// For long lists (conversation history, achievements)
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef<HTMLDivElement>(null);

const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100,
  overscan: 5
});
```

### 13.3 Bundle Size Targets

```
Initial JS: < 300KB (gzipped)
Initial CSS: < 50KB (gzipped)
Total Initial Load: < 500KB (gzipped)

WebLLM Model: ~1.8GB (cached separately, loaded async)
Question DB: ~50MB (cached separately)
```

### 13.4 Monitoring

```typescript
// src/lib/utils/performance.ts

export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now();
  fn();
  const duration = performance.now() - start;

  // Log to analytics
  analytics.track('performance', {
    metric: name,
    duration,
    timestamp: new Date()
  });

  if (duration > 1000) {
    console.warn(`Slow operation: ${name} took ${duration}ms`);
  }
}

// Usage
measurePerformance('evaluateAnswer', async () => {
  await evaluateAnswer(question, answer);
});
```

---

## 14. Security & Privacy

### 14.1 Security Principles

**1. Client-Side Security:**

```typescript
// Content Security Policy
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'wasm-unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https://api.stripe.com;
    font-src 'self';
  "
/>
```

**2. Data Privacy:**

- All user data stored locally (IndexedDB)
- No server-side user tracking (free tier)
- Optional cloud sync (premium, explicit consent)
- No third-party analytics by default
- GDPR compliant data export/deletion

**3. Input Sanitization:**

```typescript
// Sanitize user inputs before storing
import DOMPurify from 'dompurify';

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

// Usage
const sanitizedAnswer = sanitizeInput(userInput);
await saveConversation({ userAnswer: sanitizedAnswer });
```

**4. XSS Prevention:**

```typescript
// React automatically escapes values
// But for markdown rendering, use a secure parser

import { marked } from 'marked';
import DOMPurify from 'dompurify';

function renderMarkdown(markdown: string): string {
  const html = marked(markdown);
  return DOMPurify.sanitize(html);
}
```

### 14.2 Privacy Policy Requirements

Must include:
- Data collection practices
- Local storage usage
- Optional cloud sync (premium)
- Third-party services (Stripe for payments)
- Cookie usage
- User rights (access, deletion, export)
- Contact information

---

## 15. Testing Strategy

### 15.1 Unit Tests (Vitest)

```typescript
// src/lib/gamification/__tests__/level-system.test.ts

import { describe, it, expect } from 'vitest';
import { LevelSystem } from '../level-system';

describe('LevelSystem', () => {
  it('should return level 1 for 0 XP', () => {
    expect(LevelSystem.getLevelFromXP(0)).toBe(1);
  });

  it('should return level 2 for 150 XP', () => {
    expect(LevelSystem.getLevelFromXP(150)).toBe(2);
  });

  it('should calculate correct XP reward', () => {
    const xp = LevelSystem.calculateXPReward(100, 240, 'intermediate');
    expect(xp).toBeGreaterThan(50);
  });

  it('should handle perfect score bonus', () => {
    const xp = LevelSystem.calculateXPReward(100, 240, 'beginner');
    const xpWithoutPerfect = LevelSystem.calculateXPReward(99, 240, 'beginner');
    expect(xp).toBeGreaterThan(xpWithoutPerfect);
  });
});
```

### 15.2 Integration Tests

```typescript
// src/features/chat/__tests__/ChatInterface.integration.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInterface } from '../ChatInterface';
import { vi } from 'vitest';

vi.mock('@/hooks/useWebLLM', () => ({
  useWebLLM: () => ({
    isReady: true,
    evaluateAnswer: vi.fn().mockResolvedValue({
      isComplete: true,
      score: 85,
      feedback: { /* ... */ }
    })
  })
}));

describe('ChatInterface Integration', () => {
  it('should display question and handle user answer', async () => {
    render(<ChatInterface />);

    // Wait for question to load
    await waitFor(() => {
      expect(screen.getByText(/What is/)).toBeInTheDocument();
    });

    // Type answer
    const input = screen.getByPlaceholderText(/Type your answer/);
    fireEvent.change(input, { target: { value: 'Test answer' } });

    // Submit
    fireEvent.click(screen.getByText(/Submit/));

    // Wait for evaluation
    await waitFor(() => {
      expect(screen.getByText(/score/i)).toBeInTheDocument();
    });
  });
});
```

### 15.3 E2E Tests (Playwright)

```typescript
// tests/e2e/learning-flow.spec.ts

import { test, expect } from '@playwright/test';

test('complete learning flow', async ({ page }) => {
  // Go to app
  await page.goto('http://localhost:5173');

  // Complete onboarding
  await page.click('text=Get Started');
  await page.fill('input[placeholder*="company"]', 'Google');
  await page.click('text=Continue');

  // Wait for model to load (long timeout)
  await page.waitForSelector('text=Ready to start', { timeout: 60000 });

  // Answer a question
  await page.fill('textarea[placeholder*="answer"]', 'A load balancer distributes traffic...');
  await page.click('text=Submit');

  // Wait for evaluation
  await expect(page.locator('text=Score')).toBeVisible({ timeout: 10000 });

  // Check XP was awarded
  await expect(page.locator('text=/XP/')).toBeVisible();
});

test('voice recording flow', async ({ page, context }) => {
  // Grant microphone permission
  await context.grantPermissions(['microphone']);

  await page.goto('http://localhost:5173/learn');

  // Start recording
  await page.click('[aria-label="Start voice recording"]');

  // Verify recording indicator
  await expect(page.locator('text=Recording')).toBeVisible();

  // Stop recording
  await page.click('[aria-label="Stop voice recording"]');

  // Verify transcript appears
  await expect(page.locator('textarea')).not.toBeEmpty();
});
```

### 15.4 Test Coverage Goals

```
Unit Tests: 80%+ coverage
Integration Tests: Critical user flows
E2E Tests: Happy path + error cases
Performance Tests: Load time, bundle size
Accessibility Tests: WCAG 2.1 AA compliance
```

---

## 16. Deployment & Build

### 16.1 Build Configuration

```typescript
// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Interview Buddy AI',
        short_name: 'Interview Buddy',
        description: 'AI-powered interview preparation platform',
        theme_color: '#8b5cf6',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5000000, // 5MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/huggingface\.co\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'webllm-models',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['framer-motion', 'lucide-react'],
          'db': ['dexie', 'sql.js'],
          'ai': ['@mlc-ai/web-llm']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm']
  }
});
```

### 16.2 Environment Variables

```env
# .env.example

# App
VITE_APP_NAME="Interview Buddy AI"
VITE_APP_URL="https://interviewbuddy.ai"

# WebLLM
VITE_WEBLLM_MODEL="Llama-3.2-3B-Instruct-q4f16_1-MLC"
VITE_WEBLLM_MOBILE_MODEL="Phi-3-mini-4k-instruct-q4f16_1-MLC"

# Analytics (optional)
VITE_POSTHOG_KEY=""
VITE_POSTHOG_HOST="https://app.posthog.com"

# Payments (premium features)
VITE_STRIPE_PUBLIC_KEY=""

# Supabase (optional cloud sync)
VITE_SUPABASE_URL=""
VITE_SUPABASE_ANON_KEY=""
```

### 16.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run linter
        run: pnpm lint

      - name: Run type check
        run: pnpm type-check

      - name: Run unit tests
        run: pnpm test:unit

      - name: Build
        run: pnpm build

      - name: Run E2E tests
        run: pnpm test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build
        env:
          VITE_APP_URL: ${{ secrets.APP_URL }}
          VITE_STRIPE_PUBLIC_KEY: ${{ secrets.STRIPE_PUBLIC_KEY }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 16.4 Hosting Options

**Option 1: Vercel (Recommended)**
- Zero-config deployment
- Edge network CDN
- Preview deployments for PRs
- Environment variable management

**Option 2: Netlify**
- Similar to Vercel
- Edge functions support
- Form handling

**Option 3: GitHub Pages**
- Free for public repos
- Requires custom service worker setup
- Manual deployment

**Option 4: Self-hosted**
- Full control
- Need to configure CDN
- SSL certificates

---

## 17. Implementation Phases

### Phase 1: MVP Foundation (Week 1-2)

**Goals:**
- Set up project structure
- Basic chat interface
- WebLLM integration
- Question database integration
- Simple evaluation

**Deliverables:**
- [ ] Project initialized with Vite + React + TypeScript
- [ ] Tailwind CSS configured with design system
- [ ] IndexedDB schema implemented with Dexie
- [ ] WebLLM integrated with model loading
- [ ] Basic question database loaded
- [ ] Simple chat UI with text input
- [ ] Answer evaluation working (text-based)
- [ ] Progress saving to IndexedDB

**Success Metrics:**
- App loads in < 3 seconds
- Model loads in < 20 seconds
- Can answer questions and get feedback
- Progress persists across sessions

### Phase 2: Gamification (Week 3-4)

**Goals:**
- XP and leveling system
- Credits economy
- Achievement system
- Daily quests
- Progress dashboard

**Deliverables:**
- [ ] XP calculation and level progression
- [ ] Credits award and spending
- [ ] Achievement definitions and tracking
- [ ] Achievement unlock animations
- [ ] Daily quest generation
- [ ] Dashboard with stats visualization
- [ ] Streak tracking

**Success Metrics:**
- Users earn XP and level up correctly
- Achievements unlock as expected
- Dashboard shows accurate stats
- Daily quests generate correctly

### Phase 3: Voice Integration (Week 5)

**Goals:**
- Voice recording
- TTS integration
- Voice-first UI

**Deliverables:**
- [ ] Web Speech API integration
- [ ] Kokoro TTS integration
- [ ] Voice recording UI with waveform
- [ ] Voice answer submission
- [ ] AI voice responses
- [ ] Voice settings (enable/disable, voice selection)

**Success Metrics:**
- Voice recording works on mobile
- TTS plays clearly
- < 1 second latency for voice features

### Phase 4: Mock Interviews (Week 6)

**Goals:**
- Multi-question interview sessions
- Real-time scoring
- Detailed feedback reports

**Deliverables:**
- [ ] Mock interview setup flow
- [ ] Interview room with timer
- [ ] Live scorecard during interview
- [ ] Multi-turn conversation handling
- [ ] Interview completion report
- [ ] Interview history

**Success Metrics:**
- Can complete full mock interview
- Scoring is accurate
- Report provides actionable feedback

### Phase 5: Premium Features (Week 7)

**Goals:**
- Freemium gates
- Payment integration
- Cloud sync (optional)
- Advanced analytics

**Deliverables:**
- [ ] Premium feature gates
- [ ] Stripe payment integration
- [ ] Subscription management
- [ ] Cloud sync (Supabase)
- [ ] Advanced analytics dashboard
- [ ] Export/import data

**Success Metrics:**
- Payment flow works end-to-end
- Premium features unlock correctly
- Cloud sync works reliably

### Phase 6: Polish & Launch (Week 8)

**Goals:**
- Performance optimization
- Bug fixes
- User testing
- Production deployment

**Deliverables:**
- [ ] Performance optimization
- [ ] PWA configuration
- [ ] SEO optimization
- [ ] Accessibility audit
- [ ] User testing (10+ users)
- [ ] Bug fixes from testing
- [ ] Production deployment
- [ ] Marketing materials

**Success Metrics:**
- Lighthouse score > 90
- No critical bugs
- Positive user feedback
- Successfully deployed to production

---

## 18. File Structure

```
interview-buddy-ai/
├── public/
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── ai-avatar.png
│   └── favicon.ico
│
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component
│   ├── routes.tsx                  # Route configuration
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   └── Header.tsx
│   │   │
│   │   └── common/
│   │       ├── Loading.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── ConfettiEffect.tsx
│   │       └── ParticleEffect.tsx
│   │
│   ├── features/
│   │   ├── onboarding/
│   │   │   ├── OnboardingFlow.tsx
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── GoalSetting.tsx
│   │   │   ├── ModelDownload.tsx
│   │   │   └── QuickAssessment.tsx
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatHeader.tsx
│   │   │   ├── ThinkingIndicator.tsx
│   │   │   ├── FeedbackPanel.tsx
│   │   │   └── HintSystem.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── StatsOverview.tsx
│   │   │   ├── SkillBreakdown.tsx
│   │   │   ├── DailyQuests.tsx
│   │   │   ├── StreakDisplay.tsx
│   │   │   └── RecommendedActions.tsx
│   │   │
│   │   ├── mock-interview/
│   │   │   ├── MockInterviewSetup.tsx
│   │   │   ├── MockInterviewRoom.tsx
│   │   │   ├── InterviewTimer.tsx
│   │   │   ├── LiveScorecard.tsx
│   │   │   └── InterviewReport.tsx
│   │   │
│   │   ├── gamification/
│   │   │   ├── LevelProgress.tsx
│   │   │   ├── AchievementsList.tsx
│   │   │   ├── AchievementUnlockModal.tsx
│   │   │   ├── CreditsDisplay.tsx
│   │   │   └── BadgeCollection.tsx
│   │   │
│   │   ├── voice/
│   │   │   ├── VoiceRecorder.tsx
│   │   │   ├── WaveformVisualizer.tsx
│   │   │   ├── VoiceSettings.tsx
│   │   │   └── TTSPlayer.tsx
│   │   │
│   │   ├── profile/
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   ├── TargetCompanies.tsx
│   │   │   └── InterviewDateTracker.tsx
│   │   │
│   │   └── premium/
│   │       ├── PremiumUpsell.tsx
│   │       ├── PaymentFlow.tsx
│   │       └── PremiumFeatures.tsx
│   │
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── webllm.ts
│   │   │   ├── answer-evaluator.ts
│   │   │   ├── prompts.ts
│   │   │   └── model-manager.ts
│   │   │
│   │   ├── voice/
│   │   │   ├── kokoro-tts.ts
│   │   │   ├── speech-recognition.ts
│   │   │   └── audio-utils.ts
│   │   │
│   │   ├── questions/
│   │   │   ├── question-selector.ts
│   │   │   ├── question-db.ts
│   │   │   └── question-parser.ts
│   │   │
│   │   ├── gamification/
│   │   │   ├── xp-calculator.ts
│   │   │   ├── level-system.ts
│   │   │   ├── achievement-engine.ts
│   │   │   ├── credits-manager.ts
│   │   │   └── srs-algorithm.ts
│   │   │
│   │   └── utils/
│   │       ├── db.ts
│   │       ├── storage.ts
│   │       ├── analytics.ts
│   │       └── date-utils.ts
│   │
│   ├── hooks/
│   │   ├── useWebLLM.ts
│   │   ├── useVoiceRecording.ts
│   │   ├── useKokoroTTS.ts
│   │   ├── useQuestionSelector.ts
│   │   ├── useProgress.ts
│   │   ├── useGamification.ts
│   │   ├── useAchievements.ts
│   │   ├── useConversation.ts
│   │   └── useMockInterview.ts
│   │
│   ├── store/
│   │   ├── userStore.ts
│   │   ├── conversationStore.ts
│   │   ├── gamificationStore.ts
│   │   ├── progressStore.ts
│   │   ├── aiStore.ts
│   │   └── settingsStore.ts
│   │
│   ├── types/
│   │   ├── database.ts
│   │   ├── ai.ts
│   │   ├── gamification.ts
│   │   ├── question.ts
│   │   └── user.ts
│   │
│   └── styles/
│       ├── globals.css
│       ├── animations.css
│       └── themes.css
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── README.md
```

---

## 19. Code Examples & Patterns

### 19.1 Custom Hook Pattern

```typescript
// src/hooks/useConversation.ts

import { useState, useCallback } from 'react';
import { useWebLLM } from './useWebLLM';
import { useGamification } from './useGamification';
import { db } from '@/lib/utils/db';
import type { Question, Conversation } from '@/types';

export function useConversation(questionId: string) {
  const [history, setHistory] = useState<Conversation[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);

  const { evaluateAnswer } = useWebLLM();
  const { awardXP, awardCredits } = useGamification();

  const submitAnswer = useCallback(async (answer: string) => {
    // Evaluate answer
    const evaluation = await evaluateAnswer(question, answer, history);

    // Create conversation entry
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      userId: currentUserId,
      questionId,
      questionText: question.question,
      expectedAnswer: question.answer,
      expectedKeyPoints: extractKeyPoints(question.answer),
      userAnswer: answer,
      responseMode: 'text',
      aiFollowups: [],
      score: evaluation.score,
      keyPointsCovered: evaluation.coveredKeyPoints,
      keyPointsMissing: evaluation.missingKeyPoints,
      feedback: evaluation.feedback,
      timeSpent: 0,
      hintsUsed: 0,
      attemptsCount: 1,
      timestamp: new Date()
    };

    // Save to DB
    await db.conversations.add(conversation);

    // Update history
    setHistory(prev => [...prev, conversation]);
    setCurrentTurn(prev => prev + 1);

    // Award rewards if complete
    if (evaluation.isComplete) {
      const xp = calculateXP(evaluation.score);
      const credits = calculateCredits(evaluation.score);
      await awardXP(xp);
      await awardCredits(credits);
    }

    return evaluation;
  }, [questionId, history]);

  return {
    history,
    currentTurn,
    submitAnswer
  };
}
```

### 19.2 Context Provider Pattern

```typescript
// src/contexts/AIContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getWebLLM, WebLLMManager } from '@/lib/ai/webllm';

interface AIContextValue {
  isReady: boolean;
  isLoading: boolean;
  loadProgress: number;
  error: string | null;
  initialize: () => Promise<void>;
}

const AIContext = createContext<AIContextValue | null>(null);

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const webLLM = getWebLLM();

  const initialize = async () => {
    if (isReady || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await webLLM.initialize((progress) => {
        setLoadProgress(progress);
      });

      setIsReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize AI');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-initialize on mount (for premium users)
  useEffect(() => {
    const userProfile = getUserProfile(); // From store
    if (userProfile?.isPremium) {
      initialize();
    }
  }, []);

  return (
    <AIContext.Provider value={{ isReady, isLoading, loadProgress, error, initialize }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
}
```

---

## 20. Migration from Existing System

### 20.1 Data Migration Strategy

**Step 1: Export Existing Data**

```typescript
// scripts/export-existing-data.ts

import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
});

async function exportData() {
  // Export questions
  const questions = await client.execute('SELECT * FROM questions WHERE status = "active"');
  await fs.writeFile('data/questions.json', JSON.stringify(questions.rows, null, 2));

  // Export question relationships
  const relationships = await client.execute('SELECT * FROM questionRelationships');
  await fs.writeFile('data/relationships.json', JSON.stringify(relationships.rows, null, 2));

  // Export certifications
  const certifications = await client.execute('SELECT * FROM certifications');
  await fs.writeFile('data/certifications.json', JSON.stringify(certifications.rows, null, 2));

  console.log('Data exported successfully');
}

exportData();
```

**Step 2: Transform Data Format**

```typescript
// scripts/transform-data.ts

interface OldQuestion {
  id: string;
  question: string;
  answer: string;
  // ... old fields
}

interface NewQuestion {
  id: string;
  question: string;
  answer: string;
  // ... new fields
}

async function transformQuestions() {
  const oldQuestions: OldQuestion[] = JSON.parse(
    await fs.readFile('data/questions.json', 'utf-8')
  );

  const newQuestions: NewQuestion[] = oldQuestions.map(q => ({
    ...q,
    // Add any new required fields
    // Transform any changed field formats
  }));

  await fs.writeFile('data/questions-transformed.json', JSON.stringify(newQuestions, null, 2));
}

transformQuestions();
```

**Step 3: Bundle with App**

```typescript
// public/data/questions.json
// Include transformed data with app distribution
// Or load on first app start

// src/lib/questions/question-db.ts
async function initializeQuestionDB() {
  // Check if already initialized
  const count = await db.questions.count();
  if (count > 0) return;

  // Load bundled data
  const response = await fetch('/data/questions.json');
  const questions = await response.json();

  // Insert into IndexedDB or SQLite WASM
  await db.questions.bulkAdd(questions);

  console.log(`Initialized ${questions.length} questions`);
}
```

### 20.2 User Data Migration (Optional)

For existing users who want to migrate their progress:

```typescript
// Feature: Import progress from old system

async function importUserProgress(exportFile: File) {
  const data = JSON.parse(await exportFile.text());

  // Transform old progress format to new
  const transformedProgress = data.progress.map(p => ({
    id: p.questionId,
    userId: currentUserId,
    attempts: p.attempts || 1,
    bestScore: p.score || 0,
    averageScore: p.score || 0,
    lastScore: p.score || 0,
    lastAttempt: new Date(p.completedAt),
    nextReview: calculateNextReview(p.score),
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    status: p.score >= 80 ? 'mastered' : 'learning',
    mastered: p.score >= 80,
    weakKeyPoints: [],
    needsVoicePractice: false,
    firstSeenAt: new Date(p.firstSeenAt),
    lastUpdatedAt: new Date()
  }));

  // Import into new DB
  await db.progress.bulkAdd(transformedProgress);

  // Import achievements
  // Import stats
  // etc.
}
```

---

## Final Checklist

### Pre-Launch Checklist

**Technical:**
- [ ] All core features implemented and tested
- [ ] Performance targets met (LCP < 2.5s, FID < 100ms)
- [ ] Bundle size optimized (< 500KB initial)
- [ ] PWA configured and working offline
- [ ] WebLLM model loads correctly on all devices
- [ ] Voice features work on iOS and Android
- [ ] IndexedDB persistence working
- [ ] Service worker caching configured
- [ ] Error tracking implemented
- [ ] Analytics configured (opt-in)

**Content:**
- [ ] All questions imported and verified
- [ ] Question relationships mapped
- [ ] Achievement definitions complete
- [ ] Daily quest templates created
- [ ] Mock interview scenarios defined

**Legal & Compliance:**
- [ ] Privacy policy written and published
- [ ] Terms of service written and published
- [ ] Cookie consent implemented
- [ ] GDPR compliance verified
- [ ] Data export/deletion feature working
- [ ] Payment terms clear (for premium)

**UX:**
- [ ] Onboarding flow tested with users
- [ ] Mobile experience optimized
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Loading states for all async operations
- [ ] Error messages clear and helpful
- [ ] Success feedback satisfying

**Launch Prep:**
- [ ] Landing page ready
- [ ] Demo video created
- [ ] Screenshots prepared
- [ ] Social media accounts set up
- [ ] Launch announcement drafted
- [ ] Support email/chat configured
- [ ] Analytics dashboards set up
- [ ] Backup and recovery plan documented

---

## Conclusion

This technical specification provides a complete, implementation-ready blueprint for building **Interview Buddy AI**. Every section is designed to be directly usable by AI code generators or human developers.

**Key Differentiators:**
1. **100% Browser-Based AI**: No API calls, no latency, works offline
2. **Conversational Learning**: Natural dialogue, not flashcards
3. **Voice-First**: Speak your answers, hear AI responses
4. **Gamified**: Levels, achievements, streaks, quests
5. **Personalized**: RAG-powered question selection
6. **Privacy-Focused**: All data stays local by default

**Next Steps:**
1. Set up project with specified tech stack
2. Implement Phase 1 (MVP Foundation)
3. Integrate WebLLM and test on target devices
4. Build and test core conversation loop
5. Add gamification layer
6. Integrate voice features
7. Polish and optimize
8. Launch!

**Support:**
For implementation questions or clarifications, refer to:
- Code examples throughout this document
- Component specifications in Section 6
- Data models in Section 4
- Integration guides in Sections 7-9

Good luck building Interview Buddy AI! 🚀