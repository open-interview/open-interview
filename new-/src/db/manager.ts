import { db } from "./schema";
import type { UserProfile, AppSettings } from "./schema";

/**
 * Database initialization and migration utilities
 */

export class DatabaseManager {
  private static instance: DatabaseManager;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize the database and run migrations
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await db.open();
      console.log("Database opened successfully");

      // Run any necessary migrations
      await this.runMigrations();

      this.isInitialized = true;
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    try {
      const settingsCount = await db.appSettings.count();
      if (settingsCount === 0) {
        console.log("Creating default app settings");
      }
    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    }
  }

  /**
   * Create a new user profile with default settings
   */
  async createUserProfile(
    userData: Partial<UserProfile>,
  ): Promise<UserProfile> {
    const now = new Date();
    const defaultProfile: UserProfile = {
      id: crypto.randomUUID(),
      targetCompanies: [],
      targetRole: "",
      experienceLevel: "entry",
      weeklyGoalMinutes: 300,
      xp: 0,
      level: 1,
      credits: 100,
      streak: 0,
      lastActiveDate: now,
      voiceEnabled: true,
      aiVoice: "professional-female",
      difficulty: "adaptive",
      theme: "system",
      isPremium: false,
      createdAt: now,
      updatedAt: now,
      ...userData,
    };

    await db.userProfiles.add(defaultProfile);
    await this.createDefaultSettings(defaultProfile.id);

    return defaultProfile;
  }

  /**
   * Create default app settings for a new user
   */
  private async createDefaultSettings(userId: string): Promise<void> {
    const defaultSettings: AppSettings = {
      id: "settings",
      userId,
      preferredModel: "llama-3.2-3b",
      modelLoadStrategy: "lazy",
      enableAnimations: true,
      reducedMotion: false,
      offlineMode: false,
      allowAnalytics: true,
      allowCrashReports: true,
      enableNotifications: true,
      streakReminders: true,
      questReminders: true,
      aiPersonality: "professional",
      followUpQuestions: true,
      detailedFeedback: true,
      updatedAt: new Date(),
    };

    await db.appSettings.add(defaultSettings);
  }

  /**
   * Clear all data (for development/testing)
   */
  async clearAllData(): Promise<void> {
    await db.userProfiles.clear();
    await db.conversations.clear();
    await db.progress.clear();
    await db.dailyStats.clear();
    await db.achievements.clear();
    await db.mockInterviewSessions.clear();
    await db.dailyQuests.clear();
    await db.appSettings.clear();
  }

  /**
   * Export user data for backup
   */
  async exportUserData(userId: string): Promise<any> {
    const profile = await db.userProfiles.where("id").equals(userId).first();
    const conversations = await db.conversations
      .where("userId")
      .equals(userId)
      .toArray();
    const progress = await db.progress.where("userId").equals(userId).toArray();
    const dailyStats = await db.dailyStats
      .where("userId")
      .equals(userId)
      .toArray();
    const achievements = await db.achievements
      .where("userId")
      .equals(userId)
      .toArray();
    const sessions = await db.mockInterviewSessions
      .where("userId")
      .equals(userId)
      .toArray();
    const quests = await db.dailyQuests
      .where("userId")
      .equals(userId)
      .toArray();
    const settings = await db.appSettings
      .where("userId")
      .equals(userId)
      .first();

    return {
      profile,
      conversations,
      progress,
      dailyStats,
      achievements,
      sessions,
      quests,
      settings,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Import user data from backup
   */
  async importUserData(userData: any): Promise<void> {
    if (userData.profile) {
      await db.userProfiles.put(userData.profile);
    }
    if (userData.conversations) {
      await db.conversations.bulkPut(userData.conversations);
    }
    if (userData.progress) {
      await db.progress.bulkPut(userData.progress);
    }
    if (userData.dailyStats) {
      await db.dailyStats.bulkPut(userData.dailyStats);
    }
    if (userData.achievements) {
      await db.achievements.bulkPut(userData.achievements);
    }
    if (userData.sessions) {
      await db.mockInterviewSessions.bulkPut(userData.sessions);
    }
    if (userData.quests) {
      await db.dailyQuests.bulkPut(userData.quests);
    }
    if (userData.settings) {
      await db.appSettings.put(userData.settings);
    }
  }

  /**
   * Check if database is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await db.userProfiles.limit(1).toArray();
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    const userCount = await db.userProfiles.count();
    const conversationCount = await db.conversations.count();
    const progressCount = await db.progress.count();
    const statsCount = await db.dailyStats.count();
    const achievementCount = await db.achievements.count();
    const sessionCount = await db.mockInterviewSessions.count();
    const questCount = await db.dailyQuests.count();

    return {
      users: userCount,
      conversations: conversationCount,
      progress: progressCount,
      dailyStats: statsCount,
      achievements: achievementCount,
      sessions: sessionCount,
      quests: questCount,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();
