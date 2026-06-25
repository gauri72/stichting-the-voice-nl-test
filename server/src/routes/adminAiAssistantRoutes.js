import { Router } from "express";
import { getAiAssistantStatusAdmin, runAiActionAdmin } from "../controllers/adminAiAssistantController.js";
import { requireCmsPermission, requireCmsWrite } from "../middleware/cmsMiddleware.js";

const router = Router();

router.get("/status", requireCmsPermission("pages.read"), getAiAssistantStatusAdmin);
router.post("/run", requireCmsWrite, runAiActionAdmin);

export default router;
