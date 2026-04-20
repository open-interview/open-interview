/**
 * Chat Store - Zustand store for managing chat/conversation state
 */

import { create } from "zustand";
import type {
  ChatStoreState,
  ChatStoreActions,
  ChatMessage,
  Question,
  EvaluationResult,
} from "@/types";

type ChatStore = ChatStoreState & ChatStoreActions;

const initialState: ChatStoreState = {
  currentSession: null,
  messages: [],
  isProcessing: false,
  currentQuestion: null,
  evaluationResult: null,
  hintsUsed: 0,
  timeSpent: 0,
};

export const useChatStore = create<ChatStore>((set) => ({
  ...initialState,

  startSession: (question: Question) => {
    const now = new Date();
    set({
      currentQuestion: question,
      messages: [
        {
          id: crypto.randomUUID(),
          role: "ai",
          content: question.question,
          timestamp: now,
          type: "question",
          metadata: { questionId: question.id },
        },
      ],
      hintsUsed: 0,
      timeSpent: 0,
      evaluationResult: null,
      isProcessing: false,
    });
  },

  addMessage: (message: ChatMessage) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  updateMessage: (id: string, updates: Partial<ChatMessage>) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg,
      ),
    }));
  },

  setProcessing: (processing: boolean) => {
    set({ isProcessing: processing });
  },

  setCurrentQuestion: (question: Question | null) => {
    set({ currentQuestion: question });
  },

  setEvaluationResult: (result: EvaluationResult | null) => {
    set({ evaluationResult: result });
  },

  useHint: () => {
    set((state) => ({
      hintsUsed: state.hintsUsed + 1,
    }));
  },

  incrementTimeSpent: (seconds: number) => {
    set((state) => ({
      timeSpent: state.timeSpent + seconds,
    }));
  },

  endSession: () => {
    set({
      currentSession: null,
      isProcessing: false,
    });
  },

  reset: () => {
    set(initialState);
  },
}));
