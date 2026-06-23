import { canReadCategory, canWriteCategory, hasSettingsPermission } from "../config/settingsConfig.js";

export function requireSettingsRead(category) {
  return (req, res, next) => {
    const role = req.admin?.role || "viewer";
    const cat = category || req.params.category;
    if (!canReadCategory(role, cat)) {
      return res.status(403).json({ error: "You do not have permission to view these settings." });
    }
    return next();
  };
}

export function requireSettingsWrite(category) {
  return (req, res, next) => {
    const role = req.admin?.role || "viewer";
    const cat = category || req.params.category;
    if (!canWriteCategory(role, cat)) {
      return res.status(403).json({ error: "You do not have permission to edit these settings." });
    }
    return next();
  };
}

export function requireFinanceSettingsWrite(req, res, next) {
  const role = req.admin?.role || "viewer";
  if (!canWriteCategory(role, "stripe") && !hasSettingsPermission(role, "*")) {
    return res.status(403).json({ error: "Only finance administrators can edit payment and bank settings." });
  }
  return next();
}

export function requireTemplateWrite(req, res, next) {
  const role = req.admin?.role || "viewer";
  if (!hasSettingsPermission(role, "settings.templates.write") && !hasSettingsPermission(role, "*")) {
    return res.status(403).json({ error: "You do not have permission to edit email templates." });
  }
  return next();
}
