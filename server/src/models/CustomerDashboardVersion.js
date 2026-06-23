import mongoose from "mongoose";

const customerDashboardVersionSchema = new mongoose.Schema(
  {
    versionId: { type: String, unique: true, sparse: true, trim: true, index: true },
    dashboardConfigId: { type: String, required: true, index: true },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    changeNote: { type: String, default: "", maxlength: 500 },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "customer_dashboard_versions" }
);

const CustomerDashboardVersion =
  mongoose.models.CustomerDashboardVersion || mongoose.model("CustomerDashboardVersion", customerDashboardVersionSchema);
export default CustomerDashboardVersion;
