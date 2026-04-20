// Basic in-memory database for demo purposes
// Replace with actual Dexie implementation when dependencies are installed

export interface UserProfile {
  id: string;
  username?: string;
  email?: string;
  targetCompanies: string[];
  targetRole: string;
  experienceLevel: "entry" | "mid" | "senior" | "staff" | "principal";
  interviewDate?: Date;
  weeklyGoalMinutes: number;
  xp: number;
  level: number;
  credits: number;
  streak: number;
  lastActiveDate: Date;
  voiceEnabled: boolean;
  aiVoice:
    | "professional-female"
    | "professional-male"
    | "casual-female"
    | "casual-male";
  difficulty: "adaptive" | "easy" | "medium" | "hard";
  theme: "dark" | "light" | "system";
  isPremium: boolean;
  premiumExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  questionId: string;
  questionText: string;
  expectedAnswer: string;
  expectedKeyPoints: string[];
  userAnswer: string;
  responseMode: "voice" | "text";
  aiFollowups: Array<{
    prompt: string;
    userResponse: string;
    timestamp: Date;
  }>;
  score: number;
  keyPointsCovered: string[];
  keyPointsMissing: string[];
  feedback: {
    strengths: string[];
    improvements: string[];
    overallComment: string;
  };
  timeSpent: number;
  hintsUsed: number;
  attemptsCount: number;
  sessionId?: string;
  timestamp: Date;
}

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
  status: "new" | "learning" | "reviewing" | "mastered";
  mastered: boolean;
  weakKeyPoints: string[];
  needsVoicePractice: boolean;
  firstSeenAt: Date;
  lastUpdatedAt: Date;
}

export interface Question {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  diagram?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
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
  relevanceDetails?: any;
  jobTitleRelevance?: Record<string, number>;
  experienceLevelTags: string[];
  voiceKeywords: string[];
  voiceSuitable: boolean;
  status: string;
  isNew: boolean;
  lastUpdated?: string;
  createdAt: string;
}

// In-memory storage for demo
class InterviewBuddyDB {
  private data: any = {
    userProfiles: [],
    conversations: [],
    progress: []
  };

  async open() {
    // Simulate database opening
    return Promise.resolve();
  }

  get userProfiles() {
    return {
      toArray: () => Promise.resolve(this.data.userProfiles),
      add: (item: any) => {
        this.data.userProfiles.push(item);
        return Promise.resolve(item.id);
      },
      update: (id: string, changes: any) => {
        const index = this.data.userProfiles.findIndex((p: any) => p.id === id);
        if (index !== -1) {
          this.data.userProfiles[index] = {
            ...this.data.userProfiles[index],
            ...changes
          };
        }
        return Promise.resolve();
      }
    };
  }

  get conversations() {
    return {
      toArray: () => Promise.resolve(this.data.conversations),
      add: (item: any) => {
        this.data.conversations.push(item);
        return Promise.resolve(item.id);
      }
    };
  }

  get progress() {
    return {
      toArray: () => Promise.resolve(this.data.progress),
      add: (item: any) => {
        this.data.progress.push(item);
        return Promise.resolve(item.id);
      }
    };
  }
}

export const db = new InterviewBuddyDB();
