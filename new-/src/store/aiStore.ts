/**
 * AI Store - Zustand store for managing AI/WebLLM state
 * Handles model initialization, AI responses, and evaluation state
 */

import { create } from "zustand";
import type {
  EvaluationResult,
  ModelLoadProgress,
  Question,
  ModelInfo,
} from "@/types";
import { getWebLLM, resetWebLLM, AVAILABLE_MODELS } from "@/lib/ai/webllm";

interface AIStoreState {
  isInitializing: boolean;
  isReady: boolean;
  progress: ModelLoadProgress | null;
  error: string | null;
  currentModel: ModelInfo | null;
  availableModels: ModelInfo[];
  currentEvaluation: EvaluationResult | null;
  isEvaluating: boolean;
  lastResponse: string | null;
}

interface AIStoreActions {
  initialize: (
    onProgress?: (progress: ModelLoadProgress) => void,
  ) => Promise<void>;
  reset: () => void;
  evaluateAnswer: (
    question: Question,
    userAnswer: string,
  ) => Promise<EvaluationResult>;
  generateFollowUp: (
    question: Question,
    userAnswer: string,
    previousFollowups: string[],
  ) => Promise<string>;
  generateResponse: (prompt: string) => Promise<string>;
  getHint: (question: Question) => Promise<string>;
  setCurrentModel: (model: ModelInfo) => void;
  clearEvaluation: () => void;
  clearError: () => void;
}

type AIStore = AIStoreState & AIStoreActions;

const initialState: AIStoreState = {
  isInitializing: false,
  isReady: false,
  progress: null,
  error: null,
  currentModel: AVAILABLE_MODELS[0],
  availableModels: AVAILABLE_MODELS,
  currentEvaluation: null,
  isEvaluating: false,
  lastResponse: null,
};

export const useAIStore = create<AIStore>((set, get) => ({
  ...initialState,

  initialize: async (onProgress) => {
    if (get().isReady || get().isInitializing) return;

    set({ isInitializing: true, error: null });

    try {
      const webLLM = getWebLLM({ modelId: get().currentModel?.id });

      await webLLM.initialize((progress) => {
        set({ progress });
        onProgress?.(progress);
      });

      set({ isReady: true, isInitializing: false, progress: null });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to initialize AI";
      set({ error: errorMessage, isInitializing: false, isReady: false });
      throw error;
    }
  },

  reset: () => {
    resetWebLLM();
    set(initialState);
  },

  evaluateAnswer: async (question: Question, userAnswer: string) => {
    if (!get().isReady) {
      throw new Error(
        "AI not initialized. Please wait for initialization to complete.",
      );
    }

    set({ isEvaluating: true, error: null });

    try {
      const webLLM = getWebLLM();
      const result = await webLLM.evaluateAnswer(question, userAnswer);

      set({
        currentEvaluation: result,
        isEvaluating: false,
        lastResponse: JSON.stringify(result),
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Evaluation failed";
      set({ error: errorMessage, isEvaluating: false });
      throw error;
    }
  },

  generateFollowUp: async (
    question: Question,
    userAnswer: string,
    previousFollowups: string[],
  ) => {
    if (!get().isReady) {
      throw new Error("AI not initialized");
    }

    set({ isEvaluating: true, error: null });

    try {
      const webLLM = getWebLLM();
      const followUp = await webLLM.generateFollowUp(
        question,
        userAnswer,
        previousFollowups,
      );

      set({ isEvaluating: false, lastResponse: followUp });
      return followUp;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate follow-up";
      set({ error: errorMessage, isEvaluating: false });
      throw error;
    }
  },

  generateResponse: async (prompt: string) => {
    if (!get().isReady) {
      throw new Error("AI not initialized");
    }

    try {
      const webLLM = getWebLLM();
      const response = await webLLM.generate(prompt);
      set({ lastResponse: response });
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Generation failed";
      set({ error: errorMessage });
      throw error;
    }
  },

  getHint: async (question: Question) => {
    if (!get().isReady) {
      throw new Error("AI not initialized");
    }

    const prompt = `Provide a helpful hint for this interview question without giving away the full answer:

Question: ${question.question}

Key concepts: ${question.tags.join(", ")}

Provide a brief, helpful hint (2-3 sentences) that guides the user toward the answer without revealing it completely.`;

    try {
      const webLLM = getWebLLM();
      const hint = await webLLM.generate(prompt, {
        maxTokens: 150,
        temperature: 0.5,
      });
      return hint;
    } catch (error) {
      // Fallback hints based on question content
      if (question.tags.includes("javascript")) {
        return "Think about how JavaScript handles scope and closure patterns.";
      } else if (question.tags.includes("css")) {
        return "Consider the CSS cascade and specificity rules.";
      } else if (question.tags.includes("react")) {
        return "Consider component lifecycle and state management patterns.";
      }
      return "Break down the problem into smaller parts and think about the core concepts involved.";
    }
  },

  setCurrentModel: (model: ModelInfo) => {
    set({ currentModel: model });
    // Reset and reinitialize with new model
    resetWebLLM();
    set({ isReady: false, progress: null });
  },

  clearEvaluation: () => {
    set({ currentEvaluation: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useAIStore;
