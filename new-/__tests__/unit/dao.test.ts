import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  UserProfileDAO,
  ConversationDAO,
  ProgressDAO,
  DailyStatsDAO,
  AchievementDAO,
  MockInterviewSessionDAO,
  DailyQuestDAO,
  AppSettingsDAO,
} from "../../src/db/dao";
import {
  createMockDB,
  mockDate,
  mockUserProfile,
  mockConversation,
  mockProgress,
  mockDailyStats,
  mockAchievement,
  mockAppSettings,
} from "../mocks/test-utils";

describe("UserProfileDAO", () => {
  let dao: UserProfileDAO;
  let mockDB: ReturnType<typeof createMockDB>;

  beforeEach(() => {
    mockDB = createMockDB();
    vi.doMock("../../src/db/schema", () => ({ db: mockDB }));
    dao = new UserProfileDAO();
  });

  describe("create", () => {
    it("should create a new user profile with generated ID and timestamps", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        targetCompanies: ["Google"],
        targetRole: "Engineer",
        experienceLevel: "mid" as const,
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
      };

      const result = await dao.create(userData);

      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.username).toBe("testuser");
      expect(mockDB.userProfiles.add).toHaveBeenCalledWith(
        expect.objectContaining(userData),
      );
    });
  });

  describe("getById", () => {
    it("should return user by ID", async () => {
      const user = { ...mockUserProfile };
      await mockDB.userProfiles.add(user);

      const result = await dao.getById("user-1");

      expect(result).toEqual(user);
    });

    it("should return undefined for non-existent user", async () => {
      const result = await dao.getById("non-existent");

      expect(result).toBeUndefined();
    });
  });

  describe("addXP", () => {
    it("should add XP and update level correctly", async () => {
      const user = { ...mockUserProfile, xp: 50, level: 1 };
      await mockDB.userProfiles.add(user);

      await dao.addXP("user-1", 60);

      const updated = await mockDB.userProfiles.get("user-1");
      expect(updated.xp).toBe(110);
      expect(updated.level).toBe(2);
    });

    it("should handle level progression correctly", async () => {
      const user = { ...mockUserProfile, xp: 190, level: 2 };
      await mockDB.userProfiles.add(user);

      await dao.addXP("user-1", 20);

      const updated = await mockDB.userProfiles.get("user-1");
      expect(updated.xp).toBe(210);
      expect(updated.level).toBe(3);
    });
  });

  describe("addCredits", () => {
    it("should add credits to user", async () => {
      const user = { ...mockUserProfile, credits: 100 };
      await mockDB.userProfiles.add(user);

      await dao.addCredits("user-1", 50);

      const updated = await mockDB.userProfiles.get("user-1");
      expect(updated.credits).toBe(150);
    });
  });

  describe("updateStreak", () => {
    it("should update streak and last active date", async () => {
      const user = { ...mockUserProfile, streak: 5 };
      await mockDB.userProfiles.add(user);

      await dao.updateStreak("user-1", 6);

      const updated = await mockDB.userProfiles.get("user-1");
      expect(updated.streak).toBe(6);
      expect(updated.lastActiveDate).toBeInstanceOf(Date);
    });
  });
});

describe("ConversationDAO", () => {
  let dao: ConversationDAO;
  let mockDB: ReturnType<typeof createMockDB>;

  beforeEach(() => {
    mockDB = createMockDB();
    vi.doMock("../../src/db/schema", () => ({ db: mockDB }));
    dao = new ConversationDAO();
  });

  describe("create", () => {
    it("should create conversation with timestamp", async () => {
      const convData = {
        userId: "user-1",
        questionId: "q-1",
        questionText: "Test?",
        expectedAnswer: "Answer",
        expectedKeyPoints: ["point1"],
        userAnswer: "My answer",
        responseMode: "text" as const,
        aiFollowups: [],
        score: 85,
        keyPointsCovered: ["point1"],
        keyPointsMissing: [],
        feedback: { strengths: [], improvements: [], overallComment: "" },
        timeSpent: 120,
        hintsUsed: 0,
        attemptsCount: 1,
      };

      const result = await dao.create(convData);

      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.score).toBe(85);
    });
  });

  describe("getStatsByTimeRange", () => {
    it("should calculate correct statistics", async () => {
      const conversations = [
        {
          ...mockConversation,
          score: 80,
          timeSpent: 100,
          responseMode: "voice",
        },
        {
          ...mockConversation,
          id: "conv-2",
          score: 90,
          timeSpent: 120,
          responseMode: "text",
        },
      ];

      for (const conv of conversations) {
        await mockDB.conversations.add(conv);
      }

      const stats = await dao.getStatsByTimeRange(
        "user-1",
        new Date("2024-01-01"),
        new Date("2024-12-31"),
      );

      expect(stats.total).toBe(2);
      expect(stats.averageScore).toBe(85);
      expect(stats.totalTime).toBe(220);
      expect(stats.voiceCount).toBe(1);
      expect(stats.textCount).toBe(1);
    });

    it("should handle empty results", async () => {
      const stats = await dao.getStatsByTimeRange(
        "user-1",
        new Date("2024-01-01"),
        new Date("2024-12-31"),
      );

      expect(stats.total).toBe(0);
      expect(stats.averageScore).toBe(0);
    });
  });
});

