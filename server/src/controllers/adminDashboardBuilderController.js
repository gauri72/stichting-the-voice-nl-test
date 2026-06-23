function handleError(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error("[dashboard-builder]", error);
  return res.status(status).json({ error: error.message || "Something went wrong." });
}

export async function getDashboard(req, res) {
  try {
    const { getPublishedDashboardForRole } = await import("../services/dashboardBuilderService.js");
    const { buildDashboardDataBundle, resolveDashboardWidgets } = await import("../services/dashboardWidgetDataService.js");
    const { getAdminDashboardPayload } = await import("../services/adminDashboardService.js");

    const version = req.query.version === "draft" ? "draft" : "published";
    const role = req.admin?.role || "admin";

    if (version === "draft") {
      const { getDashboardBuilderState } = await import("../services/dashboardBuilderService.js");
      const builder = await getDashboardBuilderState("draft");
      const dataBundle = await buildDashboardDataBundle(req.admin);
      const widgets = await resolveDashboardWidgets(
        builder.widgets.filter((w) => w.isVisible !== false),
        req.admin,
        dataBundle
      );
      return res.json({
        ...await getAdminDashboardPayload(req.admin),
        dashboard: { settings: builder.settings, widgets, version: "draft" },
      });
    }

    const layout = await getPublishedDashboardForRole(role);
    const dataBundle = await buildDashboardDataBundle(req.admin);
    const widgets = await resolveDashboardWidgets(layout.widgets, req.admin, dataBundle);
    const welcomeMessage = (layout.settings?.welcomeMessage || "Welcome back {{name}} 👋").replace(
      "{{name}}",
      req.admin?.firstName || req.admin?.name || "Admin"
    );

    return res.json({
      ...await getAdminDashboardPayload(req.admin),
      dashboard: {
        settings: { ...layout.settings, welcomeMessage },
        widgets,
        version: "published",
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchDashboard(req, res) {
  try {
    const { updateDashboardSettings } = await import("../services/dashboardBuilderService.js");
    const state = await updateDashboardSettings(req.body, req.admin?.id);
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listWidgets(req, res) {
  try {
    const { listWidgets } = await import("../services/dashboardBuilderService.js");
    const widgets = await listWidgets(req.query.version || "draft");
    return res.json({ widgets });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createWidget(req, res) {
  try {
    const { createWidget } = await import("../services/dashboardBuilderService.js");
    const state = await createWidget(req.body, req.admin?.id);
    return res.status(201).json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateWidget(req, res) {
  try {
    const { updateWidget } = await import("../services/dashboardBuilderService.js");
    const state = await updateWidget(req.params.id, req.body, req.admin?.id);
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteWidget(req, res) {
  try {
    const { deleteWidget } = await import("../services/dashboardBuilderService.js");
    const state = await deleteWidget(req.params.id, req.admin?.id);
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function duplicateWidget(req, res) {
  try {
    const { duplicateWidget } = await import("../services/dashboardBuilderService.js");
    const state = await duplicateWidget(req.params.id, req.admin?.id);
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reorderWidgets(req, res) {
  try {
    const { reorderWidgets } = await import("../services/dashboardBuilderService.js");
    const { widgetOrder } = req.body || {};
    if (!Array.isArray(widgetOrder)) return res.status(400).json({ error: "widgetOrder array is required." });
    const state = await reorderWidgets(widgetOrder, req.admin?.id);
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function publishDashboard(req, res) {
  try {
    const { publishDashboard } = await import("../services/dashboardBuilderService.js");
    const state = await publishDashboard(req.admin?.id);
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getDashboardBuilder(req, res) {
  try {
    const { getDashboardBuilderState } = await import("../services/dashboardBuilderService.js");
    const { listCustomReports } = await import("../services/dashboardReportBuilderService.js");
    const [state, reports] = await Promise.all([
      getDashboardBuilderState("draft"),
      listCustomReports(),
    ]);
    return res.json({ ...state, reports });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listReports(req, res) {
  try {
    const { listCustomReports } = await import("../services/dashboardReportBuilderService.js");
    const reports = await listCustomReports();
    return res.json({ reports });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createReport(req, res) {
  try {
    const { createCustomReport } = await import("../services/dashboardReportBuilderService.js");
    const report = await createCustomReport(req.body, req.admin?.id);
    return res.status(201).json(report);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function runReport(req, res) {
  try {
    const { runCustomReport } = await import("../services/dashboardReportBuilderService.js");
    const result = await runCustomReport(req.params.id, req.body?.filters || req.query);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getInsights(req, res) {
  try {
    const { buildDashboardDataBundle } = await import("../services/dashboardWidgetDataService.js");
    const bundle = await buildDashboardDataBundle(req.admin);
    return res.json({ insights: bundle.ai_insights || [] });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getDashboardConfig(req, res) {
  try {
    const { WIDGET_TYPES, DATA_SOURCES, REPORT_DATA_SOURCES, REPORT_METRICS, REPORT_OUTPUTS } =
      await import("../config/dashboardConfig.js");
    return res.json({ widgetTypes: WIDGET_TYPES, dataSources: DATA_SOURCES, reportDataSources: REPORT_DATA_SOURCES, reportMetrics: REPORT_METRICS, reportOutputs: REPORT_OUTPUTS });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resetDashboard(req, res) {
  try {
    const { resetDashboardDefaults } = await import("../services/dashboardBuilderService.js");
    const state = await resetDashboardDefaults(req.admin?.id);
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}
