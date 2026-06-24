import mongoose from "mongoose";

const ticketOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    attendeeFirstName: { type: String, required: true, trim: true, maxlength: 80 },
    attendeeLastName: { type: String, required: true, trim: true, maxlength: 80 },
    attendeeEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    attendeePhone: { type: String, default: "", trim: true, maxlength: 40 },
    orderType: {
      type: String,
      enum: ["TICKET_ONLY", "MEMBERSHIP_ONLY", "TICKET_AND_MEMBERSHIP"],
      default: "TICKET_ONLY",
      index: true,
    },
    lineItems: [
      {
        ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketType", required: true },
        ticketTypeName: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPriceMinor: { type: Number, required: true, min: 0 },
        originalPriceMinor: { type: Number, default: 0, min: 0 },
        eventDiscountMinor: { type: Number, default: 0, min: 0 },
        memberDiscountMinor: { type: Number, default: 0, min: 0 },
        finalPriceMinor: { type: Number, default: 0, min: 0 },
        seatIds: { type: [String], default: [] },
      },
    ],
    selectedSeats: [
      {
        seatId: { type: String, trim: true },
        section: { type: String, trim: true },
        row: { type: String, trim: true },
        seatNumber: { type: String, trim: true },
        seatLabel: { type: String, trim: true },
        category: { type: String, trim: true },
        ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketType", default: null },
      },
    ],
    seatingMode: { type: String, default: "general_admission", trim: true },
    membershipItems: [
      {
        membershipType: { type: String, trim: true },
        planId: { type: String, trim: true },
        purchaseType: { type: String, enum: ["NEW", "RENEWAL"], default: "NEW" },
        originalPriceMinor: { type: Number, default: 0, min: 0 },
        membershipDiscountMinor: { type: Number, default: 0, min: 0 },
        finalPriceMinor: { type: Number, default: 0, min: 0 },
        memberUntil: { type: Date, default: null },
      },
    ],
    appliedDiscounts: [
      {
        type: { type: String, trim: true },
        label: { type: String, trim: true },
        amountMinor: { type: Number, default: 0 },
        ruleId: { type: mongoose.Schema.Types.ObjectId, ref: "DiscountRule", default: null },
      },
    ],
    memberStatusAtCheckout: { type: String, default: "", trim: true },
    membershipSourceAtCheckout: { type: String, default: "", trim: true },
    membershipTypeAtCheckout: { type: String, default: "", trim: true },
    membershipBenefitApplied: { type: Boolean, default: false },
    membershipBenefitReason: { type: String, default: "", trim: true },
    membershipDiscountAmount: { type: Number, default: 0, min: 0 },
    totalSavingsMinor: { type: Number, default: 0, min: 0 },
    orderStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    subtotalMinor: { type: Number, required: true, min: 0 },
    discountAmountMinor: { type: Number, default: 0, min: 0 },
    bookingFeeMinor: { type: Number, default: 0, min: 0 },
    vatAmountMinor: { type: Number, default: 0, min: 0 },
    totalAmountMinor: { type: Number, required: true, min: 0 },
    voucherCode: { type: String, default: "", trim: true },
    discountCode: { type: String, default: "", trim: true },
    referralCode: { type: String, default: "", trim: true },
    membershipDiscountMinor: { type: Number, default: 0, min: 0 },
    voucherDiscountMinor: { type: Number, default: 0, min: 0 },
    referralDiscountMinor: { type: Number, default: 0, min: 0 },
    personalDiscountMinor: { type: Number, default: 0, min: 0 },
    discountRuleId: { type: mongoose.Schema.Types.ObjectId, ref: "DiscountRule", default: null },
    memberDiscountRuleId: { type: mongoose.Schema.Types.ObjectId, ref: "DiscountRule", default: null },
    membershipDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    checkoutFormResponseId: { type: String, default: "", trim: true, index: true },
    checkoutAnswers: { type: [mongoose.Schema.Types.Mixed], default: [] },
    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "paid", "failed", "refunded", "free", "complimentary"],
      default: "pending",
      index: true,
    },
    paymentIntentId: { type: String, default: "", trim: true, index: true },
    termsAccepted: { type: Boolean, default: false },
    bookingMode: { type: String, default: "", trim: true, index: true },
    adminIssued: { type: Boolean, default: false },
    adminIssuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    adminNote: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { timestamps: true, collection: "ticket_orders" }
);

ticketOrderSchema.index({ createdAt: -1 });
ticketOrderSchema.index({ eventId: 1, paymentStatus: 1 });

const TicketOrder =
  mongoose.models.TicketOrder || mongoose.model("TicketOrder", ticketOrderSchema);

export default TicketOrder;
