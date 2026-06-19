import { hasFinancePermission, canDeleteFinanceRecords } from "../config/financeConfig.js";

export function requireFinancePermission(permission) {
  return (req, res, next) => {
    const role = req.admin?.role || "admin";
    if (!hasFinancePermission(role, permission)) {
      return res.status(403).json({ error: "You do not have permission for this finance action." });
    }
    return next();
  };
}

export function requireFinanceDelete(req, res, next) {
  const role = req.admin?.role || "admin";
  if (!canDeleteFinanceRecords(role)) {
    return res.status(403).json({ error: "Only Finance Admin or Super Admin can delete finance records." });
  }
  return next();
}
