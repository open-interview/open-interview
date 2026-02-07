import { db } from "./schema";
import type {
  UserProfile,
  Conversation,
  Progress,
  DailyStats,
  Achievement,
  MockInterviewSession,
  DailyQuest,
  AppSettings,
} from "./schema";

/**
 * Data Access Object for UserProfile operations
 */
export class UserProfileDAO {
  async create(
    profile: Omit<UserProfile, "id" | "createdAt" | "updatedAt">,
  ): Promise<UserProfile> {
    const now = new Date();
    const newProfile: UserProfile = {
      ...profile,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.userProfiles.add(newProfile);
    return newProfile;
  }

  async getById(id: string): Promise<UserProfile | undefined> {
    return await db.userProfiles.get(id);
  }

  async getByEmail(email: string): Promise<UserProfile | undefined> {
    return await db.userProfiles.where("email").equals(email).first();
  }

  async update(id: string, updates: Partial<UserProfile>): Promise<number> {
    const updatedData = {
      ...updates,
      updatedAt: new Date(),
    };
    return await db.userProfiles.update(id, updatedData);
  }

  async delete(id: string): Promise<void> {
    await db.userProfiles.delete(id);
  }

  async getAll(): Promise<UserProfile[]> {
    return await db.userProfiles.toArray();
  }

  async updateLastActive(id: string): Promise<void> {
    await db.userProfiles.update(id, {
      lastActiveDate: new Date(),
      updatedAt: new Date(),
    });
  }

  async updateStreak(id: string, streak: number): Promise<void> {
    await db.userProfiles.update(id, {
      streak,
      lastActiveDate: new Date(),
      updatedAt: new Date(),
    });
  }

  async addXP(id: string, xp: number): Promise<void> {
    const profile = await this.getById(id);
    if (profile) {
      const newXP = profile.xp + xp;
      const newLevel = Math.floor(newXP / 100) + 1; // Simple level calculation
      await db.userProfiles.update(id, {
        xp: newXP,
        level: newLevel,
        updatedAt: new Date(),
      });
    }
  }

  async addCredits(id: string, credits: number): Promise<void> {
    const profile = await this.getById(id);
    if (profile) {
      await db.userProfiles.update(id, {
        credits: profile.credits + credits,
        updatedAt: new Date(),
      });
    }
  }
}

/**
 * Data Access Object for Conversation operations
 */
export class ConversationDAO {
  async create(
    conversation: Omit<Conversation, "id" | "timestamp">,
  ): Promise<Conversation> {
    const newConversation: Conversation = {
      ...conversation,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    await db.conversations.add(newConversation);
    return newConversation;
  }

  async getById(id: string): Promise<Conversation | undefined> {
    return await db.conversations.get(id);
  }

  async getByUserId(userId: string, limit?: number): Promise<Conversation[]> {
    let query = db.conversations.where("userId").equals(userId).reverse();
    if (limit) {
      query = query.limit(limit);
    }
    return await query.toArray();
  }

  async getByQuestionId(
    userId: string,
    questionId: string,
  ): Promise<Conversation[]> {
    return await db.conversations
      .where("userId")
      .equals(userId)
      .and((conv) => conv.questionId === questionId)
      .toArray();
  }

  async getBySessionId(sessionId: string): Promise<Conversation[]> {
    return await db.conversations
      .where("sessionId")
      .equals(sessionId)
      .toArray();
  }

  async getRecentByUserId(
    userId: string,
    hours: number = 24,
  ): Promise<Conversation[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await db.conversations
      .where("userId")
      .equals(userId)
      .and((conv) => conv.timestamp >= cutoff)
      .reverse()
      .toArray();
  }

  async update(id: string, updates: Partial<Conversation>): Promise<number> {
    return await db.conversations.update(id, updates);
  }

  async delete(id: string): Promise<void> {
    await db.conversations.delete(id);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await db.conversations.where("userId").equals(userId).delete();
  }

  async getAverageScore(userId: string, days: number = 30): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const conversations = await db.conversations
      .where("userId")
      .equals(userId)
      .and((conv) => conv.timestamp >= cutoff)
      .toArray();

    if (conversations.length === 0) return 0;

    const totalScore = conversations.reduce((sum, conv) => sum + conv.score, 0);
    return totalScore / conversations.length;
  }

