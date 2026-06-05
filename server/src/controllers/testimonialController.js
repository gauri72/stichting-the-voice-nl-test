import mongoose from "mongoose";
import EventTestimonial from "../models/EventTestimonial.js";

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

function trimField(value, maxLen) {
  return String(value || "").trim().slice(0, maxLen);
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function toPublicTestimonial(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    role: doc.role,
    quote: doc.quote,
    rating: doc.rating,
    initials: doc.initials,
    createdAt: doc.createdAt
  };
}

export async function listTestimonials(_req, res) {
  if (!isDbReady()) {
    return res.status(503).json({ error: "Testimonials storage is unavailable." });
  }

  try {
    const rows = await EventTestimonial.find({ approved: true })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      testimonials: rows.map(toPublicTestimonial)
    });
  } catch (error) {
    console.error("[testimonials] List failed:", error.message);
    return res.status(500).json({ error: "Could not load testimonials." });
  }
}

export async function createTestimonial(req, res) {
  if (!isDbReady()) {
    return res.status(503).json({ error: "Testimonials storage is unavailable." });
  }

  const name = trimField(req.body?.name, 120);
  const quote = trimField(req.body?.quote ?? req.body?.testimonial, 2000);
  const role = trimField(req.body?.role, 80) || "Community Member";
  const rating = Number(req.body?.rating);

  if (!name) {
    return res.status(400).json({ error: "Please enter your name." });
  }
  if (!quote) {
    return res.status(400).json({ error: "Please share your testimonial." });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Please select a star rating." });
  }

  try {
    const created = await EventTestimonial.create({
      name,
      role,
      quote,
      rating,
      initials: getInitials(name),
      approved: true
    });

    return res.status(201).json({
      testimonial: toPublicTestimonial(created)
    });
  } catch (error) {
    console.error("[testimonials] Create failed:", error.message);
    return res.status(500).json({ error: "Could not save your review. Please try again." });
  }
}
