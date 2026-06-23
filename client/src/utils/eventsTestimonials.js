import { apiFetch } from "./api.js";

export const EVENTS_TESTIMONIALS_STORAGE_KEY = "voice-events-testimonials";

function normalizeTestimonial(entry) {
  if (!entry || typeof entry !== "object") return null;

  const name = String(entry.name || "").trim();
  const quote = String(entry.quote || entry.text || "").trim();
  const rating = Number(entry.rating);

  if (!name || !quote || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null;
  }

  return {
    id: String(entry.reviewId || entry.id || crypto.randomUUID()),
    reviewId: String(entry.reviewId || entry.id || ""),
    name,
    role: String(entry.roleLabel || entry.role || "Community Member").trim() || "Community Member",
    roleLabel: String(entry.roleLabel || entry.role || "Community Member").trim() || "Community Member",
    quote,
    text: quote,
    rating,
    initials: String(entry.initials || name.charAt(0).toUpperCase()).trim().slice(0, 4) || "?",
    eventName: String(entry.eventName || "").trim(),
    submittedAt: entry.submittedAt || entry.createdAt || null,
    createdAt: entry.createdAt || entry.submittedAt || null,
    featured: Boolean(entry.featured),
  };
}

export function getInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function readLocalTestimonials() {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(EVENTS_TESTIMONIALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeTestimonial).filter(Boolean);
  } catch {
    return [];
  }
}

export function writeLocalTestimonials(testimonials) {
  if (typeof window === "undefined") return;
  localStorage.setItem(EVENTS_TESTIMONIALS_STORAGE_KEY, JSON.stringify(testimonials));
}

export async function loadEventTestimonials() {
  try {
    const data = await apiFetch("/api/public/reviews");
    const testimonials = Array.isArray(data?.reviews)
      ? data.reviews.map(normalizeTestimonial).filter(Boolean)
      : Array.isArray(data?.testimonials)
        ? data.testimonials.map(normalizeTestimonial).filter(Boolean)
        : [];

    writeLocalTestimonials(testimonials);
    return testimonials;
  } catch {
    return readLocalTestimonials();
  }
}

export async function saveEventTestimonial(entry) {
  const normalized = normalizeTestimonial({
    ...entry,
    quote: entry.quote || entry.text,
    initials: entry.initials || getInitials(entry.name),
  });
  if (!normalized) {
    throw new Error("Invalid testimonial.");
  }

  const data = await apiFetch("/api/testimonials", {
    method: "POST",
    body: JSON.stringify({
      name: normalized.name,
      role: normalized.role,
      quote: normalized.quote,
      rating: normalized.rating,
      eventName: entry.eventName || "",
      consentAccepted: Boolean(entry.consentAccepted),
      captchaToken: entry.captchaToken,
    }),
  });

  return {
    ...normalized,
    message:
      data?.message ||
      "Thank you for sharing your experience. Your review will be visible after moderation.",
    pending: Boolean(data?.pending),
  };
}
