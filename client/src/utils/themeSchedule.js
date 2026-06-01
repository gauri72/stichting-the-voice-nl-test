/** Theme schedule for the Netherlands (Europe/Amsterdam). */

export const THEME_PREFERENCE_KEY = "voice-theme-preference";
/** @deprecated Legacy manual theme key; migrated to THEME_PREFERENCE_KEY */
export const THEME_STORAGE_KEY = "voice-theme";

export const NL_TIMEZONE = "Europe/Amsterdam";
/** Local civil day in NL: light theme from 06:00 until 20:00 */
export const NL_DAY_START_HOUR = 6;
export const NL_DAY_END_HOUR = 20;

export function getAmsterdamHour() {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: NL_TIMEZONE,
      hour: "numeric",
      hour12: false
    }).format(new Date())
  );
}

export function getNetherlandsTheme() {
  const hour = getAmsterdamHour();
  return hour >= NL_DAY_START_HOUR && hour < NL_DAY_END_HOUR ? "light" : "dark";
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
  return getNetherlandsTheme();
}

export function persistThemePreference(preference) {
  localStorage.setItem(THEME_PREFERENCE_KEY, preference);
  localStorage.removeItem(THEME_STORAGE_KEY);
}