describe("ProgressDAO", () => {
  let dao: ProgressDAO;
  let mockDB: ReturnType<typeof createMockDB>;

  beforeEach(() => {
    mockDB = createMockDB();
    vi.doMock("../../src/db/schema", () => ({ db: mockDB }));
    dao = new ProgressDAO();
  });

  describe("updateScore", () => {
    it("should update scores correctly", async () => {
      const progress = {
        ...mockProgress,
        attempts: 2,
        bestScore: 80,
        averageScore: 75,
      };
      await mockDB.progress.add(progress);

      await dao.updateScore("progress-1", 90);

      const updated = await mockDB.progress.get("progress-1");
      expect(updated.attempts).toBe(3);
      expect(updated.bestScore).toBe(90);
      expect(updated.averageScore).toBe(80);
    });
  });

  describe("updateSRS", () => {
    it("should increase interval for good scores", async () => {
      const progress = {
        ...mockProgress,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 2,
        status: "learning" as const,
        mastered: false,
      };
      await mockDB.progress.add(progress);

      await dao.updateSRS("progress-1", 85);

      const updated = await mockDB.progress.get("progress-1");
      expect(updated.repetitions).toBe(3);
      expect(updated.interval).toBeGreaterThan(1);
      expect(updated.mastered).toBe(true);
    });

    it("should reset for poor scores", async () => {
      const progress = {
        ...mockProgress,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 3,
        mastered: true,
      };
      await mockDB.progress.add(progress);

      await dao.updateSRS("progress-1", 60);

      const updated = await mockDB.progress.get("progress-1");
      expect(updated.repetitions).toBe(0);
      expect(updated.interval).toBe(1);
      expect(updated.mastered).toBe(false);
    });
  });

  describe("getStats", () => {
    it("should return correct statistics", async () => {
      const progressItems = [
        { ...mockProgress, mastered: true, status: "mastered" as const },
        {
          ...mockProgress,
          id: "prog-2",
          mastered: false,
          status: "learning" as const,
        },
        {
          ...mockProgress,
          id: "prog-3",
          mastered: false,
          status: "new" as const,
        },
      ];

      for (const item of progressItems) {
        await mockDB.progress.add(item);
      }

      const stats = await dao.getStats("user-1");

      expect(stats.total).toBe(3);
      expect(stats.mastered).toBe(1);
      expect(stats.learning).toBe(1);
      expect(stats.new).toBe(1);
      expect(stats.masteryRate).toBeCloseTo(33.33, 1);
    });

    it("BUG: should handle zero total (division by zero)", async () => {
      const stats = await dao.getStats("user-1");

      expect(stats.total).toBe(0);
      expect(stats.masteryRate).toBeNaN(); // This is a bug - should be 0
    });
  });
});

describe("DailyStatsDAO", () => {
  let dao: DailyStatsDAO;
  let mockDB: ReturnType<typeof createMockDB>;

  beforeEach(() => {
    mockDB = createMockDB();
    vi.doMock("../../src/db/schema", () => ({ db: mockDB }));
    dao = new DailyStatsDAO();
  });

  describe("create", () => {
    it("should create stats with date-based ID", async () => {
      const statsData = {
        userId: "user-1",
        date: new Date("2024-01-15"),
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

      const result = await dao.create(statsData);

      expect(result.id).toBe("2024-01-15");
    });
  });

  describe("incrementStats", () => {
    it("should increment existing stats", async () => {
      const existing = {
        ...mockDailyStats,
        questionsAnswered: 5,
        totalScore: 400,
      };
      await mockDB.dailyStats.add(existing);

      await dao.incrementStats("user-1", mockDate, {
        questionsAnswered: 3,
        totalScore: 240,
      });

      const updated = await mockDB.dailyStats.get("2024-01-01");
      expect(updated.questionsAnswered).toBe(8);
      expect(updated.totalScore).toBe(640);
      expect(updated.averageScore).toBe(80);
    });

    it("should create new stats if not exists", async () => {
      await dao.incrementStats("user-1", mockDate, {
        questionsAnswered: 5,
        totalScore: 400,
      });

      const created = await mockDB.dailyStats.get("2024-01-01");
      expect(created).toBeDefined();
      expect(created.questionsAnswered).toBe(5);
    });
  });
});

describe("AchievementDAO", () => {
  let dao: AchievementDAO;
  let mockDB: ReturnType<typeof createMockDB>;

  beforeEach(() => {
    mockDB = createMockDB();
    vi.doMock("../../src/db/schema", () => ({ db: mockDB }));
    dao = new AchievementDAO();
  });

  describe("updateProgress", () => {
    it("should update progress and unlock when threshold reached", async () => {
      const achievement = {
        ...mockAchievement,
        threshold: 10,
        currentValue: 0,
        unlocked: false,
      };
      await mockDB.achievements.add(achievement);

      await dao.updateProgress("ach-1", 10);

      const updated = await mockDB.achievements.get("ach-1");
      expect(updated.progress).toBe(100);
      expect(updated.unlocked).toBe(true);
      expect(updated.unlockedAt).toBeInstanceOf(Date);
    });
  });
});
