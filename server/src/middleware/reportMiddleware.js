import { canAccessReportSection, canExportReports } from "../config/reportsConfig.js";

export function requireReportSection(section) {
  return (req, res, next) => {
    const role = req.admin?.role || "admin";
    if (!canAccessReportSection(role, section)) {
      return res.status(403).json({ error: "You do not have permission to view this report." });
    }
    return next();
  };
}

export function requireReportExport(req, res, next) {
  const role = req.admin?.role || "admin";
  if (!canExportReports(role)) {
    return res.status(403).json({ error: "You do not have permission to export reports." });
  }
  return next();
}
