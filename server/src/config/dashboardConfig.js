export const DASHBOARD_ROLES = [
  "superadmin",
  "admin",
  "event_manager",
  "finance",
  "viewer",
];

export const WIDGET_TYPES = [
  "welcome_banner",
  "stat_card",
  "stat_group",
  "kpi_card",
  "revenue_card",
  "ticket_sales",
  "membership_card",
  "donation_card",
  "sponsorship_card",
  "user_growth",
  "event_summary",
  "bar_chart",
  "line_chart",
  "area_chart",
  "pie_chart",
  "funnel_chart",
  "trend_analysis",
  "quick_actions",
  "activity_feed",
  "ai_insight",
  "custom_html",
  "embedded_report",
  "section_header",
];

export const DATA_SOURCES = [
  "overview",
  "ticket_stats",
  "ticket_tailor",
  "finance",
  "sponsorships",
  "donations",
  "recent_activity",
  "events",
  "members",
  "users",
  "vouchers",
  "checkins",
  "custom_report",
  "ai_insights",
];

export const REPORT_DATA_SOURCES = [
  "events",
  "tickets",
  "members",
  "users",
  "donations",
  "sponsorships",
  "finance",
  "vouchers",
  "checkins",
  "tickettailor",
];

export const REPORT_METRICS = [
  "revenue",
  "growth",
  "conversions",
  "attendance",
  "registrations",
  "membership_sales",
  "donations",
  "sponsorship_income",
];

export const REPORT_OUTPUTS = ["table", "csv", "excel", "pdf", "bar_chart", "line_chart", "pie_chart"];

export const DASHBOARD_PERMISSIONS = {
  superadmin: ["*"],
  admin: ["dashboard.read", "dashboard.write", "dashboard.publish", "reports.write"],
  event_manager: ["dashboard.read", "dashboard.write"],
  finance: ["dashboard.read", "reports.write"],
  viewer: ["dashboard.read"],
};

export function hasDashboardPermission(role, permission) {
  const perms = DASHBOARD_PERMISSIONS[role] || DASHBOARD_PERMISSIONS.viewer;
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export function widgetVisibleForRole(widget, role) {
  const roles = widget?.permissions?.roles || widget?.allowedRoles || [];
  if (!roles.length) return true;
  return roles.includes(role);
}
