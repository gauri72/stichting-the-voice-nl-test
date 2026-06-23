import { hasDashboardPermission } from "../config/dashboardConfig.js";

export function requireDashboardPermission(permission) {
  return (req, res, next) => {
    const role = req.admin?.role || "viewer";
    if (!hasDashboardPermission(role, permission)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    return next();
  };
}
