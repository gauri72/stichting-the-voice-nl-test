import mongoose from "mongoose";
import { DISCOUNT_SOURCES } from "../config/discountConfig.js";

const voucherSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true, maxlength: 160 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    usageLimit: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    expiryDate: { type: Date, default: null },
    // Deprecated in favor of applyToAllEvents/eventScopes below — kept as a read-only
    // fallback for documents created before that migration (see DiscountRule.js for the
    // same pattern and the reasoning behind applyToAllEvents defaulting to false).
    eligibleEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    applyToAllEvents: { type: Boolean, default: false },
    eventScopes: [
      {
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
        applyToAllTicketTypes: { type: Boolean, default: true },
        ticketTypeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "TicketType" }],
        _id: false,
      },
    ],
    // Single-recipient restriction: when set, only this email may redeem the voucher.
    // Empty string = redeemable by whoever has the code (subject to usageLimit).
    assignedEmail: { type: String, default: "", lowercase: true, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive", "archived", "used"],
      default: "active",
      index: true,
    },
    visibleToUsers: { type: Boolean, default: true },
    showOnDashboard: { type: Boolean, default: false },
    source: {
      type: String,
      enum: DISCOUNT_SOURCES,
      default: "voucher",
      index: true,
    },
    deletedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "vouchers" }
);

voucherSchema.index({ code: 1, status: 1 });

const Voucher = mongoose.models.Voucher || mongoose.model("Voucher", voucherSchema);

export default Voucher;
