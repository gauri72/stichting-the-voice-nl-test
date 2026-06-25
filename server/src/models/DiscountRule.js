import mongoose from "mongoose";
import {
  DISCOUNT_TYPES,
  DISCOUNT_VALUE_TYPES,
  APPLIES_TO,
  DISCOUNT_STATUSES,
  DISCOUNT_SOURCES,
  REWARD_TYPES,
} from "../config/discountConfig.js";

const discountRuleSchema = new mongoose.Schema(
  {
    discountId: { type: String, unique: true, sparse: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    code: { type: String, default: "", trim: true, uppercase: true, index: true },
    type: {
      type: String,
      enum: DISCOUNT_TYPES,
      required: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: DISCOUNT_VALUE_TYPES,
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    appliesTo: {
      type: String,
      enum: APPLIES_TO,
      default: "tickets",
    },
    // Deprecated in favor of applyToAllEvents/eventScopes below — kept for backward
    // compatibility (read-only fallback) on documents created before that migration.
    eligibleEventIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    // Defaults to false (not true) deliberately: Mongoose applies schema defaults during
    // hydration for ANY document missing the field, including old documents loaded via a
    // non-lean query — defaulting to true would make every unmigrated rule with a populated
    // legacy eligibleEventIds silently behave as "all events" the moment it's read without
    // .lean(). false + empty eventScopes correctly falls through to the legacy-array check
    // in appliesToEventAndTicketType() instead.
    applyToAllEvents: { type: Boolean, default: false },
    eventScopes: [
      {
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
        applyToAllTicketTypes: { type: Boolean, default: true },
        ticketTypeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "TicketType" }],
        _id: false,
      },
    ],
    eligibleMembershipTypes: [{ type: String, trim: true }],
    assignedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedEmail: { type: String, default: "", lowercase: true, trim: true },
    isPublic: { type: Boolean, default: false },
    referrerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    referrerEmail: { type: String, default: "", lowercase: true, trim: true },
    referrerName: { type: String, default: "", trim: true, maxlength: 160 },
    rewardType: { type: String, enum: [...REWARD_TYPES, ""], default: "" },
    rewardValue: { type: Number, default: 0, min: 0 },
    usageLimit: { type: Number, default: null, min: 1 },
    usageLimitPerUser: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    minimumOrderAmount: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null, index: true },
    expiryReminderSentAt: { type: Date, default: null },
    allowStacking: { type: Boolean, default: true },
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
      default: "platform",
      index: true,
    },
    deletedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "discount_rules" }
);

discountRuleSchema.index({ type: 1, status: 1 });
discountRuleSchema.index({ code: 1, status: 1 });
discountRuleSchema.index({ assignedUserId: 1 });
discountRuleSchema.index({ referrerUserId: 1 });
discountRuleSchema.index({ createdAt: -1 });

const DiscountRule =
  mongoose.models.DiscountRule || mongoose.model("DiscountRule", discountRuleSchema);

export default DiscountRule;
