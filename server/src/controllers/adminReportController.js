import SavedReport from "../models/SavedReport.js";
import ScheduledReport from "../models/ScheduledReport.js";
import {
  getReportsOverview,
  getRevenueSummary,
  getEventPerformance,
  getTicketingAnalytics,
  getMembershipAnalytics,
  getSponsorshipAnalytics,
  getDonationAnalytics,
  getDiscountAnalytics,
  getUserGrowthAnalytics,
  getCheckInAnalytics,
  getFinanceAnalytics,
  generateCustomReport,
  nextReportPublicId,
  parseReportDateRange,
} from "../services/reportAnalyticsService.js";
import {
  exportReportPdf,
  exportReportExcel,
  exportReportCsv,
} from "../services/reportExportService.js";

import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[admin/reports]" });
}

function adminName(admin) {
  return admin?.name || admin?.email || "Admin";
}

function dateSubtitle(params) {
  const { from, to, preset } = parseReportDateRange(params);
  return `Period: ${from.toLocaleDateString("nl-NL")} – ${to.toLocaleDateString("nl-NL")} (${preset})`;
}

export async function reportOverview(req, res) {
  try {
    console.log("[REPORT_OVERVIEW_FETCH_STARTED]", req.query);
    const data = await getReportsOverview(req.query);
    console.log("[REPORT_OVERVIEW_FETCH_SUCCESS]", { cards: data.cards?.length });
    return res.json(data);
  } catch (error) {
    console.error("[REPORT_OVERVIEW_FETCH_ERROR]", error.message);
    return handleError(res, error);
  }
}

