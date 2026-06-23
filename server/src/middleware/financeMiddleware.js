import { hasFinancePermission, canDeleteFinanceRecords } from "../config/financeConfig.js";
import { hasPermission } from "../config/rbacConfig.js";

const FINANCE_PERMISSION_MAP = {
  view: "finance.view",
  edit: "finance.edit",
  export: "finance.export",
  delete: "finance.edit",
};

function financeRbacAllowed(admin, permission) {
  const rbacKey = FINANCE_PERMISSION_MAP[permission] || "finance.view";
  if (hasPermission(admin?.permissions, rbacKey)) return true;
  const role = admin?.role || "viewer";
  return hasFinancePermission(role, permission);
}

export function requireFinancePermission(permission) {
  return (req, res, next) => {
    if (!financeRbacAllowed(req.admin, permission)) {
      return res.status(403).json({ error: "You do not have permission for this finance action." });
    }
    return next();
  };
}

export function requireFinanceDelete(req, res, next) {
  if (hasPermission(req.admin?.permissions, "finance.edit") || hasPermission(req.admin?.permissions, "*")) {
    return next();
  }
  const role = req.admin?.role || "viewer";
  if (!canDeleteFinanceRecords(role)) {
    return res.status(403).json({ error: "Only Finance Admin or Super Admin can delete finance records." });
  }
  return next();
}
