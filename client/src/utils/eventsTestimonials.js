import { apiFetch } from "./api.js";

export const EVENTS_TESTIMONIALS_STORAGE_KEY = "voice-events-testimonials";

function normalizeTestimonial(entry) {
  if (!entry || typeof entry !== "object") return null;

  const name = String(entry.name || "").trim();
  const quote = String(entry.quote || "").trim();
  const rating = Number(entry.rating);

  if (!name || !quote || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null;
  }

  return {
    id: String(entry.id || crypto.randomUUID()),
    name,
    role: String(entry.role || "Community Member").trim() || "Community Member",
    quote,
    rating,
    initials: String(entry.initials || name.charAt(0).toUpperCase()).trim().slice(0, 4) || "?"
  };
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
    const data = await apiFetch("/api/testimonials");
    const testimonials = Array.isArray(data?.testimonials)
      ? data.testimonials.map(normalizeTestimonial).filter(Boolean)
      : [];

    writeLocalTestimonials(testimonials);
    return testimonials;
  } catch {
    return readLocalTestimonials();
  }
}

export async function saveEventTestimonial(entry) {
  const normalized = normalizeTestimonial(entry);
  if (!normalized) {
    throw new Error("Invalid testimonial.");
  }

  try {
    const data = await apiFetch("/api/testimonials", {
      method: "POST",
      body: JSON.stringify({
        name: normalized.name,
        role: normalized.role,
        quote: normalized.quote,
        rating: normalized.rating
      })
    });

    const saved = normalizeTestimonial(data?.testimonial);
    if (!saved) {
      throw new Error("Could not save testimonial.");
    }

    const next = [saved, ...readLocalTestimonials().filter((item) => item.id !== saved.id)];
    writeLocalTestimonials(next);
    return saved;
  } catch (error) {
    if (error?.status === 400) {
      throw error;
    }

    const saved = { ...normalized, id: normalized.id || crypto.randomUUID() };
    const next = [saved, ...readLocalTestimonials().filter((item) => item.id !== saved.id)];
    writeLocalTestimonials(next);
    return saved;
  }
}
