import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  registerWholesaler,
  getWholesalerStatus,
  getMyWholesalerProfile,
  updateMyWholesalerProfile,
  reorderFromPastOrder,
} from "../services/wholesalerService.js";

const router = Router();

function ok(res, data, status = 200) {
  return res.status(status).json(data);
}

function fail(res, err) {
  const status = err.status || 500;
  return res.status(status).json({ error: err.message || "Unexpected error" });
}

router.post("/register", requireAuth, async (req, res) => {
  try {
    const profile = await registerWholesaler(req.user.id, req.body);
    return ok(res, { profile }, 201);
  } catch (e) {
    return fail(res, e);
  }
});

router.get("/status", requireAuth, async (req, res) => {
  try {
    const status = await getWholesalerStatus(req.user.id);
    return ok(res, status);
  } catch (e) {
    return fail(res, e);
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const profile = await getMyWholesalerProfile(req.user.id);
    return ok(res, { profile });
  } catch (e) {
    return fail(res, e);
  }
});

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const profile = await updateMyWholesalerProfile(req.user.id, req.body);
    return ok(res, { profile });
  } catch (e) {
    return fail(res, e);
  }
});

router.post("/orders/:orderId/reorder", requireAuth, async (req, res) => {
  try {
    const cart = await reorderFromPastOrder(req.user.id, req.params.orderId);
    return ok(res, { cart });
  } catch (e) {
    return fail(res, e);
  }
});

export default router;
