export function getMonthGridDays(year, month) {
  // month is 1-indexed. Grid starts on Monday.
  const firstOfMonth = new Date(year, month - 1, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month - 1, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function toDayKey(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isSameDay(a, b) {
  return Boolean(a && b && toDayKey(a) === toDayKey(b));
}

const CATEGORY_COLORS = {
  Music: "bg-pink-500",
  Culture: "bg-amber-500",
  Sports: "bg-blue-500",
  Community: "bg-emerald-500",
  Festivals: "bg-purple-500",
  Workshops: "bg-cyan-500",
  Experience: "bg-evx-accent",
};

export function categoryColor(category) {
  return CATEGORY_COLORS[category] || "bg-evx-accent";
}
