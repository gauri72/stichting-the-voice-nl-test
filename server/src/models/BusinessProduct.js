import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    options: { type: [String], default: [] },
  },
  { _id: false }
);

const businessProductSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessProfile", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    type: {
      type: String,
      enum: ["physical", "digital", "service"],
      default: "service",
    },
    imageUrls: { type: [String], default: [] },
    priceMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "eur", lowercase: true },
    stockCount: { type: Number, default: null },
    isAvailable: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    variants: { type: [variantSchema], default: [] },
    tags: { type: [String], default: [] },
    deliveryInfo: { type: String, default: "", trim: true, maxlength: 500 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "business_products" }
);

businessProductSchema.index({ businessId: 1, isAvailable: 1 });
businessProductSchema.index({ businessId: 1, sortOrder: 1 });
businessProductSchema.index({ businessId: 1, slug: 1 }, { unique: true });

const BusinessProduct =
  mongoose.models.BusinessProduct || mongoose.model("BusinessProduct", businessProductSchema);

export default BusinessProduct;
