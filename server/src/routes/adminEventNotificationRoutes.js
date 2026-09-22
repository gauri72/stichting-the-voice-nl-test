import { Router } from "express";
import { listAll, save, remove, listEvents } from "../controllers/adminEventNotificationController.js";

const router = Router();

router.get("/", listAll);
router.post("/", save);
router.delete("/:id", remove);
router.get("/events", listEvents);

export default router;
