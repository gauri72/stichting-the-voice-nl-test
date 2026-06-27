import { Router } from "express";
import {
  getSettings,
  patchSettings,
  postPrebuiltPrompt,
  removePrebuiltPrompt,
  getOverride,
  putOverride,
  getUsageList,
  getRunLogs,
  getStats,
} from "../controllers/adminAiAssistantSettingsController.js";

const router = Router();

router.get("/dashboard", getStats);
router.get("/settings", getSettings);
router.patch("/settings", patchSettings);
router.post("/settings/prebuilt-prompts", postPrebuiltPrompt);
router.delete("/settings/prebuilt-prompts/:promptId", removePrebuiltPrompt);
router.get("/customers/:customerId/override", getOverride);
router.put("/customers/:customerId/override", putOverride);
router.get("/usage", getUsageList);
router.get("/run-logs", getRunLogs);

export default router;
