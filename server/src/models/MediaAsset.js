import mongoose from "mongoose";

export const MEDIA_PUBLIC_CATEGORIES = [
  "cms",
  "events",
  "team",
  "logos",
  "reviews",
  "highlights",
  "business_profiles",
  "business_products",
];
export const MEDIA_PRIVATE_CATEGORIES = [
  "tickets",
  "memberships",
  "invoices",
  "receipts",
  "contracts",
  "reports",
  "budget-sheets",
  "technical-riders",
  "stage-plans",
];

const mediaAssetSchema = new mongoose.Schema(
  {
    assetId: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      enum: [...MEDIA_PUBLIC_CATEGORIES, ...MEDIA_PRIVATE_CATEGORIES],
      required: true,
    },
    visibility: { type: String, enum: ["public", "private"], required: true },
    originalKey: { type: String, required: true },
    webpKey: { type: String, default: "" },
    mobileKey: { type: String, default: "" },
    thumbnailKey: { type: String, default: "" },
    originalUrl: { type: String, default: "" },
    webpUrl: { type: String, default: "" },
    mobileUrl: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    sizeBytes: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    alt: { type: String, default: "", maxlength: 300 },
    tags: { type: [String], default: [] },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    usageCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true, collection: "media_assets" }
);

mediaAssetSchema.index({ category: 1, status: 1 });
mediaAssetSchema.index({ tags: 1 });

const MediaAsset = mongoose.models.MediaAsset || mongoose.model("MediaAsset", mediaAssetSchema);
export default MediaAsset;
