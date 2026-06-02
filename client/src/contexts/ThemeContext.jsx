import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getLocalTimeTheme,
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

  useEffect(() => {
    if (preference !== "auto") return undefined;

    function syncWithLocalTime() {
      const next = getLocalTimeTheme();
      setThemeState(next);
      applyThemeToDocument(next);
    }

    syncWithLocalTime();
    const intervalId = window.setInterval(syncWithLocalTime, 60_000);
    return () => window.clearInterval(intervalId);
  }, [preference]);

  const setTheme = useCallback((next) => {
    setPreference(next === "dark" ? "dark" : "light");
  }, []);

  const setAutoTheme = useCallback(() => {
    setPreference("auto");
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
      isAuto: preference === "auto",
      setTheme,
      setAutoTheme,
      toggleTheme,
      setLightTheme: () => setTheme("light"),
      setDarkTheme: () => setTheme("dark")
    }),
    [theme, preference, setTheme, setAutoTheme, toggleTheme]
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
