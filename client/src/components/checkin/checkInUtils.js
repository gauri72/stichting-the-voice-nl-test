const RECENT_KEY = "voice_checkin_recent";
const RECENT_LIMIT = 12;

export function extractTokenFromInput(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const urlMatch = trimmed.match(/\/verify\/([a-f0-9-]+)/i);
  if (urlMatch) return urlMatch[1];
  if (/^[a-f0-9-]{36}$/i.test(trimmed)) return trimmed;
  return trimmed;
}

export function loadRecentCheckIns() {
  try {
    const raw = sessionStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushRecentCheckIn(entry) {
  const current = loadRecentCheckIns().filter((item) => item.ticketNumber !== entry.ticketNumber);
  const next = [entry, ...current].slice(0, RECENT_LIMIT);
  sessionStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}

export {
  isStandalonePwa,
  getPwaVariantForPath,
  PWA_VARIANTS,
} from "../../pwa/manifestConfig.js";
