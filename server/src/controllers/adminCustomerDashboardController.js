function handleError(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error("[customer-dashboard-builder]", error);
  return res.status(status).json({ error: error.message || "Something went wrong." });
}

export async function getCustomerDashboard(req, res) {
  try {
    const { getBuilderState } = await import("../services/customerDashboardBuilderService.js");
    const version = req.query.version === "published" ? "published" : "draft";
    const state = await getBuilderState(version);
    const { listCustomerDashboardVersions } = await import("../services/customerDashboardVersionService.js");
    const versions = await listCustomerDashboardVersions(30);
    return res.json({ ...state, versions });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchCustomerDashboard(req, res) {
  try {
    const { saveDraft } = await import("../services/customerDashboardBuilderService.js");
    const state = await saveDraft(req.body, req.admin?.id);
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function saveCustomerDashboardDraft(req, res) {
  try {
    const { saveDraft } = await import("../services/customerDashboardBuilderService.js");
    const state = await saveDraft(req.body, req.admin?.id);
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function publishCustomerDashboard(req, res) {
  try {
    const { publishDashboard } = await import("../services/customerDashboardBuilderService.js");
    const state = await publishDashboard(req.admin?.id, req.body?.changeNote || "");
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createCustomerDashboardSection(req, res) {
  try {
    const { addSection } = await import("../services/customerDashboardBuilderService.js");
    const state = await addSection(req.body, req.admin?.id);
    return res.status(201).json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateCustomerDashboardSection(req, res) {
  try {
    const { updateSection } = await import("../services/customerDashboardBuilderService.js");
    const state = await updateSection(req.params.sectionId, req.body, req.admin?.id);
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteCustomerDashboardSection(req, res) {
  try {
    const { deleteSection } = await import("../services/customerDashboardBuilderService.js");
    const state = await deleteSection(req.params.sectionId, req.admin?.id);
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function duplicateCustomerDashboardSection(req, res) {
  try {
    const { duplicateSection } = await import("../services/customerDashboardBuilderService.js");
    const state = await duplicateSection(req.params.sectionId, req.admin?.id);
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reorderCustomerDashboardSections(req, res) {
  try {
    const { reorderSections } = await import("../services/customerDashboardBuilderService.js");
    const state = await reorderSections(req.body.sectionOrder || [], req.admin?.id);
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function toggleCustomerDashboardSectionVisibility(req, res) {
  try {
    const { toggleSectionVisibility } = await import("../services/customerDashboardBuilderService.js");
    const state = await toggleSectionVisibility(req.params.sectionId, req.admin?.id);
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function restoreCustomerDashboardVersion(req, res) {
  try {
    const { restoreVersion } = await import("../services/customerDashboardBuilderService.js");
    const state = await restoreVersion(req.body.versionId, req.admin?.id);
    return res.json(state);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listCustomerDashboardVersions(req, res) {
  try {
    const { listCustomerDashboardVersions: listVersions } = await import("../services/customerDashboardVersionService.js");
    const versions = await listVersions(Number(req.query.limit) || 30);
    return res.json({ versions });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getCustomerDashboardPreview(req, res) {
  try {
    const { getBuilderState } = await import("../services/customerDashboardBuilderService.js");
    const version = req.query.version === "published" ? "published" : "draft";
    const builder = await getBuilderState(version);
    const settings = { ...builder.settings };
    settings.welcomeMessage = (settings.welcomeMessage || "Welcome, {{name}}").replace(
      /\{\{name\}\}/g,
      req.admin?.firstName || req.admin?.name || "Preview User"
    );
    return res.json({
      dashboardConfigId: builder.dashboardConfigId,
      settings,
      sections: (builder.sections || []).filter((s) => s.isVisible !== false),
      version,
      preview: true,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getCustomerDashboardConfig(req, res) {
  try {
    const { CUSTOMER_SECTION_TYPES, VISIBILITY_RULES, CTA_STYLES, SECTION_TYPE_LABELS } = await import(
      "../config/customerDashboardConfig.js"
    );
    return res.json({
      sectionTypes: CUSTOMER_SECTION_TYPES,
      visibilityRules: VISIBILITY_RULES,
      ctaStyles: CTA_STYLES,
      sectionTypeLabels: SECTION_TYPE_LABELS,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

