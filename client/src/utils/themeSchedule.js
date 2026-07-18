/** Theme preference and local sunrise/sunset scheduling. Default: dark. */

export const THEME_PREFERENCE_KEY = "voice-theme-preference";
export const THEME_LOCATION_KEY = "voice-theme-location";
/** @deprecated Legacy manual theme key; migrated to THEME_PREFERENCE_KEY. */
export const THEME_STORAGE_KEY = "voice-theme";
export const DEFAULT_THEME = "dark";
export const THEME_PREFERENCES = ["dark", "light", "auto"];

const LOCATION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const RAD = Math.PI / 180;

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function dayOfYear(date) {
  // Use the device's calendar day; Auto is intentionally local to the user.
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((current - start) / 86400000);
}

/**
 * NOAA-style sunrise/sunset approximation. Returned dates are UTC instants,
 * so daylight-saving and display timezone handling remain browser-native.
 */
function solarTime(date, latitude, longitude, sunrise) {
  const n = dayOfYear(date);
  const longitudeHour = longitude / 15;
  const approximateTime = n + ((sunrise ? 6 : 18) - longitudeHour) / 24;
  const meanAnomaly = (0.9856 * approximateTime) - 3.289;
  let trueLongitude = meanAnomaly
    + 1.916 * Math.sin(meanAnomaly * RAD)
    + 0.02 * Math.sin(2 * meanAnomaly * RAD)
    + 282.634;
  trueLongitude = normalizeDegrees(trueLongitude);

  let rightAscension = Math.atan(0.91764 * Math.tan(trueLongitude * RAD)) / RAD;
  rightAscension = normalizeDegrees(rightAscension);
  rightAscension += Math.floor(trueLongitude / 90) * 90 - Math.floor(rightAscension / 90) * 90;
  rightAscension /= 15;

  const sinDeclination = 0.39782 * Math.sin(trueLongitude * RAD);
  const cosDeclination = Math.cos(Math.asin(sinDeclination));
  const zenith = 90.833;
  const cosHourAngle = (
    Math.cos(zenith * RAD) - sinDeclination * Math.sin(latitude * RAD)
  ) / (cosDeclination * Math.cos(latitude * RAD));

  // Polar day/night: there is no transition on this date.
  if (cosHourAngle > 1 || cosHourAngle < -1) return null;

  let hourAngle = sunrise
    ? 360 - (Math.acos(cosHourAngle) / RAD)
    : Math.acos(cosHourAngle) / RAD;
  hourAngle /= 15;

  const localMeanTime = hourAngle + rightAscension - (0.06571 * approximateTime) - 6.622;
  const utcHours = normalizeDegrees((localMeanTime - longitudeHour) * 15) / 15;
  const midnightUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return new Date(midnightUtc + utcHours * 60 * 60 * 1000);
}

export function getSunTimes(date, coordinates) {
  if (!coordinates) return { sunrise: null, sunset: null };
  const latitude = Number(coordinates.latitude);
  const longitude = Number(coordinates.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { sunrise: null, sunset: null };
  }
  return {
    sunrise: solarTime(date, latitude, longitude, true),
    sunset: solarTime(date, latitude, longitude, false),
  };
}

export function readThemePreference() {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(THEME_PREFERENCE_KEY);
  if (THEME_PREFERENCES.includes(stored)) return stored;

  const legacy = localStorage.getItem(THEME_STORAGE_KEY);
  if (legacy === "light" || legacy === "dark") return legacy;
  return DEFAULT_THEME;
}

export function readThemeLocation() {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(THEME_LOCATION_KEY) || "null");
    if (
      !Number.isFinite(Number(value?.latitude))
      || !Number.isFinite(Number(value?.longitude))
      || Date.now() - Number(value?.updatedAt || 0) > LOCATION_MAX_AGE_MS
    ) return null;
    return value;
  } catch {
    return null;
  }
}

export function persistThemeLocation(coordinates) {
  if (typeof window === "undefined" || !coordinates) return;
  localStorage.setItem(THEME_LOCATION_KEY, JSON.stringify({
    latitude: Number(coordinates.latitude),
    longitude: Number(coordinates.longitude),
    updatedAt: Date.now(),
  }));
}

export function getSystemTheme() {
  if (typeof window === "undefined" || !window.matchMedia) return DEFAULT_THEME;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function resolveAutoTheme(coordinates, now = new Date(), systemTheme = getSystemTheme()) {
  if (!coordinates) {
    return { theme: systemTheme, source: "system", nextTransition: null, sunrise: null, sunset: null };
  }
  const { sunrise, sunset } = getSunTimes(now, coordinates);
  if (!sunrise || !sunset) {
    return { theme: systemTheme, source: "system", nextTransition: null, sunrise, sunset };
  }
  const isDaylight = now >= sunrise && now < sunset;
  let nextTransition = isDaylight ? sunset : sunrise;
  if (!isDaylight && now >= sunset) {
    nextTransition = getSunTimes(new Date(now.getTime() + 86400000), coordinates).sunrise;
  }
  return {
    theme: isDaylight ? "light" : "dark",
    source: "sun",
    nextTransition,
    sunrise,
    sunset,
  };
}

export function resolveTheme(preference = readThemePreference(), options = {}) {
  if (preference === "light") return "light";
  if (preference === "auto") {
    return resolveAutoTheme(options.coordinates, options.now, options.systemTheme).theme;
  }
  return "dark";
}

export function persistThemePreference(preference) {
  if (typeof window === "undefined") return;
  const normalized = THEME_PREFERENCES.includes(preference) ? preference : DEFAULT_THEME;
  localStorage.setItem(THEME_PREFERENCE_KEY, normalized);
  localStorage.removeItem(THEME_STORAGE_KEY);
}
