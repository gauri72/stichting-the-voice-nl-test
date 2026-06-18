import { Router } from "express";
import { verifyMembership } from "../controllers/membershipController.js";

const router = Router();

router.get("/:token", verifyMembership);

export default router;
