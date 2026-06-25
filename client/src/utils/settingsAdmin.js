export const SETTINGS_PERMISSIONS = {
  superadmin: ["*"],
  finance: [
    "settings.read",
    "settings.finance.read",
    "settings.finance.write",
    "settings.email.read",
    "settings.templates.read",
  ],
  admin: [
    "settings.read",
    "settings.write",
    "settings.content.read",
    "settings.content.write",
    "settings.email.read",
    "settings.templates.read",
    "settings.templates.write",
  ],
  event_manager: [
    "settings.read",
    "settings.content.read",
    "settings.content.write",
    "settings.email.read",
    "settings.templates.read",
    "settings.templates.write",
  ],
  viewer: ["settings.read"],
};

export const FINANCE_CATEGORIES = ["payment", "stripe", "bank", "invoice"];

export const SETTINGS_NAV = [
  { to: "/admin/settings/general", label: "General Settings", category: "general" },
  { to: "/admin/settings/payment", label: "Payment Settings", category: "payment", finance: true },
  { to: "/admin/settings/stripe", label: "Stripe Settings", category: "stripe", finance: true },
  { to: "/admin/settings/bank", label: "Bank Account Settings", category: "bank", finance: true },
  { to: "/admin/settings/email-templates", label: "Email Templates", templates: true },
  { to: "/admin/settings/email-provider", label: "Email Provider Settings", category: "email_provider" },
  { to: "/admin/settings/pdf-templates", label: "PDF Templates", category: "pdf_templates", templates: true },
  { to: "/admin/settings/ticketing", label: "Ticketing Settings", category: "ticketing" },
  { to: "/admin/settings/membership", label: "Membership Settings", category: "membership" },
  { to: "/admin/settings/sponsorship", label: "Sponsorship Settings", category: "sponsorship" },
  { to: "/admin/settings/donation", label: "Donation Settings", category: "donation" },
  { to: "/admin/settings/invoice", label: "Invoice Settings", category: "invoice", finance: true },
  { to: "/admin/settings/security", label: "Security Settings", category: "security" },
  { to: "/admin/settings/integrations", label: "Integrations", category: "integrations" },
  { to: "/admin/settings/content-overrides", label: "Page Content (Pillars, Get Involved, Stats)", category: "content_overrides" },
  { to: "/admin/settings/audit-logs", label: "System Logs", audit: true },
];

export function hasSettingsPermission(role, permission) {
  const perms = SETTINGS_PERMISSIONS[role] || SETTINGS_PERMISSIONS.viewer;
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export function canReadSettingsCategory(role, category) {
  if (hasSettingsPermission(role, "*") || hasSettingsPermission(role, "settings.write")) return true;
  if (FINANCE_CATEGORIES.includes(category)) return hasSettingsPermission(role, "settings.finance.read");
  if (category === "pdf_templates" || category === "email_provider" || category === "content_overrides") {
    return hasSettingsPermission(role, "settings.content.read") || hasSettingsPermission(role, "settings.templates.read");
  }
  return hasSettingsPermission(role, "settings.read");
}

export function canWriteSettingsCategory(role, category) {
  if (hasSettingsPermission(role, "*")) return true;
  if (FINANCE_CATEGORIES.includes(category)) return hasSettingsPermission(role, "settings.finance.write");
  if (category === "pdf_templates") {
    return hasSettingsPermission(role, "settings.content.write") || hasSettingsPermission(role, "settings.templates.write");
  }
  if (category === "email_provider" || category === "content_overrides") {
    return hasSettingsPermission(role, "settings.content.write") || hasSettingsPermission(role, "settings.write");
  }
  return hasSettingsPermission(role, "settings.write");
}

export function canWriteTemplates(role) {
  return hasSettingsPermission(role, "settings.templates.write") || hasSettingsPermission(role, "*");
}

export function formatTemplateType(type) {
  return String(type || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
