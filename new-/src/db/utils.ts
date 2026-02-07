import { db } from "./schema";
import { databaseManager } from "./manager";
import {
  userProfileDAO,
  conversationDAO,
  progressDAO,
  dailyStatsDAO,
  achievementDAO,
  mockInterviewSessionDAO,
  dailyQuestDAO,
} from "./dao";
import type {
  UserProfile,
  Conversation,
  MockInterviewSession,
  DailyQuest,
} from "./schema";

/**
 * Database utility functions for common operations
 */

export class DatabaseUtils {
  /**
   * Initialize database for a new user
   */
  static async initializeUser(
    userData: Partial<UserProfile>,
  ): Promise<UserProfile> {
    await databaseManager.initialize();
    return await databaseManager.createUserProfile(userData);
  }

  /**
   * Complete a conversation and update all related data
   */
  static async completeConversation(
    conversation: Omit<Conversation, "id" | "timestamp">,
    score: number,
    timeSpent: number,
  ): Promise<Conversation> {
    // Create the conversation
    const newConversation = await conversationDAO.create({
      ...conversation,
      score,
      timeSpent,
    });

    // Update user progress for this question
    await this.updateQuestionProgress(
      conversation.userId,
      conversation.questionId,
      score,
    );

    // Update user stats
    await this.updateUserStats(conversation.userId, score, timeSpent);

    // Check for achievements
    await this.checkAchievements(conversation.userId);

    return newConversation;
  }

  /**
   * Update question progress using SRS algorithm
   */
  static async updateQuestionProgress(
    userId: string,
    questionId: string,
    score: number,
  ): Promise<void> {
    const progress = await progressDAO.getById(`${userId}-${questionId}`);

    if (!progress) {
      // Create new progress entry with composite ID for multi-user support
      await progressDAO.create({
        id: `${userId}-${questionId}`,
        userId,
        attempts: 0,
        bestScore: 0,
        averageScore: 0,
        lastScore: 0,
        lastAttempt: new Date(),
        nextReview: new Date(),
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        status: "new",
        mastered: false,
        weakKeyPoints: [],
        needsVoicePractice: score < 70,
      });
    }

    // Update score and SRS data
    const progressId = `${userId}-${questionId}`;
    await progressDAO.updateScore(progressId, score);
    await progressDAO.updateSRS(progressId, score);
  }

  /**
   * Update user daily stats and profile
   */
  static async updateUserStats(
    userId: string,
    score: number,
    timeSpent: number,
  ): Promise<void> {
    const today = new Date();
    const isCorrect = score >= 70;

    // Update daily stats
    await dailyStatsDAO.incrementStats(userId, today, {
      questionsAnswered: 1,
      questionsCorrect: isCorrect ? 1 : 0,
      totalScore: score,
      xpEarned: this.calculateXP(score),
      creditsEarned: this.calculateCredits(score),
      timeSpent,
      sessionsCount: 1,
    });

    // Update user profile
    await userProfileDAO.addXP(userId, this.calculateXP(score));
    await userProfileDAO.addCredits(userId, this.calculateCredits(score));
    await userProfileDAO.updateLastActive(userId);
  }

  /**
   * Calculate XP based on performance
   */
  static calculateXP(score: number): number {
    if (score >= 90) return 50;
    if (score >= 80) return 30;
    if (score >= 70) return 20;
    if (score >= 60) return 10;
    return 5;
  }

  /**
   * Calculate credits based on performance
   */
  static calculateCredits(score: number): number {
    if (score >= 90) return 10;
    if (score >= 80) return 7;
    if (score >= 70) return 5;
    if (score >= 60) return 3;
    return 1;
  }

  /**
   * Check and unlock achievements
   */
  static async checkAchievements(userId: string): Promise<void> {
    const profile = await userProfileDAO.getById(userId);
    if (!profile) return;

    const stats = await dailyStatsDAO.getWeeklyStats(userId);
    const progressStats = await progressDAO.getStats(userId);
    const conversationStats = await conversationDAO.getStatsByTimeRange(
      userId,
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      new Date(),
    );

    // Check various achievements
    await this.checkFirstConversation(userId, conversationStats.total);
    await this.checkStreakAchievement(userId, profile.streak);
    await this.checkMasteryAchievement(userId, progressStats.masteryRate);
    await this.checkWeeklyGoal(userId, stats);
    await this.checkVoicePractice(userId, conversationStats.voiceCount);
  }

  private static async checkFirstConversation(
    userId: string,
    totalConversations: number,
  ): Promise<void> {
    if (totalConversations === 1) {
      await this.unlockAchievement(
        userId,
        "first-conversation",
        "First Conversation",
        "Complete your first interview question",
      );
    }
  }

