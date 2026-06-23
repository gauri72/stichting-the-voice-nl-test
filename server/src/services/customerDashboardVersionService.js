import { getNextSequence } from "../utils/sequence.js";

function throwError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

async function nextVersionId() {
  const seq = await getNextSequence("customer_dashboard_version");
  return `CDV-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

export async function createCustomerDashboardVersion({ config, changeNote, status, adminId }) {
  const CustomerDashboardVersion = (await import("../models/CustomerDashboardVersion.js")).default;
  const versionId = await nextVersionId();
  return CustomerDashboardVersion.create({
    versionId,
    dashboardConfigId: config.dashboardConfigId,
    snapshot: {
      draftSections: config.draftSections,
      draftSettings: config.draftSettings,
      status: config.status,
    },
    changeNote: changeNote || "",
    status: status || "draft",
    createdBy: adminId,
  });
}

export async function listCustomerDashboardVersions(limit = 30) {
  const CustomerDashboardVersion = (await import("../models/CustomerDashboardVersion.js")).default;
  return CustomerDashboardVersion.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("createdBy", "name email firstName lastName")
    .lean();
}

export async function getCustomerDashboardVersion(versionId) {
  const CustomerDashboardVersion = (await import("../models/CustomerDashboardVersion.js")).default;
  const version = await CustomerDashboardVersion.findOne({ versionId }).populate("createdBy", "name email").lean();
  if (!version) throwError("Version not found.", 404);
  return version;
}
