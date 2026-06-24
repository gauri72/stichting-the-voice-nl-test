export const REPORT_DATA_SOURCES = [
  "events",
  "tickets",
  "tickettailor_tickets",
  "memberships",
  "users",
  "sponsorships",
  "donations",
  "discounts",
  "vouchers",
  "finance_transactions",
  "invoices",
  "checkins",
  "audit_logs",
];

export const REPORT_CHART_TYPES = ["table", "bar", "line", "pie"];
export const REPORT_GROUP_BY = ["date", "month", "event", "membership_type", "ticket_type", "campaign", "payment_status", "source"];
export const SCHEDULE_FREQUENCIES = ["daily", "weekly", "monthly"];
export const EXPORT_FORMATS = ["pdf", "excel", "csv"];

/** Section access by admin role */
export const REPORT_SECTION_ACCESS = {
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

export function canAccessReportSection(role, section) {
  const allowed = REPORT_SECTION_ACCESS[section] || REPORT_SECTION_ACCESS.overview;
  return allowed.includes(role || "admin");
}

export function canExportReports(role) {
  return canAccessReportSection(role, "export");
}
