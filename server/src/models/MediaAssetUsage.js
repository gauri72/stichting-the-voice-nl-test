import mongoose from "mongoose";

const mediaAssetUsageSchema = new mongoose.Schema(
  {
    assetId: { type: String, required: true, index: true },
    usedInType: { type: String, enum: ["page_section", "seo_og_image"], required: true },
    usedInId: { type: String, required: true }, // e.g. "home:hero-section-id" or "events:seo"
    label: { type: String, default: "", maxlength: 200 }, // human-readable, e.g. "Home Hero"
  },
  { timestamps: true, collection: "media_asset_usages" }
);

mediaAssetUsageSchema.index({ assetId: 1, usedInType: 1, usedInId: 1 }, { unique: true });

const MediaAssetUsage =
  mongoose.models.MediaAssetUsage || mongoose.model("MediaAssetUsage", mediaAssetUsageSchema);
export default MediaAssetUsage;
