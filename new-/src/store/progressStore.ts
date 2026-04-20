/**
 * Progress Store - Zustand store for managing user progress state
 * Handles progress tracking, SRS, and question mastery
 */

import { create } from "zustand";
import type { Progress, WeeklyStats, ProgressStats } from "@/types";
import { progressDAO, dailyStatsDAO } from "@/db/dao";

// Real type definitions since they're not in @/types
interface ProgressStoreState {
  progress: Progress[];
  weeklyStats: WeeklyStats | null;
  stats: ProgressStats | null;
  isLoading: boolean;
  error: string | null;
}

interface ProgressStoreActions {
  loadProgress: (userId: string) => Promise<void>;
  loadWeeklyStats: (userId: string) => Promise<void>;
  loadStats: (userId: string) => Promise<void>;
  updateProgress: (id: string, score: number) => Promise<void>;
  updateSRS: (id: string, score: number) => Promise<void>;
  createProgress: (
    progress: Omit<Progress, "firstSeenAt" | "lastUpdatedAt">,
  ) => Promise<Progress>;
  getDueForReview: (userId: string) => Promise<Progress[]>;
  getMastered: (userId: string) => Promise<Progress[]>;
  refreshStats: (userId: string) => Promise<void>;
  clearError: () => void;
}

type ProgressStore = ProgressStoreState & ProgressStoreActions;

const initialState: ProgressStoreState = {
  progress: [],
  weeklyStats: null,
  stats: null,
  isLoading: false,
  error: null,
};

export const useProgressStore = create<ProgressStore>((set, get) => ({
  ...initialState,

  loadProgress: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const progress = await progressDAO.getByUserId(userId);
      set({ progress, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load progress",
        isLoading: false,
      });
    }
  },

  loadWeeklyStats: async (userId: string) => {
    try {
      const weeklyStats = await dailyStatsDAO.getWeeklyStats(userId);
      set({ weeklyStats });
    } catch (error) {
      console.error("Failed to load weekly stats:", error);
    }
  },

  loadStats: async (userId: string) => {
    try {
      const stats = await progressDAO.getStats(userId);
      set({ stats });
    } catch (error) {
      console.error("Failed to load progress stats:", error);
    }
  },

  updateProgress: async (id: string, score: number) => {
    try {
      await progressDAO.updateScore(id, score);
      // Refresh local state
      const updatedProgress = await progressDAO.getById(id);
      if (updatedProgress) {
        set((state) => ({
          progress: state.progress.map((p) =>
            p.id === id ? updatedProgress : p,
          ),
        }));
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to update progress",
      });
    }
  },

  updateSRS: async (id: string, score: number) => {
    try {
      await progressDAO.updateSRS(id, score);
      // Refresh local state
      const updatedProgress = await progressDAO.getById(id);
      if (updatedProgress) {
        set((state) => ({
          progress: state.progress.map((p) =>
            p.id === id ? updatedProgress : p,
          ),
        }));
      }
    } catch (error) {
      console.error("Failed to update SRS:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to update SRS",
      });
    }
  },

  createProgress: async (progress) => {
    try {
      const newProgress = await progressDAO.create(progress);
      set((state) => ({
        progress: [...state.progress, newProgress],
      }));
      return newProgress;
    } catch (error) {
      console.error("Failed to create progress:", error);
      throw error;
    }
  },

  getDueForReview: async (userId: string) => {
    try {
      return await progressDAO.getDueForReview(userId);
    } catch (error) {
      console.error("Failed to get due questions:", error);
      return [];
    }
  },

  getMastered: async (userId: string) => {
    try {
      return await progressDAO.getMastered(userId);
    } catch (error) {
      console.error("Failed to get mastered questions:", error);
      return [];
    }
  },

  refreshStats: async (userId: string) => {
    await get().loadProgress(userId);
    await get().loadStats(userId);
    await get().loadWeeklyStats(userId);
  },

  clearError: () => set({ error: null }),
}));

export default useProgressStore;
