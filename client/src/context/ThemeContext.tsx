import { createContext, useContext, useEffect, useState } from "react";

// Gen Z themes - Dark and Light modes
export const themes = [
  { id: "genz-dark", name: "Gen Z Dark", category: "genz", description: "Pure black with neon accents" },
  { id: "genz-light", name: "Gen Z Light", category: "genz", description: "Pure white with vibrant accents" },
] as const;

export type Theme = typeof themes[number]["id"];

export const themeCategories = [
  { id: "genz", name: "Gen Z" },
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
  // Load theme from localStorage or default to dark
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'genz-dark' || saved === 'genz-light') ? saved : 'genz-dark';
  });

  const [autoRotate, setAutoRotate] = useState(false);
  
  // Listen to storage events for theme changes (for testing and cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        const newTheme = e.newValue as Theme;
        if (newTheme === 'genz-dark' || newTheme === 'genz-light') {
          setThemeState(newTheme);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Apply theme to DOM and save to localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove old theme classes
    root.classList.remove('genz-dark', 'genz-light', 'dark', 'light');
    
    // Add new theme class
    root.classList.add(theme);
    root.setAttribute("data-theme", theme);
    
    // Also set dark/light for compatibility
    if (theme === 'genz-dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(current => current === 'genz-dark' ? 'genz-light' : 'genz-dark');
  };

  const cycleTheme = () => {
    const currentIndex = themes.findIndex(t => t.id === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setThemeState(themes[nextIndex].id);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      toggleTheme,
      cycleTheme, 
      themes, 
      themeCategories,
      autoRotate,
      setAutoRotate
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
