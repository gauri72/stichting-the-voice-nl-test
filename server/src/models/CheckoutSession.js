import mongoose from "mongoose";

const checkoutSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null, index: true },
    detectedMemberStatus: { type: String, default: "GUEST_UNKNOWN", trim: true },
    selectedTickets: [
      {
        ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketType" },
        quantity: { type: Number, min: 1 },
      },
    ],
    selectedMembership: {
      planId: { type: String, default: "", trim: true },
      purchaseType: { type: String, enum: ["NEW", "RENEWAL", ""], default: "" },
    },
    appliedDiscounts: [
      {
        type: { type: String, trim: true },
        label: { type: String, trim: true },
        amountMinor: { type: Number, default: 0 },
        ruleId: { type: mongoose.Schema.Types.ObjectId, ref: "DiscountRule", default: null },
      },
    ],
    pricePreview: { type: mongoose.Schema.Types.Mixed, default: null },
    includeMembership: { type: Boolean, default: false },
    applyMemberBenefit: { type: Boolean, default: false },
    discountCode: { type: String, default: "", trim: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "checkout_sessions" }
);

checkoutSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CheckoutSession =
  mongoose.models.CheckoutSession || mongoose.model("CheckoutSession", checkoutSessionSchema);

export default CheckoutSession;
