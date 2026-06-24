import ActivityLog from "../../models/ActivityLog.js";
import { logCheckoutAction, CHECKOUT_AUDIT_ACTIONS } from "../checkoutAuditService.js";

const BOOKING_ACTIVITY_KINDS = new Set([
  "booking_started",
  "booking_completed",
  "booking_cancelled",
  "ticket_purchased",
  "rsvp_submitted",
  "session_booked",
  "waitlist_joined",
  "membership_detected",
  "payment_completed",
]);

export async function logUserBookingActivity({ userId, kind, summary, detail = "" }) {
  if (!userId) return null;
  const safeKind = BOOKING_ACTIVITY_KINDS.has(kind) ? kind : "booking_completed";
  try {
    return ActivityLog.create({
      userId,
      kind: safeKind,
      summary: String(summary).slice(0, 200),
      detail: String(detail).slice(0, 500),
    });
  } catch {
    return null;
  }
}

export async function logBookingAudit({ sessionId, action, metadata = {}, userId = null, email = "" }) {
  return logCheckoutAction({
    sessionId,
    action: CHECKOUT_AUDIT_ACTIONS[action] || action,
    userId,
    email,
    details: metadata,
  });
}

export async function listUserBookingActivity(userId, limit = 50) {
  return ActivityLog.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
}
