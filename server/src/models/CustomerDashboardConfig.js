import mongoose from "mongoose";
import { CUSTOMER_SECTION_TYPES } from "../config/customerDashboardConfig.js";

const ctaSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, default: "" },
    url: { type: String, default: "" },
    style: { type: String, default: "primary" },
    target: { type: String, default: "_self" },
    visible: { type: Boolean, default: true },
    trackingLabel: { type: String, default: "" },
  },
  { _id: false }
);

const sectionSchema = new mongoose.Schema(
  {
    sectionId: { type: String, required: true },
    sectionType: { type: String, enum: CUSTOMER_SECTION_TYPES, required: true },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    image: { type: mongoose.Schema.Types.Mixed, default: {} },
    ctas: { type: [ctaSchema], default: [] },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    visibilityRules: { type: mongoose.Schema.Types.Mixed, default: { rules: [] } },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    isCustom: { type: Boolean, default: false },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    title: { type: String, default: "My Dashboard" },
    welcomeMessage: { type: String, default: "Welcome, {{name}}" },
    introText: { type: String, default: "" },
    footerText: { type: String, default: "" },
    announcement: { type: mongoose.Schema.Types.Mixed, default: { visible: false, text: "" } },
    heroBanner: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const customerDashboardConfigSchema = new mongoose.Schema(
  {
    dashboardConfigId: { type: String, unique: true, sparse: true, trim: true },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    draftSections: { type: [sectionSchema], default: [] },
    publishedSections: { type: [sectionSchema], default: [] },
    draftSettings: { type: settingsSchema, default: () => ({}) },
    publishedSettings: { type: settingsSchema, default: () => ({}) },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "customer_dashboard_configs" }
);

const CustomerDashboardConfig =
  mongoose.models.CustomerDashboardConfig || mongoose.model("CustomerDashboardConfig", customerDashboardConfigSchema);
export default CustomerDashboardConfig;
