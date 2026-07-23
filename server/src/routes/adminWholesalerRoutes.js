import { Router } from "express";
import {
  adminListWholesalers,
  adminUpdateWholesaler,
} from "../services/wholesalerService.js";
import { adminListReviews, adminDeleteReview } from "../services/businessReviewService.js";
import { handleError as handleErrorBase } from "../utils/handleError.js";

// requireAdmin is applied by the parent adminRoutes.js before mounting this router
const router = Router();

function ok(res, data, status = 200) {
  return res.status(status).json(data);
}

function handleError(res, err) {
  return handleErrorBase(res, err, { logTag: "[admin/wholesaler]" });
}

router.get("/", async (req, res) => {
  try {
    const { status, search, page, pageSize } = req.query;
    const result = await adminListWholesalers({
      status,
      search,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Math.min(Number(pageSize), 50) : 20,
    });
    return ok(res, result);
  } catch (e) {
    return handleError(res, e);
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const profile = await adminUpdateWholesaler(req.params.id, req.admin._id, req.body);
    return ok(res, { profile });
  } catch (e) {
    return handleError(res, e);
  }
});

// Review moderation
router.get("/reviews", async (req, res) => {
  try {
    const { businessId, page, pageSize } = req.query;
    const result = await adminListReviews({
      businessId,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Math.min(Number(pageSize), 50) : 20,
    });
    return ok(res, result);
  } catch (e) {
    return handleError(res, e);
  }
});

router.delete("/reviews/:id", async (req, res) => {
  try {
    await adminDeleteReview(req.params.id);
    return ok(res, { success: true });
  } catch (e) {
    return handleError(res, e);
  }
});

export default router;
