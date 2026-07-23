import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  registerWholesaler,
  getWholesalerStatus,
  getMyWholesalerProfile,
  updateMyWholesalerProfile,
  reorderFromPastOrder,
} from "../services/wholesalerService.js";
import { handleError as handleErrorBase } from "../utils/handleError.js";

const router = Router();

function ok(res, data, status = 200) {
  return res.status(status).json(data);
}

function handleError(res, err) {
  return handleErrorBase(res, err, { logTag: "[wholesaler]" });
}

router.post("/register", requireAuth, async (req, res) => {
  try {
    const profile = await registerWholesaler(req.user.id, req.body);
    return ok(res, { profile }, 201);
  } catch (e) {
    return handleError(res, e);
  }
});

router.get("/status", requireAuth, async (req, res) => {
  try {
    const status = await getWholesalerStatus(req.user.id);
    return ok(res, status);
  } catch (e) {
    return handleError(res, e);
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const profile = await getMyWholesalerProfile(req.user.id);
    return ok(res, { profile });
  } catch (e) {
    return handleError(res, e);
  }
});

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const profile = await updateMyWholesalerProfile(req.user.id, req.body);
    return ok(res, { profile });
  } catch (e) {
    return handleError(res, e);
  }
});

router.post("/orders/:orderId/reorder", requireAuth, async (req, res) => {
  try {
    const cart = await reorderFromPastOrder(req.user.id, req.params.orderId);
    return ok(res, { cart });
  } catch (e) {
    return handleError(res, e);
  }
});

export default router;
