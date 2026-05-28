import { useEffect } from 'react';

interface StudyKeyboardHandlers {
  onFlip: () => void;
  onAgain: () => void;
  onHard: () => void;
  onGood: () => void;
  onEasy: () => void;
  onSkip: () => void;
  onFeynman: () => void;
}

export function useStudyKeyboard(handlers: StudyKeyboardHandlers): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const key = event.key;
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      switch (key) {
        case ' ':
          event.preventDefault();
          handlers.onFlip();
          break;
        case '1':
          event.preventDefault();
          handlers.onAgain();
          break;
        case '2':
          event.preventDefault();
          handlers.onHard();
          break;
        case '3':
          event.preventDefault();
          handlers.onGood();
          break;
        case '4':
          event.preventDefault();
          handlers.onEasy();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault();
          handlers.onGood();
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
