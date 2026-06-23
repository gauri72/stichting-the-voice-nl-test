import crypto from "crypto";
import AdminDashboardConfig from "../models/AdminDashboardConfig.js";
import { widgetVisibleForRole } from "../config/dashboardConfig.js";
import { logAdminAction } from "./adminAuditService.js";

function throwError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

export function generateWidgetId() {
  return `wdg-${crypto.randomUUID()}`;
}

function defaultWidgets() {
  let order = 0;
  const next = () => order++;

  return [
    {
      widgetId: generateWidgetId(),
      widgetType: "welcome_banner",
      title: "Welcome",
      dataSource: "overview",
      layout: { colSpan: 12, rowSpan: 1, order: next() },
      isVisible: true,
      isCustom: false,
      settings: { backgroundStyle: "gradient" },
    },
    ...[
      { key: "totalUsers", label: "Registered Users", icon: "IconUsers", colSpan: 2 },
      { key: "verifiedUsers", label: "Verified Users", icon: "IconUserCheck", colSpan: 2 },
      { key: "totalMembers", label: "Members", icon: "IconTicket", colSpan: 2 },
      { key: "activeMemberships", label: "Active Memberships", icon: "IconUsers", colSpan: 2 },
      { key: "totalPayments", label: "Paid Transactions", icon: "IconCreditCard", colSpan: 2 },
      { key: "totalRevenue", label: "Total Revenue (paid)", icon: "IconCreditCard", colSpan: 4 },
    ].map((s) => ({
      widgetId: generateWidgetId(),
      widgetType: "stat_card",
      title: s.label,
      dataSource: "overview",
      dataKey: s.key,
      icon: s.icon,
      layout: { colSpan: s.colSpan, rowSpan: 1, order: next() },
      isVisible: true,
      isCustom: false,
    })),
    {
      widgetId: generateWidgetId(),
      widgetType: "section_header",
      title: "Platform Tickets",
      layout: { colSpan: 12, rowSpan: 1, order: next() },
      isVisible: true,
      isCustom: false,
    },
    {
      widgetId: generateWidgetId(),
      widgetType: "stat_group",
      title: "Platform Tickets",
      dataSource: "ticket_stats",
      layout: { colSpan: 12, rowSpan: 1, order: next() },
      content: {
        stats: [
          { key: "totalTicketsSold", label: "Tickets Sold", icon: "IconTicket" },
          { key: "totalRevenue", label: "Ticket Revenue" },
          { key: "ticketsCheckedIn", label: "Checked In" },
          { key: "remainingCapacity", label: "Remaining Capacity" },
          { key: "refundedTickets", label: "Refunded" },
        ],
      },
      isVisible: true,
      isCustom: false,
    },
    {
      widgetId: generateWidgetId(),
      widgetType: "stat_group",
      title: "TicketTailor",
      dataSource: "ticket_tailor",
      layout: { colSpan: 12, rowSpan: 1, order: next() },
      settings: { variant: "ticket_tailor" },
      content: {
        stats: [
          { key: "memberships", label: "Memberships", icon: "IconUsers" },
          { key: "customers", label: "Customers", icon: "IconUsers" },
          { key: "historicalOrders", label: "Historical Orders", icon: "IconCloudDownload" },
          { key: "syncedBookings", label: "Synced Bookings", icon: "IconTicket" },
          { key: "revenue", label: "TT Revenue", icon: "IconCreditCard" },
          { key: "checkedIn", label: "Checked In", icon: "IconTicket" },
          { key: "memberLinkedBookings", label: "Member-linked", icon: "IconUserCheck" },
        ],
      },
      ctas: [{ id: "tt-link", text: "View memberships & sync TicketTailor", url: "/admin/memberships", visible: true }],
      isVisible: true,
      isCustom: false,
    },
    {
      widgetId: generateWidgetId(),
      widgetType: "quick_actions",
      title: "Quick Actions",
      layout: { colSpan: 12, rowSpan: 1, order: next() },
      content: {
        actions: [
          { label: "Send Sponsorship Reminder", url: "/admin/sponsorships" },
          { label: "Resend Donation Receipt", url: "/admin/donations" },
          { label: "Export Donations", url: "/admin/donations", icon: "IconDownload" },
          { label: "Add Sponsor", url: "/admin/sponsorships", icon: "IconPlus" },
          { label: "Add Donation", url: "/admin/donations", icon: "IconPlus" },
          { label: "Create Invoice", url: "/admin/finance/invoices", icon: "IconFileInvoice" },
          { label: "Create Budget Sheet", url: "/admin/finance/event-budgets", icon: "IconReportMoney" },
          { label: "Add Transaction", url: "/admin/finance/transactions", icon: "IconPlus" },
          { label: "Generate Audit Report", url: "/admin/finance/audit-reports", icon: "IconReceipt" },
        ],
      },
      isVisible: true,
      isCustom: false,
    },
    {
      widgetId: generateWidgetId(),
      widgetType: "stat_group",
      title: "Finance & Audit",
      dataSource: "finance",
      layout: { colSpan: 12, rowSpan: 1, order: next() },
      content: {
        stats: [
          { key: "totalIncome", label: "Total Income", icon: "IconCreditCard" },
          { key: "totalExpenses", label: "Total Expenses", icon: "IconReceipt" },
          { key: "netResult", label: "Net Result", icon: "IconReportMoney" },
          { key: "pendingInvoices", label: "Pending Invoices", icon: "IconMail" },
          { key: "overdueInvoices", label: "Overdue Invoices", icon: "IconMail" },
          { key: "eventBudgetVariance", label: "Budget Variance", icon: "IconChartBar" },
          { key: "auditReportsGenerated", label: "Audit Reports", icon: "IconReceipt" },
          { key: "receiptsMissing", label: "Receipts Missing", icon: "IconDownload" },
        ],
      },
      ctas: [{ id: "finance-link", text: "View financial reports", url: "/admin/finance/reports", visible: true }],
      isVisible: true,
      isCustom: false,
      allowedRoles: ["superadmin", "admin", "finance"],
    },
    {
      widgetId: generateWidgetId(),
      widgetType: "stat_group",
      title: "Sponsorships",
      dataSource: "sponsorships",
      layout: { colSpan: 12, rowSpan: 1, order: next() },
      content: {
        stats: [
          { key: "sponsorshipRevenue", label: "Sponsorship Revenue", icon: "IconCreditCard" },
          { key: "pendingPayments", label: "Pending Payments", icon: "IconMail" },
          { key: "activeSponsorships", label: "Active Sponsors", icon: "IconUsers" },
          { key: "followUpsDue", label: "Follow-ups Due", icon: "IconReceipt" },
        ],
      },
      ctas: [{ id: "sponsor-link", text: "Manage sponsorships", url: "/admin/sponsorships", visible: true }],
      isVisible: true,
      isCustom: false,
    },
    {
      widgetId: generateWidgetId(),
      widgetType: "stat_group",
      title: "Donations",
      dataSource: "donations",
      layout: { colSpan: 12, rowSpan: 1, order: next() },
      content: {
        stats: [
          { key: "donationRevenue", label: "Donation Revenue", icon: "IconCreditCard" },
          { key: "totalDonors", label: "Total Donors", icon: "IconUsers" },
          { key: "recurringDonations", label: "Recurring Donors", icon: "IconHeart" },
          { key: "pendingReceipts", label: "Pending Receipts", icon: "IconReceipt" },
        ],
      },
      ctas: [{ id: "donate-link", text: "Manage donations", url: "/admin/donations", visible: true }],
      isVisible: true,
      isCustom: false,
    },
    {
      widgetId: generateWidgetId(),
      widgetType: "activity_feed",
      title: "Recent Activity",
      dataSource: "recent_activity",
      layout: { colSpan: 12, rowSpan: 2, order: next() },
      ctas: [{ id: "email-link", text: "Email broadcasts", url: "/admin/communication", visible: true }],
      isVisible: true,
      isCustom: false,
    },
    {
      widgetId: generateWidgetId(),
      widgetType: "ai_insight",
      title: "AI Insights",
      dataSource: "ai_insights",
      layout: { colSpan: 12, rowSpan: 1, order: next() },
      isVisible: true,
      isCustom: false,
    },
  ];
}

