import { useState, useCallback, useRef, useEffect } from 'react';

export interface UndoableAction<T> {
  previousState: T;
  message: string;
  undo: () => void;
}

const UNDO_TIMEOUT = 4000;

export function useUndo<T>() {
  const [pendingAction, setPendingAction] = useState<UndoableAction<T> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUndoTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearUndoTimeout();
  }, [clearUndoTimeout]);

  const triggerUndo = useCallback((
    message: string,
    previousState: T,
    undo: () => void,
    duration: number = UNDO_TIMEOUT
  ) => {
    clearUndoTimeout();
    setPendingAction({ previousState, message, undo });

    timeoutRef.current = setTimeout(() => {
      setPendingAction(null);
    }, duration);
  }, [clearUndoTimeout]);

  const undo = useCallback(() => {
    if (pendingAction) {
      pendingAction.undo();
      setPendingAction(null);
      clearUndoTimeout();
    }
  }, [pendingAction, clearUndoTimeout]);

  const dismiss = useCallback(() => {
    setPendingAction(null);
    clearUndoTimeout();
  }, [clearUndoTimeout]);

  return {
    pendingAction,
    triggerUndo,
    undo,
    dismiss,
  };
}