import { hasCustomerDashboardPermission } from "../config/customerDashboardConfig.js";

export function requireCustomerDashboardPermission(permission) {
  return (req, res, next) => {
    const role = req.admin?.role || "viewer";
    if (!hasCustomerDashboardPermission(role, permission)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    return next();
  };
}
