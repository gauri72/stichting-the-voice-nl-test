import { Router } from "express";
import { getMembershipQr, verifyMembership } from "../controllers/membershipController.js";

const router = Router();

router.get("/verify/:token", verifyMembership);
router.get("/qr/:token", getMembershipQr);

export default router;
