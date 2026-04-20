/**
 * WebLLM React Hooks
 * Provides React hooks for interacting with the WebLLM AI service
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { EvaluationResult, Question, ModelLoadProgress } from "@/types";
import { getWebLLM, createWebLLM, AVAILABLE_MODELS } from "@/lib/ai/webllm";

export interface UseWebLLMOptions {
  autoInitialize?: boolean;
  modelId?: string;
}

export interface UseWebLLMReturn {
  isInitializing: boolean;
  isReady: boolean;
  progress: ModelLoadProgress | null;
  error: string | null;
  initialize: () => Promise<void>;
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
}

export function useWebLLM(options: UseWebLLMOptions = {}): UseWebLLMReturn {
  const { autoInitialize = true, modelId } = options;

  const [isInitializing, setIsInitializing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState<ModelLoadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const webLLMRef = useRef(getWebLLM({ modelId }));

  const initialize = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    try {
      await webLLMRef.current.initialize((p) => {
        setProgress(p);
      });
      setIsReady(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initialize AI model";
      setError(errorMessage);
      setIsReady(false);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (autoInitialize && !isReady && !isInitializing && !error) {
      initialize();
    }
  }, [autoInitialize, isReady, isInitializing, error, initialize]);

  const evaluateAnswer = useCallback(
    async (
      _question: Question,
      _userAnswer: string,
    ): Promise<EvaluationResult> => {
      if (!isReady) {
        throw new Error("AI model not ready. Please wait for initialization.");
      }

      try {
        const result = await webLLMRef.current.evaluateAnswer(
          _question,
          _userAnswer,
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Evaluation failed";
        throw new Error(errorMessage);
      }
    },
    [isReady],
  );

  const generateFollowUp = useCallback(
    async (
      _question: Question,
      _userAnswer: string,
      _previousFollowups: string[],
    ): Promise<string> => {
      if (!isReady) {
        throw new Error("AI model not ready");
      }

      try {
        const followUp = await webLLMRef.current.generateFollowUp(
          _question,
          _userAnswer,
          _previousFollowups,
        );
        return followUp;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to generate follow-up";
        throw new Error(errorMessage);
      }
    },
    [isReady],
  );

  const generateResponse = useCallback(
    async (prompt: string): Promise<string> => {
      if (!isReady) {
        throw new Error("AI model not ready");
      }

      try {
        const response = await webLLMRef.current.generate(prompt);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Generation failed";
        throw new Error(errorMessage);
      }
    },
    [isReady],
  );

  return {
    isInitializing,
    isReady,
    progress,
    error,
    initialize,
    evaluateAnswer,
    generateFollowUp,
    generateResponse,
  };
}

export interface UseModelDownloadReturn {
  models: typeof AVAILABLE_MODELS;
  isDownloading: boolean;
  downloadProgress: number;
  downloadModel: (modelId: string) => Promise<void>;
  error: string | null;
}

export function useModelDownload(): UseModelDownloadReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const downloadModel = useCallback(async (modelId: string) => {
    setIsDownloading(true);
    setError(null);
    setDownloadProgress(0);

    try {
      const webLLM = createWebLLM({
        modelId,
        temperature: 0.7,
        maxTokens: 1024,
        topP: 0.9,
      });

      await webLLM.initialize((p) => {
        setDownloadProgress(p.progress);
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Download failed";
      setError(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return {
    models: AVAILABLE_MODELS,
    isDownloading,
    downloadProgress,
    downloadModel,
    error,
  };
}