  private static async checkStreakAchievement(
    userId: string,
    streak: number,
  ): Promise<void> {
    const streakMilestones = [3, 7, 14, 30, 60, 100];
    for (const milestone of streakMilestones) {
      if (streak >= milestone) {
        const achievementId = `streak-${milestone}`;
        const existing = await achievementDAO.getByAchievementId(
          userId,
          achievementId,
        );
        if (!existing || !existing.unlocked) {
          await this.unlockAchievement(
            userId,
            achievementId,
            `${milestone} Day Streak`,
            `Maintain a ${milestone} day streak`,
          );
        }
      }
    }
  }

  private static async checkMasteryAchievement(
    userId: string,
    masteryRate: number,
  ): Promise<void> {
    if (masteryRate >= 10) {
      await this.unlockAchievement(
        userId,
        "master-10",
        "Novice Master",
        "Master 10% of questions",
      );
    }
    if (masteryRate >= 25) {
      await this.unlockAchievement(
        userId,
        "master-25",
        "Apprentice Master",
        "Master 25% of questions",
      );
    }
    if (masteryRate >= 50) {
      await this.unlockAchievement(
        userId,
        "master-50",
        "Journeyman Master",
        "Master 50% of questions",
      );
    }
    if (masteryRate >= 75) {
      await this.unlockAchievement(
        userId,
        "master-75",
        "Expert Master",
        "Master 75% of questions",
      );
    }
  }

  private static async checkWeeklyGoal(
    userId: string,
    weeklyStats: any,
  ): Promise<void> {
    const profile = await userProfileDAO.getById(userId);
    if (profile && weeklyStats.timeSpent >= profile.weeklyGoalMinutes * 60) {
      await this.unlockAchievement(
        userId,
        "weekly-goal",
        "Weekly Champion",
        "Meet your weekly practice goal",
      );
    }
  }

  private static async checkVoicePractice(
    userId: string,
    voiceCount: number,
  ): Promise<void> {
    const voiceMilestones = [1, 5, 10, 25, 50, 100];
    for (const milestone of voiceMilestones) {
      if (voiceCount === milestone) {
        await this.unlockAchievement(
          userId,
          `voice-${milestone}`,
          `Voice Master ${milestone}`,
          `Complete ${milestone} voice practice sessions`,
        );
      }
    }
  }

  private static async unlockAchievement(
    userId: string,
    achievementId: string,
    name: string,
    description: string,
  ): Promise<void> {
    let achievement = await achievementDAO.getByAchievementId(
      userId,
      achievementId,
    );

    if (!achievement) {
      achievement = await achievementDAO.create({
        userId,
        achievementId,
        name,
        description,
        icon: "🏆",
        tier: "bronze",
        progress: 0,
        threshold: 1,
        currentValue: 0,
        unlocked: false,
        seen: false,
        xpReward: 100,
        creditsReward: 20,
      });
    }

    if (!achievement.unlocked) {
      await achievementDAO.unlock(achievement.id);
      await userProfileDAO.addXP(userId, achievement.xpReward);
      await userProfileDAO.addCredits(userId, achievement.creditsReward);
    }
  }

  /**
   * Get user dashboard data
   */
  static async getDashboardData(userId: string): Promise<any> {
    const [
      profile,
      recentConversations,
      progress,
      weeklyStats,
      achievements,
      quests,
    ] = await Promise.all([
      userProfileDAO.getById(userId),
      conversationDAO.getByUserId(userId, 5),
      progressDAO.getByUserId(userId),
      dailyStatsDAO.getWeeklyStats(userId),
      achievementDAO.getUnseen(userId),
      dailyQuestDAO.getAvailable(userId),
    ]);

    const progressStats = await progressDAO.getStats(userId);
    const dueForReview = await progressDAO.getDueForReview(userId);

    return {
      profile,
      recentConversations,
      progress,
      weeklyStats,
      progressStats,
      dueForReview,
      achievements,
      quests,
    };
  }

  /**
   * Get questions for practice (due for review + new questions)
   */
  static async getPracticeQuestions(
    userId: string,
    limit: number = 10,
  ): Promise<string[]> {
    const dueForReview = await progressDAO.getDueForReview(userId);

    // Get question IDs that are due for review
    const reviewIds = dueForReview.map((p) => p.id);

    // Get some new questions (simplified - in real app would use question DB)
    const newQuestionCount = Math.max(0, limit - reviewIds.length);
    const newIds = Array.from({ length: newQuestionCount }, () =>
      crypto.randomUUID(),
    );

    return [...reviewIds, ...newIds].slice(0, limit);
  }