  async getStatsByTimeRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const conversations = await db.conversations
      .where("userId")
      .equals(userId)
      .and((conv) => conv.timestamp >= startDate && conv.timestamp <= endDate)
      .toArray();

    const total = conversations.length;
    const averageScore =
      total > 0
        ? conversations.reduce((sum, conv) => sum + conv.score, 0) / total
        : 0;
    const totalTime = conversations.reduce(
      (sum, conv) => sum + conv.timeSpent,
      0,
    );
    const voiceCount = conversations.filter(
      (conv) => conv.responseMode === "voice",
    ).length;
    const textCount = conversations.filter(
      (conv) => conv.responseMode === "text",
    ).length;

    return {
      total,
      averageScore,
      totalTime,
      voiceCount,
      textCount,
      averageTime: total > 0 ? totalTime / total : 0,
    };
  }
}

/**
 * Data Access Object for Progress operations
 */
export class ProgressDAO {
  async create(
    progress: Omit<Progress, "firstSeenAt" | "lastUpdatedAt">,
  ): Promise<Progress> {
    const now = new Date();
    const newProgress: Progress = {
      ...progress,
      firstSeenAt: now,
      lastUpdatedAt: now,
    };
    await db.progress.add(newProgress);
    return newProgress;
  }

  async getById(id: string): Promise<Progress | undefined> {
    return await db.progress.get(id);
  }

  async getByUserId(userId: string): Promise<Progress[]> {
    return await db.progress.where("userId").equals(userId).toArray();
  }

  async getByStatus(
    userId: string,
    status: Progress["status"],
  ): Promise<Progress[]> {
    return await db.progress
      .where("userId")
      .equals(userId)
      .and((prog) => prog.status === status)
      .toArray();
  }

  async getDueForReview(userId: string): Promise<Progress[]> {
    const now = new Date();
    return await db.progress
      .where("userId")
      .equals(userId)
      .and((prog) => prog.nextReview <= now && !prog.mastered)
      .toArray();
  }

  async getMastered(userId: string): Promise<Progress[]> {
    return await db.progress
      .where("userId")
      .equals(userId)
      .and((prog) => prog.mastered)
      .toArray();
  }

  async update(id: string, updates: Partial<Progress>): Promise<number> {
    const updatedData = {
      ...updates,
      lastUpdatedAt: new Date(),
    };
    return await db.progress.update(id, updatedData);
  }

  async updateScore(id: string, score: number): Promise<void> {
    const progress = await this.getById(id);
    if (progress) {
      const newAttempts = progress.attempts + 1;
      const newBestScore = Math.max(progress.bestScore, score);
      const newAverageScore =
        (progress.averageScore * progress.attempts + score) / newAttempts;

      await this.update(id, {
        attempts: newAttempts,
        bestScore: newBestScore,
        averageScore: newAverageScore,
        lastScore: score,
        lastAttempt: new Date(),
      });
    }
  }

  async updateSRS(id: string, score: number): Promise<void> {
    const progress = await this.getById(id);
    if (progress) {
      // Simple SM-2 algorithm implementation
      let { easeFactor, interval, repetitions } = progress;

      if (score >= 80) {
        repetitions += 1;
        if (repetitions === 1) {
          interval = 1;
        } else if (repetitions === 2) {
          interval = 6;
        } else {
          interval = Math.round(interval * easeFactor);
        }
      } else {
        repetitions = 0;
        interval = 1;
      }

      easeFactor = Math.max(
        1.3,
        easeFactor +
          (0.1 - (5 - score / 20) * (0.08 + (5 - score / 20) * 0.02)),
      );

      const nextReview = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
      const status = this.calculateStatus(repetitions, score);

      await this.update(id, {
        easeFactor,
        interval,
        repetitions,
        nextReview,
        status,
        mastered: status === "mastered",
      });
    }
  }

  private calculateStatus(
    repetitions: number,
    score: number,
  ): Progress["status"] {
    if (repetitions >= 3 && score >= 90) return "mastered";
    if (repetitions >= 2) return "reviewing";
    if (repetitions >= 1) return "learning";
    return "new";
  }

  async delete(id: string): Promise<void> {
    await db.progress.delete(id);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await db.progress.where("userId").equals(userId).delete();
  }

