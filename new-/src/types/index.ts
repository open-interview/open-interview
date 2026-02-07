/**
 * Core Type Definitions for Interview Buddy AI
 * Comprehensive type system for the entire application
 */

// ============================================================
// User Profile Types
// ============================================================

export type ExperienceLevel =
  | "entry"
  | "mid"
  | "senior"
  | "staff"
  | "principal";
export type DifficultyLevel = "adaptive" | "easy" | "medium" | "hard";
export type ThemeMode = "dark" | "light" | "system";
export type AIVoice =
  | "professional-female"
  | "professional-male"
  | "casual-female"
  | "casual-male";
export type ResponseMode = "voice" | "text";
export type ProgressStatus = "new" | "learning" | "reviewing" | "mastered";
export type InterviewType = "system-design" | "coding" | "behavioral" | "mixed";
export type QuestType =
  | "daily-easy"
  | "daily-medium"
  | "daily-hard"
  | "daily-boss";
export type QuestStatus =
  | "available"
  | "in-progress"
  | "completed"
  | "failed"
  | "expired";
export type AchievementTier =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond";
export type SessionStatus = "in-progress" | "completed" | "abandoned";
export type ModelId = "llama-3.2-3b" | "phi-3-mini" | "gemma-2b";
export type AIPersonality =
  | "professional"
  | "friendly"
  | "tough"
  | "encouraging";
export type LoadStrategy = "eager" | "lazy" | "on-demand";
export type QuestionDifficulty = "beginner" | "intermediate" | "advanced";

