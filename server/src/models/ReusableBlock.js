import mongoose from "mongoose";
import ctaSchema from "./shared/ctaSchema.js";

const stateSchema = {
  content: { type: mongoose.Schema.Types.Mixed, default: {} },
  images: { type: mongoose.Schema.Types.Mixed, default: {} },
  ctas: { type: [ctaSchema], default: [] },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
};

const reusableBlockSchema = new mongoose.Schema(
  {
    blockId: { type: String, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, default: "general", trim: true },
    sectionType: { type: String, required: true },
    draft: stateSchema,
    published: stateSchema,
    usageCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "cms_reusable_blocks" }
);

reusableBlockSchema.index({ category: 1 });

const ReusableBlock = mongoose.models.ReusableBlock || mongoose.model("ReusableBlock", reusableBlockSchema);
export default ReusableBlock;
