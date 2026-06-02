/** Theme schedule based on the user's local region time. */

export const THEME_PREFERENCE_KEY = "voice-theme-preference";
/** @deprecated Legacy manual theme key; migrated to THEME_PREFERENCE_KEY */
export const THEME_STORAGE_KEY = "voice-theme";

export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 20;

export function getLocalHour() {
  return new Date().getHours();
}

export function getLocalTimeTheme() {
  const hour = getLocalHour();
  return hour >= DAY_START_HOUR && hour < DAY_END_HOUR ? "light" : "dark";
}

export function readThemePreference() {
  if (typeof window === "undefined") return "auto";

  const stored = localStorage.getItem(THEME_PREFERENCE_KEY);
  if (stored === "auto" || stored === "light" || stored === "dark") {
    return stored;
  }

  const legacy = localStorage.getItem(THEME_STORAGE_KEY);
  if (legacy === "light" || legacy === "dark") {
    return legacy;
  }

  return "auto";
}

export function resolveTheme(preference = readThemePreference()) {
  if (preference === "light" || preference === "dark") {
    return preference;
  }
  return getLocalTimeTheme();
}

export function persistThemePreference(preference) {
  localStorage.setItem(THEME_PREFERENCE_KEY, preference);
  localStorage.removeItem(THEME_STORAGE_KEY);
}
