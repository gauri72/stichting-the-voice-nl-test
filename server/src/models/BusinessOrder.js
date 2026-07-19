import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessProduct" },
    productName: { type: String, default: "", trim: true },
    productType: { type: String, default: "", trim: true },
    variant: { type: String, default: "", trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    unitPriceMinor: { type: Number, default: 0 },
    lineTotalMinor: { type: Number, default: 0 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true },
    line1: { type: String, default: "", trim: true },
    line2: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    postcode: { type: String, default: "", trim: true },
    country: { type: String, default: "NL", trim: true },
  },
  { _id: false }
);

const businessOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, trim: true, unique: true, sparse: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessProfile", required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    checkoutMode: { type: String, enum: ["account", "guest"], default: "account", index: true },
    businessName: { type: String, default: "", trim: true },
    customerName: { type: String, default: "", trim: true },
    customerEmail: { type: String, default: "", trim: true },
    customerPhone: { type: String, default: "", trim: true, maxlength: 40 },
    companyName: { type: String, default: "", trim: true, maxlength: 200 },
    vatNumber: { type: String, default: "", trim: true, maxlength: 80 },
    items: { type: [orderItemSchema], default: [] },
    subtotalMinor: { type: Number, default: 0 },
    platformFeePercent: { type: Number, default: 0 },
    platformFeeMinor: { type: Number, default: 0 },
    businessAmountMinor: { type: Number, default: 0 },
    cashbackMinor: { type: Number, default: 0 },
    currency: { type: String, default: "eur", lowercase: true },
    stripePaymentIntentId: { type: String, default: "", trim: true, index: true },
    stripeConnectedAccountId: { type: String, default: "", trim: true, index: true },
    stripeChargeId: { type: String, default: "", trim: true, index: true },
    stripeTransferId: { type: String, default: "", trim: true, index: true },
    stripeApplicationFeeId: { type: String, default: "", trim: true, index: true },
    stripeBalanceTransactionId: { type: String, default: "", trim: true },
    payoutEligibleAt: { type: Date, default: null, index: true },
    payoutHoldReason: { type: String, default: "", trim: true, maxlength: 500 },
    processingFeeMinor: { type: Number, default: 0, min: 0 },
    calculationSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    adjustmentTotalMinor: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "processing", "paid", "fulfilled", "failed", "cancelled", "expired", "refunded"],
      default: "pending",
      index: true,
    },
    paymentStatus: { type: String, default: "requires_payment", trim: true, index: true },
    paidAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    stripeProcessingFeeMinor: { type: Number, default: 0, min: 0 },
    cashbackFundingParty: { type: String, enum: ["platform", "seller"], default: "platform" },
    disputeStatus: { type: String, enum: ["none", "open", "won", "lost"], default: "none", index: true },
    stripeDisputeId: { type: String, default: "", trim: true, index: true },
    disputedAt: { type: Date, default: null },
    shippingAddress: { type: shippingAddressSchema, default: null },
    billingAddress: { type: shippingAddressSchema, default: null },
    requiresShipping: { type: Boolean, default: false },
    guestAccessTokenHash: { type: String, default: "", select: false },
    termsAcceptedAt: { type: Date, default: null },
    poNumber: { type: String, default: "", trim: true, maxlength: 50 },
    customerNote: { type: String, default: "", trim: true, maxlength: 500 },
    businessNote: { type: String, default: "", trim: true, maxlength: 500 },
    fulfilledAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    payoutId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessPayout", default: null },
    walletTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: "WalletTransaction", default: null },
    receiptNumber: { type: String, default: "", trim: true, index: true },
    receiptGeneratedAt: { type: Date, default: null },
    receiptEmailStatus: { type: String, enum: ["not_sent", "sent", "failed"], default: "not_sent" },
    receiptEmailSentAt: { type: Date, default: null },
    receiptEmailError: { type: String, default: "", trim: true, maxlength: 1000 },
    sellerEmailStatus: { type: String, enum: ["not_sent", "sent", "failed"], default: "not_sent" },
  },
  { timestamps: true, collection: "business_orders" }
);

businessOrderSchema.index({ businessId: 1, status: 1 });
businessOrderSchema.index({ customerId: 1, createdAt: -1 });
businessOrderSchema.index({ payoutId: 1 });
businessOrderSchema.index({ status: 1, payoutEligibleAt: 1, payoutId: 1 });

const BusinessOrder =
  mongoose.models.BusinessOrder || mongoose.model("BusinessOrder", businessOrderSchema);

export default BusinessOrder;