  async getStats(userId: string): Promise<any> {
    const progress = await this.getByUserId(userId);
    const total = progress.length;
    const mastered = progress.filter((p) => p.mastered).length;
    const learning = progress.filter((p) => p.status === "learning").length;
    const reviewing = progress.filter((p) => p.status === "reviewing").length;
    const newCount = progress.filter((p) => p.status === "new").length;

    return {
      total,
      mastered,
      learning,
      reviewing,
      new: newCount,
      masteryRate: total > 0 ? (mastered / total) * 100 : 0,
    };
  }
}

/**
 * Data Access Object for DailyStats operations
 */
export class DailyStatsDAO {
  async create(stats: Omit<DailyStats, "id">): Promise<DailyStats> {
    const id = stats.date.toISOString().split("T")[0];
    const newStats: DailyStats = {
      ...stats,
      id,
    };
    await db.dailyStats.add(newStats);
    return newStats;
  }

  async getById(id: string): Promise<DailyStats | undefined> {
    return await db.dailyStats.get(id);
  }

  async getByDate(userId: string, date: Date): Promise<DailyStats | undefined> {
    const id = date.toISOString().split("T")[0];
    return await db.dailyStats.where({ id, userId }).first();
  }

  async getByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailyStats[]> {
    return await db.dailyStats
      .where("userId")
      .equals(userId)
      .and((stats) => stats.date >= startDate && stats.date <= endDate)
      .toArray();
  }

  async getLastNDays(userId: string, days: number): Promise<DailyStats[]> {
    const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    return await this.getByDateRange(userId, startDate, endDate);
  }

  async update(id: string, updates: Partial<DailyStats>): Promise<number> {
    return await db.dailyStats.update(id, updates);
  }

  async incrementStats(
    userId: string,
    date: Date,
    updates: Partial<DailyStats>,
  ): Promise<DailyStats> {
    const existing = await this.getByDate(userId, date);

    if (existing) {
      const updatedStats = {
        ...existing,
        ...updates,
        // Increment numeric fields
        questionsAnswered:
          existing.questionsAnswered + (updates.questionsAnswered || 0),
        questionsCorrect:
          existing.questionsCorrect + (updates.questionsCorrect || 0),
        questionsSkipped:
          existing.questionsSkipped + (updates.questionsSkipped || 0),
        totalScore: existing.totalScore + (updates.totalScore || 0),
        xpEarned: existing.xpEarned + (updates.xpEarned || 0),
        creditsEarned: existing.creditsEarned + (updates.creditsEarned || 0),
        timeSpent: existing.timeSpent + (updates.timeSpent || 0),
        sessionsCount: existing.sessionsCount + (updates.sessionsCount || 0),
      };

      // Recalculate average score
      if (updatedStats.questionsAnswered > 0) {
        updatedStats.averageScore =
          updatedStats.totalScore / updatedStats.questionsAnswered;
      }

      await this.update(existing.id, updatedStats);
      return updatedStats;
    } else {
      return await this.create({
        userId,
        date,
        questionsAnswered: updates.questionsAnswered || 0,
        questionsCorrect: updates.questionsCorrect || 0,
        questionsSkipped: updates.questionsSkipped || 0,
        averageScore: updates.averageScore || 0,
        totalScore: updates.totalScore || 0,
        xpEarned: updates.xpEarned || 0,
        creditsEarned: updates.creditsEarned || 0,
        badgesUnlocked: updates.badgesUnlocked || [],
        timeSpent: updates.timeSpent || 0,
        sessionsCount: updates.sessionsCount || 0,
        streakActive: updates.streakActive || false,
        streakCount: updates.streakCount || 0,
      });
    }
  }

  async delete(id: string): Promise<void> {
    await db.dailyStats.delete(id);
  }

