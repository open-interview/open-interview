/**
 * Test mocks and utilities for Interview Buddy AI tests
 */

import { vi } from "vitest";

// Mock crypto.randomUUID for consistent test data
export const mockUUIDs = [
  "test-uuid-1",
  "test-uuid-2",
  "test-uuid-3",
  "test-uuid-4",
  "test-uuid-5",
];

let uuidIndex = 0;
export const resetMockUUID = () => {
  uuidIndex = 0;
};
export const getNextMockUUID = () => {
  const uuid = mockUUIDs[uuidIndex % mockUUIDs.length];
  uuidIndex++;
  return uuid;
};

// Mock crypto module
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: vi.fn(() => getNextMockUUID()),
  },
  writable: true,
  configurable: true,
});

// Mock Date for consistent timestamps
export const mockDate = new Date("2024-01-01T12:00:00Z");
export const mockNow = mockDate.getTime();

// Mock user profile data
export const mockUserProfile = {
  id: "user-1",
  username: "testuser",
  email: "test@example.com",
  targetCompanies: ["Google", "Meta"],
  targetRole: "Senior Frontend Engineer",
  experienceLevel: "senior" as const,
  interviewDate: new Date("2024-03-01"),
  weeklyGoalMinutes: 300,
  xp: 0,
  level: 1,
  credits: 100,
  streak: 0,
  lastActiveDate: mockDate,
  voiceEnabled: true,
  aiVoice: "professional-female" as const,
  difficulty: "adaptive" as const,
  theme: "dark" as const,
  isPremium: false,
  createdAt: mockDate,
  updatedAt: mockDate,
};

// Mock question data
export const mockQuestion = {
  id: "question-1",
  question: "What is React?",
  answer: "React is a JavaScript library for building user interfaces",
  expectedKeyPoints: ["JavaScript", "library", "user interfaces"],
};

// Mock conversation data
export const mockConversation = {
  id: "conv-1",
  userId: "user-1",
  questionId: "question-1",
  questionText: "What is React?",
  expectedAnswer: "React is a JavaScript library...",
  expectedKeyPoints: ["JavaScript", "library", "user interfaces"],
  userAnswer: "React is a library for building UI",
  responseMode: "text" as const,
  aiFollowups: [],
  score: 85,
  keyPointsCovered: ["JavaScript", "library"],
  keyPointsMissing: ["user interfaces"],
  feedback: {
    strengths: ["Clear explanation"],
    improvements: ["Add more detail"],
    overallComment: "Good answer",
  },
  timeSpent: 120,
  hintsUsed: 0,
  attemptsCount: 1,
  timestamp: mockDate,
};

// Mock progress data
export const mockProgress = {
  id: "progress-1",
  userId: "user-1",
  questionId: "question-1",
  attempts: 3,
  bestScore: 85,
  averageScore: 75,
  lastScore: 85,
  lastAttempt: mockDate,
  nextReview: new Date(mockNow + 24 * 60 * 60 * 1000),
  interval: 1,
  easeFactor: 2.5,
  repetitions: 2,
  status: "learning" as const,
  mastered: false,
  weakKeyPoints: [],
  needsVoicePractice: false,
  firstSeenAt: mockDate,
  lastUpdatedAt: mockDate,
};

// Mock daily stats data
export const mockDailyStats = {
  id: "2024-01-01",
  userId: "user-1",
  date: mockDate,
  questionsAnswered: 5,
  questionsCorrect: 4,
  questionsSkipped: 0,
  averageScore: 80,
  totalScore: 400,
  xpEarned: 100,
  creditsEarned: 25,
  badgesUnlocked: [],
  timeSpent: 600,
  sessionsCount: 2,
  streakActive: true,
  streakCount: 5,
};

// Mock achievement data
export const mockAchievement = {
  id: "ach-1",
  userId: "user-1",
  achievementId: "first-conversation",
  name: "First Conversation",
  description: "Complete your first interview question",
  icon: "🏆",
  tier: "bronze" as const,
  progress: 100,
  threshold: 1,
  currentValue: 1,
  unlocked: true,
  unlockedAt: mockDate,
  seen: false,
  xpReward: 100,
  creditsReward: 20,
};

