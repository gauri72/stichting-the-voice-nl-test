import mongoose from "mongoose";

const linkSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, default: "", maxlength: 120 },
    url: { type: String, default: "" },
    icon: { type: String, default: "" },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
    platform: { type: String, default: "" },
  },
  { _id: false }
);

const siteFooterSchema = new mongoose.Schema(
  {
    footerId: { type: String, unique: true, sparse: true, trim: true },
    draft: {
      content: { type: mongoose.Schema.Types.Mixed, default: {} },
      quickLinks: { type: [linkSchema], default: [] },
      socialLinks: { type: [linkSchema], default: [] },
      ctas: { type: [mongoose.Schema.Types.Mixed], default: [] },
      contactDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
      settings: { type: mongoose.Schema.Types.Mixed, default: {} },
      sectionOrder: { type: [String], default: [] },
    },
    published: {
      content: { type: mongoose.Schema.Types.Mixed, default: {} },
      quickLinks: { type: [linkSchema], default: [] },
      socialLinks: { type: [linkSchema], default: [] },
      ctas: { type: [mongoose.Schema.Types.Mixed], default: [] },
      contactDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
      settings: { type: mongoose.Schema.Types.Mixed, default: {} },
      sectionOrder: { type: [String], default: [] },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "cms_site_footer" }
);

const SiteFooter = mongoose.models.SiteFooter || mongoose.model("SiteFooter", siteFooterSchema);
export default SiteFooter;
