import BusinessReview from "../models/BusinessReview.js";
import BusinessOrder from "../models/BusinessOrder.js";
import BusinessProfile from "../models/BusinessProfile.js";

export async function postReview(reviewerId, reviewerName, businessId, orderId, { rating, body }) {
  // Verify the reviewer has a paid/fulfilled order for this business
  const order = await BusinessOrder.findOne({
    _id: orderId,
    customerId: reviewerId,
    businessId,
    status: { $in: ["paid", "fulfilled"] },
  }).lean();

  if (!order) {
    const err = new Error("You can only review a business after a completed order.");
    err.status = 403;
    throw err;
  }

  // One review per order
  const existing = await BusinessReview.findOne({ orderId });
  if (existing) {
    const err = new Error("You have already reviewed this order.");
    err.status = 409;
    throw err;
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    const err = new Error("Rating must be an integer between 1 and 5.");
    err.status = 400;
    throw err;
  }

  const review = await BusinessReview.create({
    businessId,
    orderId,
    reviewerId,
    reviewerName,
    rating,
    body: String(body || "").trim().slice(0, 500),
  });

  // Recalculate aggregate rating on BusinessProfile
  const agg = await BusinessReview.aggregate([
    { $match: { businessId: review.businessId } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  if (agg.length > 0) {
    await BusinessProfile.findByIdAndUpdate(businessId, {
      reviewCount: agg[0].count,
      avgRating: Math.round(agg[0].avg * 10) / 10,
    });
  }

  return review;
}

export async function getReviews(businessId, { page = 1, pageSize = 10 } = {}) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    BusinessReview.find({ businessId }).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    BusinessReview.countDocuments({ businessId }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// Admin
export async function adminListReviews({ businessId, page = 1, pageSize = 20 } = {}) {
  const filter = businessId ? { businessId } : {};
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    BusinessReview.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    BusinessReview.countDocuments(filter),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function adminDeleteReview(reviewId) {
  const review = await BusinessReview.findByIdAndDelete(reviewId);
  if (!review) {
    const err = new Error("Review not found.");
    err.status = 404;
    throw err;
  }

  // Recalculate aggregate after deletion
  const agg = await BusinessReview.aggregate([
    { $match: { businessId: review.businessId } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await BusinessProfile.findByIdAndUpdate(review.businessId, {
    reviewCount: agg[0]?.count ?? 0,
    avgRating: agg[0] ? Math.round(agg[0].avg * 10) / 10 : null,
  });

  return review;
}