export async function reportRevenue(req, res) {
  try {
    const data = await getRevenueSummary(req.query);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reportEvents(req, res) {
  try {
    const data = await getEventPerformance(req.query);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reportTickets(req, res) {
  try {
    const data = await getTicketingAnalytics(req.query);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reportMemberships(req, res) {
  try {
    const data = await getMembershipAnalytics(req.query);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reportSponsorships(req, res) {
  try {
    const data = await getSponsorshipAnalytics(req.query);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reportDonations(req, res) {
  try {
    const data = await getDonationAnalytics(req.query);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reportDiscounts(req, res) {
  try {
    const data = await getDiscountAnalytics(req.query);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reportUsers(req, res) {
  try {
    const data = await getUserGrowthAnalytics(req.query);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reportCheckins(req, res) {
  try {
    const data = await getCheckInAnalytics(req.query);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reportFinance(req, res) {
  try {
    const data = await getFinanceAnalytics(req.query);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reportBookings(req, res) {
  try {
    const { getBookingEngineAnalytics } = await import("../services/booking/bookingReportingService.js");
    const data = await getBookingEngineAnalytics(req.query);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function customReportPreview(req, res) {
  try {
    console.log("[CUSTOM_REPORT_PREVIEW_STARTED]", req.body?.dataSource);
    const data = await generateCustomReport(req.body || {});
    console.log("[CUSTOM_REPORT_GENERATED]", { rows: data.total });
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listReportTemplates(req, res) {
  try {
    const templates = await SavedReport.find({})
      .sort({ updatedAt: -1 })
      .populate("createdBy", "name email")
      .lean();
    return res.json({
      templates: templates.map((t) => ({
        id: t._id.toString(),
        reportId: t.reportId,
        name: t.name,
        description: t.description,
        dataSource: t.dataSource,
        chartType: t.chartType,
        groupBy: t.groupBy,
        createdAt: t.createdAt,
        createdBy: t.createdBy?.name || t.createdBy?.email || null,
      })),
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function saveReportTemplate(req, res) {
  try {
    const body = req.body || {};
    const reportId = await nextReportPublicId("SRP");
    const doc = await SavedReport.create({
      reportId,
      name: body.name?.trim() || "Untitled Report",
      description: body.description || "",
      dataSource: body.dataSource,
      selectedFields: body.selectedFields || [],
      filters: body.filters || {},
      groupBy: body.groupBy || "",
      chartType: body.chartType || "table",
      createdBy: req.admin?.id || req.admin?._id,
    });
    return res.status(201).json({ template: { id: doc._id.toString(), reportId: doc.reportId } });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateReportTemplate(req, res) {
  try {
    const doc = await SavedReport.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: req.body.name,
          description: req.body.description,
          dataSource: req.body.dataSource,
          selectedFields: req.body.selectedFields,
          filters: req.body.filters,
          groupBy: req.body.groupBy,
          chartType: req.body.chartType,
        },
      },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Template not found." });
    return res.json({ template: { id: doc._id.toString() } });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteReportTemplate(req, res) {
  try {
    await SavedReport.findByIdAndDelete(req.params.id);
    await ScheduledReport.deleteMany({ reportId: req.params.id });
    return res.json({ ok: true });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listScheduledReports(req, res) {
  try {
    const items = await ScheduledReport.find({})
      .sort({ nextRunAt: 1 })
      .populate("reportId", "name dataSource")
      .lean();
    return res.json({
      schedules: items.map((s) => ({
        id: s._id.toString(),
        scheduledReportId: s.scheduledReportId,
        reportName: s.reportId?.name,
        frequency: s.frequency,
        format: s.format,
        recipients: s.recipients,
        nextRunAt: s.nextRunAt,
        lastRunAt: s.lastRunAt,
        status: s.status,
      })),
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function saveScheduledReport(req, res) {
  try {
    const body = req.body || {};
    const scheduledReportId = await nextReportPublicId("SCH");
    const nextRunAt = computeNextRun(body.frequency);
    const doc = await ScheduledReport.create({
      scheduledReportId,
      reportId: body.reportId,
      frequency: body.frequency,
      recipients: body.recipients || [],
      format: body.format || "pdf",
      nextRunAt,
      status: "active",
      createdBy: req.admin?.id || req.admin?._id,
    });
    return res.status(201).json({ schedule: { id: doc._id.toString(), nextRunAt } });
  } catch (error) {
    return handleError(res, error);
  }
}

function computeNextRun(frequency) {
  const now = new Date();
  if (frequency === "daily") return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (frequency === "weekly") return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (frequency === "monthly") {
    const d = new Date(now);
    d.setMonth(d.getMonth() + 1);
    return d;
  }
  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

export async function exportReport(req, res) {
  try {
    const { format = "csv", reportType = "overview", ...params } = req.body || {};
    console.log("[REPORT_EXPORT_STARTED]", { format, reportType });

    const generators = {
      overview: getReportsOverview,
      revenue: getRevenueSummary,
      events: getEventPerformance,
      tickets: getTicketingAnalytics,
      memberships: getMembershipAnalytics,
      sponsorships: getSponsorshipAnalytics,
      donations: getDonationAnalytics,
      discounts: getDiscountAnalytics,
      users: getUserGrowthAnalytics,
      checkins: getCheckInAnalytics,
      finance: getFinanceAnalytics,
    };

    let data;
    if (reportType === "custom") {
      data = await generateCustomReport(params);
    } else {
      const fn = generators[reportType] || getReportsOverview;
      data = await fn(params);
    }

    const title = params.title || `${reportType} Report`;
    const subtitle = dateSubtitle(params);
    const generatedBy = adminName(req.admin);
    const adminId = req.admin?.id || req.admin?._id;

    if (format === "pdf") {
      const summary = (data.cards || data.summary)
        ? Object.entries(typeof data.summary === "object" && !Array.isArray(data.summary) ? data.summary : {})
            .slice(0, 12)
            .map(([k, v]) => ({ label: k, value: typeof v === "object" ? JSON.stringify(v) : String(v) }))
        : (data.cards || []).map((c) => ({ label: c.label, value: c.value }));

      const tables = [];
      if (data.rows?.length) {
        tables.push({ title: "Data", columns: data.columns, rows: data.rows });
      }
      if (data.bySource?.length) {
        tables.push({
          title: "Revenue by Source",
          columns: ["source", "amount"],
          rows: data.bySource.map((s) => ({ source: s.source, amount: s.amount })),
        });
      }
      if (data.topEvents?.length) {
        tables.push({
          title: "Top Events",
          columns: ["title", "ticketsSold", "revenueFormatted"],
          rows: data.topEvents,
        });
      }

      const { buffer, filename } = await exportReportPdf({
        title,
        subtitle,
        summary,
        tables,
        generatedBy,
        adminId,
      });
      console.log("[REPORT_EXPORT_COMPLETED]", { format, reportType });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(buffer);
    }

    if (format === "excel") {
      const sheets = [];
      if (data.rows?.length) sheets.push({ name: "Data", columns: data.columns, rows: data.rows });
      if (data.bySource) {
        sheets.push({
          name: "By Source",
          columns: ["source", "amount"],
          rows: data.bySource.map((s) => ({ source: s.source, amount: s.amount })),
        });
      }
      const summary = (data.cards || []).map((c) => ({ label: c.label, value: c.value }));
      const { buffer, filename } = await exportReportExcel({
        title,
        summary,
        sheets,
        generatedBy,
        adminId,
      });
      console.log("[REPORT_EXPORT_COMPLETED]", { format, reportType });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(buffer);
    }

    // CSV default
    let columns = data.columns || ["label", "value"];
    let rows = data.rows || (data.cards || []).map((c) => ({ label: c.label, value: c.value }));
    if (!data.rows && data.bySource) {
      columns = ["source", "amount"];
      rows = data.bySource.map((s) => ({ source: s.source, amount: s.amount }));
    }
    const buffer = exportReportCsv({ columns, rows });
    console.log("[REPORT_EXPORT_COMPLETED]", { format, reportType });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${reportType}-report.csv"`);
    return res.send(buffer);
  } catch (error) {
    console.error("[REPORT_EXPORT_FAILED]", error.message);
    return handleError(res, error);
  }
}
