import mongoose from "mongoose";
import { DISCOUNT_STATUSES, DISCOUNT_SOURCES } from "../config/discountConfig.js";

const discountCodeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    discountValue: { type: Number, required: true },
    isGlobal: { type: Boolean, default: false },
    assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    status: {
      type: String,
      enum: DISCOUNT_STATUSES,
      default: "active",
      index: true,
    },
    visibleToUsers: { type: Boolean, default: true },
    showOnDashboard: { type: Boolean, default: true, index: true },
    source: {
      type: String,
      enum: DISCOUNT_SOURCES,
      default: "legacy",
      index: true,
    },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null, index: true },
    deletedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    eligibleEventIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    usageLimit: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: "discount_codes" }
);

discountCodeSchema.index({ createdAt: -1 });
discountCodeSchema.index({ status: 1, showOnDashboard: 1 });

const DiscountCode =
  mongoose.models.DiscountCode || mongoose.model("DiscountCode", discountCodeSchema);

export default DiscountCode;
