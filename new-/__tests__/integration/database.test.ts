import { describe, it, expect, beforeEach, vi } from "vitest";
import { DatabaseManager } from "../../src/db/manager";
import { createMockDB, mockUserProfile } from "../mocks/test-utils";

describe("Database Integration Tests", () => {
  let mockDB: ReturnType<typeof createMockDB>;
  let manager: DatabaseManager;

  beforeEach(() => {
    mockDB = createMockDB();
    vi.doMock("../../src/db/schema", () => ({ db: mockDB }));
    manager = DatabaseManager.getInstance();
  });

  describe("User Data Flow", () => {
    it("should create user and all related data", async () => {
      // Create user
      const userData = {
        username: "testuser",
        email: "test@example.com",
        targetCompanies: ["Google", "Meta"],
        targetRole: "Senior Engineer",
        experienceLevel: "senior" as const,
      };

      const user = await manager.createUserProfile(userData);

      expect(user.id).toBeDefined();
      expect(user.xp).toBe(0);
      expect(user.level).toBe(1);
      expect(user.credits).toBe(100);

      // Verify settings were created
      const settings = await mockDB.appSettings.toArray();
      expect(settings).toHaveLength(1);
      expect(settings[0].userId).toBe(user.id);
    });

    it("should export all user data", async () => {
      // Setup user with data
      const user = { ...mockUserProfile };
      await mockDB.userProfiles.add(user);

      await mockDB.conversations.add({
        id: "conv-1",
        userId: user.id,
        questionId: "q-1",
        questionText: "Test?",
        expectedAnswer: "Answer",
        expectedKeyPoints: [],
        userAnswer: "My answer",
        responseMode: "text",
        aiFollowups: [],
        score: 80,
        keyPointsCovered: [],
        keyPointsMissing: [],
        feedback: { strengths: [], improvements: [], overallComment: "" },
        timeSpent: 100,
        hintsUsed: 0,
        attemptsCount: 1,
        timestamp: new Date(),
      });

      const exported = await manager.exportUserData(user.id);

      expect(exported.profile).toBeDefined();
      expect(exported.conversations).toHaveLength(1);
      expect(exported.exportedAt).toBeDefined();
    });

    it("should import user data", async () => {
      const dataToImport = {
        profile: mockUserProfile,
        conversations: [],
        progress: [],
        dailyStats: [],
        achievements: [],
        sessions: [],
        quests: [],
        settings: null,
      };

      await manager.importUserData(dataToImport);

      const imported = await mockDB.userProfiles.get(mockUserProfile.id);
      expect(imported).toEqual(mockUserProfile);
    });
  });

  describe("Data Cleanup", () => {
    it("should clear all data", async () => {
      // Add some data
      await mockDB.userProfiles.add(mockUserProfile);
      await mockDB.conversations.add({ id: "conv-1", userId: "user-1" } as any);
      await mockDB.progress.add({ id: "prog-1", userId: "user-1" } as any);

      await manager.clearAllData();

      expect(await mockDB.userProfiles.toArray()).toHaveLength(0);
      expect(await mockDB.conversations.toArray()).toHaveLength(0);
      expect(await mockDB.progress.toArray()).toHaveLength(0);
    });
  });

  describe("Health Check", () => {
    it("should return true for healthy database", async () => {
      const isHealthy = await manager.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it("should return false for unhealthy database", async () => {
      mockDB.userProfiles.limit = vi.fn(() => {
        throw new Error("Database error");
      });

      const isHealthy = await manager.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });
});