  async getWeeklyStats(userId: string): Promise<any> {
    const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    const stats = await this.getByDateRange(userId, startDate, endDate);

    const totals = stats.reduce(
      (acc, stat) => ({
        questionsAnswered: acc.questionsAnswered + stat.questionsAnswered,
        questionsCorrect: acc.questionsCorrect + stat.questionsCorrect,
        totalScore: acc.totalScore + stat.totalScore,
        xpEarned: acc.xpEarned + stat.xpEarned,
        creditsEarned: acc.creditsEarned + stat.creditsEarned,
        timeSpent: acc.timeSpent + stat.timeSpent,
        sessionsCount: acc.sessionsCount + stat.sessionsCount,
      }),
      {
        questionsAnswered: 0,
        questionsCorrect: 0,
        totalScore: 0,
        xpEarned: 0,
        creditsEarned: 0,
        timeSpent: 0,
        sessionsCount: 0,
      },
    );

    return {
      ...totals,
      averageScore:
        totals.questionsAnswered > 0
          ? totals.totalScore / totals.questionsAnswered
          : 0,
      accuracy:
        totals.questionsAnswered > 0
          ? (totals.questionsCorrect / totals.questionsAnswered) * 100
          : 0,
      averageSessionTime:
        totals.sessionsCount > 0 ? totals.timeSpent / totals.sessionsCount : 0,
    };
  }
}

/**
 * Data Access Object for Achievement operations
 */
export class AchievementDAO {
  async create(achievement: Omit<Achievement, "id">): Promise<Achievement> {
    const newAchievement: Achievement = {
      ...achievement,
      id: crypto.randomUUID(),
    };
    await db.achievements.add(newAchievement);
    return newAchievement;
  }

  async getById(id: string): Promise<Achievement | undefined> {
    return await db.achievements.get(id);
  }

  async getByUserId(userId: string): Promise<Achievement[]> {
    return await db.achievements.where("userId").equals(userId).toArray();
  }

  async getByAchievementId(
    userId: string,
    achievementId: string,
  ): Promise<Achievement | undefined> {
    return await db.achievements.where({ userId, achievementId }).first();
  }

  async getUnlocked(userId: string): Promise<Achievement[]> {
    return await db.achievements
      .where("userId")
      .equals(userId)
      .and((ach) => ach.unlocked)
      .toArray();
  }

  async getLocked(userId: string): Promise<Achievement[]> {
    return await db.achievements
      .where("userId")
      .equals(userId)
      .and((ach) => !ach.unlocked)
      .toArray();
  }

  async getUnseen(userId: string): Promise<Achievement[]> {
    return await db.achievements
      .where("userId")
      .equals(userId)
      .and((ach) => ach.unlocked && !ach.seen)
      .toArray();
  }

  async update(id: string, updates: Partial<Achievement>): Promise<number> {
    return await db.achievements.update(id, updates);
  }

  async updateProgress(id: string, currentValue: number): Promise<void> {
    const achievement = await this.getById(id);
    if (achievement) {
      const progress = Math.min(
        100,
        (currentValue / achievement.threshold) * 100,
      );
      const unlocked = progress >= 100 && !achievement.unlocked;

      await this.update(id, {
        currentValue,
        progress,
        unlocked,
        unlockedAt: unlocked ? new Date() : achievement.unlockedAt,
      });
    }
  }

  async unlock(id: string): Promise<void> {
    await this.update(id, {
      unlocked: true,
      progress: 100,
      unlockedAt: new Date(),
    });
  }

  async markAsSeen(id: string): Promise<void> {
    await this.update(id, { seen: true });
  }

  async markAllAsSeen(userId: string): Promise<void> {
    const unseen = await this.getUnseen(userId);
    await Promise.all(unseen.map((ach) => this.markAsSeen(ach.id)));
  }

  async delete(id: string): Promise<void> {
    await db.achievements.delete(id);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await db.achievements.where("userId").equals(userId).delete();
  }

  async getStats(userId: string): Promise<any> {
    const achievements = await this.getByUserId(userId);
    const total = achievements.length;
    const unlocked = achievements.filter((a) => a.unlocked).length;
    const locked = total - unlocked;
    const unseen = achievements.filter((a) => a.unlocked && !a.seen).length;

    return {
      total,
      unlocked,
      locked,
      unseen,
      completionRate: total > 0 ? (unlocked / total) * 100 : 0,
    };
  }
}

/**
 * Data Access Object for MockInterviewSession operations
 */
export class MockInterviewSessionDAO {
  async create(
    session: Omit<MockInterviewSession, "id" | "startedAt">,
  ): Promise<MockInterviewSession> {
    const newSession: MockInterviewSession = {
      ...session,
      id: crypto.randomUUID(),
      startedAt: new Date(),
    };
    await db.mockInterviewSessions.add(newSession);
    return newSession;
  }

