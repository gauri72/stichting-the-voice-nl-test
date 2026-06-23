import { hasSmartApiPermission } from "../config/smartApiConfig.js";

export function requireSmartApiPermission(permission) {
  return (req, res, next) => {
    const role = req.admin?.role || "viewer";
    if (!hasSmartApiPermission(role, permission)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    return next();
  };
}
