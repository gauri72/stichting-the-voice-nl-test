import { hasPermission, hasAnyPermission, canAccessEvent } from "../config/rbacConfig.js";

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!hasPermission(req.admin?.permissions, permission)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    return next();
  };
}

export function requireAnyPermission(permissions = []) {
  return (req, res, next) => {
    if (!hasAnyPermission(req.admin?.permissions, permissions)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    return next();
  };
}

export function requireEventAccess(paramName = "eventId") {
  return (req, res, next) => {
    const eventId = req.params[paramName] || req.body?.[paramName] || req.query?.[paramName];
    if (!eventId) return next();
    if (!canAccessEvent(req.admin, eventId)) {
      return res.status(403).json({ error: "You do not have access to this event." });
    }
    return next();
  };
}
