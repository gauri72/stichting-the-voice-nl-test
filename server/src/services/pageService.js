import Page from "../models/Page.js";
import { getNextSequence } from "../utils/sequence.js";
import {
  DEFAULT_PAGES,
  SECTION_TYPES,
  CMS_AUDIT_ACTIONS,
  canEditSectionType,
} from "../config/cmsConfig.js";
import { logAdminAction } from "./adminAuditService.js";
import {
  throwError,
  generateId,
  sanitizeSection,
  normalizeSectionOrders,
  getVisibleSections,
  validateUrl,
} from "./cmsValidationService.js";
import { createPageVersion, listPageVersions } from "./pageVersionService.js";

async function nextPageId() {
  const seq = await getNextSequence("cms_page");
  const year = new Date().getFullYear();
  return `PAGE-${year}-${String(seq).padStart(6, "0")}`;
}

function formatPageListItem(page, adminMap = {}) {
  const updatedByName = page.updatedBy
    ? adminMap[page.updatedBy.toString()] || "Admin"
    : "—";
  return {
    pageId: page.pageId,
    slug: page.slug,
    title: page.title,
    route: page.route,
    status: page.status,
    sectionCount: (page.publishedSections || []).length,
    draftSectionCount: (page.draftSections || []).length,
    updatedAt: page.updatedAt,
    publishedAt: page.publishedAt,
    updatedBy: updatedByName,
    updatedById: page.updatedBy,
  };
}

function defaultSectionsForPage(slug) {
  const base = [
    {
      sectionId: generateId("sec"),
      sectionKey: "hero",
      sectionType: "hero",
      title: "Hero",
      content: {
        heading: "",
        subheading: "",
        description: "",
      },
      images: { hero: { url: "", alt: "", focusPosition: "center" } },
      ctas: [],
      settings: { themeMode: "dark", textAlign: "center" },
      order: 0,
      isVisible: true,
      isCustom: false,
    },
  ];

  if (slug === "home") {
    return [
      ...base,
      {
        sectionId: generateId("sec"),
        sectionKey: "featured-events",
        sectionType: "featured_events",
        title: "Featured Events",
        content: { pageContext: "home", variant: "fullHero" },
        images: {},
        ctas: [],
        settings: {},
        order: 1,
        isVisible: true,
        isCustom: false,
      },
      {
        sectionId: generateId("sec"),
        sectionKey: "pillars",
        sectionType: "feature_cards",
        title: "Our Pillars",
        content: { heading: "Our Pillars", cards: [] },
        images: {},
        ctas: [],
        settings: {},
        order: 2,
        isVisible: true,
        isCustom: false,
      },
      {
        sectionId: generateId("sec"),
        sectionKey: "get-involved",
        sectionType: "cta_banner",
        title: "Get Involved",
        content: { heading: "Get Involved" },
        images: {},
        ctas: [],
        settings: {},
        order: 3,
        isVisible: true,
        isCustom: false,
      },
      {
        sectionId: generateId("sec"),
        sectionKey: "impact-stats",
        sectionType: "statistics",
        title: "Impact Stats",
        content: { stats: [] },
        images: {},
        ctas: [],
        settings: {},
        order: 4,
        isVisible: true,
        isCustom: false,
      },
      {
        sectionId: generateId("sec"),
        sectionKey: "sponsors",
        sectionType: "sponsor_logos",
        title: "Sponsors",
        content: { heading: "Our Sponsors" },
        images: {},
        ctas: [],
        settings: {},
        order: 5,
        isVisible: true,
        isCustom: false,
      },
    ];
  }

  if (slug === "events" || slug === "experience") {
    return [
      {
        sectionId: generateId("sec"),
        sectionKey: "breadcrumb",
        sectionType: "breadcrumb_hero",
        title: "Experience Hero",
        content: { heading: "Experience", ariaLabel: "Experience" },
        images: { background: { url: "", alt: "", focusPosition: "center" } },
        ctas: [],
        settings: {},
        order: 0,
        isVisible: true,
        isCustom: false,
      },
      {
        sectionId: generateId("sec"),
        sectionKey: "featured-events",
        sectionType: "featured_events",
        title: "Featured Events",
        content: { pageContext: "events", variant: "compactHero" },
        images: {},
        ctas: [],
        settings: {},
        order: 1,
        isVisible: true,
        isCustom: false,
      },
      {
        sectionId: generateId("sec"),
        sectionKey: "event-highlights",
        sectionType: "event_slider",
        title: "Past Event Highlights",
        content: {},
        images: {},
        ctas: [],
        settings: {},
        order: 2,
        isVisible: true,
        isCustom: false,
      },
      {
        sectionId: generateId("sec"),
        sectionKey: "testimonials",
        sectionType: "testimonials",
        title: "Testimonials",
        content: { variant: "community" },
        images: {},
        ctas: [],
        settings: {},
        order: 3,
        isVisible: true,
        isCustom: false,
      },
    ];
  }

  return [
    {
      sectionId: generateId("sec"),
      sectionKey: "breadcrumb",
      sectionType: "breadcrumb_hero",
      title: "Page Hero",
      content: { heading: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) },
      images: { background: { url: "", alt: "", focusPosition: "center" } },
      ctas: [],
      settings: {},
      order: 0,
      isVisible: true,
      isCustom: false,
    },
    {
      sectionId: generateId("sec"),
      sectionKey: "main-content",
      sectionType: "text",
      title: "Main Content",
      content: { heading: "", description: "", richText: "" },
      images: {},
      ctas: [],
      settings: {},
      order: 1,
      isVisible: true,
      isCustom: false,
    },
  ];
}

