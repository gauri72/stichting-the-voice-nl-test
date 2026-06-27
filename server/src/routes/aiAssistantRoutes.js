import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getStatus,
  postChat,
  getChatHistoryList,
  getChatSessionDetail,
  getPrompts,
  postPrompt,
  patchPrompt,
  deletePrompt,
  getSchedules,
  postSchedule,
  putSchedule,
  deleteSchedule,
  getResults,
  getUsage,
  postPushSubscribe,
} from "../controllers/customerAiController.js";

const router = Router();
router.use(requireAuth);

router.get("/status", getStatus);

router.post("/chat", postChat);
router.get("/chat/history", getChatHistoryList);
router.get("/chat/history/:id", getChatSessionDetail);

router.get("/prompts", getPrompts);
router.post("/prompts", postPrompt);
router.patch("/prompts/:id", patchPrompt);
router.delete("/prompts/:id", deletePrompt);

router.get("/schedule", getSchedules);
router.post("/schedule", postSchedule);
router.put("/schedule/:id", putSchedule);
router.delete("/schedule/:id", deleteSchedule);

router.get("/results", getResults);
router.get("/usage", getUsage);
router.post("/push/subscribe", postPushSubscribe);

export default router;
