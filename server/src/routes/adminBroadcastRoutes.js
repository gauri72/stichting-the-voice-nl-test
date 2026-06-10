import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import {
  broadcastAudienceCount,
  broadcastCampaigns,
  broadcastCreateTemplate,
  broadcastDeleteTemplate,
  broadcastOverview,
  broadcastPreview,
  broadcastSampleUsers,
  broadcastSend,
  broadcastTemplates,
} from "../controllers/broadcastController.js";

const router = Router();

router.use(requireAdmin);

router.get("/overview", broadcastOverview);
router.get("/templates", broadcastTemplates);
router.post("/templates", broadcastCreateTemplate);
router.delete("/templates/:id", broadcastDeleteTemplate);
router.get("/sample-users", broadcastSampleUsers);
router.get("/audience/count", broadcastAudienceCount);
router.post("/preview", broadcastPreview);
router.post("/send", broadcastSend);
router.get("/campaigns", broadcastCampaigns);

export default router;
