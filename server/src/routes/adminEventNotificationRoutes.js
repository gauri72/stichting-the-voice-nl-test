import { Router } from "express";
import { listAll, save, remove, listEvents, sendSummary } from "../controllers/adminEventNotificationController.js";

const router = Router();

router.get("/", listAll);
router.post("/", save);
router.delete("/:id", remove);
router.get("/events", listEvents);
router.post("/send-summary", sendSummary);

export default router;