  /**
   * Start a mock interview session
   */
  static async startMockInterview(
    userId: string,
    type: MockInterviewSession["type"],
    company: string,
    difficulty: MockInterviewSession["difficulty"],
    duration: number,
  ): Promise<MockInterviewSession> {
    // Get appropriate questions for the interview
    const questionIds = await this.getInterviewQuestions(type, difficulty, 5);

    return await mockInterviewSessionDAO.create({
      userId,
      type,
      company,
      difficulty,
      duration,
      questionIds,
      currentQuestionIndex: 0,
      overallScore: 0,
      breakdown: {
        problemSolving: 0,
        communication: 0,
        technicalDepth: 0,
        systemDesign: type === "system-design" ? 0 : undefined,
        behavioralSTAR: type === "behavioral" ? 0 : undefined,
      },
      conversationIds: [],
      status: "in-progress",
      detailedFeedback: {
        strengths: [],
        improvements: [],
        recommendedNext: [],
      },
    });
  }

  private static async getInterviewQuestions(
    _type: MockInterviewSession["type"],
    _difficulty: MockInterviewSession["difficulty"],
    count: number,
  ): Promise<string[]> {
    // Simplified - in real app would query question database
    return Array.from({ length: count }, () => crypto.randomUUID());
  }

  /**
   * Process daily quest completion
   */
  static async processDailyQuest(
    userId: string,
    questType: DailyQuest["questType"],
  ): Promise<void> {
    const today = new Date();
    const quests = await dailyQuestDAO.getByDate(userId, today);
    const quest = quests.find((q) => q.questType === questType);

    if (quest && quest.status === "in-progress") {
      // This would be called after each question in the quest
      // For now, just mark as complete
      await dailyQuestDAO.completeQuest(quest.id);

      // Award quest rewards
      await userProfileDAO.addXP(userId, quest.xpReward);
      await userProfileDAO.addCredits(userId, quest.creditsReward);
    }
  }

  /**
   * Update user streak
   */
  static async updateStreak(userId: string): Promise<void> {
    const profile = await userProfileDAO.getById(userId);
    if (!profile) return;

    const today = new Date();
    const lastActive = new Date(profile.lastActiveDate);
    const daysDiff = Math.floor(
      (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
    );

    let newStreak = profile.streak;

    if (daysDiff === 1) {
      // User continued the streak
      newStreak += 1;
    } else if (daysDiff > 1) {
      // Streak broken
      newStreak = 1;
    }
    // If daysDiff === 0, already active today, don't change streak

    await userProfileDAO.updateStreak(userId, newStreak);
  }

  /**
   * Get user analytics
   */
  static async getUserAnalytics(
    userId: string,
    days: number = 30,
  ): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const [dailyStats, conversations, progress, achievements] =
      await Promise.all([
        dailyStatsDAO.getByDateRange(userId, startDate, endDate),
        conversationDAO.getStatsByTimeRange(userId, startDate, endDate),
        progressDAO.getByUserId(userId),
        achievementDAO.getByUserId(userId),
      ]);

    return {
      period: { days, startDate, endDate },
      dailyStats,
      conversations,
      progress,
      achievements,
      summary: {
        totalQuestions: conversations.total,
        averageScore: conversations.averageScore,
        totalTime: conversations.totalTime,
        xpEarned: dailyStats.reduce((sum, stat) => sum + stat.xpEarned, 0),
        creditsEarned: dailyStats.reduce(
          (sum, stat) => sum + stat.creditsEarned,
          0,
        ),
        achievementsUnlocked: achievements.filter((a) => a.unlocked).length,
        masteryRate:
          (progress.filter((p) => p.mastered).length / progress.length) * 100,
      },
    };
  }

  /**
   * Cleanup old data
   */
  static async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    // Clean up old conversations
    const oldConversations = await db.conversations
      .where("timestamp")
      .below(cutoffDate)
      .toArray();

    if (oldConversations.length > 0) {
      await db.conversations.bulkDelete(oldConversations.map((c) => c.id));
    }

    // Clean up old daily stats
    const oldStats = await db.dailyStats
      .where("date")
      .below(cutoffDate)
      .toArray();

    if (oldStats.length > 0) {
      await db.dailyStats.bulkDelete(oldStats.map((s) => s.id));
    }

    console.log(
      `Cleaned up ${oldConversations.length} old conversations and ${oldStats.length} old stats`,
    );
  }
}

export default DatabaseUtils;
