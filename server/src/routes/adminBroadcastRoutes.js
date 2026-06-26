import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import {
  broadcastAudienceCount,
  broadcastCampaigns,
  broadcastCreateTemplate,
  broadcastDeleteTemplate,
  broadcastDuplicateTemplate,
  broadcastGenerateStatus,
  broadcastGenerateTemplate,
  broadcastGetTemplate,
  broadcastOverview,
  broadcastPreview,
  broadcastSampleUsers,
  broadcastSend,
  broadcastTemplates,
  broadcastUpdateTemplate,
} from "../controllers/broadcastController.js";

const router = Router();

router.use(requireAdmin);

router.get("/overview", broadcastOverview);
router.get("/templates", broadcastTemplates);
router.post("/templates", broadcastCreateTemplate);
// Registered above /templates/:id so "generate" is never captured as an :id param.
router.get("/templates/generate/status", broadcastGenerateStatus);
router.post("/templates/generate", broadcastGenerateTemplate);
router.get("/templates/:id", broadcastGetTemplate);
router.put("/templates/:id", broadcastUpdateTemplate);
router.post("/templates/:id/duplicate", broadcastDuplicateTemplate);
router.delete("/templates/:id", broadcastDeleteTemplate);
router.get("/sample-users", broadcastSampleUsers);
router.get("/audience/count", broadcastAudienceCount);
router.post("/preview", broadcastPreview);
router.post("/send", broadcastSend);
router.get("/campaigns", broadcastCampaigns);

export default router;
