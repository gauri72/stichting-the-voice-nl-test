/** Manual theme preference (light / dark). Default: dark. */

export const THEME_PREFERENCE_KEY = "voice-theme-preference";
/** @deprecated Legacy manual theme key; migrated to THEME_PREFERENCE_KEY */
export const THEME_STORAGE_KEY = "voice-theme";

export const DEFAULT_THEME = "dark";

export function readThemePreference() {
  if (typeof window === "undefined") return DEFAULT_THEME;

  const stored = localStorage.getItem(THEME_PREFERENCE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  if (stored === "auto") {
    return DEFAULT_THEME;
  }

  const legacy = localStorage.getItem(THEME_STORAGE_KEY);
  if (legacy === "light" || legacy === "dark") {
    return legacy;
  }

  return DEFAULT_THEME;
}

export function resolveTheme(preference = readThemePreference()) {
  return preference === "light" ? "light" : "dark";
}

export function persistThemePreference(preference) {
  const normalized = preference === "light" ? "light" : "dark";
  localStorage.setItem(THEME_PREFERENCE_KEY, normalized);
  localStorage.removeItem(THEME_STORAGE_KEY);
}
