import { createContext, useContext, useEffect, useState } from "react";

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
    // migrate legacy theme values
    if (saved === 'genz-dark') return 'dark';
    if (saved === 'genz-light') return 'light';
    return (saved === 'dark' || saved === 'light') ? saved : 'dark';
  });

  const [autoRotate, setAutoRotate] = useState(false);

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
    root.classList.remove('genz-dark', 'genz-light', 'dark', 'light');
    root.classList.add(theme);
    root.setAttribute("data-theme", theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => setThemeState(newTheme);
  const toggleTheme = () => setThemeState(current => current === 'dark' ? 'light' : 'dark');
  const cycleTheme = () => {
    const currentIndex = themes.findIndex(t => t.id === theme);
    setThemeState(themes[(currentIndex + 1) % themes.length].id);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, cycleTheme, themes, themeCategories, autoRotate, setAutoRotate }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
