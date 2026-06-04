import { useState, useCallback } from 'react';
import type { TestQuestion } from '../lib/tests';

interface LifelineState {
  fiftyFiftyUsed: boolean;
  hintUsed: boolean;
  skipUsed: boolean;
  eliminatedOptions: Record<string, string[]>;
  hints: Record<string, string>;
}

export function useLifelines() {
  const [state, setState] = useState<LifelineState>({
    fiftyFiftyUsed: false,
    hintUsed: false,
    skipUsed: false,
    eliminatedOptions: {},
    hints: {},
  });

  const activateFiftyFifty = useCallback((question: TestQuestion) => {
    if (state.fiftyFiftyUsed) return;

    const wrongOptions = question.options.filter(o => !o.isCorrect);
    const correctOptions = question.options.filter(o => o.isCorrect);

    const eliminateCount = Math.floor(wrongOptions.length / 2);
    const shuffled = [...wrongOptions].sort(() => Math.random() - 0.5);
    const toEliminate = shuffled.slice(0, eliminateCount).map(o => o.id);

    setState(prev => ({
      ...prev,
      fiftyFiftyUsed: true,
      eliminatedOptions: {
        ...prev.eliminatedOptions,
        [question.id]: toEliminate,
      },
    }));
  }, [state.fiftyFiftyUsed]);

  const activateHint = useCallback((question: TestQuestion) => {
    if (state.hintUsed) return;

    let hintText = '';
    if (question.explanation) {
      const cleaned = question.explanation
        .replace(/^##\s+.*$/m, '')
        .trim();
      const firstSentence = cleaned.split(/\.\s/)[0];
      hintText = firstSentence || cleaned;
      if (hintText.length > 160) {
        hintText = hintText.substring(0, 157) + '...';
      }
    } else {
      const correctCount = question.options.filter(o => o.isCorrect).length;
      hintText = `There ${correctCount === 1 ? 'is' : 'are'} ${correctCount} correct answer${correctCount > 1 ? 's' : ''} out of ${question.options.length} options.`;
    }

    setState(prev => ({
      ...prev,
      hintUsed: true,
      hints: {
        ...prev.hints,
        [question.id]: hintText,
      },
    }));
  }, [state.hintUsed]);

  const activateSkip = useCallback(() => {
    if (state.skipUsed) return;
    setState(prev => ({ ...prev, skipUsed: true }));
  }, [state.skipUsed]);

  const resetLifelines = useCallback(() => {
    setState({
      fiftyFiftyUsed: false,
      hintUsed: false,
      skipUsed: false,
      eliminatedOptions: {},
      hints: {},
    });
  }, []);

  return {
    ...state,
    activateFiftyFifty,
    activateHint,
    activateSkip,
    resetLifelines,
  };
}
