import {
  listPublicReviews,
  createPublicReview,
  listAdminReviews,
  getAdminReviewById,
  updateAdminReview,
  approveReview,
  rejectReview,
  hideReview,
  featureReview,
  deleteAdminReview,
} from "../services/testimonialService.js";

function handleError(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error("[reviews]", error);
  return res.status(status).json({ error: error.message || "Something went wrong." });
}

export async function listTestimonials(req, res) {
  try {
    const reviews = await listPublicReviews();
    return res.status(200).json({ reviews, testimonials: reviews });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createTestimonial(req, res) {
  try {
    const result = await createPublicReview(req.body || {});
    return res.status(201).json({
      ...result,
      testimonial: result.review,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listReviewsAdmin(req, res) {
  try {
    const reviews = await listAdminReviews(req.query || {});
    return res.json({ reviews });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getReviewAdmin(req, res) {
  try {
    const review = await getAdminReviewById(req.params.id);
    return res.json({ review });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchReviewAdmin(req, res) {
  try {
    const review = await updateAdminReview(req.params.id, req.body || {});
    return res.json({ review });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function approveReviewAdmin(req, res) {
  try {
    const review = await approveReview(req.params.id);
    return res.json({ review });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function rejectReviewAdmin(req, res) {
  try {
    const review = await rejectReview(req.params.id);
    return res.json({ review });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function hideReviewAdmin(req, res) {
  try {
    const review = await hideReview(req.params.id);
    return res.json({ review });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function featureReviewAdmin(req, res) {
  try {
    const review = await featureReview(req.params.id, req.body?.featured !== false);
    return res.json({ review });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteReviewAdmin(req, res) {
  try {
    const result = await deleteAdminReview(req.params.id);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}
