/**
 * Settings Store - Zustand store for managing app settings
 * Handles user preferences, AI behavior settings, and app configuration
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppSettings,
  ModelId,
  LoadStrategy,
  AIPersonality,
} from "@/types";
import { appSettingsDAO } from "@/db/dao";

// Extended settings with UI state
interface SettingsStoreState extends Partial<AppSettings> {
  // From AppSettings
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

  // UI State (not persisted to DB)
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
}

interface SettingsStoreActions {
  loadSettings: (userId: string) => Promise<void>;
  saveSettings: (userId: string) => Promise<void>;
  updateSettings: (updates: Partial<SettingsStoreState>) => void;
  setPreferredModel: (model: ModelId) => void;
  setModelLoadStrategy: (strategy: LoadStrategy) => void;
  setAIPersonality: (personality: AIPersonality) => void;
  toggleSetting: (
    key: keyof Omit<SettingsStoreState, "isLoading" | "error" | "initialized">,
  ) => void;
  resetToDefaults: () => void;
  clearError: () => void;
}

type SettingsStore = SettingsStoreState & SettingsStoreActions;

const defaultSettings: Omit<
  SettingsStoreState,
  "isLoading" | "error" | "initialized"
> = {
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
};

const initialState: SettingsStoreState = {
  ...defaultSettings,
  isLoading: false,
  error: null,
  initialized: false,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      loadSettings: async (userId: string) => {
        set({ isLoading: true, error: null });

        try {
          const settings = await appSettingsDAO.getByUserId(userId);

          if (settings) {
            set({
              preferredModel: settings.preferredModel,
              modelLoadStrategy: settings.modelLoadStrategy,
              enableAnimations: settings.enableAnimations,
              reducedMotion: settings.reducedMotion,
              offlineMode: settings.offlineMode,
              allowAnalytics: settings.allowAnalytics,
              allowCrashReports: settings.allowCrashReports,
              enableNotifications: settings.enableNotifications,
              streakReminders: settings.streakReminders,
              questReminders: settings.questReminders,
              aiPersonality: settings.aiPersonality,
              followUpQuestions: settings.followUpQuestions,
              detailedFeedback: settings.detailedFeedback,
              isLoading: false,
              initialized: true,
            });
          } else {
            // Create default settings
            await appSettingsDAO.create({
              userId,
              ...defaultSettings,
              updatedAt: new Date(),
            });
            set({ isLoading: false, initialized: true });
          }
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to load settings",
            isLoading: false,
          });
        }
      },

      saveSettings: async (userId: string) => {
        const state = get();

        try {
          const settingsUpdate = {
            preferredModel: state.preferredModel,
            modelLoadStrategy: state.modelLoadStrategy,
            enableAnimations: state.enableAnimations,
            reducedMotion: state.reducedMotion,
            offlineMode: state.offlineMode,
            allowAnalytics: state.allowAnalytics,
            allowCrashReports: state.allowCrashReports,
            enableNotifications: state.enableNotifications,
            streakReminders: state.streakReminders,
            questReminders: state.questReminders,
            aiPersonality: state.aiPersonality,
            followUpQuestions: state.followUpQuestions,
            detailedFeedback: state.detailedFeedback,
            updatedAt: new Date(),
          };

          await appSettingsDAO.updateByUserId(userId, settingsUpdate);
        } catch (error) {
          console.error("Failed to save settings:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to save settings",
          });
        }
      },

      updateSettings: (updates) => {
        set((state) => ({ ...state, ...updates }));
      },

      setPreferredModel: (model) => {
        set({ preferredModel: model });
      },

      setModelLoadStrategy: (strategy) => {
        set({ modelLoadStrategy: strategy });
      },

      setAIPersonality: (personality) => {
        set({ aiPersonality: personality });
      },

      toggleSetting: (key) => {
        set((state) => {
          const currentValue = state[key];
          if (typeof currentValue === "boolean") {
            return { [key]: !currentValue } as Partial<SettingsStoreState>;
          }
          return {};
        });
      },

      resetToDefaults: () => {
        set({
          ...defaultSettings,
          isLoading: false,
          error: null,
          initialized: true,
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "interview-buddy-settings",
      partialize: (state) => ({
        preferredModel: state.preferredModel,
        modelLoadStrategy: state.modelLoadStrategy,
        enableAnimations: state.enableAnimations,
        reducedMotion: state.reducedMotion,
        offlineMode: state.offlineMode,
        aiPersonality: state.aiPersonality,
        followUpQuestions: state.followUpQuestions,
        detailedFeedback: state.detailedFeedback,
      }),
    },
  ),
);

export default useSettingsStore;
