import { Router } from "express";
import { listLoginEvents } from "../controllers/adminLoginActivityController.js";

const router = Router();

router.get("/", listLoginEvents);

export default router;
