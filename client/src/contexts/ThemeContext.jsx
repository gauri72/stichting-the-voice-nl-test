import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  persistThemePreference,
  readThemePreference,
  resolveTheme,
  THEME_PREFERENCE_KEY
} from "../utils/themeSchedule.js";

const ThemeContext = createContext(null);

function applyThemeToDocument(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => readThemePreference());
  const [theme, setThemeState] = useState(() => resolveTheme(readThemePreference()));

  useEffect(() => {
    const resolved = resolveTheme(preference);
    setThemeState(resolved);
    applyThemeToDocument(resolved);
    persistThemePreference(preference);
  }, [preference]);

  const setTheme = useCallback((next) => {
    setPreference(next === "dark" ? "dark" : "light");
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference((prev) => {
      const current = resolveTheme(prev);
      return current === "dark" ? "light" : "dark";
    });
  }, []);

  const value = useMemo(
    () => ({
      theme,
      preference,
      isDark: theme === "dark",
      setTheme,
      toggleTheme,
      setLightTheme: () => setTheme("light"),
      setDarkTheme: () => setTheme("dark")
    }),
    [theme, preference, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

export { THEME_PREFERENCE_KEY };