export async function ensureDefaultPages() {
  const created = [];
  for (const def of DEFAULT_PAGES) {
    const exists = await Page.findOne({ slug: def.slug });
    if (exists) continue;
    const pageId = await nextPageId();
    const sections = defaultSectionsForPage(def.slug);
    const page = await Page.create({
      pageId,
      slug: def.slug,
      title: def.title,
      route: def.route,
      status: "draft",
      draftSections: sections,
      publishedSections: [],
      seo: {
        metaTitle: def.title,
        metaDescription: `${def.title} — Stichting The V.O.I.C.E. NL`,
        robotsIndex: true,
      },
    });
    created.push(page.slug);
  }
  return created;
}

export async function listPages() {
  await ensureDefaultPages();
  const pages = await Page.find().sort({ title: 1 }).lean();
  return pages.map((p) => formatPageListItem(p));
}

export async function getPageBySlug(slug, { draft = false } = {}) {
  await ensureDefaultPages();
  const page = await Page.findOne({ slug: slug.toLowerCase() }).lean();
  if (!page) throwError("Page not found.", 404);

  const sections = draft ? page.draftSections : page.publishedSections;
  return {
    ...page,
    sections: normalizeSectionOrders(sections || []),
    versions: await listPageVersions(page.slug, 10),
  };
}

export async function getPublicPage(slug) {
  const page = await Page.findOne({ slug: slug.toLowerCase(), status: { $ne: "archived" } }).lean();
  if (!page || !page.publishedSections?.length) return null;

  return {
    slug: page.slug,
    title: page.title,
    route: page.route,
    seo: page.seo,
    sections: getVisibleSections(page.publishedSections),
    publishedAt: page.publishedAt,
  };
}

export async function createPage(payload, adminId) {
  const slug = (payload.slug || "").toLowerCase().trim();
  if (!slug) throwError("Page slug is required.");
  const existing = await Page.findOne({ slug });
  if (existing) throwError("A page with this slug already exists.");

  const pageId = await nextPageId();
  const sections = defaultSectionsForPage(slug);
  const page = await Page.create({
    pageId,
    slug,
    title: payload.title || slug,
    route: payload.route || `/${slug}`,
    status: "draft",
    draftSections: sections,
    publishedSections: [],
    seo: payload.seo || {},
    createdBy: adminId,
    updatedBy: adminId,
  });

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.PAGE_CREATED,
    targetType: "cms_page",
    targetId: page.pageId,
    summary: `Created page: ${page.title}`,
  });

  return getPageBySlug(page.slug, { draft: true });
}

export async function updatePage(slug, payload, adminId) {
  const page = await Page.findOne({ slug: slug.toLowerCase() });
  if (!page) throwError("Page not found.", 404);

  if (payload.title) page.title = payload.title;
  if (payload.route) page.route = payload.route;
  if (payload.seo) page.seo = { ...page.seo?.toObject?.() || page.seo || {}, ...payload.seo };
  if (payload.status) page.status = payload.status;
  page.updatedBy = adminId;
  await page.save();

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.PAGE_UPDATED,
    targetType: "cms_page",
    targetId: page.pageId,
    summary: `Updated page settings: ${page.title}`,
  });

  return getPageBySlug(page.slug, { draft: true });
}

