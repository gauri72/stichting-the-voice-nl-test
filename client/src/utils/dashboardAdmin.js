export const DASHBOARD_PERMISSIONS = {
  superadmin: ["*"],
  admin: ["dashboard.read", "dashboard.write", "dashboard.publish", "reports.write"],
  event_manager: ["dashboard.read", "dashboard.write"],
  finance: ["dashboard.read", "reports.write"],
  viewer: ["dashboard.read"],
};

export const WIDGET_TYPE_LABELS = {
  welcome_banner: "Welcome Banner",
  stat_card: "Statistic Card",
  stat_group: "Statistics Group",
  kpi_card: "KPI Card",
  revenue_card: "Revenue Card",
  ticket_sales: "Ticket Sales",
  membership_card: "Membership",
  donation_card: "Donations",
  sponsorship_card: "Sponsorships",
  user_growth: "User Growth",
  event_summary: "Event Summary",
  bar_chart: "Bar Chart",
  line_chart: "Line Chart",
  area_chart: "Area Chart",
  pie_chart: "Pie Chart",
  funnel_chart: "Funnel Chart",
  trend_analysis: "Trend Analysis",
  quick_actions: "Quick Actions",
  activity_feed: "Activity Feed",
  ai_insight: "AI Insights",
  custom_html: "Custom HTML",
  embedded_report: "Embedded Report",
  section_header: "Section Header",
};

export const DATA_SOURCE_LABELS = {
  overview: "Overview",
  ticket_stats: "Platform Tickets",
  ticket_tailor: "TicketTailor",
  finance: "Finance",
  sponsorships: "Sponsorships",
  donations: "Donations",
  recent_activity: "Recent Activity",
  ai_insights: "AI Insights",
  custom_report: "Custom Report",
};

export const REPORT_DATA_SOURCES = [
  "events", "tickets", "members", "users", "donations", "sponsorships", "finance", "vouchers", "checkins", "tickettailor",
];

export const REPORT_METRICS = [
  "revenue", "growth", "conversions", "attendance", "registrations", "membership_sales", "donations", "sponsorship_income",
];

export const REPORT_OUTPUTS = ["table", "csv", "excel", "pdf", "bar_chart", "line_chart", "pie_chart"];

export function hasDashboardPermission(role, permission) {
  const perms = DASHBOARD_PERMISSIONS[role] || DASHBOARD_PERMISSIONS.viewer;
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export function widgetTypeLabel(type) {
  return WIDGET_TYPE_LABELS[type] || type;
}

export const COL_SPAN_OPTIONS = [2, 3, 4, 6, 8, 12];

export function formatWidgetGridStyle(widget) {
  const colSpan = widget.layout?.colSpan || 3;
  const rowSpan = widget.layout?.rowSpan || 1;
  return {
    gridColumn: `span ${Math.min(12, Math.max(1, colSpan))}`,
    gridRow: `span ${Math.max(1, rowSpan)}`,
  };
}
