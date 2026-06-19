import AuditReport from "../models/AuditReport.js";
import Donation from "../models/Donation.js";
import Sponsorship from "../models/Sponsorship.js";
import Invoice from "../models/Invoice.js";
import EventBudget from "../models/EventBudget.js";
import FinanceTransaction from "../models/FinanceTransaction.js";
import TicketOrder from "../models/TicketOrder.js";
import Member from "../models/Member.js";
import TicketTailorBooking from "../models/TicketTailorBooking.js";
import Event from "../models/Event.js";
import { formatMoney, formatDate, nextFinanceId, throwFinanceError } from "../utils/financeUtils.js";
import { logFinanceAction, listFinanceAuditLogs } from "./financeAuditService.js";
import { renderAuditReportPdf } from "./financePdfService.js";
import { buildAuditReportExcel } from "./financeExcelService.js";
import { getBudgetDashboardStats } from "./adminEventBudgetService.js";
import { getInvoiceDashboardStats } from "./adminInvoiceService.js";
import { getTransactionDashboardStats } from "./adminFinanceTransactionService.js";

function formatReport(doc) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    reportId: doc.reportId,
    reportType: doc.reportType,
    title: doc.title,
    dateRangeStart: doc.dateRangeStart,
    dateRangeEnd: doc.dateRangeEnd,
    eventId: doc.eventId?.toString() || null,
    eventName: doc.eventName,
    modulesIncluded: doc.modulesIncluded || [],
    options: doc.options || {},
    generatedBy: doc.generatedBy?.toString() || null,
    generatedByName: doc.generatedByName,
    generatedAt: doc.generatedAt,
    pdfUrl: doc.pdfUrl,
    excelUrl: doc.excelUrl,
    summary: doc.summary,
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

function dateFilter(start, end, field = "createdAt") {
  const filter = {};
  if (start || end) {
    filter[field] = {};
    if (start) filter[field].$gte = new Date(start);
    if (end) {
      const e = new Date(end);
      e.setHours(23, 59, 59, 999);
      filter[field].$lte = e;
    }
  }
  return filter;
}

