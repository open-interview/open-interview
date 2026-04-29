import { useState, useEffect, useCallback, useMemo } from 'react';
import posthog from 'posthog-js';

export type VariantAssignment = 'A' | 'B' | 'control' | string;

export interface ABTestConfig {
  testName: string;
  variants: Record<string, any>;
  featureFlagKey?: string;
  enableTracking?: boolean;
}

export interface ABTestResult<T = any> {
  variant: string;
  value: T;
  isControl: boolean;
  trackExposure: () => void;
  isLoaded: boolean;
}

const variantStorage: Map<string, string> = new Map();

function getStoredVariant(testName: string): string | null {
  try {
    const stored = localStorage.getItem(`ab_test_${testName}_variant`);
    if (stored) return stored;
  } catch (e) {
    // localStorage might not be available
  }
  return variantStorage.get(testName) || null;
}

function storeVariant(testName: string, variant: string): void {
  try {
    localStorage.setItem(`ab_test_${testName}_variant`, variant);
  } catch (e) {
    // localStorage might not be available
  }
  variantStorage.set(testName, variant);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function assignVariant(testName: string, variants: string[]): string {
  const stored = getStoredVariant(testName);
  if (stored && variants.includes(stored)) {
    return stored;
  }

  let userId = 'anonymous';
  try {
    userId = localStorage.getItem('user_id') || 'anonymous';
  } catch (e) {
    // ignore
  }

  const seed = `${testName}_${userId}`;
  const hash = hashString(seed);
  const index = hash % variants.length;
  const variant = variants[index];

  storeVariant(testName, variant);
  return variant;
}

export function useABTest<T = any>(config: ABTestConfig): ABTestResult<T> {
  const {
    testName,
    variants,
    featureFlagKey,
    enableTracking = true,
  } = config;

  const variantKeys = useMemo(() => Object.keys(variants), [variants]);
  
  const [variant, setVariant] = useState<string>(() => {
    if (featureFlagKey && typeof window !== 'undefined') {
      const flagValue = posthog.getFeatureFlag(featureFlagKey);
      if (flagValue && variantKeys.includes(flagValue as string)) {
        return flagValue as string;
      }
    }
    return assignVariant(testName, variantKeys);
  });

  const [isLoaded, setIsLoaded] = useState(!featureFlagKey);

  useEffect(() => {
    if (!featureFlagKey) {
      setIsLoaded(true);
      return;
    }

    const checkFeatureFlag = () => {
      const flagValue = posthog.getFeatureFlag(featureFlagKey);
      if (flagValue !== undefined) {
        const newVariant = variantKeys.includes(flagValue as string)
          ? (flagValue as string)
          : assignVariant(testName, variantKeys);
        setVariant(newVariant);
        setIsLoaded(true);
      }
    };

    checkFeatureFlag();

    const unsubscribe = posthog.onFeatureFlags(() => {
      checkFeatureFlag();
    });

    return () => {
      unsubscribe();
    };
  }, [featureFlagKey, testName, variantKeys]);

  const trackExposure = useCallback(() => {
    if (!enableTracking) return;

    try {
      posthog.capture(`$ab_test_exposure`, {
        test_name: testName,
        variant: variant,
        timestamp: new Date().toISOString(),
      });

      if (featureFlagKey) {
        posthog.capture(`$feature_flag_called`, {
          feature_flag: featureFlagKey,
          variant: variant,
          $set: { [`ab_test_${testName}`]: variant },
        });
      }
    } catch (e) {
      console.warn('[A/B Test] Failed to track exposure:', e);
    }
  }, [testName, variant, featureFlagKey, enableTracking]);

  const value = variants[variant] as T;
  const isControl = variant === 'control' || variant === 'A';

  return {
    variant,
    value,
    isControl,
    trackExposure,
    isLoaded,
  };
}

export function useFeatureFlag(flagKey: string): {
  isEnabled: boolean;
  value: any;
  isLoaded: boolean;
} {
  const [isEnabled, setIsEnabled] = useState(false);
  const [value, setValue] = useState<any>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkFlag = () => {
      const flagValue = posthog.getFeatureFlag(flagKey);
      if (flagValue !== undefined) {
        setIsEnabled(flagValue === true || flagValue === 'true');
        setValue(flagValue);
        setIsLoaded(true);
      }
    };

    checkFlag();

    const unsubscribe = posthog.onFeatureFlags(() => {
      checkFlag();
    });

    return () => {
      unsubscribe();
    };
  }, [flagKey]);

  return { isEnabled, value, isLoaded };
}

export function ABTestProvider({ 
  children,
  apiKey,
  options = {},
}: {
  children: React.ReactNode;
  apiKey?: string;
  options?: Record<string, any>;
}) {
  useEffect(() => {
    if (!apiKey || typeof window === 'undefined') return;

    posthog.init(apiKey, {
      api_host: 'https://app.posthog.com',
      loaded: (posthogInstance) => {
        posthogInstance.debug(false);
      },
      autocapture: false,
      disable_session_recording: true,
      ...options,
    });
  }, [apiKey, options]);

  return <>{children}</>;
}

export const abTestButtonText = {
  testName: 'button_text_challenge',
  variants: {
    A: 'Start Challenge',
    B: 'Practice Now',
  },
  featureFlagKey: 'button-text-challenge',
  enableTracking: true,
};
