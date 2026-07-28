import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import {
  broadcastAudienceCount,
  broadcastCampaigns,
  broadcastCreateTemplate,
  broadcastDeleteTemplate,
  broadcastDownloadPdf,
  broadcastDuplicateTemplate,
  broadcastGenerateStatus,
  broadcastGenerateTemplate,
  broadcastGetTemplate,
  broadcastHistory,
  broadcastLinkClickers,
  broadcastLinks,
  broadcastOverview,
  broadcastPdfStatus,
  broadcastPreview,
  broadcastRecipients,
  broadcastRecipientsExport,
  broadcastReport,
  broadcastRequestPdf,
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
router.get("/history", broadcastHistory);

// Registered after every literal top-level path above (matching the same defensive
// ordering already used for /templates/generate/status vs /templates/:id) so a broadcast
// ObjectId can never be shadowed by — or shadow — a fixed route name.
router.get("/:id/report", broadcastReport);
router.get("/:id/links", broadcastLinks);
router.get("/:id/links/:linkId/clickers", broadcastLinkClickers);
router.get("/:id/recipients", broadcastRecipients);
router.get("/:id/recipients/export", broadcastRecipientsExport);
router.post("/:id/pdf", broadcastRequestPdf);
router.get("/:id/pdf/status", broadcastPdfStatus);
router.get("/:id/pdf/download", broadcastDownloadPdf);

export default router;
