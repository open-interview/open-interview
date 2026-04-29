import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

export const themes = [
  { id: "dark", name: "Dark", category: "theme", description: "Pure black with neon accents" },
  { id: "light", name: "Light", category: "theme", description: "Pure white with vibrant accents" },
] as const;

export type Theme = typeof themes[number]["id"];

export const themeCategories = [
  { id: "theme", name: "Theme" },
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  cycleTheme: () => void;
  themes: typeof themes;
  themeCategories: typeof themeCategories;
  autoRotate: boolean;
  setAutoRotate: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'genz-dark') return 'dark';
    if (saved === 'genz-light') return 'light';
    if (saved === 'dark' || saved === 'light') return saved;
    // Respect system preference if no saved theme
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [autoRotate, setAutoRotate] = useState(false);
  const toggleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [announcement, setAnnouncement] = useState('');

  // Listen for system preference changes
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only apply system preference if user hasn't manually set a theme
      const saved = localStorage.getItem('theme');
      if (!saved || (saved !== 'dark' && saved !== 'light' && saved !== 'genz-dark' && saved !== 'genz-light')) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        const v = e.newValue === 'genz-dark' ? 'dark' : e.newValue === 'genz-light' ? 'light' : e.newValue as Theme;
        if (v === 'dark' || v === 'light') setThemeState(v);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    // Preserve focus during theme change
    const activeElement = document.activeElement as HTMLElement | null;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    root.classList.remove('genz-dark', 'genz-light', 'dark', 'light');
    root.classList.add(theme);
    root.setAttribute("data-theme", theme);
    localStorage.setItem('theme', theme);

    // Restore focus and scroll position
    if (activeElement && document.contains(activeElement)) {
      activeElement.focus({ preventScroll: true });
    }
    window.scrollTo(scrollX, scrollY);

    // Announce theme change to screen readers
    setAnnouncement(`${theme === 'dark' ? 'Dark' : 'Light'} theme activated`);

    // Apply M3 token system classes
    if (theme === 'dark') {
      root.style.setProperty('--md-sys-color-primary', 'var(--md-ref-palette-primary40, #6750A4)');
      root.style.setProperty('--md-sys-color-on-primary', 'var(--md-ref-palette-primary100, #FFFFFF)');
      root.style.setProperty('--md-sys-color-primary-container', 'var(--md-ref-palette-primary90, #EADDFF)');
      root.style.setProperty('--md-sys-color-on-primary-container', 'var(--md-ref-palette-primary10, #21005D)');
      root.style.setProperty('--md-sys-color-secondary', 'var(--md-ref-palette-secondary40, #625B71)');
      root.style.setProperty('--md-sys-color-on-secondary', 'var(--md-ref-palette-secondary100, #FFFFFF)');
      root.style.setProperty('--md-sys-color-surface', 'var(--md-ref-palette-neutral98, #1C1B1F)');
      root.style.setProperty('--md-sys-color-on-surface', 'var(--md-ref-palette-neutral10, #E6E1E5)');
      root.style.setProperty('--md-sys-color-surface-variant', 'var(--md-ref-palette-neutral-variant90, #49454F)');
      root.style.setProperty('--md-sys-color-on-surface-variant', 'var(--md-ref-palette-neutral-variant80, #CAC4D0)');
      root.style.setProperty('--md-sys-color-outline', 'var(--md-ref-palette-neutral-variant50, #938F99)');
      root.style.setProperty('--md-sys-color-error', 'var(--md-ref-palette-error40, #FFB4AB)');
      root.style.setProperty('--md-sys-color-on-error', 'var(--md-ref-palette-error100, #690005)');
    } else {
      root.style.setProperty('--md-sys-color-primary', 'var(--md-ref-palette-primary40, #6750A4)');
      root.style.setProperty('--md-sys-color-on-primary', 'var(--md-ref-palette-primary100, #FFFFFF)');
      root.style.setProperty('--md-sys-color-primary-container', 'var(--md-ref-palette-primary90, #EADDFF)');
      root.style.setProperty('--md-sys-color-on-primary-container', 'var(--md-ref-palette-primary10, #21005D)');
      root.style.setProperty('--md-sys-color-secondary', 'var(--md-ref-palette-secondary40, #625B71)');
      root.style.setProperty('--md-sys-color-on-secondary', 'var(--md-ref-palette-secondary100, #FFFFFF)');
      root.style.setProperty('--md-sys-color-surface', 'var(--md-ref-palette-neutral98, #FFFBFE)');
      root.style.setProperty('--md-sys-color-on-surface', 'var(--md-ref-palette-neutral10, #1C1B1F)');
      root.style.setProperty('--md-sys-color-surface-variant', 'var(--md-ref-palette-neutral-variant90, #E7E0EC)');
      root.style.setProperty('--md-sys-color-on-surface-variant', 'var(--md-ref-palette-neutral-variant30, #49454F)');
      root.style.setProperty('--md-sys-color-outline', 'var(--md-ref-palette-neutral-variant50, #79747E)');
      root.style.setProperty('--md-sys-color-error', 'var(--md-ref-palette-error40, #B3261E)');
      root.style.setProperty('--md-sys-color-on-error', 'var(--md-ref-palette-error100, #FFFFFF)');
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => setThemeState(newTheme), []);

  const toggleTheme = useCallback(() => {
    // Debounce rapid toggling to prevent flash
    if (toggleTimeoutRef.current) return;
    toggleTimeoutRef.current = setTimeout(() => {
      toggleTimeoutRef.current = null;
    }, 150);
    setThemeState(current => current === 'dark' ? 'light' : 'dark');
  }, []);

  const cycleTheme = useCallback(() => {
    const currentIndex = themes.findIndex(t => t.id === theme);
    setThemeState(themes[(currentIndex + 1) % themes.length].id);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, cycleTheme, themes, themeCategories, autoRotate, setAutoRotate }}>
      {children}
      {/* Live region for screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </ThemeContext.Provider>
  );
}


export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
