export function formatShortDate(isoOrDate) {
  if (!isoOrDate) return { day: "", month: "" };
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return { day: "", month: "" };
  return {
    day: String(d.getDate()),
    month: new Intl.DateTimeFormat("en-GB", { month: "short" }).format(d).toUpperCase(),
  };
}

export function formatDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  if (!total) return "";
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function isWithinNextHours(dateIso, startTime, hours = 24) {
  const date = combineDateAndTime(dateIso, startTime);
  if (!date) return false;
  const now = Date.now();
  const diff = date.getTime() - now;
  return diff > 0 && diff <= hours * 60 * 60 * 1000;
}

export function combineDateAndTime(dateIso, startTime) {
  if (!dateIso) return null;
  const base = new Date(dateIso);
  if (Number.isNaN(base.getTime())) return null;
  const match = String(startTime || "").match(/^(\d{1,2}):(\d{2})/);
  if (match) base.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return base;
}

export function getCountdownParts(targetDate) {
  if (!targetDate) return null;
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}
