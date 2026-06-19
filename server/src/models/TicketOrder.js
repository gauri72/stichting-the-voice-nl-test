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
    lineItems: [
      {
        ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketType", required: true },
        ticketTypeName: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPriceMinor: { type: Number, required: true, min: 0 },
      },
    ],
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
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    paymentIntentId: { type: String, default: "", trim: true, index: true },
    termsAccepted: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "ticket_orders" }
);

ticketOrderSchema.index({ createdAt: -1 });
ticketOrderSchema.index({ eventId: 1, paymentStatus: 1 });

const TicketOrder =
  mongoose.models.TicketOrder || mongoose.model("TicketOrder", ticketOrderSchema);

export default TicketOrder;
