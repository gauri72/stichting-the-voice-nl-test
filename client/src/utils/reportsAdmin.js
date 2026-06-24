/** Client-side mirror of server report section access */
const REPORT_SECTION_ACCESS = {
  overview: ["superadmin", "finance", "event_manager", "viewer", "admin"],
  revenue: ["superadmin", "finance", "viewer", "admin"],
  events: ["superadmin", "finance", "event_manager", "viewer", "admin"],
  tickets: ["superadmin", "finance", "event_manager", "viewer", "admin"],
  memberships: ["superadmin", "finance", "viewer", "admin"],
  sponsorships: ["superadmin", "finance", "viewer", "admin"],
  donations: ["superadmin", "finance", "viewer", "admin"],
  discounts: ["superadmin", "finance", "event_manager", "viewer", "admin"],
  users: ["superadmin", "viewer", "admin"],
  checkins: ["superadmin", "event_manager", "viewer", "admin"],
  finance: ["superadmin", "finance", "viewer", "admin"],
  bookings: ["superadmin", "finance", "event_manager", "viewer", "admin"],
  custom: ["superadmin", "finance", "event_manager", "admin"],
  export: ["superadmin", "finance", "admin"],
  schedule: ["superadmin", "finance", "admin"],
};

export const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "thisMonth", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "thisYear", label: "This year" },
  { value: "custom", label: "Custom range" },
];

export const REPORT_TABS = [
  { id: "overview", label: "Overview" },
  { id: "revenue", label: "Revenue" },
  { id: "events", label: "Events" },
  { id: "tickets", label: "Ticketing" },
  { id: "memberships", label: "Memberships" },
  { id: "sponsorships", label: "Sponsorships" },
  { id: "donations", label: "Donations" },
  { id: "discounts", label: "Discounts" },
  { id: "users", label: "User Growth" },
  { id: "checkins", label: "Check-ins" },
  { id: "bookings", label: "Booking Engine" },
  { id: "finance", label: "Finance & Audit" },
];

export const DATA_SOURCES = [
  { value: "events", label: "Events" },
  { value: "tickets", label: "Tickets" },
  { value: "tickettailor_tickets", label: "TicketTailor Tickets" },
  { value: "memberships", label: "Memberships" },
  { value: "users", label: "Users" },
  { value: "sponsorships", label: "Sponsorships" },
  { value: "donations", label: "Donations" },
  { value: "discounts", label: "Discounts" },
  { value: "finance_transactions", label: "Finance Transactions" },
  { value: "invoices", label: "Invoices" },
  { value: "checkins", label: "Check-ins" },
  { value: "audit_logs", label: "Audit Logs" },
];

export const CHART_TYPES = [
  { value: "table", label: "Table" },
  { value: "bar", label: "Bar chart" },
  { value: "line", label: "Line chart" },
  { value: "pie", label: "Pie chart" },
];

export const GROUP_BY_OPTIONS = [
  { value: "", label: "None" },
  { value: "date", label: "Date" },
  { value: "month", label: "Month" },
];

export function canViewReportSection(role, section) {
  const allowed = REPORT_SECTION_ACCESS[section] || REPORT_SECTION_ACCESS.overview;
  return allowed.includes(role || "admin");
}

export function canExportReports(role) {
  return canViewReportSection(role, "export");
}

export function buildDateParams(preset, dateFrom, dateTo) {
  const params = new URLSearchParams();
  params.set("preset", preset || "last30");
  if (preset === "custom" && dateFrom) params.set("dateFrom", dateFrom);
  if (preset === "custom" && dateTo) params.set("dateTo", dateTo);
  return params;
}

export async function exportReport(format, body) {
  const { apiUrl, adminAuthHeaders } = await import("./api.js");
  const response = await fetch(apiUrl(`/api/admin/reports/export/${format}`), {
    method: "POST",
    headers: { ...adminAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Export failed.");
  }
  const blob = await response.blob();
  const ext = format === "excel" ? "xlsx" : format;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${body.reportType || "report"}-export.${ext}`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function trendClass(trend) {
  if (trend === "up") return "admin-reports__trend--up";
  if (trend === "down") return "admin-reports__trend--down";
  return "admin-reports__trend--flat";
}

export function formatChange(change) {
  if (change == null) return "—";
  const sign = change > 0 ? "+" : "";
  return `${sign}${change}%`;
}
