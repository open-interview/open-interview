import { useEffect } from 'react';

interface StudyKeyboardHandlers {
  onFlip: () => void;
  onEasy: () => void;
  onAgain: () => void;
  onHard: () => void;
  onSkip: () => void;
  onFeynman: () => void;
}

export function useStudyKeyboard(handlers: StudyKeyboardHandlers): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const key = event.key;

      switch (key) {
        case ' ':
          event.preventDefault();
          handlers.onFlip();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault();
          handlers.onEasy();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault();
          handlers.onAgain();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          event.preventDefault();
          handlers.onHard();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault();
          handlers.onSkip();
          break;
        case 'e':
        case 'E':
          event.preventDefault();
          handlers.onFeynman();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers]);
}
