import AdminNotification from "../models/AdminNotification.js";

// 15% — matches typical ESP-industry alerting bands. Named "failure", not "bounce": plain
// SMTP (see emailProviders/smtpProvider.js) can only tell us a send was rejected outright,
// never that a message bounced after being accepted, so this is a submission-failure rate.
const HIGH_FAILURE_RATE_THRESHOLD = 0.15;

function formatNotification(doc) {
  return {
    id: doc._id.toString(),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    severity: doc.severity,
    broadcastId: doc.broadcastId ? doc.broadcastId.toString() : null,
    readAt: doc.readAt,
    createdAt: doc.createdAt,
  };
}

export async function createNotification({ type, title, message, severity = "info", broadcastId = null, createdFor = null }) {
  const doc = await AdminNotification.create({ type, title, message, severity, broadcastId, createdFor });
  return formatNotification(doc);
}

/** Called once a broadcast's send loop finishes — picks the right notification shape from
 * the final counts rather than requiring every call site to work that out itself. */
export async function notifyBroadcastOutcome(broadcast) {
  const { sentCount, failedCount, recipientCount, status, _id, campaignName, templateName } = broadcast;
  const name = campaignName || templateName;
  const failureRate = sentCount > 0 ? failedCount / (sentCount + failedCount) : 0;

  if (status === "failed") {
    return createNotification({
      type: "broadcast_failed",
      title: "Broadcast failed",
      message: `"${name}" could not be sent to any of its ${recipientCount} recipients.`,
      severity: "critical",
      broadcastId: _id,
    });
  }

  if (status === "partially_sent") {
    await createNotification({
      type: "broadcast_partial",
      title: "Broadcast partially sent",
      message: `"${name}" sent to ${sentCount} of ${recipientCount} recipients — ${failedCount} failed.`,
      severity: "warning",
      broadcastId: _id,
    });
  } else {
    await createNotification({
      type: "broadcast_sent",
      title: "Broadcast sent",
      message: `"${name}" sent successfully to ${sentCount} recipient${sentCount === 1 ? "" : "s"}.`,
      severity: "info",
      broadcastId: _id,
    });
  }

  if (failureRate >= HIGH_FAILURE_RATE_THRESHOLD) {
    return createNotification({
      type: "broadcast_bounce_high",
      title: "High failure rate detected",
      message: `"${name}" had a ${Math.round(failureRate * 100)}% send-failure rate — worth checking the audience list and template.`,
      severity: "warning",
      broadcastId: _id,
    });
  }
  return null;
}

export async function listNotifications({ page = 1, pageSize = 20, unreadOnly = false } = {}) {
  const filter = unreadOnly ? { readAt: null } : {};
  const skip = (Math.max(1, page) - 1) * pageSize;
  const [items, total, unreadCount] = await Promise.all([
    AdminNotification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    AdminNotification.countDocuments(filter),
    AdminNotification.countDocuments({ readAt: null }),
  ]);
  return {
    notifications: items.map(formatNotification),
    total,
    unreadCount,
    page,
    pageSize,
  };
}

export async function getUnreadCount() {
  return AdminNotification.countDocuments({ readAt: null });
}

export async function markNotificationRead(id) {
  const doc = await AdminNotification.findOneAndUpdate(
    { _id: id, readAt: null },
    { $set: { readAt: new Date() } },
    { new: true }
  );
  // Idempotent — if it's already read, return the current doc rather than treating a
  // second click on the same notification as an error.
  if (doc) return formatNotification(doc);
  const existing = await AdminNotification.findById(id).lean();
  if (!existing) {
    const error = new Error("Notification not found.");
    error.status = 404;
    throw error;
  }
  return formatNotification(existing);
}

export async function markAllNotificationsRead() {
  const result = await AdminNotification.updateMany({ readAt: null }, { $set: { readAt: new Date() } });
  return { updated: result.modifiedCount || 0 };
}
