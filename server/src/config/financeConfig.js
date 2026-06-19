export const INVOICE_CLIENT_TYPES = ["individual", "company", "sponsor", "vendor", "donor"];
export const INVOICE_RELATED_TYPES = [
  "sponsorship",
  "donation",
  "event_vendor",
  "membership",
  "ticketing",
  "custom",
];
export const INVOICE_PAYMENT_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "paid",
  "partially_paid",
  "overdue",
  "cancelled",
  "refunded",
];
export const INVOICE_SENT_STATUSES = ["not_sent", "sent", "resent", "viewed"];

export const BUDGET_STATUSES = ["draft", "approved", "in_progress", "finalized", "archived"];

export const INCOME_CATEGORIES = [
  "ticket_sales",
  "membership_revenue",
  "sponsorship_revenue",
  "donation_revenue",
  "food_stall_revenue",
  "vendor_fees",
  "merchandise_sales",
  "grants",
  "other_income",
];

export const EXPENSE_CATEGORIES = [
  "venue_rental",
  "artist_fees",
  "dj_music",
  "sound_lighting",
  "decoration",
  "catering_food",
  "marketing",
  "photography_videography",
  "printing",
  "volunteers_staff",
  "travel",
  "equipment",
  "insurance",
  "payment_processing_fees",
  "miscellaneous",
];

export const EXPENSE_PAYMENT_STATUSES = [
  "planned",
  "pending",
  "paid",
  "partially_paid",
  "overdue",
  "cancelled",
];

export const TRANSACTION_TYPES = ["income", "expense", "refund", "transfer", "adjustment"];
export const TRANSACTION_MODULES = [
  "tickets",
  "tickettailor",
  "memberships",
  "sponsorships",
  "donations",
  "invoices",
  "manual",
];

export const AUDIT_REPORT_TYPES = [
  "event_audit",
  "monthly_finance",
  "annual_finance",
  "sponsorship_audit",
  "donation_audit",
  "membership_audit",
  "ticketing_audit",
  "full_platform_audit",
];

export const AUDIT_REPORT_MODULES = [
  "ticket_sales",
  "tickettailor_data",
  "membership_revenue",
  "sponsorship_revenue",
  "donation_revenue",
  "expenses",
  "invoices",
  "receipts",
  "refunds",
  "admin_changes",
  "qr_checkins",
];

export const FINANCE_AUDIT_ACTIONS = [
  "invoice_created",
  "invoice_updated",
  "invoice_sent",
  "invoice_resent",
  "invoice_downloaded",
  "invoice_marked_paid",
  "budget_created",
  "budget_updated",
  "budget_approved",
  "budget_finalized",
  "expense_added",
  "expense_updated",
  "expense_deleted",
  "receipt_attached",
  "audit_report_generated",
  "audit_report_downloaded",
  "transaction_created",
  "transaction_updated",
  "transaction_deleted",
];

export const FINANCE_ROLES = {
  superadmin: {
    label: "Super Admin",
    permissions: ["*"],
  },
  finance: {
    label: "Finance Admin",
    permissions: [
      "invoices.read",
      "invoices.write",
      "invoices.delete",
      "invoices.send",
      "budgets.read",
      "budgets.write",
      "budgets.delete",
      "budgets.approve",
      "transactions.read",
      "transactions.write",
      "transactions.delete",
      "reports.read",
      "reports.generate",
      "audit.read",
      "settings.read",
      "settings.write",
    ],
  },
  event_manager: {
    label: "Event Manager",
    permissions: [
      "budgets.read",
      "budgets.write_expense",
      "transactions.read",
      "reports.read",
    ],
  },
  viewer: {
    label: "Viewer",
    permissions: [
      "invoices.read",
      "budgets.read",
      "transactions.read",
      "reports.read",
      "audit.read",
    ],
  },
  admin: {
    label: "Admin",
    permissions: [
      "invoices.read",
      "budgets.read",
      "transactions.read",
      "reports.read",
      "audit.read",
    ],
  },
};

export function hasFinancePermission(role, permission) {
  const config = FINANCE_ROLES[role] || FINANCE_ROLES.admin;
  if (config.permissions.includes("*")) return true;
  if (config.permissions.includes(permission)) return true;
  const [resource] = permission.split(".");
  return config.permissions.includes(`${resource}.*`);
}

export function canDeleteFinanceRecords(role) {
  return hasFinancePermission(role, "invoices.delete") || hasFinancePermission(role, "*");
}
