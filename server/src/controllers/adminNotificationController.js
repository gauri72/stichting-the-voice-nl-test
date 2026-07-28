import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/adminNotificationService.js";
import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[admin-notifications]" });
}

export async function notificationsList(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Math.min(Number(req.query.pageSize) || 20, 50);
    const unreadOnly = req.query.unreadOnly === "true";
    const result = await listNotifications({ page, pageSize, unreadOnly });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function notificationsUnreadCount(req, res) {
  try {
    const unreadCount = await getUnreadCount();
    return res.status(200).json({ unreadCount });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function notificationsMarkRead(req, res) {
  try {
    const notification = await markNotificationRead(req.params.id);
    return res.status(200).json({ notification });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function notificationsMarkAllRead(req, res) {
  try {
    const result = await markAllNotificationsRead();
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}
