import mongoose from "mongoose";

const checkoutAuditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true, index: true },
    sessionId: { type: String, default: "", trim: true, index: true },
    orderId: { type: String, default: "", trim: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    email: { type: String, default: "", lowercase: true, trim: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null },
    memberStatus: { type: String, default: "", trim: true },
    details: { type: mongoose.Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "checkout_audit_logs" }
);

checkoutAuditLogSchema.index({ createdAt: -1 });

const CheckoutAuditLog =
  mongoose.models.CheckoutAuditLog || mongoose.model("CheckoutAuditLog", checkoutAuditLogSchema);

export default CheckoutAuditLog;
