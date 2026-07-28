import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import {
  notificationsList,
  notificationsUnreadCount,
  notificationsMarkRead,
  notificationsMarkAllRead,
} from "../controllers/adminNotificationController.js";

const router = Router();

router.use(requireAdmin);

router.get("/", notificationsList);
router.get("/unread-count", notificationsUnreadCount);
router.post("/mark-all-read", notificationsMarkAllRead);
router.post("/:id/read", notificationsMarkRead);

export default router;
