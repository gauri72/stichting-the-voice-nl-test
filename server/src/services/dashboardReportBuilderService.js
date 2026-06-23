import DashboardCustomReport from "../models/DashboardCustomReport.js";
import { getNextSequence } from "../utils/sequence.js";
import Donation from "../models/Donation.js";
import Sponsorship from "../models/Sponsorship.js";
import TicketOrder from "../models/TicketOrder.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import FinanceTransaction from "../models/FinanceTransaction.js";

function throwError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

async function nextReportId() {
  const seq = await getNextSequence("dashboard_report");
  return `DR-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

function parseDateRange(filters = {}) {
  const now = new Date();
  const days = Number(filters.days) || 30;
  const from = filters.dateFrom ? new Date(filters.dateFrom) : new Date(now.getTime() - days * 86400000);
  const to = filters.dateTo ? new Date(filters.dateTo) : now;
  return { from, to };
}

function formatEur(amount) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(amount) || 0);
}

async function queryReportData(report) {
  const { from, to } = parseDateRange(report.filters || {});
  const dateQuery = { createdAt: { $gte: from, $lte: to } };

  switch (report.dataSource) {
    case "donations": {
      const rows = await Donation.aggregate([
        { $match: { ...dateQuery, paymentStatus: "paid" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            value: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      return {
        rows: rows.map((r) => ({ name: r._id, date: r._id, value: r.value, count: r.count })),
        summary: { total: rows.reduce((s, r) => s + r.value, 0), records: rows.reduce((s, r) => s + r.count, 0) },
      };
    }
    case "sponsorships": {
      const rows = await Sponsorship.aggregate([
        { $match: { ...dateQuery, paymentStatus: "paid" } },
        { $group: { _id: "$tierName", value: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { value: -1 } },
      ]);
      return {
        rows: rows.map((r) => ({ name: r._id || "Unknown", value: r.value, count: r.count })),
        summary: { total: rows.reduce((s, r) => s + r.value, 0) },
      };
    }
    case "tickets": {
      const rows = await TicketOrder.aggregate([
        { $match: { ...dateQuery, status: "paid" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            value: { $sum: "$totalAmountMinor" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      return {
        rows: rows.map((r) => ({ name: r._id, date: r._id, value: r.value / 100, count: r.count })),
        summary: { total: rows.reduce((s, r) => s + r.value, 0) / 100 },
      };
    }
    case "members": {
      const count = await Membership.countDocuments(dateQuery);
      const active = await Membership.countDocuments({ ...dateQuery, active: true });
      return {
        rows: [{ name: "New memberships", value: count }, { name: "Active", value: active }],
        summary: { total: count, active },
      };
    }
    case "users": {
      const count = await User.countDocuments(dateQuery);
      const verified = await User.countDocuments({ ...dateQuery, isVerified: true });
      return {
        rows: [{ name: "Registered", value: count }, { name: "Verified", value: verified }],
        summary: { total: count, verified },
      };
    }
    case "events": {
      const events = await Event.find(dateQuery).select("title startDate status").limit(50).lean();
      return {
        rows: events.map((e) => ({ name: e.title, date: e.startDate, value: 1, status: e.status })),
        summary: { total: events.length },
      };
    }
    case "finance": {
      const rows = await FinanceTransaction.aggregate([
        { $match: dateQuery },
        { $group: { _id: "$type", value: { $sum: "$amountMinor" }, count: { $sum: 1 } } },
      ]);
      return {
        rows: rows.map((r) => ({ name: r._id, value: r.value / 100, count: r.count })),
        summary: { total: rows.reduce((s, r) => s + r.value, 0) / 100 },
      };
    }
    default:
      return { rows: [], summary: {} };
  }
}

export async function listCustomReports() {
  return DashboardCustomReport.find().sort({ updatedAt: -1 }).lean();
}

export async function createCustomReport(payload, adminId) {
  const reportId = await nextReportId();
  const report = await DashboardCustomReport.create({
    reportId,
    name: payload.name,
    description: payload.description || "",
    dataSource: payload.dataSource,
    metric: payload.metric || "revenue",
    filters: payload.filters || {},
    outputFormat: payload.outputFormat || "table",
    chartConfig: payload.chartConfig || {},
    createdBy: adminId,
    updatedBy: adminId,
  });
  return report.toObject();
}

export async function updateCustomReport(reportId, payload, adminId) {
  const report = await DashboardCustomReport.findOne({ reportId });
  if (!report) throwError("Report not found.", 404);
  Object.assign(report, payload, { updatedBy: adminId });
  await report.save();
  return report.toObject();
}

export async function deleteCustomReport(reportId) {
  const result = await DashboardCustomReport.deleteOne({ reportId });
  if (!result.deletedCount) throwError("Report not found.", 404);
  return { success: true };
}

export async function runCustomReport(reportOrId, filters = {}) {
  const report =
    typeof reportOrId === "string"
      ? await DashboardCustomReport.findOne({ reportId: reportOrId }).lean()
      : reportOrId;
  if (!report) throwError("Report not found.", 404);

  const merged = { ...report, filters: { ...report.filters, ...filters } };
  const data = await queryReportData(merged);

  return {
    reportId: report.reportId,
    name: report.name,
    outputFormat: report.outputFormat,
    rows: data.rows,
    chartData: data.rows,
    summary: data.summary,
    generatedAt: new Date().toISOString(),
  };
}

export async function exportCustomReport(reportId, format, filters = {}) {
  const result = await runCustomReport(reportId, filters);
  if (format === "csv") {
    const headers = Object.keys(result.rows[0] || { name: "", value: "" });
    const lines = [headers.join(",")];
    for (const row of result.rows) {
      lines.push(headers.map((h) => JSON.stringify(row[h] ?? "")).join(","));
    }
    return { contentType: "text/csv", body: lines.join("\n"), filename: `${reportId}.csv` };
  }
  return { contentType: "application/json", body: JSON.stringify(result, null, 2), filename: `${reportId}.json` };
}
