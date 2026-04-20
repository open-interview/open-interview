/**
 * Hook for managing Answer Formatting Standards overrides
 * 
 * This hook provides functionality for managing manual overrides
 * of formatting patterns, including tracking usage metrics.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  configurationManager, 
  OverrideRecord 
} from '../lib/answer-formatting/configuration-manager';

export interface UseFormatOverridesReturn {
  // Override data
  overrides: OverrideRecord[];
  hasOverride: (questionId: string) => boolean;
  getOverride: (questionId: string) => OverrideRecord | null;
  
  // Override actions
  addOverride: (override: Omit<OverrideRecord, 'timestamp'>) => Promise<void>;
  removeOverride: (questionId: string) => Promise<void>;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Metrics
  overrideCount: number;
  refreshOverrides: () => void;
}

/**
 * Hook for managing format overrides
 */
export const useFormatOverrides = (): UseFormatOverridesReturn => {
  const [overrides, setOverrides] = useState<OverrideRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load overrides on mount
  useEffect(() => {
    loadOverrides();
  }, []);

  const loadOverrides = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedOverrides = configurationManager.getOverrides();
      setOverrides(loadedOverrides);
    } catch (err) {
      setError('Failed to load overrides');
      console.error('Error loading overrides:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasOverride = useCallback((questionId: string): boolean => {
    return overrides.some(override => override.questionId === questionId);
  }, [overrides]);

  const getOverride = useCallback((questionId: string): OverrideRecord | null => {
    return overrides.find(override => override.questionId === questionId) || null;
  }, [overrides]);

  const addOverride = useCallback(async (override: Omit<OverrideRecord, 'timestamp'>) => {
    try {
      setError(null);
      
      // Validate override data
      if (!override.questionId) {
        throw new Error('Question ID is required');
      }
      
      if (!override.justification || override.justification.trim().length < 10) {
        throw new Error('Justification must be at least 10 characters long');
      }

      // Check if override already exists
      if (hasOverride(override.questionId)) {
        throw new Error('Override already exists for this question');
      }

      // Add override using configuration manager
      configurationManager.addOverride(override);
      
      // Refresh overrides list
      await loadOverrides();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add override';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [hasOverride, loadOverrides]);

  const removeOverride = useCallback(async (questionId: string) => {
    try {
      setError(null);
      
      if (!hasOverride(questionId)) {
        throw new Error('No override exists for this question');
      }

      // Remove override using configuration manager
      configurationManager.removeOverride(questionId);
      
      // Refresh overrides list
      await loadOverrides();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove override';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [hasOverride, loadOverrides]);

  const refreshOverrides = useCallback(() => {
    loadOverrides();
  }, [loadOverrides]);

  return {
    // Override data
    overrides,
    hasOverride,
    getOverride,
    
    // Override actions
    addOverride,
    removeOverride,
    
    // State
    isLoading,
    error,
    
    // Metrics
    overrideCount: overrides.length,
    refreshOverrides,
  };
};

/**
 * Hook for managing overrides for a specific question
 */
export const useQuestionOverride = (questionId: string) => {
  const {
    overrides,
    hasOverride,
    getOverride,
    addOverride,
    removeOverride,
    isLoading,
    error,
    refreshOverrides,
  } = useFormatOverrides();

  const questionOverride = getOverride(questionId);
  const hasQuestionOverride = hasOverride(questionId);

  const addQuestionOverride = useCallback(
    async (justification: string, overridePattern?: string, originalPattern?: string) => {
      const override: Omit<OverrideRecord, 'timestamp'> = {
        questionId,
        justification,
        overridePattern,
        originalPattern,
        userId: 'current-user', // In a real app, this would come from auth context
      };
      
      return addOverride(override);
    },
    [questionId, addOverride]
  );

  const removeQuestionOverride = useCallback(async () => {
    return removeOverride(questionId);
  }, [questionId, removeOverride]);

  return {
    // Question-specific data
    override: questionOverride,
    hasOverride: hasQuestionOverride,
    
    // Question-specific actions
    addOverride: addQuestionOverride,
    removeOverride: removeQuestionOverride,
    
    // State
    isLoading,
    error,
    
    // Utilities
    refreshOverrides,
  };
};

export default useFormatOverrides;