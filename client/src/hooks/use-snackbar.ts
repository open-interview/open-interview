import { useState, useCallback, useRef, useEffect } from 'react';

export interface SnackbarMessage {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

const SNACKBAR_TIMEOUT = 4000;

export function useSnackbar() {
  const [snackbar, setSnackbar] = useState<SnackbarMessage | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSnackbarTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearSnackbarTimeout();
  }, [clearSnackbarTimeout]);

  const showSnackbar = useCallback((
    message: string,
    actionLabel?: string,
    onAction?: () => void,
    duration: number = SNACKBAR_TIMEOUT
  ) => {
    clearSnackbarTimeout();
    setSnackbar({ message, actionLabel, onAction, duration });

    if (!onAction) {
      timeoutRef.current = setTimeout(() => {
        setSnackbar(null);
      }, duration);
    }
  }, [clearSnackbarTimeout]);

  const dismissSnackbar = useCallback(() => {
    clearSnackbarTimeout();
    setSnackbar(null);
  }, [clearSnackbarTimeout]);

  return {
    snackbar,
    showSnackbar,
    dismissSnackbar,
  };
}
