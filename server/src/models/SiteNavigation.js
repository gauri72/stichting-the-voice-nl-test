import mongoose from "mongoose";

const navItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, default: "", maxlength: 120 },
    url: { type: String, default: "" },
    icon: { type: String, default: "" },
    order: { type: Number, default: 0 },
    target: { type: String, enum: ["_self", "_blank"], default: "_self" },
    visible: { type: Boolean, default: true },
    mobileVisible: { type: Boolean, default: true },
    desktopVisible: { type: Boolean, default: true },
    children: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { _id: false }
);

const siteNavigationSchema = new mongoose.Schema(
  {
    navigationId: { type: String, unique: true, sparse: true, trim: true },
    type: { type: String, default: "header", enum: ["header"] },
    draft: {
      logo: { type: mongoose.Schema.Types.Mixed, default: {} },
      items: { type: [navItemSchema], default: [] },
      mobileItems: { type: [navItemSchema], default: [] },
      settings: { type: mongoose.Schema.Types.Mixed, default: {} },
      ctas: { type: [mongoose.Schema.Types.Mixed], default: [] },
      announcementBar: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    published: {
      logo: { type: mongoose.Schema.Types.Mixed, default: {} },
      items: { type: [navItemSchema], default: [] },
      mobileItems: { type: [navItemSchema], default: [] },
      settings: { type: mongoose.Schema.Types.Mixed, default: {} },
      ctas: { type: [mongoose.Schema.Types.Mixed], default: [] },
      announcementBar: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "cms_site_navigation" }
);

const SiteNavigation = mongoose.models.SiteNavigation || mongoose.model("SiteNavigation", siteNavigationSchema);
export default SiteNavigation;
