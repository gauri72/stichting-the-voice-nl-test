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
    eligibleEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
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