  async getById(id: string): Promise<MockInterviewSession | undefined> {
    return await db.mockInterviewSessions.get(id);
  }

  async getByUserId(userId: string): Promise<MockInterviewSession[]> {
    return await db.mockInterviewSessions
      .where("userId")
      .equals(userId)
      .reverse()
      .toArray();
  }

  async getByStatus(
    userId: string,
    status: MockInterviewSession["status"],
  ): Promise<MockInterviewSession[]> {
    return await db.mockInterviewSessions
      .where("userId")
      .equals(userId)
      .and((session) => session.status === status)
      .toArray();
  }

  async getInProgress(
    userId: string,
  ): Promise<MockInterviewSession | undefined> {
    return await db.mockInterviewSessions
      .where("userId")
      .equals(userId)
      .and((session) => session.status === "in-progress")
      .first();
  }

  async getCompleted(userId: string): Promise<MockInterviewSession[]> {
    return await this.getByStatus(userId, "completed");
  }

  async update(
    id: string,
    updates: Partial<MockInterviewSession>,
  ): Promise<number> {
    return await db.mockInterviewSessions.update(id, updates);
  }

  async completeSession(
    id: string,
    overallScore: number,
    breakdown: MockInterviewSession["breakdown"],
    detailedFeedback: MockInterviewSession["detailedFeedback"],
  ): Promise<void> {
    await this.update(id, {
      status: "completed",
      overallScore,
      breakdown,
      detailedFeedback,
      completedAt: new Date(),
    });
  }

  async addConversation(id: string, conversationId: string): Promise<void> {
    const session = await this.getById(id);
    if (session) {
      await this.update(id, {
        conversationIds: [...session.conversationIds, conversationId],
      });
    }
  }

  async nextQuestion(id: string): Promise<void> {
    const session = await this.getById(id);
    if (
      session &&
      session.currentQuestionIndex < session.questionIds.length - 1
    ) {
      await this.update(id, {
        currentQuestionIndex: session.currentQuestionIndex + 1,
      });
    }
  }

  async delete(id: string): Promise<void> {
    await db.mockInterviewSessions.delete(id);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await db.mockInterviewSessions.where("userId").equals(userId).delete();
  }

