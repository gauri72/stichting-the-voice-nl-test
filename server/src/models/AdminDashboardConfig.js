import mongoose from "mongoose";

const ctaSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, default: "" },
    url: { type: String, default: "" },
    target: { type: String, default: "_self" },
    style: { type: String, default: "primary" },
    visible: { type: Boolean, default: true },
  },
  { _id: false }
);

const widgetSchema = new mongoose.Schema(
  {
    widgetId: { type: String, required: true },
    widgetType: { type: String, required: true },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
    dataSource: { type: String, default: "" },
    dataKey: { type: String, default: "" },
    displayType: { type: String, default: "card" },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    ctas: { type: [ctaSchema], default: [] },
    permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
    allowedRoles: { type: [String], default: [] },
    layout: {
      colSpan: { type: Number, default: 3, min: 1, max: 12 },
      rowSpan: { type: Number, default: 1, min: 1, max: 4 },
      order: { type: Number, default: 0 },
      groupId: { type: String, default: "" },
    },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    isVisible: { type: Boolean, default: true },
    isCustom: { type: Boolean, default: false },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    title: { type: String, default: "Dashboard" },
    welcomeMessage: { type: String, default: "Welcome back {{name}} 👋" },
    subtitle: { type: String, default: "Overview of users, memberships, and activity." },
    announcement: { type: mongoose.Schema.Types.Mixed, default: { visible: false, text: "", style: "info" } },
    heroCard: { type: mongoose.Schema.Types.Mixed, default: {} },
    banners: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { _id: false }
);

const roleLayoutSchema = new mongoose.Schema(
  {
    settings: { type: settingsSchema, default: () => ({}) },
    widgets: { type: [widgetSchema], default: [] },
  },
  { _id: false }
);

const dashboardConfigSchema = new mongoose.Schema(
  {
    configId: { type: String, unique: true, sparse: true, trim: true },
    draft: {
      settings: { type: settingsSchema, default: () => ({}) },
      widgets: { type: [widgetSchema], default: [] },
      roleOverrides: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    published: {
      settings: { type: settingsSchema, default: () => ({}) },
      widgets: { type: [widgetSchema], default: [] },
      roleOverrides: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "admin_dashboard_configs" }
);

const AdminDashboardConfig =
  mongoose.models.AdminDashboardConfig || mongoose.model("AdminDashboardConfig", dashboardConfigSchema);
export default AdminDashboardConfig;
