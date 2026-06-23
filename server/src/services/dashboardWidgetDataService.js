import { getAdminDashboardPayload } from "./adminDashboardService.js";
import { getTicketStats } from "./ticketAdminService.js";
import { generateDashboardInsights } from "./dashboardInsightService.js";
import { runCustomReport } from "./dashboardReportBuilderService.js";
import DashboardCustomReport from "../models/DashboardCustomReport.js";

function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export async function buildDashboardDataBundle(admin) {
  const [payload, ticketStatsResult] = await Promise.all([
    getAdminDashboardPayload(admin),
    getTicketStats().catch(() => null),
  ]);

  const ticketStats = ticketStatsResult?.stats || ticketStatsResult || null;

  return {
    overview: payload.overview,
    ticket_tailor: payload.ticketTailor,
    ticket_stats: ticketStats,
    finance: payload.finance,
    sponsorships: payload.sponsorships,
    donations: payload.donations,
    recent_activity: payload.recentActivity,
    ai_insights: await generateDashboardInsights({ overview: payload.overview, ticketStats, finance: payload.finance, donations: payload.donations, sponsorships: payload.sponsorships }),
  };
}

export async function resolveWidgetData(widget, dataBundle) {
  const source = widget.dataSource;
  const bundle = dataBundle[source] ?? dataBundle[source?.replace(/-/g, "_")];

  if (widget.widgetType === "welcome_banner") {
    return { type: "welcome" };
  }

  if (widget.widgetType === "activity_feed") {
    return { items: dataBundle.recent_activity || [] };
  }

  if (widget.widgetType === "quick_actions") {
    return { actions: widget.content?.actions || [] };
  }

  if (widget.widgetType === "ai_insight") {
    return { insights: dataBundle.ai_insights || [] };
  }

  if (widget.widgetType === "custom_html") {
    return { html: widget.content?.html || widget.description || "" };
  }

  if (widget.widgetType === "embedded_report" && widget.content?.reportId) {
    try {
      const report = await DashboardCustomReport.findOne({ reportId: widget.content.reportId }).lean();
      if (report) {
        const result = await runCustomReport(report, {});
        return { report, result };
      }
    } catch {
      return { error: "Report could not be loaded." };
    }
  }

  if (["bar_chart", "line_chart", "area_chart", "pie_chart", "funnel_chart", "trend_analysis"].includes(widget.widgetType)) {
    const chartData = widget.content?.chartData || widget.settings?.chartData;
    if (chartData?.length) return { chartData };
    if (widget.content?.reportId) {
      const report = await DashboardCustomReport.findOne({ reportId: widget.content.reportId }).lean();
      if (report) {
        const result = await runCustomReport(report, {});
        return { chartData: result.rows || result.chartData || [], report };
      }
    }
    return { chartData: [] };
  }

  if (widget.widgetType === "stat_card") {
    const value = widget.dataKey ? getNestedValue(bundle, widget.dataKey) : null;
    return { value, label: widget.title };
  }

  if (widget.widgetType === "stat_group" || widget.widgetType === "kpi_card") {
    const stats = (widget.content?.stats || []).map((stat) => ({
      ...stat,
      value: stat.key ? getNestedValue(bundle, stat.key) : stat.value,
    }));
    return { stats, meta: bundle?.lastSyncedAt ? { lastSyncedAt: bundle.lastSyncedAt } : null };
  }

  if (widget.widgetType === "section_header") {
    return { title: widget.title };
  }

  return { raw: bundle };
}

export async function resolveDashboardWidgets(widgets, admin, dataBundle = null) {
  const bundle = dataBundle || (await buildDashboardDataBundle(admin));
  const resolved = [];

  for (const widget of widgets) {
    try {
      const data = await resolveWidgetData(widget, bundle);
      resolved.push({ ...widget, data });
    } catch (error) {
      resolved.push({ ...widget, data: { error: error.message } });
    }
  }

  return resolved;
}