const DEFAULT_SETTINGS = {
  title: "Dashboard",
  welcomeMessage: "Welcome back {{name}} 👋",
  subtitle: "Overview of users, memberships, and activity.",
  announcement: { visible: false, text: "", style: "info" },
  heroCard: { title: "", description: "", ctaText: "", ctaUrl: "" },
  banners: [],
};

async function ensureConfigDoc() {
  let doc = await AdminDashboardConfig.findOne();
  if (!doc) {
    const widgets = defaultWidgets();
    doc = await AdminDashboardConfig.create({
      configId: "ADC-001",
      draft: { settings: DEFAULT_SETTINGS, widgets, roleOverrides: {} },
      published: { settings: DEFAULT_SETTINGS, widgets: JSON.parse(JSON.stringify(widgets)), roleOverrides: {} },
      publishedAt: new Date(),
    });
  }
  return doc;
}

function sortWidgets(widgets = []) {
  return [...widgets].sort((a, b) => (a.layout?.order ?? 0) - (b.layout?.order ?? 0));
}

function getRoleSettings(layout, role) {
  const override = layout?.roleOverrides?.[role];
  if (override?.settings) {
    return { ...layout.settings, ...override.settings };
  }
  return layout?.settings || DEFAULT_SETTINGS;
}

function filterWidgetsForRole(widgets, role) {
  return sortWidgets(widgets).filter((w) => w.isVisible !== false && widgetVisibleForRole(w, role));
}