export async function saveDraft(slug, payload, adminId) {
  const page = await Page.findOne({ slug: slug.toLowerCase() });
  if (!page) throwError("Page not found.", 404);

  if (payload.seo) page.seo = { ...page.seo?.toObject?.() || page.seo || {}, ...payload.seo };
  if (payload.draftSections) {
    page.draftSections = normalizeSectionOrders(
      payload.draftSections.map(sanitizeSection)
    );
  }
  page.status = "draft";
  page.updatedBy = adminId;
  await page.save();

  await createPageVersion({
    page: page.toObject(),
    changeNote: payload.changeNote || "Draft saved",
    status: "draft",
    adminId,
  });

  return getPageBySlug(page.slug, { draft: true });
}

export async function publishPage(slug, adminId, changeNote = "") {
  const page = await Page.findOne({ slug: slug.toLowerCase() });
  if (!page) throwError("Page not found.", 404);

  page.publishedSections = normalizeSectionOrders(
    JSON.parse(JSON.stringify(page.draftSections || []))
  );
  page.status = "published";
  page.publishedAt = new Date();
  page.updatedBy = adminId;
  await page.save();

  await createPageVersion({
    page: { ...page.toObject(), draftSections: page.publishedSections },
    changeNote: changeNote || "Published",
    status: "published",
    adminId,
  });

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.PAGE_PUBLISHED,
    targetType: "cms_page",
    targetId: page.pageId,
    summary: `Published page: ${page.title}`,
  });

  return getPageBySlug(page.slug, { draft: false });
}

export async function duplicatePage(slug, adminId) {
  const source = await Page.findOne({ slug: slug.toLowerCase() });
  if (!source) throwError("Page not found.", 404);

  const newSlug = `${source.slug}-copy-${Date.now()}`;
  const pageId = await nextPageId();
  const page = await Page.create({
    pageId,
    slug: newSlug,
    title: `${source.title} (Copy)`,
    route: `${source.route}-copy`,
    status: "draft",
    seo: JSON.parse(JSON.stringify(source.seo || {})),
    draftSections: JSON.parse(JSON.stringify(source.draftSections || [])),
    publishedSections: [],
    createdBy: adminId,
    updatedBy: adminId,
  });

  return getPageBySlug(page.slug, { draft: true });
}

export async function deletePage(slug, adminId) {
  const page = await Page.findOne({ slug: slug.toLowerCase() });
  if (!page) throwError("Page not found.", 404);
  if (DEFAULT_PAGES.some((p) => p.slug === page.slug)) {
    throwError("Cannot delete a system page. Archive it instead.");
  }
  page.status = "archived";
  page.updatedBy = adminId;
  await page.save();
  return { success: true };
}

export async function addSection(slug, payload, adminId, adminRole) {
  const page = await Page.findOne({ slug: slug.toLowerCase() });
  if (!page) throwError("Page not found.", 404);

  const sectionType = payload.sectionType;
  if (!SECTION_TYPES.includes(sectionType)) throwError("Invalid section type.");
  if (!canEditSectionType(adminRole, sectionType)) {
    throwError("You do not have permission to add this section type.", 403);
  }

  const maxOrder = Math.max(-1, ...(page.draftSections || []).map((s) => s.order ?? 0));
  const section = sanitizeSection({
    sectionId: generateId("sec"),
    sectionKey: payload.sectionKey || sectionType,
    sectionType,
    title: payload.title || sectionType.replace(/_/g, " "),
    content: payload.content || {},
    images: payload.images || {},
    ctas: payload.ctas || [],
    settings: payload.settings || {},
    order: maxOrder + 1,
    isVisible: true,
    isCustom: true,
  });

  page.draftSections.push(section);
  page.draftSections = normalizeSectionOrders(page.draftSections);
  page.updatedBy = adminId;
  await page.save();

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.SECTION_UPDATED,
    targetType: "cms_section",
    targetId: section.sectionId,
    summary: `Added section "${section.title}" to ${page.title}`,
  });

  return getPageBySlug(page.slug, { draft: true });
}

export async function updateSection(slug, sectionId, payload, adminId, adminRole) {
  const page = await Page.findOne({ slug: slug.toLowerCase() });
  if (!page) throwError("Page not found.", 404);

  const idx = (page.draftSections || []).findIndex((s) => s.sectionId === sectionId);
  if (idx === -1) throwError("Section not found.", 404);

  const existing = page.draftSections[idx];
  if (!canEditSectionType(adminRole, payload.sectionType || existing.sectionType)) {
    throwError("You do not have permission to edit this section.", 403);
  }

  const updated = sanitizeSection({
    ...existing.toObject?.() || existing,
    ...payload,
    sectionId,
  });
  page.draftSections[idx] = updated;
  page.updatedBy = adminId;
  await page.save();

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.SECTION_UPDATED,
    targetType: "cms_section",
    targetId: sectionId,
    summary: `Updated section "${updated.title}" on ${page.title}`,
  });

  return getPageBySlug(page.slug, { draft: true });
}