  async getStats(userId: string): Promise<any> {
    const sessions = await this.getByUserId(userId);
    const completed = sessions.filter((s) => s.status === "completed");

    const totalSessions = sessions.length;
    const completedSessions = completed.length;
    const averageScore =
      completedSessions > 0
        ? completed.reduce((sum, s) => sum + s.overallScore, 0) /
          completedSessions
        : 0;

    const typeBreakdown = sessions.reduce(
      (acc, session) => {
        acc[session.type] = (acc[session.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalSessions,
      completedSessions,
      averageScore,
      completionRate:
        totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      typeBreakdown,
    };
  }
}

/**
 * Data Access Object for DailyQuest operations
 */
export class DailyQuestDAO {
  async create(quest: Omit<DailyQuest, "id">): Promise<DailyQuest> {
    const id = `${quest.userId}-${quest.date.toISOString().split("T")[0]}-${quest.questType}`;
    const newQuest: DailyQuest = {
      ...quest,
      id,
    };
    await db.dailyQuests.add(newQuest);
    return newQuest;
  }

  async getById(id: string): Promise<DailyQuest | undefined> {
    return await db.dailyQuests.get(id);
  }

  async getByUserId(userId: string): Promise<DailyQuest[]> {
    return await db.dailyQuests
      .where("userId")
      .equals(userId)
      .reverse()
      .toArray();
  }

  async getByDate(userId: string, date: Date): Promise<DailyQuest[]> {
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
    );

    return await db.dailyQuests
      .where("userId")
      .equals(userId)
      .and((quest) => quest.date >= startOfDay && quest.date < endOfDay)
      .toArray();
  }

  async getAvailable(userId: string): Promise<DailyQuest[]> {
    const now = new Date();
    return await db.dailyQuests
      .where("userId")
      .equals(userId)
      .and((quest) => quest.status === "available" && quest.expiresAt > now)
      .toArray();
  }

  async getInProgress(userId: string): Promise<DailyQuest[]> {
    return await db.dailyQuests
      .where("userId")
      .equals(userId)
      .and((quest) => quest.status === "in-progress")
      .toArray();
  }

  async getCompleted(userId: string): Promise<DailyQuest[]> {
    return await db.dailyQuests
      .where("userId")
      .equals(userId)
      .and((quest) => quest.status === "completed")
      .toArray();
  }

  async update(id: string, updates: Partial<DailyQuest>): Promise<number> {
    return await db.dailyQuests.update(id, updates);
  }

  async startQuest(id: string): Promise<void> {
    await this.update(id, { status: "in-progress" });
  }

  async updateProgress(id: string, score: number): Promise<void> {
    const quest = await this.getById(id);
    if (quest) {
      const newQuestionsCompleted = quest.questionsCompleted + 1;
      const newAverageScore =
        (quest.currentAverageScore * quest.questionsCompleted + score) /
        newQuestionsCompleted;

      const completed =
        newQuestionsCompleted >= quest.requiredQuestions &&
        newAverageScore >= quest.requiredScore;

      await this.update(id, {
        questionsCompleted: newQuestionsCompleted,
        currentAverageScore: newAverageScore,
        status: completed ? "completed" : "in-progress",
        completedAt: completed ? new Date() : undefined,
      });
    }
  }

  async completeQuest(id: string): Promise<void> {
    await this.update(id, {
      status: "completed",
      completedAt: new Date(),
    });
  }

  async failQuest(id: string): Promise<void> {
    await this.update(id, { status: "failed" });
  }

  async expireQuests(): Promise<void> {
    const now = new Date();
    const expiredQuests = await db.dailyQuests
      .where("status")
      .equals("in-progress")
      .and((quest) => quest.expiresAt <= now)
      .toArray();

    await Promise.all(
      expiredQuests.map((quest) =>
        this.update(quest.id, { status: "expired" }),
      ),
    );
  }

  async delete(id: string): Promise<void> {
    await db.dailyQuests.delete(id);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await db.dailyQuests.where("userId").equals(userId).delete();
  }

  async getStats(userId: string): Promise<any> {
    const quests = await this.getByUserId(userId);
    const total = quests.length;
    const completed = quests.filter((q) => q.status === "completed").length;
    const inProgress = quests.filter((q) => q.status === "in-progress").length;
    const failed = quests.filter((q) => q.status === "failed").length;
    const expired = quests.filter((q) => q.status === "expired").length;

    return {
      total,
      completed,
      inProgress,
      failed,
      expired,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }
}

/**
 * Data Access Object for AppSettings operations
 */
export class AppSettingsDAO {
  async create(settings: Omit<AppSettings, "id">): Promise<AppSettings> {
    const newSettings: AppSettings = {
      ...settings,
      id: "settings",
    };
    await db.appSettings.add(newSettings);
    return newSettings;
  }

  async getById(id: string): Promise<AppSettings | undefined> {
    return await db.appSettings.get(id);
  }

  async getByUserId(userId: string): Promise<AppSettings | undefined> {
    return await db.appSettings.where("userId").equals(userId).first();
  }

  async update(id: string, updates: Partial<AppSettings>): Promise<number> {
    const updatedData = {
      ...updates,
      updatedAt: new Date(),
    };
    return await db.appSettings.update(id, updatedData);
  }

  async updateByUserId(
    userId: string,
    updates: Partial<AppSettings>,
  ): Promise<number> {
    const settings = await this.getByUserId(userId);
    if (settings) {
      return await this.update(settings.id, updates);
    }
    return 0;
  }

  async delete(id: string): Promise<void> {
    await db.appSettings.delete(id);
  }

  async deleteByUserId(userId: string): Promise<void> {
    const settings = await this.getByUserId(userId);
    if (settings) {
      await this.delete(settings.id);
    }
  }
}

// Export all DAOs
export const userProfileDAO = new UserProfileDAO();
export const conversationDAO = new ConversationDAO();
export const progressDAO = new ProgressDAO();
export const dailyStatsDAO = new DailyStatsDAO();
export const achievementDAO = new AchievementDAO();
export const mockInterviewSessionDAO = new MockInterviewSessionDAO();
export const dailyQuestDAO = new DailyQuestDAO();
export const appSettingsDAO = new AppSettingsDAO();
