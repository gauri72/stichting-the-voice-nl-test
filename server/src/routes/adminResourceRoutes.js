import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import {
  listAdminResources,
  createAdminResource,
} from "../controllers/sessionPlatformController.js";

const router = Router();
router.use(requireAdmin);
router.get("/", listAdminResources);
router.post("/", createAdminResource);

export default router;