export interface UserProfile {
  id: string;
  username?: string;
  email?: string;
  targetCompanies: string[];
  targetRole: string;
  experienceLevel: ExperienceLevel;
  interviewDate?: Date;
  weeklyGoalMinutes: number;
  xp: number;
  level: number;
  credits: number;
  streak: number;
  lastActiveDate: Date;
  voiceEnabled: boolean;
  aiVoice: AIVoice;
  difficulty: DifficultyLevel;
  theme: ThemeMode;
  isPremium: boolean;
  premiumExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// Question Types
// ============================================================

export interface Question {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  diagram?: string;
  difficulty: QuestionDifficulty;
  tags: string[];
  channel: string;
  subChannel?: string;
  sourceUrl?: string;
  videos?: {
    shortVideo?: string;
    longVideo?: string;
  };
  companies: string[];
  eli5?: string;
  tldr?: string;
  relevanceScore: number;
  relevanceDetails?: RelevanceDetails;
  jobTitleRelevance?: Record<string, number>;
  experienceLevelTags: string[];
  voiceKeywords: string[];
  voiceSuitable: boolean;
  status: string;
  isNew: boolean;
  lastUpdated?: string;
  createdAt: string;
}

export interface RelevanceDetails {
  titleMatch: boolean;
  companyMatch: boolean;
  levelMatch: boolean;
  tagRelevance: number;
  recencyBoost: number;
}

export interface QuestionFilter {
  targetRole?: string;
  companies?: string[];
  experienceLevel?: ExperienceLevel;
  difficulty?: DifficultyLevel;
  tags?: string[];
  excludeIds?: string[];
  requireVoiceSuitable?: boolean;
}

// ============================================================
// Conversation Types
// ============================================================

export interface AIFollowUp {
  prompt: string;
  userResponse: string;
  timestamp: Date;
}

export interface Feedback {
  strengths: string[];
  improvements: string[];
  overallComment: string;
}

export interface Conversation {
  id: string;
  userId: string;
  questionId: string;
  questionText: string;
  expectedAnswer: string;
  expectedKeyPoints: string[];
  userAnswer: string;
  responseMode: ResponseMode;
  aiFollowups: AIFollowUp[];
  score: number;
  keyPointsCovered: string[];
  keyPointsMissing: string[];
  feedback: Feedback;
  timeSpent: number;
  hintsUsed: number;
  attemptsCount: number;
  sessionId?: string;
  timestamp: Date;
}

// ============================================================
// Progress Types
// ============================================================

export interface Progress {
  id: string;
  userId: string;
  attempts: number;
  bestScore: number;
  averageScore: number;
  lastScore: number;
  lastAttempt: Date;
  nextReview: Date;
  interval: number;
  easeFactor: number;
  repetitions: number;
  status: ProgressStatus;
  mastered: boolean;
  weakKeyPoints: string[];
  needsVoicePractice: boolean;
  firstSeenAt: Date;
  lastUpdatedAt: Date;
}

// ============================================================
// Gamification Types
// ============================================================

export interface Achievement {
  id: string;
  userId: string;
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  progress: number;
  threshold: number;
  currentValue: number;
  unlocked: boolean;
  unlockedAt?: Date;
  seen: boolean;
  xpReward: number;
  creditsReward: number;
}

export interface DailyQuest {
  id: string;
  userId: string;
  date: Date;
  questType: QuestType;
  title: string;
  description: string;
  requiredQuestions: number;
  requiredScore: number;
  timeLimit?: number;
  questionsCompleted: number;
  currentAverageScore: number;
  status: QuestStatus;
  xpReward: number;
  creditsReward: number;
  completedAt?: Date;
  expiresAt: Date;
}

export interface DailyStats {
  id: string;
  userId: string;
  date: Date;
  questionsAnswered: number;
  questionsCorrect: number;
  questionsSkipped: number;
  averageScore: number;
  totalScore: number;
  xpEarned: number;
  creditsEarned: number;
  badgesUnlocked: string[];
  timeSpent: number;
  sessionsCount: number;
  streakActive: boolean;
  streakCount: number;
}

export interface LevelInfo {
  level: number;
  title: string;
  xpRequired: number;
  xpToNextLevel: number;
  currentLevelProgress: number;
}

// ============================================================
// Mock Interview Types
// ============================================================

export interface InterviewBreakdown {
  problemSolving: number;
  communication: number;
  technicalDepth: number;
  systemDesign?: number;
  behavioralSTAR?: number;
}

export interface DetailedFeedback {
  strengths: string[];
  improvements: string[];
  recommendedNext: string[];
}

export interface MockInterviewSession {
  id: string;
  userId: string;
  type: InterviewType;
  company: string;
  difficulty: QuestionDifficulty;
  duration: number;
  questionIds: string[];
  currentQuestionIndex: number;
  overallScore: number;
  breakdown: InterviewBreakdown;
  conversationIds: string[];
  status: SessionStatus;
  startedAt: Date;
  completedAt?: Date;
  detailedFeedback: DetailedFeedback;
}

// ============================================================
// Settings Types
// ============================================================

export interface AppSettings {
  id: string;
  userId: string;
  preferredModel: ModelId;
  modelLoadStrategy: LoadStrategy;
  enableAnimations: boolean;
  reducedMotion: boolean;
  offlineMode: boolean;
  allowAnalytics: boolean;
  allowCrashReports: boolean;
  enableNotifications: boolean;
  streakReminders: boolean;
  questReminders: boolean;
  aiPersonality: AIPersonality;
  followUpQuestions: boolean;
  detailedFeedback: boolean;
  updatedAt: Date;
}

// ============================================================
// AI/ML Types
// ============================================================

export interface WebLLMConfig {
  modelId: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt?: string;
}

export interface EvaluationResult {
  isComplete: boolean;
  score: number;
  coveredKeyPoints: string[];
  missingKeyPoints: string[];
  followUpQuestion?: string;
  confidence: number;
  reasoning: string;
  feedback: Feedback;
  suggestedImprovements: string[];
}

export interface RAGContext {
  questionId: string;
  relevanceScore: number;
  context: string;
  source: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  sizeGB: number;
  capabilities: string[];
  downloadUrl: string;
  isAvailable: boolean;
  isDownloaded: boolean;
}

export interface ModelLoadProgress {
  progress: number;
  status: "idle" | "downloading" | "loading" | "ready" | "error";
  message?: string;
  error?: string;
}

// ============================================================
// Voice Types
// ============================================================

export interface VoiceConfig {
  voiceId: string;
  rate: number;
  pitch: number;
  volume: number;
  lang: string;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface VoiceSession {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  error?: string;
}

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
}

// ============================================================
// Store Types
// ============================================================

export interface UserStoreState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

export interface UserStoreActions {
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addXP: (amount: number) => void;
  addCredits: (amount: number) => void;
  updateStreak: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface ChatStoreState {
  currentSession: Conversation | null;
  messages: ChatMessage[];
  isProcessing: boolean;
  currentQuestion: Question | null;
  evaluationResult: EvaluationResult | null;
  hintsUsed: number;
  timeSpent: number;
}

export interface ChatStoreActions {
  startSession: (question: Question) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setProcessing: (processing: boolean) => void;
  setCurrentQuestion: (question: Question | null) => void;
  setEvaluationResult: (result: EvaluationResult | null) => void;
  useHint: () => void;
  incrementTimeSpent: (seconds: number) => void;
  endSession: () => void;
  reset: () => void;
}

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: Date;
  type?: "question" | "answer" | "feedback" | "followup" | "hint" | "system";
  metadata?: Record<string, unknown>;
}

export interface GamificationStoreState {
  achievements: Achievement[];
  dailyQuests: DailyQuest[];
  level: number;
  xp: number;
  credits: number;
  streak: number;
  unlockedAchievements: string[];
  newAchievements: Achievement[];
}

export interface GamificationStoreActions {
  addAchievement: (achievement: Achievement) => void;
  updateAchievementProgress: (id: string, progress: number) => void;
  markAchievementSeen: (id: string) => void;
  addXP: (amount: number) => void;
  addCredits: (amount: number) => void;
  updateStreak: (streak: number) => void;
  setDailyQuests: (quests: DailyQuest[]) => void;
  updateQuestProgress: (id: string, progress: number) => void;
  completeQuest: (id: string) => void;
}

// ============================================================
// UI Types
// ============================================================

export interface ToastOptions {
  title?: string;
  description?: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  message: string;
  code?: string;
  retry?: () => void;
}

// ============================================================
// Analytics Types
// ============================================================

export interface UserAnalytics {
  period: {
    days: number;
    startDate: Date;
    endDate: Date;
  };
  dailyStats: DailyStats[];
  conversations: ConversationStats;
  progress: Progress[];
  achievements: Achievement[];
  summary: AnalyticsSummary;
}

export interface ConversationStats {
  total: number;
  averageScore: number;
  totalTime: number;
  voiceCount: number;
  textCount: number;
  averageTime: number;
}

export interface AnalyticsSummary {
  totalQuestions: number;
  averageScore: number;
  totalTime: number;
  xpEarned: number;
  creditsEarned: number;
  achievementsUnlocked: number;
  masteryRate: number;
}

// ============================================================
// Dashboard Types
// ============================================================

export interface DashboardData {
  profile: UserProfile | null;
  recentConversations: Conversation[];
  progress: Progress[];
  weeklyStats: WeeklyStats;
  progressStats: ProgressStats;
  dueForReview: Progress[];
  achievements: Achievement[];
  quests: DailyQuest[];
  levelInfo: LevelInfo;
}

export interface WeeklyStats {
  questionsAnswered: number;
  questionsCorrect: number;
  totalScore: number;
  xpEarned: number;
  creditsEarned: number;
  timeSpent: number;
  sessionsCount: number;
  averageScore: number;
  accuracy: number;
  averageSessionTime: number;
}

export interface ProgressStats {
  total: number;
  mastered: number;
  learning: number;
  reviewing: number;
  new: number;
  masteryRate: number;
}

// ============================================================
// Database Utility Types
// ============================================================

export interface DatabaseStats {
  users: number;
  conversations: number;
  progress: number;
  dailyStats: number;
  achievements: number;
  sessions: number;
  quests: number;
  lastUpdated: string;
}

export interface ImportExportData {
  profile?: UserProfile;
  conversations?: Conversation[];
  progress?: Progress[];
  dailyStats?: DailyStats[];
  achievements?: Achievement[];
  sessions?: MockInterviewSession[];
  quests?: DailyQuest[];
  settings?: AppSettings;
  exportedAt: string;
}
