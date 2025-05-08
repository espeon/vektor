import { createContext, useContext, useState, useEffect } from "react";

export enum Theme {
  LIGHT = "light",
  DARK = "dark",
}

// Create context
const ThemeContext = createContext<{
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode?: Theme) => void;
}>({
  theme: Theme.LIGHT,
  isDarkMode: false,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Get initial theme from localStorage or system preference
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme;

    // Check system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return Theme.DARK;
    }

    return Theme.LIGHT;
  });

  // Toggle theme function
  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT,
    );
  };

  // Set specific theme
  const setThemeMode = (mode = Theme.LIGHT) => {
    if (Object.values(Theme).includes(mode)) {
      setTheme(mode);
    }
  };

  // Update document classes and localStorage when theme changes
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem("theme", theme);

    // Update document class for Tailwind dark mode
    if (theme === Theme.DARK) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Theme context value
  const value = {
    theme: theme as Theme,
    isDarkMode: theme === Theme.DARK,
    toggleTheme,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Custom hook for using theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
