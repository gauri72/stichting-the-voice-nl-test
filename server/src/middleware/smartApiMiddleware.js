import { hasSmartApiPermission } from "../config/smartApiConfig.js";
import { hasPermission } from "../config/rbacConfig.js";

const API_BUILDER_MAP = {
  view: "api_builder.view",
  edit: "api_builder.edit",
  secrets: "api_builder.secrets",
  test: "api_builder.test",
};

export function requireSmartApiPermission(permission) {
  return (req, res, next) => {
    const rbacKey = API_BUILDER_MAP[permission] || `api_builder.${permission}`;
    if (hasPermission(req.admin?.permissions, rbacKey)) return next();
    const role = req.admin?.role || "viewer";
    if (!hasSmartApiPermission(role, permission)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    return next();
  };
}
