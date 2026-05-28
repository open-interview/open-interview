export function useHaptic() {
  const supported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  return {
    supported,
    light: () => { if (supported) navigator.vibrate(10); },
    medium: () => { if (supported) navigator.vibrate(20); },
    heavy: () => { if (supported) navigator.vibrate([10, 30, 10]); },
    selection: () => { if (supported) navigator.vibrate(15); },
  };
}
