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
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessProfile", required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    businessName: { type: String, default: "", trim: true },
    customerName: { type: String, default: "", trim: true },
    customerEmail: { type: String, default: "", trim: true },
    items: { type: [orderItemSchema], default: [] },
    subtotalMinor: { type: Number, default: 0 },
    platformFeePercent: { type: Number, default: 0 },
    platformFeeMinor: { type: Number, default: 0 },
    businessAmountMinor: { type: Number, default: 0 },
    cashbackMinor: { type: Number, default: 0 },
    currency: { type: String, default: "eur", lowercase: true },
    stripePaymentIntentId: { type: String, default: "", trim: true, index: true },
    status: {
      type: String,
      enum: ["pending", "paid", "fulfilled", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    shippingAddress: { type: shippingAddressSchema, default: null },
    poNumber: { type: String, default: "", trim: true, maxlength: 50 },
    customerNote: { type: String, default: "", trim: true, maxlength: 500 },
    businessNote: { type: String, default: "", trim: true, maxlength: 500 },
    fulfilledAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    payoutId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessPayout", default: null },
    walletTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: "WalletTransaction", default: null },
  },
  { timestamps: true, collection: "business_orders" }
);

businessOrderSchema.index({ businessId: 1, status: 1 });
businessOrderSchema.index({ customerId: 1, createdAt: -1 });
businessOrderSchema.index({ payoutId: 1 });

const BusinessOrder =
  mongoose.models.BusinessOrder || mongoose.model("BusinessOrder", businessOrderSchema);

export default BusinessOrder;
