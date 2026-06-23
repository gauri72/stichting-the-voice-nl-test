import { hasCmsPermission } from "../config/cmsConfig.js";

export function requireCmsPermission(permission) {
  return (req, res, next) => {
    const role = req.admin?.role || "viewer";
    if (!hasCmsPermission(role, permission)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    return next();
  };
}

export function requireCmsWrite(req, res, next) {
  const role = req.admin?.role || "viewer";
  if (!hasCmsPermission(role, "pages.write")) {
    return res.status(403).json({ error: "Read-only access. You cannot edit pages." });
  }
  return next();
}

export function requireCmsPublish(req, res, next) {
  const role = req.admin?.role || "viewer";
  if (!hasCmsPermission(role, "pages.publish")) {
    return res.status(403).json({ error: "You do not have permission to publish content." });
  }
  return next();
}
