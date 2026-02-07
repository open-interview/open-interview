/**
 * Gamification Store - Zustand store for managing gamification state
 * Handles XP, levels, credits, achievements, and daily quests
 */

import { create } from "zustand";
import type {
  GamificationStoreState,
  GamificationStoreActions,
  Achievement,
  DailyQuest,
  LevelInfo,
} from "@/types";

type GamificationStore = GamificationStoreState & GamificationStoreActions;

// XP required for each level (exponential growth)
const calculateXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

const calculateLevelFromXP = (xp: number): LevelInfo => {
  let level = 1;
  let xpRequired = 100;
  let accumulatedXP = 0;

  while (accumulatedXP + xpRequired <= xp) {
    accumulatedXP += xpRequired;
    level++;
    xpRequired = calculateXPForLevel(level);
  }

  const xpToNextLevel = xpRequired;
  const xpInCurrentLevel = xp - accumulatedXP;
  const currentLevelProgress = (xpInCurrentLevel / xpToNextLevel) * 100;

  return {
    level,
    title: getLevelTitle(level),
    xpRequired: accumulatedXP + xpRequired,
    xpToNextLevel,
    currentLevelProgress,
  };
};

const getLevelTitle = (level: number): string => {
  if (level >= 50) return "Legendary";
  if (level >= 40) return "Grandmaster";
  if (level >= 30) return "Expert";
  if (level >= 20) return "Advanced";
  if (level >= 10) return "Intermediate";
  return "Beginner";
};

const initialState: GamificationStoreState = {
  achievements: [],
  dailyQuests: [],
  level: 1,
  xp: 0,
  credits: 100,
  streak: 0,
  unlockedAchievements: [],
  newAchievements: [],
};

export const useGamificationStore = create<GamificationStore>((set, get) => ({
  ...initialState,

  addAchievement: (achievement: Achievement) => {
    set((state) => ({
      achievements: [...state.achievements, achievement],
      unlockedAchievements: achievement.unlocked
        ? [...state.unlockedAchievements, achievement.id]
        : state.unlockedAchievements,
      newAchievements:
        achievement.unlocked && !achievement.seen
          ? [...state.newAchievements, achievement]
          : state.newAchievements,
    }));
  },

  updateAchievementProgress: (id: string, progress: number) => {
    set((state) => ({
      achievements: state.achievements.map((ach) =>
        ach.id === id
          ? {
              ...ach,
              progress: Math.min(100, progress),
              unlocked: progress >= 100,
              unlockedAt:
                progress >= 100 && !ach.unlocked ? new Date() : ach.unlockedAt,
            }
          : ach,
      ),
    }));

    // Check if achievement was unlocked
    const achievement = get().achievements.find((a) => a.id === id);
    if (achievement && progress >= 100 && !achievement.unlocked) {
      // Add XP and credits reward
      get().addXP(achievement.xpReward);
      get().addCredits(achievement.creditsReward);
    }
  },

  markAchievementSeen: (id: string) => {
    set((state) => ({
      achievements: state.achievements.map((ach) =>
        ach.id === id ? { ...ach, seen: true } : ach,
      ),
      newAchievements: state.newAchievements.filter((ach) => ach.id !== id),
    }));
  },

  addXP: (amount: number) => {
    set((state) => {
      const newXP = state.xp + amount;
      const levelInfo = calculateLevelFromXP(newXP);

      return {
        xp: newXP,
        level: levelInfo.level,
      };
    });
  },

  addCredits: (amount: number) => {
    set((state) => ({
      credits: Math.max(0, state.credits + amount),
    }));
  },

  updateStreak: (streak: number) => {
    set({ streak });
  },

  setDailyQuests: (quests: DailyQuest[]) => {
    set({ dailyQuests: quests });
  },

  updateQuestProgress: (id: string, progress: number) => {
    set((state) => ({
      dailyQuests: state.dailyQuests.map((quest) =>
        quest.id === id
          ? {
              ...quest,
              questionsCompleted: Math.min(quest.requiredQuestions, progress),
            }
          : quest,
      ),
    }));
  },

  completeQuest: (id: string) => {
    const quest = get().dailyQuests.find((q) => q.id === id);
    if (quest && quest.status !== "completed") {
      set((state) => ({
        dailyQuests: state.dailyQuests.map((q) =>
          q.id === id
            ? {
                ...q,
                status: "completed",
                completedAt: new Date(),
              }
            : q,
        ),
      }));

      // Award quest rewards
      get().addXP(quest.xpReward);
      get().addCredits(quest.creditsReward);
    }
  },
}));

// Export utility functions
export { calculateXPForLevel, calculateLevelFromXP, getLevelTitle };
