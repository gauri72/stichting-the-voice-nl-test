export const PROFILE_ROUTES = {
  dashboard: "/dashboard",
  profile: "/dashboard/profile",
  events: "/events",
  membership: "/membership",
  resetPassword: "/reset-password",
};

export function profileInitials(firstName, lastName, fallback = "U") {
  const value = [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase();
  return value || fallback;
}

export function formatProfilePhone(phone) {
  const raw = String(phone || "").trim();
  if (!raw) return "—";
  if (raw.startsWith("+")) return raw;
  return `+31 ${raw.replace(/^0/, "")}`;
}
