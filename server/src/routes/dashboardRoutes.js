import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getDashboard,
  getMemberships,
  seedMembership
} from "../controllers/dashboardController.js";

const router = Router();

router.get("/", requireAuth, getDashboard);
router.get("/memberships", requireAuth, getMemberships);
router.post("/memberships/seed", requireAuth, seedMembership);

export default router;
