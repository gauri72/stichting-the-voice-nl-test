import { hasCmsPermission } from "../config/cmsConfig.js";
import { hasPermission } from "../config/rbacConfig.js";

const CMS_PERMISSION_MAP = {
  "pages.read": "cms.view",
  "pages.write": "cms.edit",
  "pages.publish": "cms.publish",
  "header.write": "cms.edit",
  "footer.write": "cms.edit",
  upload: "templates.upload",
};

function cmsRbacAllowed(admin, legacyPermission) {
  const rbacKey = CMS_PERMISSION_MAP[legacyPermission] || "cms.view";
  if (hasPermission(admin?.permissions, rbacKey)) return true;
  const role = admin?.role || "viewer";
  return hasCmsPermission(role, legacyPermission);
}

export function requireCmsPermission(permission) {
  return (req, res, next) => {
    if (!cmsRbacAllowed(req.admin, permission)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    return next();
  };
}

export function requireCmsWrite(req, res, next) {
  if (!cmsRbacAllowed(req.admin, "pages.write")) {
    return res.status(403).json({ error: "Read-only access. You cannot edit pages." });
  }
  return next();
}

export function requireCmsPublish(req, res, next) {
  if (!cmsRbacAllowed(req.admin, "pages.publish")) {
    return res.status(403).json({ error: "You do not have permission to publish content." });
  }
  return next();
}
