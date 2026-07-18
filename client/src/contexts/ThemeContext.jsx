import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getSystemTheme,
  persistThemeLocation,
  persistThemePreference,
  readThemeLocation,
  readThemePreference,
  resolveAutoTheme,
  resolveTheme,
  THEME_PREFERENCE_KEY,
} from "../utils/themeSchedule.js";

const ThemeContext = createContext(null);

function applyThemeToDocument(theme, preference) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-theme-preference", preference);
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }) {
  const initialPreference = readThemePreference();
  const [preference, setPreference] = useState(initialPreference);
  const [coordinates, setCoordinates] = useState(() => readThemeLocation());
  const [theme, setThemeState] = useState(() => resolveTheme(initialPreference, {
    coordinates: readThemeLocation(),
  }));
  const [autoStatus, setAutoStatus] = useState({
    source: initialPreference === "auto" ? (readThemeLocation() ? "sun" : "system") : "manual",
    nextTransition: null,
    locationError: "",
  });

  const refreshAutoLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setAutoStatus((current) => ({
        ...current,
        source: "system",
        locationError: "Location is unavailable. Using your device theme.",
      }));
      return;
    }

    setAutoStatus((current) => ({ ...current, locating: true, locationError: "" }));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = { latitude: coords.latitude, longitude: coords.longitude };
        persistThemeLocation(next);
        setCoordinates(next);
        setAutoStatus((current) => ({ ...current, locating: false, locationError: "" }));
      },
      () => {
        setAutoStatus((current) => ({
          ...current,
          locating: false,
          source: "system",
          locationError: "Location permission was not granted. Using your device theme.",
        }));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 24 * 60 * 60 * 1000 }
    );
  }, []);

  useEffect(() => {
    persistThemePreference(preference);

    if (preference !== "auto") {
      const resolved = resolveTheme(preference);
      setThemeState(resolved);
      setAutoStatus({ source: "manual", nextTransition: null, locationError: "", locating: false });
      applyThemeToDocument(resolved, preference);
      return undefined;
    }

    const updateAutoTheme = () => {
      const result = resolveAutoTheme(coordinates, new Date(), getSystemTheme());
      setThemeState(result.theme);
      setAutoStatus((current) => ({
        ...current,
        source: result.source,
        nextTransition: result.nextTransition,
        sunrise: result.sunrise,
        sunset: result.sunset,
      }));
      applyThemeToDocument(result.theme, preference);
      return result;
    };

    let timer;
    const scheduleNextTransition = () => {
      const result = updateAutoTheme();
      const transitionDelay = result.nextTransition
        ? Math.max(1000, Math.min(result.nextTransition.getTime() - Date.now() + 1500, 2147483647))
        : 60 * 60 * 1000;
      timer = window.setTimeout(scheduleNextTransition, transitionDelay);
    };
    scheduleNextTransition();
    const media = window.matchMedia?.("(prefers-color-scheme: light)");
    const handleSystemChange = () => {
      if (!coordinates) updateAutoTheme();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") updateAutoTheme();
    };
    media?.addEventListener?.("change", handleSystemChange);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearTimeout(timer);
      media?.removeEventListener?.("change", handleSystemChange);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [preference, coordinates]);

  useEffect(() => {
    if (preference === "auto" && !coordinates) refreshAutoLocation();
  }, [preference, coordinates, refreshAutoLocation]);

  const setTheme = useCallback((next) => {
    setPreference(["dark", "light", "auto"].includes(next) ? next : "dark");
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference((current) => (resolveTheme(current, { coordinates }) === "dark" ? "light" : "dark"));
  }, [coordinates]);

  const value = useMemo(
    () => ({
      theme,
      preference,
      isDark: theme === "dark",
      autoStatus,
      setTheme,
      toggleTheme,
      refreshAutoLocation,
      setLightTheme: () => setTheme("light"),
      setDarkTheme: () => setTheme("dark"),
      setAutoTheme: () => setTheme("auto"),
    }),
    [theme, preference, autoStatus, setTheme, toggleTheme, refreshAutoLocation]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export { THEME_PREFERENCE_KEY };