async function buildReportSummary(params) {
  const dateF = dateFilter(params.dateRangeStart, params.dateRangeEnd);
  const modules = params.modulesIncluded || [];

  const include = (m) => !modules.length || modules.includes(m);

  const [
    donationAgg,
    sponsorshipAgg,
    ticketAgg,
    ttAgg,
    memberCount,
    invoiceStats,
    transactionStats,
    budgetStats,
    budgets,
    auditLogs,
  ] = await Promise.all([
    include("donation_revenue")
      ? Donation.aggregate([
          { $match: { ...dateF, paymentStatus: "paid" } },
          { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ])
      : [],
    include("sponsorship_revenue")
      ? Sponsorship.aggregate([
          { $match: { ...dateF, paymentStatus: "paid" } },
          { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ])
      : [],
    include("ticket_sales")
      ? TicketOrder.aggregate([
          { $match: { ...dateF, status: "paid" } },
          { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
        ])
      : [],
    include("tickettailor_data")
      ? TicketTailorBooking.aggregate([
          { $match: dateF },
          { $group: { _id: null, count: { $sum: 1 }, checkedIn: { $sum: { $cond: ["$checkedIn", 1, 0] } } } },
        ])
      : [],
    include("membership_revenue") ? Member.countDocuments({}) : 0,
    include("invoices") ? getInvoiceDashboardStats() : null,
    include("expenses") ? getTransactionDashboardStats() : null,
    getBudgetDashboardStats(),
    EventBudget.find(params.eventId ? { eventId: params.eventId } : {}).limit(50).lean(),
    params.options?.includeAuditLogs !== false
      ? listFinanceAuditLogs({
          dateFrom: params.dateRangeStart,
          dateTo: params.dateRangeEnd,
          limit: 100,
        })
      : [],
  ]);

  const donationTotal = donationAgg[0]?.total || 0;
  const sponsorshipTotal = sponsorshipAgg[0]?.total || 0;
  const ticketTotal = ticketAgg[0]?.total || 0;
  const totalIncome = donationTotal + sponsorshipTotal + ticketTotal + (transactionStats?.totalIncomeMinor || 0);
  const totalExpenses = transactionStats?.totalExpensesMinor || budgetStats.actualExpensesMinor || 0;

  const eventPerformance = budgets.map((b) => ({
    name: b.eventName,
    plannedNet: formatMoney((b.plannedIncomeTotal || 0) - (b.plannedExpenseTotal || 0)),
    actualNet: formatMoney((b.actualIncomeTotal || 0) - (b.actualExpenseTotal || 0)),
    netResult: formatMoney((b.actualIncomeTotal || 0) - (b.actualExpenseTotal || 0)),
    attendance: b.actualAttendance || b.expectedAttendance || 0,
  }));

  return {
    executive: {
      totalIncome: formatMoney(totalIncome),
      totalExpenses: formatMoney(totalExpenses),
      netResult: formatMoney(totalIncome - totalExpenses),
      totalMembers: memberCount,
      totalSponsors: sponsorshipAgg[0]?.count || 0,
      totalDonors: donationAgg[0]?.count || 0,
      totalAttendees: ttAgg[0]?.checkedIn || 0,
      keyObservations: `Report covers ${params.reportType} for period ${formatDate(params.dateRangeStart)} – ${formatDate(params.dateRangeEnd)}.`,
    },
    income: {
      ticketing: formatMoney(ticketTotal),
      ticketTailor: `${ttAgg[0]?.count || 0} bookings`,
      membership: `${memberCount} members`,
      sponsorship: formatMoney(sponsorshipTotal),
      donation: formatMoney(donationTotal),
      other: formatMoney(Math.max(0, totalIncome - donationTotal - sponsorshipTotal - ticketTotal)),
    },
    expenses: {
      total: formatMoney(totalExpenses),
      byBudget: formatMoney(budgetStats.actualExpensesMinor),
    },
    events: eventPerformance,
    receiptsInvoices: {
      invoicesIssued: invoiceStats?.totalInvoices || 0,
      paidInvoices: invoiceStats?.paidInvoices || 0,
      overdueInvoices: invoiceStats?.overdueInvoices || 0,
      outstanding: invoiceStats?.outstandingAmount || "€0,00",
    },
    auditTrail: auditLogs.slice(0, 50).map((l) => `${l.changedAt}: ${l.action} on ${l.entityType} ${l.entityId}`),
    attachmentsRegister: [],
  };
}

const REPORT_TITLES = {
  event_audit: "Event Audit Report",
  monthly_finance: "Monthly Finance Report",
  annual_finance: "Annual Finance Report",
  sponsorship_audit: "Sponsorship Audit Report",
  donation_audit: "Donation Audit Report",
  membership_audit: "Membership Audit Report",
  ticketing_audit: "Ticketing Audit Report",
  full_platform_audit: "Full Platform Audit Report",
};

export async function listAuditReports(params = {}) {
  const filter = {};
  if (params.reportType) filter.reportType = params.reportType;
  const docs = await AuditReport.find(filter).sort({ generatedAt: -1 }).limit(100).lean();
  return docs.map(formatReport);
}

export async function getAuditReportById(id) {
  const doc = await AuditReport.findById(id).lean();
  if (!doc) throwFinanceError("Audit report not found.", 404);
  return formatReport(doc);
}

export async function generateAuditReport(data, admin, req) {
  const reportId = await nextFinanceId("AUD");
  const summary = await buildReportSummary(data);
  let eventName = data.eventName || "";
  if (data.eventId) {
    const event = await Event.findById(data.eventId).select("title name").lean();
    eventName = event?.title || event?.name || eventName;
  }

  const title = data.title || REPORT_TITLES[data.reportType] || "Audit Report";
  const adminName = admin ? `${admin.firstName || ""} ${admin.lastName || ""}`.trim() : "";

  const doc = await AuditReport.create({
    reportId,
    reportType: data.reportType,
    title,
    dateRangeStart: data.dateRangeStart ? new Date(data.dateRangeStart) : null,
    dateRangeEnd: data.dateRangeEnd ? new Date(data.dateRangeEnd) : null,
    eventId: data.eventId || null,
    eventName,
    modulesIncluded: data.modulesIncluded || [],
    options: {
      includeAttachments: !!data.includeAttachments,
      includeAuditLogs: data.includeAuditLogs !== false,
      includePaymentStatus: data.includePaymentStatus !== false,
      includeVarianceAnalysis: data.includeVarianceAnalysis !== false,
      includeSummaryCharts: !!data.includeSummaryCharts,
    },
    generatedBy: admin?.id || admin?._id,
    generatedByName: adminName,
    generatedAt: new Date(),
    summary,
    status: "generated",
  });

  await logFinanceAction({
    admin,
    action: "audit_report_generated",
    entityType: "audit_report",
    entityId: doc.reportId,
    newValue: { reportType: doc.reportType, title },
    req,
  });

  return formatReport(doc.toObject());
}

export async function downloadAuditReportPdf(id, admin, req) {
  const doc = await AuditReport.findById(id).lean();
  if (!doc) throwFinanceError("Audit report not found.", 404);

  const payload = {
    title: doc.title,
    reportPeriod: `${formatDate(doc.dateRangeStart)} – ${formatDate(doc.dateRangeEnd)}`,
    generatedBy: doc.generatedByName,
    generatedAt: formatDate(doc.generatedAt),
    executiveSummary: Object.entries(doc.summary?.executive || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"),
    incomeSummary: Object.entries(doc.summary?.income || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"),
    expenseSummary: Object.entries(doc.summary?.expenses || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"),
    eventPerformance: (doc.summary?.events || []).map((e) => `${e.name}: ${e.netResult}`).join("\n"),
    receiptsInvoices: JSON.stringify(doc.summary?.receiptsInvoices || {}, null, 2),
    auditTrail: (doc.summary?.auditTrail || []).join("\n"),
    attachmentsRegister: (doc.summary?.attachmentsRegister || []).join("\n") || "None",
  };

  const pdf = await renderAuditReportPdf(payload);
  await logFinanceAction({
    admin,
    action: "audit_report_downloaded",
    entityType: "audit_report",
    entityId: doc.reportId,
    req,
  });
  return { pdf, filename: `audit-report-${doc.reportId}.pdf` };
}

export async function downloadAuditReportExcel(id, admin, req) {
  const doc = await AuditReport.findById(id).lean();
  if (!doc) throwFinanceError("Audit report not found.", 404);
  const buffer = await buildAuditReportExcel(doc, doc.summary);
  await logFinanceAction({
    admin,
    action: "audit_report_downloaded",
    entityType: "audit_report",
    entityId: doc.reportId,
    notes: "Excel download",
    req,
  });
  return { buffer, filename: `audit-report-${doc.reportId}.xlsx` };
}

export async function getAuditReportDashboardStats() {
  const count = await AuditReport.countDocuments({});
  return { auditReportsGenerated: count };
}

export async function getFinancialReportsSummary(params = {}) {
  const [invoiceStats, transactionStats, budgetStats, reportCount] = await Promise.all([
    getInvoiceDashboardStats(),
    getTransactionDashboardStats(),
    getBudgetDashboardStats(),
    AuditReport.countDocuments({}),
  ]);
  return {
    totalIncome: transactionStats.totalIncome,
    totalExpenses: transactionStats.totalExpenses,
    netResult: transactionStats.netResult,
    invoiceStats,
    budgetStats,
    auditReportsGenerated: reportCount,
    period: params.dateFrom && params.dateTo ? `${params.dateFrom} – ${params.dateTo}` : "All time",
  };
}
