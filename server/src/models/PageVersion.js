import mongoose from "mongoose";
import { VERSION_STATUSES } from "../config/cmsConfig.js";

const pageVersionSchema = new mongoose.Schema(
  {
    versionId: { type: String, unique: true, sparse: true, trim: true, index: true },
    pageId: { type: String, required: true, index: true },
    pageSlug: { type: String, required: true, index: true },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    changeNote: { type: String, default: "", maxlength: 500 },
    status: { type: String, enum: VERSION_STATUSES, default: "draft" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "cms_page_versions" }
);

pageVersionSchema.index({ pageSlug: 1, createdAt: -1 });

const PageVersion = mongoose.models.PageVersion || mongoose.model("PageVersion", pageVersionSchema);
export default PageVersion;
