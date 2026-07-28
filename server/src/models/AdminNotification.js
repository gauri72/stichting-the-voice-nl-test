import mongoose from "mongoose";

const NOTIFICATION_TYPES = [
  "broadcast_sent",
  "broadcast_partial",
  "broadcast_failed",
  "broadcast_bounce_high",
  "broadcast_scheduled_sent",
  "critical_error",
];

const adminNotificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: NOTIFICATION_TYPES, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    severity: { type: String, enum: ["info", "warning", "critical"], default: "info" },
    broadcastId: { type: mongoose.Schema.Types.ObjectId, ref: "EmailBroadcast", default: null, index: true },
    // null = visible to every admin (the normal case for broadcast outcomes); set to scope
    // a notification to one admin only, mirroring the nullable-audience shape used elsewhere
    // in this codebase rather than requiring a separate per-admin fan-out row per notice.
    createdFor: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "admin_notifications" }
);

adminNotificationSchema.index({ createdFor: 1, readAt: 1, createdAt: -1 });

const AdminNotification =
  mongoose.models.AdminNotification || mongoose.model("AdminNotification", adminNotificationSchema);

export { NOTIFICATION_TYPES };
export default AdminNotification;
