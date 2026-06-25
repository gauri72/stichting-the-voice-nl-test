import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[cms]" });
}

export async function listPagesAdmin(req, res) {
  try {
    const { listPages } = await import("../services/pageService.js");
    const pages = await listPages({ includeSeo: req.query.includeSeo === "true" });
    return res.json({ pages });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getPageAdmin(req, res) {
  try {
    const { getPageBySlug } = await import("../services/pageService.js");
    const draft = req.query.version !== "published";
    const page = await getPageBySlug(req.params.slug, { draft });
    return res.json(page);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createPageAdmin(req, res) {
  try {
    const { createPage } = await import("../services/pageService.js");
    const page = await createPage(req.body, req.admin?.id);
    return res.status(201).json(page);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updatePageAdmin(req, res) {
  try {
    const { updatePage } = await import("../services/pageService.js");
    const page = await updatePage(req.params.slug, req.body, req.admin?.id);
    return res.json(page);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deletePageAdmin(req, res) {
  try {
    const { deletePage } = await import("../services/pageService.js");
    const result = await deletePage(req.params.slug, req.admin?.id);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function archivePageAdmin(req, res) {
  try {
    const { archivePage } = await import("../services/pageService.js");
    const result = await archivePage(req.params.slug, req.admin?.id);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function restorePageAdmin(req, res) {
  try {
    const { restorePage } = await import("../services/pageService.js");
    const result = await restorePage(req.params.slug, req.admin?.id);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function saveDraftAdmin(req, res) {
  try {
    const { saveDraft } = await import("../services/pageService.js");
    const page = await saveDraft(req.params.slug, req.body, req.admin?.id);
    return res.json(page);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function publishPageAdmin(req, res) {
  try {
    const { publishPage } = await import("../services/pageService.js");
    const page = await publishPage(req.params.slug, req.admin?.id, req.body?.changeNote);
    return res.json(page);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function duplicatePageAdmin(req, res) {
  try {
    const { duplicatePage } = await import("../services/pageService.js");
    const page = await duplicatePage(req.params.slug, req.admin?.id);
    return res.status(201).json(page);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function addSectionAdmin(req, res) {
  try {
    const { addSection } = await import("../services/pageService.js");
    const page = await addSection(req.params.slug, req.body, req.admin?.id, req.admin?.role);
    return res.status(201).json(page);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function addLinkedSectionAdmin(req, res) {
  try {
    const { addLinkedSection } = await import("../services/pageService.js");
    const page = await addLinkedSection(req.params.slug, req.body.blockId, req.admin?.id, req.admin?.role);
    return res.status(201).json(page);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateSectionAdmin(req, res) {
  try {
    const { updateSection } = await import("../services/pageService.js");
    const page = await updateSection(
      req.params.slug,
      req.params.sectionId,
      req.body,
      req.admin?.id,
      req.admin?.role
    );
    return res.json(page);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteSectionAdmin(req, res) {
  try {
    const { deleteSection } = await import("../services/pageService.js");
    const page = await deleteSection(req.params.slug, req.params.sectionId, req.admin?.id);
    return res.json(page);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reorderSectionsAdmin(req, res) {
  try {
    const { reorderSections } = await import("../services/pageService.js");
    const { sectionOrder } = req.body || {};
    if (!Array.isArray(sectionOrder)) {
      return res.status(400).json({ error: "sectionOrder array is required." });
    }
    const page = await reorderSections(req.params.slug, sectionOrder, req.admin?.id);
    return res.json(page);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function duplicateSectionAdmin(req, res) {
  try {
    const { duplicateSection } = await import("../services/pageService.js");
    const page = await duplicateSection(req.params.slug, req.params.sectionId, req.admin?.id);
    return res.json(page);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function toggleSectionVisibilityAdmin(req, res) {
  try {
    const { toggleSectionVisibility } = await import("../services/pageService.js");
    const page = await toggleSectionVisibility(req.params.slug, req.params.sectionId, req.admin?.id);
    return res.json(page);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function restoreVersionAdmin(req, res) {
  try {
    const { restoreVersion } = await import("../services/pageService.js");
    const { versionId } = req.body || {};
    if (!versionId) return res.status(400).json({ error: "versionId is required." });
    const page = await restoreVersion(req.params.slug, versionId, req.admin?.id);
    return res.json(page);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listVersionsAdmin(req, res) {
  try {
    const { listPageVersions } = await import("../services/pageVersionService.js");
    const versions = await listPageVersions(req.params.slug);
    return res.json({ versions });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function compareVersionsAdmin(req, res) {
  try {
    const { comparePageVersions } = await import("../services/pageVersionService.js");
    const { versionIdA, versionIdB } = req.query;
    const result = await comparePageVersions(versionIdA, versionIdB);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function uploadPageImageAdmin(req, res) {
  try {
    const { processPageImageUpload, IMAGE_SIZE_GUIDANCE } = await import("../services/pageImageService.js");
    const result = await processPageImageUpload(req.body, req.admin?.id);
    return res.json({ image: result, guidance: IMAGE_SIZE_GUIDANCE[req.body?.imageType] || "" });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getHeaderAdmin(req, res) {
  try {
    const { getAdminHeader } = await import("../services/siteNavigationService.js");
    const data = await getAdminHeader();
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateHeaderAdmin(req, res) {
  try {
    const { updateHeaderDraft, publishHeader } = await import("../services/siteNavigationService.js");
    if (req.body?.publish) {
      const data = await publishHeader(req.admin?.id);
      return res.json(data);
    }
    const data = await updateHeaderDraft(req.body, req.admin?.id);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getFooterAdmin(req, res) {
  try {
    const { getAdminFooter } = await import("../services/siteFooterService.js");
    const data = await getAdminFooter();
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateFooterAdmin(req, res) {
  try {
    const { updateFooterDraft, publishFooter } = await import("../services/siteFooterService.js");
    if (req.body?.publish) {
      const data = await publishFooter(req.admin?.id);
      return res.json(data);
    }
    const data = await updateFooterDraft(req.body, req.admin?.id);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getCmsAuditLogAdmin(req, res) {
  try {
    const { listAccessAuditLogs } = await import("../services/accessManagementService.js");
    const logs = await listAccessAuditLogs({ cmsOnly: true });
    return res.json({ logs });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getCmsConfig(req, res) {
  try {
    const { SECTION_TYPES, CTA_STYLES, IMAGE_FOCUS_POSITIONS } = await import("../config/cmsConfig.js");
    const { IMAGE_SIZE_GUIDANCE } = await import("../services/pageImageService.js");
    return res.json({ sectionTypes: SECTION_TYPES, ctaStyles: CTA_STYLES, focusPositions: IMAGE_FOCUS_POSITIONS, imageGuidance: IMAGE_SIZE_GUIDANCE });
  } catch (error) {
    return handleError(res, error);
  }
}