export async function getDashboardBuilderState(version = "draft") {
  const doc = await ensureConfigDoc();
  const layout = version === "published" ? doc.published : doc.draft;
  return {
    configId: doc.configId,
    settings: layout.settings || DEFAULT_SETTINGS,
    widgets: sortWidgets(layout.widgets || []),
    roleOverrides: layout.roleOverrides || {},
    updatedAt: doc.updatedAt,
    publishedAt: doc.publishedAt,
    version,
  };
}

export async function getPublishedDashboardForRole(role) {
  const doc = await ensureConfigDoc();
  const layout = doc.published || doc.draft;
  return {
    settings: getRoleSettings(layout, role),
    widgets: filterWidgetsForRole(layout.widgets || [], role),
  };
}

export async function updateDashboardSettings(payload, adminId) {
  const doc = await ensureConfigDoc();
  doc.draft.settings = { ...doc.draft.settings?.toObject?.() || doc.draft.settings || {}, ...payload.settings };
  if (payload.roleOverrides) doc.draft.roleOverrides = payload.roleOverrides;
  doc.updatedBy = adminId;
  await doc.save();
  await logAdminAction({
    adminId,
    action: "dashboard_settings_updated",
    targetType: "admin_dashboard",
    targetId: doc.configId,
    summary: "Dashboard settings updated",
  });
  return getDashboardBuilderState("draft");
}

export async function listWidgets(version = "draft") {
  const state = await getDashboardBuilderState(version);
  return state.widgets;
}

