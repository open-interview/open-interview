import Dexie, { Table } from "dexie";

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
  experienceLevel: "entry" | "mid" | "senior" | "staff" | "principal";
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
  aiVoice:
    | "professional-female"
    | "professional-male"
    | "casual-female"
    | "casual-male";
  difficulty: "adaptive" | "easy" | "medium" | "hard";
  theme: "dark" | "light" | "system";

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
  responseMode: "voice" | "text";

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
  status: "new" | "learning" | "reviewing" | "mastered";
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
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";

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
  type: "system-design" | "coding" | "behavioral" | "mixed";
  company: string; // "Google", "Meta", etc.
  difficulty: "easy" | "medium" | "hard";
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
  status: "in-progress" | "completed" | "abandoned";
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
  questType: "daily-easy" | "daily-medium" | "daily-hard" | "daily-boss";
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
  status: "available" | "in-progress" | "completed" | "failed" | "expired";

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
  preferredModel: "llama-3.2-3b" | "phi-3-mini" | "gemma-2b";
  modelLoadStrategy: "eager" | "lazy" | "on-demand";

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
  aiPersonality: "professional" | "friendly" | "tough" | "encouraging";
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
    super("InterviewBuddyDB");

    this.version(1).stores({
      userProfiles: "id, email, lastActiveDate",
      conversations: "id, userId, questionId, timestamp, sessionId",
      progress: "id, userId, status, nextReview, mastered",
      dailyStats: "id, userId, date",
      achievements: "id, userId, achievementId, unlocked",
      mockInterviewSessions: "id, userId, status, startedAt",
      dailyQuests: "id, userId, date, status",
      appSettings: "id, userId",
    });
  }
}

export const db = new InterviewBuddyDB();
