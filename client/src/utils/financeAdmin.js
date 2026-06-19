export const FINANCE_ROLES = {
  superadmin: { label: "Super Admin", permissions: ["*"] },
  finance: {
    label: "Finance Admin",
    permissions: [
      "invoices.read", "invoices.write", "invoices.delete", "invoices.send",
      "budgets.read", "budgets.write", "budgets.delete", "budgets.approve",
      "transactions.read", "transactions.write", "transactions.delete",
      "reports.read", "reports.generate", "audit.read", "settings.read", "settings.write",
    ],
  },
  event_manager: {
    label: "Event Manager",
    permissions: ["budgets.read", "budgets.write_expense", "transactions.read", "reports.read"],
  },
  viewer: {
    label: "Viewer",
    permissions: ["invoices.read", "budgets.read", "transactions.read", "reports.read", "audit.read"],
  },
  admin: {
    label: "Admin",
    permissions: ["invoices.read", "budgets.read", "transactions.read", "reports.read", "audit.read"],
  },
};

export function hasFinancePermission(role, permission) {
  const config = FINANCE_ROLES[role] || FINANCE_ROLES.admin;
  if (config.permissions.includes("*")) return true;
  if (config.permissions.includes(permission)) return true;
  const [resource] = permission.split(".");
  return config.permissions.includes(`${resource}.*`);
}

export function canDeleteFinance(role) {
  return hasFinancePermission(role, "invoices.delete");
}

export function formatMoney(minor) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(minor || 0) / 100);
}

export function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL");
}

export function badgeClass(status) {
  return `admin-finance__badge admin-finance__badge--${(status || "pending").replace(/\s/g, "_")}`;
}

export async function downloadBlob(url, filename) {
  const { apiUrl, adminAuthHeaders } = await import("./api.js");
  const response = await fetch(apiUrl(url), { headers: adminAuthHeaders() });
  if (!response.ok) throw new Error("Download failed.");
  const blob = await response.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const INCOME_CATEGORIES = [
  { value: "ticket_sales", label: "Ticket Sales" },
  { value: "membership_revenue", label: "Membership Revenue" },
  { value: "sponsorship_revenue", label: "Sponsorship Revenue" },
  { value: "donation_revenue", label: "Donation Revenue" },
  { value: "food_stall_revenue", label: "Food Stall Revenue" },
  { value: "vendor_fees", label: "Vendor Fees" },
  { value: "merchandise_sales", label: "Merchandise Sales" },
  { value: "grants", label: "Grants" },
  { value: "other_income", label: "Other Income" },
];

export const EXPENSE_CATEGORIES = [
  { value: "venue_rental", label: "Venue Rental" },
  { value: "artist_fees", label: "Artist Fees" },
  { value: "dj_music", label: "DJ / Music" },
  { value: "sound_lighting", label: "Sound & Lighting" },
  { value: "decoration", label: "Decoration" },
  { value: "catering_food", label: "Catering / Food" },
  { value: "marketing", label: "Marketing" },
  { value: "photography_videography", label: "Photography / Videography" },
  { value: "printing", label: "Printing" },
  { value: "volunteers_staff", label: "Volunteers / Staff" },
  { value: "travel", label: "Travel" },
  { value: "equipment", label: "Equipment" },
  { value: "insurance", label: "Insurance" },
  { value: "payment_processing_fees", label: "Payment Processing Fees" },
  { value: "miscellaneous", label: "Miscellaneous" },
];
