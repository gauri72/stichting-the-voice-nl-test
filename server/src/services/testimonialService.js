import EventTestimonial from "../models/EventTestimonial.js";
import Event from "../models/Event.js";
import { getNextSequence } from "../utils/sequence.js";
import { escapeRegex } from "../utils/regexUtils.js";

function trimField(value, maxLen) {
  return String(value || "").trim().slice(0, maxLen);
}

export function getInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function publicFilter() {
  return {
    $or: [{ status: "approved" }, { status: { $exists: false }, approved: true }],
  };
}

function formatPublicReview(doc) {
  return {
    reviewId: doc._id?.toString() || doc.id,
    id: doc._id?.toString() || doc.id,
    name: doc.name,
    initials: doc.initials || getInitials(doc.name),
    rating: doc.rating,
    text: doc.quote,
    quote: doc.quote,
    roleLabel: doc.role || "Community Member",
    role: doc.role || "Community Member",
    eventName: doc.eventName || "",
    eventId: doc.eventId?.toString?.() || doc.eventId || null,
    submittedAt: doc.createdAt,
    createdAt: doc.createdAt,
    featured: Boolean(doc.featured),
  };
}

function formatAdminReview(doc) {
  return {
    id: doc._id?.toString() || doc.id,
    reviewId: doc.reviewId || doc._id?.toString(),
    name: doc.name,
    role: doc.role || "Community Member",
    quote: doc.quote,
    rating: doc.rating,
    initials: doc.initials,
    eventId: doc.eventId?.toString?.() || null,
    eventName: doc.eventName || "",
    status: doc.status || (doc.approved ? "approved" : "pending"),
    featured: Boolean(doc.featured),
    consentAccepted: Boolean(doc.consentAccepted),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function nextReviewId() {
  const seq = await getNextSequence("community_review");
  return `REV-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

export async function listPublicReviews() {
  const rows = await EventTestimonial.find(publicFilter())
    .sort({ featured: -1, rating: -1, createdAt: -1 })
    .limit(100)
    .lean();
  return rows.map(formatPublicReview);
}

export async function createPublicReview(payload = {}) {
  const name = trimField(payload.name, 120);
  const quote = trimField(payload.quote ?? payload.text ?? payload.testimonial, 2000);
  const role = trimField(payload.role ?? payload.roleLabel, 80) || "Community Member";
  const rating = Number(payload.rating);
  const eventName = trimField(payload.eventName, 200);
  const eventId = payload.eventId || null;
  const consentAccepted = Boolean(payload.consentAccepted ?? payload.consent);

  if (!name) {
    const err = new Error("Please enter your name.");
    err.status = 400;
    throw err;
  }
  if (!quote) {
    const err = new Error("Please share your review.");
    err.status = 400;
    throw err;
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    const err = new Error("Please select a star rating.");
    err.status = 400;
    throw err;
  }
  if (!consentAccepted) {
    const err = new Error("Please accept the consent to submit your review.");
    err.status = 400;
    throw err;
  }

  let resolvedEventName = eventName;
  if (eventId && !resolvedEventName) {
    const event = await Event.findById(eventId).select("title").lean();
    if (event) resolvedEventName = event.title;
  }

  const created = await EventTestimonial.create({
    reviewId: await nextReviewId(),
    name,
    role,
    quote,
    rating,
    initials: getInitials(name),
    eventId: eventId || null,
    eventName: resolvedEventName,
    status: "pending",
    approved: false,
    featured: false,
    consentAccepted: true,
  });

  return {
    review: formatPublicReview(created.toObject()),
    message:
      "Thank you for sharing your experience. Your review will be visible after moderation.",
    pending: true,
  };
}

export async function listAdminReviews(filters = {}) {
  const query = {};
  if (filters.status && filters.status !== "all") query.status = filters.status;
  if (filters.search) {
    const needle = escapeRegex(String(filters.search).trim());
    query.$or = [
      { name: new RegExp(needle, "i") },
      { quote: new RegExp(needle, "i") },
      { eventName: new RegExp(needle, "i") },
    ];
  }
  const rows = await EventTestimonial.find(query).sort({ createdAt: -1 }).lean();
  return rows.map(formatAdminReview);
}

export async function getAdminReviewById(id) {
  const doc = await EventTestimonial.findById(id).lean();
  if (!doc) {
    const err = new Error("Review not found.");
    err.status = 404;
    throw err;
  }
  return formatAdminReview(doc);
}

async function patchReviewStatus(id, status, extra = {}) {
  const doc = await EventTestimonial.findById(id);
  if (!doc) {
    const err = new Error("Review not found.");
    err.status = 404;
    throw err;
  }
  doc.status = status;
  doc.approved = status === "approved";
  if (extra.featured !== undefined) doc.featured = Boolean(extra.featured);
  if (extra.name !== undefined) doc.name = trimField(extra.name, 120);
  if (extra.role !== undefined) doc.role = trimField(extra.role, 80);
  if (extra.quote !== undefined) doc.quote = trimField(extra.quote, 2000);
  if (extra.rating !== undefined) doc.rating = Math.max(1, Math.min(5, Number(extra.rating) || 1));
  if (extra.eventName !== undefined) doc.eventName = trimField(extra.eventName, 200);
  await doc.save();
  return formatAdminReview(doc.toObject());
}

export async function approveReview(id) {
  return patchReviewStatus(id, "approved");
}

export async function rejectReview(id) {
  return patchReviewStatus(id, "rejected");
}

export async function hideReview(id) {
  return patchReviewStatus(id, "hidden");
}

export async function featureReview(id, featured = true) {
  return patchReviewStatus(id, "approved", { featured: Boolean(featured) });
}

export async function updateAdminReview(id, payload) {
  const doc = await EventTestimonial.findById(id);
  if (!doc) {
    const err = new Error("Review not found.");
    err.status = 404;
    throw err;
  }
  if (payload.status) {
    doc.status = payload.status;
    doc.approved = payload.status === "approved";
  }
  if (payload.name !== undefined) doc.name = trimField(payload.name, 120);
  if (payload.role !== undefined) doc.role = trimField(payload.role, 80);
  if (payload.quote !== undefined) doc.quote = trimField(payload.quote, 2000);
  if (payload.rating !== undefined) doc.rating = Math.max(1, Math.min(5, Number(payload.rating) || 1));
  if (payload.eventName !== undefined) doc.eventName = trimField(payload.eventName, 200);
  if (payload.featured !== undefined) doc.featured = Boolean(payload.featured);
  if (payload.name) doc.initials = getInitials(doc.name);
  await doc.save();
  return formatAdminReview(doc.toObject());
}

export async function deleteAdminReview(id) {
  const result = await EventTestimonial.deleteOne({ _id: id });
  if (!result.deletedCount) {
    const err = new Error("Review not found.");
    err.status = 404;
    throw err;
  }
  return { deleted: true };
}