export async function createWidget(payload, adminId) {
  const doc = await ensureConfigDoc();
  const maxOrder = Math.max(-1, ...(doc.draft.widgets || []).map((w) => w.layout?.order ?? 0));
  const widget = {
    widgetId: generateWidgetId(),
    widgetType: payload.widgetType || "stat_card",
    title: payload.title || "New Widget",
    subtitle: payload.subtitle || "",
    description: payload.description || "",
    icon: payload.icon || "",
    dataSource: payload.dataSource || "overview",
    dataKey: payload.dataKey || "",
    displayType: payload.displayType || "card",
    settings: payload.settings || {},
    ctas: payload.ctas || [],
    permissions: payload.permissions || {},
    allowedRoles: payload.allowedRoles || [],
    layout: { colSpan: 3, rowSpan: 1, order: maxOrder + 1, ...(payload.layout || {}) },
    content: payload.content || {},
    isVisible: true,
    isCustom: true,
  };
  doc.draft.widgets.push(widget);
  doc.updatedBy = adminId;
  await doc.save();
  return getDashboardBuilderState("draft");
}

export async function updateWidget(widgetId, payload, adminId) {
  const doc = await ensureConfigDoc();
  const idx = (doc.draft.widgets || []).findIndex((w) => w.widgetId === widgetId);
  if (idx === -1) throwError("Widget not found.", 404);
  const existing = doc.draft.widgets[idx];
  doc.draft.widgets[idx] = {
    ...existing.toObject?.() || existing,
    ...payload,
    widgetId,
  };
  doc.updatedBy = adminId;
  await doc.save();
  return getDashboardBuilderState("draft");
}

export async function deleteWidget(widgetId, adminId) {
  const doc = await ensureConfigDoc();
  const widget = (doc.draft.widgets || []).find((w) => w.widgetId === widgetId);
  if (!widget) throwError("Widget not found.", 404);
  if (!widget.isCustom) throwError("Only custom widgets can be deleted.");
  doc.draft.widgets = (doc.draft.widgets || []).filter((w) => w.widgetId !== widgetId);
  doc.updatedBy = adminId;
  await doc.save();
  return getDashboardBuilderState("draft");
}

export async function duplicateWidget(widgetId, adminId) {
  const doc = await ensureConfigDoc();
  const source = (doc.draft.widgets || []).find((w) => w.widgetId === widgetId);
  if (!source) throwError("Widget not found.", 404);
  const maxOrder = Math.max(-1, ...(doc.draft.widgets || []).map((w) => w.layout?.order ?? 0));
  const copy = {
    ...JSON.parse(JSON.stringify(source.toObject?.() || source)),
    widgetId: generateWidgetId(),
    title: `${source.title} (Copy)`,
    isCustom: true,
    layout: { ...source.layout, order: maxOrder + 1 },
  };
  doc.draft.widgets.push(copy);
  doc.updatedBy = adminId;
  await doc.save();
  return getDashboardBuilderState("draft");
}

export async function reorderWidgets(widgetOrder, adminId) {
  const doc = await ensureConfigDoc();
  const orderMap = new Map(widgetOrder.map((id, i) => [id, i]));
  doc.draft.widgets = sortWidgets(
    (doc.draft.widgets || []).map((w) => ({
      ...w.toObject?.() || w,
      layout: { ...w.layout, order: orderMap.has(w.widgetId) ? orderMap.get(w.widgetId) : w.layout?.order },
    }))
  );
  doc.updatedBy = adminId;
  await doc.save();
  return getDashboardBuilderState("draft");
}

export async function publishDashboard(adminId) {
  const doc = await ensureConfigDoc();
  doc.published = JSON.parse(JSON.stringify(doc.draft));
  doc.publishedAt = new Date();
  doc.updatedBy = adminId;
  await doc.save();
  await logAdminAction({
    adminId,
    action: "dashboard_published",
    targetType: "admin_dashboard",
    targetId: doc.configId,
    summary: "Dashboard layout published",
  });
  return getDashboardBuilderState("published");
}

export async function resetDashboardDefaults(adminId) {
  const doc = await ensureConfigDoc();
  const widgets = defaultWidgets();
  doc.draft = {
    settings: DEFAULT_SETTINGS,
    widgets,
    roleOverrides: {},
  };
  doc.updatedBy = adminId;
  await doc.save();
  return getDashboardBuilderState("draft");
}