// Mock app settings data
export const mockAppSettings = {
  id: "settings",
  userId: "user-1",
  preferredModel: "llama-3.2-3b" as const,
  modelLoadStrategy: "lazy" as const,
  enableAnimations: true,
  reducedMotion: false,
  offlineMode: false,
  allowAnalytics: true,
  allowCrashReports: true,
  enableNotifications: true,
  streakReminders: true,
  questReminders: true,
  aiPersonality: "professional" as const,
  followUpQuestions: true,
  detailedFeedback: true,
  updatedAt: mockDate,
};

// Test helpers
export const createMockUser = (overrides = {}) => ({
  ...mockUserProfile,
  ...overrides,
});

export const createMockConversation = (overrides = {}) => ({
  ...mockConversation,
  ...overrides,
});

export const createMockProgress = (overrides = {}) => ({
  ...mockProgress,
  ...overrides,
});

export const createMockDailyStats = (overrides = {}) => ({
  ...mockDailyStats,
  ...overrides,
});

// Database mock helpers
export const createMockDB = () => {
  const store: Record<string, any[]> = {
    userProfiles: [],
    conversations: [],
    progress: [],
    dailyStats: [],
    achievements: [],
    mockInterviewSessions: [],
    dailyQuests: [],
    appSettings: [],
  };

  return {
    userProfiles: {
      add: vi.fn((item) => {
        store.userProfiles.push(item);
        return Promise.resolve(item.id);
      }),
      get: vi.fn((id) =>
        Promise.resolve(store.userProfiles.find((p) => p.id === id)),
      ),
      update: vi.fn((id, changes) => {
        const index = store.userProfiles.findIndex((p) => p.id === id);
        if (index !== -1) {
          store.userProfiles[index] = {
            ...store.userProfiles[index],
            ...changes,
          };
        }
        return Promise.resolve(index !== -1 ? 1 : 0);
      }),
      delete: vi.fn((id) => {
        const index = store.userProfiles.findIndex((p) => p.id === id);
        if (index !== -1) store.userProfiles.splice(index, 1);
        return Promise.resolve();
      }),
      toArray: vi.fn(() => Promise.resolve([...store.userProfiles])),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          first: vi.fn(() => Promise.resolve(store.userProfiles[0])),
        })),
      })),
      clear: vi.fn(() => {
        store.userProfiles.length = 0;
        return Promise.resolve();
      }),
      count: vi.fn(() => Promise.resolve(store.userProfiles.length)),
      limit: vi.fn(() => ({
        toArray: vi.fn(() => Promise.resolve(store.userProfiles.slice(0, 1))),
      })),
    },
    conversations: {
      add: vi.fn((item) => {
        store.conversations.push(item);
        return Promise.resolve(item.id);
      }),
      get: vi.fn((id) =>
        Promise.resolve(store.conversations.find((c) => c.id === id)),
      ),
      update: vi.fn((id, changes) => {
        const index = store.conversations.findIndex((c) => c.id === id);
        if (index !== -1) {
          store.conversations[index] = {
            ...store.conversations[index],
            ...changes,
          };
        }
        return Promise.resolve(index !== -1 ? 1 : 0);
      }),
      delete: vi.fn((id) => {
        const index = store.conversations.findIndex((c) => c.id === id);
        if (index !== -1) store.conversations.splice(index, 1);
        return Promise.resolve();
      }),
      toArray: vi.fn(() => Promise.resolve([...store.conversations])),
      where: vi.fn((field) => ({
        equals: vi.fn((value) => ({
          reverse: vi.fn(() => ({
            limit: vi.fn((n) => ({
              toArray: vi.fn(() =>
                Promise.resolve(
                  store.conversations
                    .filter((c) => c[field] === value)
                    .reverse()
                    .slice(0, n),
                ),
              ),
            })),
            toArray: vi.fn(() =>
              Promise.resolve(
                store.conversations.filter((c) => c[field] === value).reverse(),
              ),
            ),
          })),
          and: vi.fn((filterFn) => ({
            toArray: vi.fn(() =>
              Promise.resolve(
                store.conversations
                  .filter((c) => c[field] === value)
                  .filter(filterFn),
              ),
            ),
            reverse: vi.fn(() => ({
              toArray: vi.fn(() =>
                Promise.resolve(
                  store.conversations
                    .filter((c) => c[field] === value)
                    .filter(filterFn)
                    .reverse(),
                ),
              ),
            })),
            first: vi.fn(() =>
              Promise.resolve(
                store.conversations
                  .filter((c) => c[field] === value)
                  .filter(filterFn)[0],
              ),
            ),
          })),
          first: vi.fn(() =>
            Promise.resolve(
              store.conversations.find((c) => c[field] === value),
            ),
          ),
          delete: vi.fn(() => {
            const toDelete = store.conversations.filter(
              (c) => c[field] === value,
            );
            toDelete.forEach((item) => {
              const index = store.conversations.indexOf(item);
              if (index !== -1) store.conversations.splice(index, 1);
            });
            return Promise.resolve();
          }),
        })),
      })),
      clear: vi.fn(() => {
        store.conversations.length = 0;
        return Promise.resolve();
      }),
      bulkDelete: vi.fn((ids) => {
        ids.forEach((id: string) => {
          const index = store.conversations.findIndex((c) => c.id === id);
          if (index !== -1) store.conversations.splice(index, 1);
        });
        return Promise.resolve();
      }),
    },
    progress: {
      add: vi.fn((item) => {
        store.progress.push(item);
        return Promise.resolve(item.id);
      }),
      get: vi.fn((id) =>
        Promise.resolve(store.progress.find((p) => p.id === id)),
      ),
      update: vi.fn((id, changes) => {
        const index = store.progress.findIndex((p) => p.id === id);
        if (index !== -1) {
          store.progress[index] = { ...store.progress[index], ...changes };
        }
        return Promise.resolve(index !== -1 ? 1 : 0);
      }),
      delete: vi.fn((id) => {
        const index = store.progress.findIndex((p) => p.id === id);
        if (index !== -1) store.progress.splice(index, 1);
        return Promise.resolve();
      }),
      toArray: vi.fn(() => Promise.resolve([...store.progress])),
      where: vi.fn((field) => ({
        equals: vi.fn((value) => ({
          and: vi.fn((filterFn) => ({
            toArray: vi.fn(() =>
              Promise.resolve(
                store.progress
                  .filter((p) => p[field] === value)
                  .filter(filterFn),
              ),
            ),
          })),
          toArray: vi.fn(() =>
            Promise.resolve(store.progress.filter((p) => p[field] === value)),
          ),
        })),
      })),
      clear: vi.fn(() => {
        store.progress.length = 0;
        return Promise.resolve();
      }),
    },
    dailyStats: {
      add: vi.fn((item) => {
        store.dailyStats.push(item);
        return Promise.resolve(item.id);
      }),
      get: vi.fn((id) =>
        Promise.resolve(store.dailyStats.find((s) => s.id === id)),
      ),
      update: vi.fn((id, changes) => {
        const index = store.dailyStats.findIndex((s) => s.id === id);
        if (index !== -1) {
          store.dailyStats[index] = { ...store.dailyStats[index], ...changes };
        }
        return Promise.resolve(index !== -1 ? 1 : 0);
      }),
      delete: vi.fn((id) => {
        const index = store.dailyStats.findIndex((s) => s.id === id);
        if (index !== -1) store.dailyStats.splice(index, 1);
        return Promise.resolve();
      }),
      toArray: vi.fn(() => Promise.resolve([...store.dailyStats])),
      where: vi.fn((field) => ({
        equals: vi.fn((value) => ({
          first: vi.fn(() =>
            Promise.resolve(store.dailyStats.find((s) => s[field] === value)),
          ),
          and: vi.fn((filterFn) => ({
            toArray: vi.fn(() =>
              Promise.resolve(
                store.dailyStats
                  .filter((s) => s[field] === value)
                  .filter(filterFn),
              ),
            ),
          })),
        })),
      })),
      clear: vi.fn(() => {
        store.dailyStats.length = 0;
        return Promise.resolve();
      }),
      bulkDelete: vi.fn((ids) => {
        ids.forEach((id: string) => {
          const index = store.dailyStats.findIndex((s) => s.id === id);
          if (index !== -1) store.dailyStats.splice(index, 1);
        });
        return Promise.resolve();
      }),
    },
    achievements: {
      add: vi.fn((item) => {
        store.achievements.push(item);
        return Promise.resolve(item.id);
      }),
      get: vi.fn((id) =>
        Promise.resolve(store.achievements.find((a) => a.id === id)),
      ),
      update: vi.fn((id, changes) => {
        const index = store.achievements.findIndex((a) => a.id === id);
        if (index !== -1) {
          store.achievements[index] = {
            ...store.achievements[index],
            ...changes,
          };
        }
        return Promise.resolve(index !== -1 ? 1 : 0);
      }),
      delete: vi.fn((id) => {
        const index = store.achievements.findIndex((a) => a.id === id);
        if (index !== -1) store.achievements.splice(index, 1);
        return Promise.resolve();
      }),
      toArray: vi.fn(() => Promise.resolve([...store.achievements])),
      where: vi.fn((criteria) => ({
        equals: vi.fn((value) => ({
          first: vi.fn(() =>
            Promise.resolve(
              store.achievements.find((a) => {
                if (typeof criteria === "string") {
                  return a[criteria] === value;
                }
                return Object.entries(criteria).every(([k, v]) => a[k] === v);
              }),
            ),
          ),
          and: vi.fn((filterFn) => ({
            toArray: vi.fn(() =>
              Promise.resolve(
                store.achievements
                  .filter((a) => {
                    if (typeof criteria === "string") {
                      return a[criteria] === value;
                    }
                    return Object.entries(criteria).every(
                      ([k, v]) => a[k] === v,
                    );
                  })
                  .filter(filterFn),
              ),
            ),
          })),
        })),
      })),
      clear: vi.fn(() => {
        store.achievements.length = 0;
        return Promise.resolve();
      }),
    },
    mockInterviewSessions: {
      add: vi.fn((item) => {
        store.mockInterviewSessions.push(item);
        return Promise.resolve(item.id);
      }),
      get: vi.fn((id) =>
        Promise.resolve(store.mockInterviewSessions.find((s) => s.id === id)),
      ),
      update: vi.fn((id, changes) => {
        const index = store.mockInterviewSessions.findIndex((s) => s.id === id);
        if (index !== -1) {
          store.mockInterviewSessions[index] = {
            ...store.mockInterviewSessions[index],
            ...changes,
          };
        }
        return Promise.resolve(index !== -1 ? 1 : 0);
      }),
      delete: vi.fn((id) => {
        const index = store.mockInterviewSessions.findIndex((s) => s.id === id);
        if (index !== -1) store.mockInterviewSessions.splice(index, 1);
        return Promise.resolve();
      }),
      toArray: vi.fn(() => Promise.resolve([...store.mockInterviewSessions])),
      where: vi.fn((field) => ({
        equals: vi.fn((value) => ({
          reverse: vi.fn(() => ({
            toArray: vi.fn(() =>
              Promise.resolve(
                store.mockInterviewSessions
                  .filter((s) => s[field] === value)
                  .reverse(),
              ),
            ),
          })),
          and: vi.fn((filterFn) => ({
            first: vi.fn(() =>
              Promise.resolve(
                store.mockInterviewSessions
                  .filter((s) => s[field] === value)
                  .filter(filterFn)[0],
              ),
            ),
            toArray: vi.fn(() =>
              Promise.resolve(
                store.mockInterviewSessions
                  .filter((s) => s[field] === value)
                  .filter(filterFn),
              ),
            ),
          })),
        })),
      })),
      clear: vi.fn(() => {
        store.mockInterviewSessions.length = 0;
        return Promise.resolve();
      }),
    },
    dailyQuests: {
      add: vi.fn((item) => {
        store.dailyQuests.push(item);
        return Promise.resolve(item.id);
      }),
      get: vi.fn((id) =>
        Promise.resolve(store.dailyQuests.find((q) => q.id === id)),
      ),
      update: vi.fn((id, changes) => {
        const index = store.dailyQuests.findIndex((q) => q.id === id);
        if (index !== -1) {
          store.dailyQuests[index] = {
            ...store.dailyQuests[index],
            ...changes,
          };
        }
        return Promise.resolve(index !== -1 ? 1 : 0);
      }),
      delete: vi.fn((id) => {
        const index = store.dailyQuests.findIndex((q) => q.id === id);
        if (index !== -1) store.dailyQuests.splice(index, 1);
        return Promise.resolve();
      }),
      toArray: vi.fn(() => Promise.resolve([...store.dailyQuests])),
      where: vi.fn((field) => ({
        equals: vi.fn((value) => ({
          reverse: vi.fn(() => ({
            toArray: vi.fn(() =>
              Promise.resolve(
                store.dailyQuests.filter((q) => q[field] === value).reverse(),
              ),
            ),
          })),
          and: vi.fn((filterFn) => ({
            toArray: vi.fn(() =>
              Promise.resolve(
                store.dailyQuests
                  .filter((q) => q[field] === value)
                  .filter(filterFn),
              ),
            ),
          })),
        })),
      })),
      clear: vi.fn(() => {
        store.dailyQuests.length = 0;
        return Promise.resolve();
      }),
    },
    appSettings: {
      add: vi.fn((item) => {
        store.appSettings.push(item);
        return Promise.resolve(item.id);
      }),
      get: vi.fn((id) =>
        Promise.resolve(store.appSettings.find((s) => s.id === id)),
      ),
      put: vi.fn((item) => {
        const index = store.appSettings.findIndex((s) => s.id === item.id);
        if (index !== -1) {
          store.appSettings[index] = item;
        } else {
          store.appSettings.push(item);
        }
        return Promise.resolve(item.id);
      }),
      update: vi.fn((id, changes) => {
        const index = store.appSettings.findIndex((s) => s.id === id);
        if (index !== -1) {
          store.appSettings[index] = {
            ...store.appSettings[index],
            ...changes,
          };
        }
        return Promise.resolve(index !== -1 ? 1 : 0);
      }),
      delete: vi.fn((id) => {
        const index = store.appSettings.findIndex((s) => s.id === id);
        if (index !== -1) store.appSettings.splice(index, 1);
        return Promise.resolve();
      }),
      toArray: vi.fn(() => Promise.resolve([...store.appSettings])),
      where: vi.fn((field) => ({
        equals: vi.fn((value) => ({
          first: vi.fn(() =>
            Promise.resolve(store.appSettings.find((s) => s[field] === value)),
          ),
        })),
      })),
      clear: vi.fn(() => {
        store.appSettings.length = 0;
        return Promise.resolve();
      }),
      count: vi.fn(() => Promise.resolve(store.appSettings.length)),
    },
    open: vi.fn(() => Promise.resolve()),
    bulkPut: vi.fn((items, table) => {
      items.forEach((item: any) => {
        const index = store[table].findIndex((i: any) => i.id === item.id);
        if (index !== -1) {
          store[table][index] = item;
        } else {
          store[table].push(item);
        }
      });
      return Promise.resolve();
    }),
    _store: store, // Expose for test inspection
  };
};

// Test data factories
export const factories = {
  user: (overrides = {}) => createMockUser(overrides),
  conversation: (overrides = {}) => createMockConversation(overrides),
  progress: (overrides = {}) => createMockProgress(overrides),
  dailyStats: (overrides = {}) => createMockDailyStats(overrides),
};