export async function deleteSection(slug, sectionId, adminId) {
  const page = await Page.findOne({ slug: slug.toLowerCase() });
  if (!page) throwError("Page not found.", 404);

  const section = (page.draftSections || []).find((s) => s.sectionId === sectionId);
  if (!section) throwError("Section not found.", 404);
  if (!section.isCustom) throwError("Only custom sections can be deleted.");

  page.draftSections = normalizeSectionOrders(
    page.draftSections.filter((s) => s.sectionId !== sectionId)
  );
  page.updatedBy = adminId;
  await page.save();

  return getPageBySlug(page.slug, { draft: true });
}

export async function reorderSections(slug, sectionOrder, adminId) {
  const page = await Page.findOne({ slug: slug.toLowerCase() });
  if (!page) throwError("Page not found.", 404);

  const orderMap = new Map(sectionOrder.map((id, index) => [id, index]));
  page.draftSections = normalizeSectionOrders(
    (page.draftSections || []).map((s) => ({
      ...s.toObject?.() || s,
      order: orderMap.has(s.sectionId) ? orderMap.get(s.sectionId) : s.order,
    }))
  );
  page.updatedBy = adminId;
  await page.save();

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.SECTION_REORDERED,
    targetType: "cms_page",
    targetId: page.pageId,
    summary: `Reordered sections on ${page.title}`,
  });

  return getPageBySlug(page.slug, { draft: true });
}

export async function duplicateSection(slug, sectionId, adminId) {
  const page = await Page.findOne({ slug: slug.toLowerCase() });
  if (!page) throwError("Page not found.", 404);

  const source = (page.draftSections || []).find((s) => s.sectionId === sectionId);
  if (!source) throwError("Section not found.", 404);

  const copy = sanitizeSection({
    ...JSON.parse(JSON.stringify(source.toObject?.() || source)),
    sectionId: generateId("sec"),
    title: `${source.title} (Copy)`,
    isCustom: true,
  });
  page.draftSections.push(copy);
  page.draftSections = normalizeSectionOrders(page.draftSections);
  page.updatedBy = adminId;
  await page.save();

  return getPageBySlug(page.slug, { draft: true });
}

export async function toggleSectionVisibility(slug, sectionId, adminId) {
  const page = await Page.findOne({ slug: slug.toLowerCase() });
  if (!page) throwError("Page not found.", 404);

  const section = (page.draftSections || []).find((s) => s.sectionId === sectionId);
  if (!section) throwError("Section not found.", 404);

  section.isVisible = !section.isVisible;
  page.updatedBy = adminId;
  await page.save();

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.SECTION_HIDDEN,
    targetType: "cms_section",
    targetId: sectionId,
    summary: `${section.isVisible ? "Shown" : "Hidden"} section "${section.title}" on ${page.title}`,
  });

  return getPageBySlug(page.slug, { draft: true });
}

export async function restoreVersion(slug, versionId, adminId) {
  const { getPageVersion } = await import("./pageVersionService.js");
  const version = await getPageVersion(versionId);
  const page = await Page.findOne({ slug: slug.toLowerCase() });
  if (!page) throwError("Page not found.", 404);
  if (version.pageSlug !== page.slug) throwError("Version does not belong to this page.", 400);

  const snapshot = version.snapshot || {};
  if (snapshot.sections) page.draftSections = normalizeSectionOrders(snapshot.sections);
  if (snapshot.seo) page.seo = snapshot.seo;
  if (snapshot.title) page.title = snapshot.title;
  page.updatedBy = adminId;
  await page.save();

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.VERSION_RESTORED,
    targetType: "cms_page",
    targetId: page.pageId,
    summary: `Restored version ${versionId} for ${page.title}`,
    detail: { versionId },
  });

  return getPageBySlug(page.slug, { draft: true });
}

export async function getPreviewPage(slug, version = "draft") {
  if (version === "published") {
    const pub = await getPublicPage(slug);
    if (pub) return pub;
    throwError("No published content for this page.", 404);
  }
  const page = await getPageBySlug(slug, { draft: true });
  return {
    slug: page.slug,
    title: page.title,
    route: page.route,
    seo: page.seo,
    sections: getVisibleSections(page.sections),
    isPreview: true,
    version: "draft",
  };
}
