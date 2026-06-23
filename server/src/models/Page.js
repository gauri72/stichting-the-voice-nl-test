import mongoose from "mongoose";
import { PAGE_STATUSES } from "../config/cmsConfig.js";

const imageFieldSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    alt: { type: String, default: "", maxlength: 300 },
    focusPosition: { type: String, default: "center" },
    originalUrl: { type: String, default: "" },
    optimizedUrl: { type: String, default: "" },
  },
  { _id: false }
);

const ctaSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, default: "", maxlength: 200 },
    url: { type: String, default: "" },
    target: { type: String, enum: ["_self", "_blank"], default: "_self" },
    style: { type: String, default: "primary" },
    visible: { type: Boolean, default: true },
    trackingLabel: { type: String, default: "", maxlength: 100 },
  },
  { _id: false }
);

const sectionSchema = new mongoose.Schema(
  {
    sectionId: { type: String, required: true },
    sectionKey: { type: String, default: "" },
    sectionType: { type: String, required: true },
    title: { type: String, default: "", maxlength: 200 },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    images: { type: mongoose.Schema.Types.Mixed, default: {} },
    ctas: { type: [ctaSchema], default: [] },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    isCustom: { type: Boolean, default: false },
  },
  { _id: false }
);

const seoSchema = new mongoose.Schema(
  {
    metaTitle: { type: String, default: "", maxlength: 200 },
    metaDescription: { type: String, default: "", maxlength: 500 },
    ogTitle: { type: String, default: "", maxlength: 200 },
    ogDescription: { type: String, default: "", maxlength: 500 },
    ogImage: { type: imageFieldSchema, default: () => ({}) },
    canonicalUrl: { type: String, default: "" },
    robotsIndex: { type: Boolean, default: true },
    keywords: { type: String, default: "", maxlength: 500 },
  },
  { _id: false }
);

const pageSchema = new mongoose.Schema(
  {
    pageId: { type: String, unique: true, sparse: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    route: { type: String, required: true, trim: true },
    status: { type: String, enum: PAGE_STATUSES, default: "draft", index: true },
    seo: { type: seoSchema, default: () => ({}) },
    draftSections: { type: [sectionSchema], default: [] },
    publishedSections: { type: [sectionSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "cms_pages" }
);

pageSchema.index({ route: 1 });
pageSchema.index({ updatedAt: -1 });

const Page = mongoose.models.Page || mongoose.model("Page", pageSchema);
export default Page;
