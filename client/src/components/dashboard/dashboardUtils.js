export const PREMIUM_BENEFITS = [
  { id: "entry", label: "Free Event Entry" },
  { id: "seats", label: "Reserved Premium Seats" },
  { id: "lounge", label: "VIP Lounge Access" },
  { id: "artist", label: "Artist Meet & Greet" },
  { id: "partner", label: "Partner Discounts" },
  { id: "merch", label: "Merchandise Discounts" },
  { id: "priority", label: "Priority Registration" },
];

export const UPCOMING_EVENTS = [
  {
    id: "couples-night",
    title: "Couples Night 2026",
    location: "Amsterdam",
    day: "20",
    month: "Jun",
    imageKey: "signature-events-1",
  },
  {
    id: "short-film",
    title: "Int. Short Film Festival",
    location: "Rotterdam",
    day: "05",
    month: "Jul",
    imageKey: "signature-events-2",
  },
  {
    id: "music-festival",
    title: "Music Festival",
    location: "The Hague",
    day: "15",
    month: "Aug",
    imageKey: "signature-events-3",
  },
  {
    id: "cultural-showcase",
    title: "Cultural Showcase",
    location: "Utrecht",
    day: "28",
    month: "Aug",
    imageKey: "signature-events-4",
  },
];

export function planTierLabel(planId) {
  if (!planId) return "Member";
  if (planId.startsWith("privileged")) return "Privileged";
  return "Premium";
}

/** Badge label e.g. "Premium Family Member" without duplicating "Membership". */
export function membershipBadgeLabel(planShort) {
  const label = String(planShort || "").trim();
  if (!label) return "Member";
  if (/member/i.test(label)) return label;
  return `${label} Member`;
}

export function planShortLabel(planId, fallback) {
  switch (planId) {
    case "family":
      return "Premium Family";
    case "single":
      return "Premium Single";
    case "privilegedFamily":
      return "Privileged Family";
    case "privilegedSingle":
      return "Privileged Single";
    default:
      return fallback || "Membership";
  }
}

export function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(1, Math.floor((Date.now() - then) / 1000));
  const units = [
    { limit: 60, div: 1, name: "second" },
    { limit: 3600, div: 60, name: "minute" },
    { limit: 86400, div: 3600, name: "hour" },
    { limit: 604800, div: 86400, name: "day" },
    { limit: 2629800, div: 604800, name: "week" },
    { limit: 31557600, div: 2629800, name: "month" },
    { limit: Infinity, div: 31557600, name: "year" },
  ];
  for (const u of units) {
    if (seconds < u.limit) {
      const value = Math.max(1, Math.floor(seconds / u.div));
      return `${value} ${u.name}${value === 1 ? "" : "s"} ago`;
    }
  }
  return "";
}

export function downloadMembershipCard(card) {
  if (!card) return;
  const code = card.membershipCode || card.membershipNumber || "VOICE";
  const lines = [
    "STICHTING THE V.O.I.C.E. NL",
    "Membership Card",
    "-------------------",
    `Member: ${card.memberName || ""}`,
    `Plan: ${card.planName || ""}`,
    `Membership ID: ${code}`,
    card.validFrom ? `Member since: ${card.validFrom}` : null,
    card.validTo ? `Valid until: ${card.validTo}` : null,
    "",
    "Present this code at member events.",
  ].filter(Boolean);
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `voice-membership-${code}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function buildQrSrc(membershipId) {
  const data = encodeURIComponent(membershipId !== "—" ? membershipId : "VOICE-NL");
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${data}`;
}
