import { verifyAdminToken } from "../services/adminService.js";
import { getAdminAccessProfile } from "../services/rbacService.js";
import { hasPermission } from "../config/rbacConfig.js";
import { resolveAdminPermission } from "../config/adminRoutePermissions.js";

export async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return res.status(401).json({ error: "Admin authentication required." });
    }

    const payload = verifyAdminToken(match[1]);
    const admin = await getAdminAccessProfile(payload.sub);
    if (!admin) {
      return res.status(401).json({ error: "Invalid or expired admin session." });
    }

    if (!admin.isActive || ["disabled", "suspended"].includes(admin.status)) {
      return res.status(403).json({ error: "Your admin account is not active." });
    }

    req.admin = admin;

    const requiredPermission = resolveAdminPermission(req);
    if (requiredPermission && !hasPermission(admin.permissions, requiredPermission)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }

    return next();
  } catch (error) {
    const status = error.status || 401;
    return res.status(status).json({ error: error.message || "Invalid or expired admin session." });
  }
}
