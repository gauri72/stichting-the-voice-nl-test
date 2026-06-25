import crypto from "crypto";
import CustomerDashboardConfig from "../models/CustomerDashboardConfig.js";
import { CUSTOMER_DASHBOARD_AUDIT } from "../config/customerDashboardConfig.js";
import { logAdminAction } from "./adminAuditService.js";
import { createCustomerDashboardVersion } from "./customerDashboardVersionService.js";
import { sanitizeHtml } from "./cmsValidationService.js";

function throwError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

export function generateSectionId() {
  return `cds-${crypto.randomUUID()}`;
}

const DEFAULT_SETTINGS = {
  title: "My Dashboard",
  welcomeMessage: "Welcome, {{name}}",
  introText: "",
  footerText: "",
  announcement: { visible: false, text: "" },
  heroBanner: {},
};

function defaultSections() {
  let order = 0;
  const next = () => order++;
  return [
    { sectionId: generateSectionId(), sectionType: "welcome_banner", title: "Welcome", order: next(), isVisible: true, isCustom: false, visibilityRules: { rules: [] } },
    { sectionId: generateSectionId(), sectionType: "available_discounts", title: "Available Discounts", order: next(), isVisible: true, isCustom: false, visibilityRules: { rules: [] } },
    { sectionId: generateSectionId(), sectionType: "my_events", title: "My Events", order: next(), isVisible: true, isCustom: false, visibilityRules: { rules: [] } },
    { sectionId: generateSectionId(), sectionType: "referral_code", title: "Refer a Friend", order: next(), isVisible: true, isCustom: false, visibilityRules: { rules: [] } },
    { sectionId: generateSectionId(), sectionType: "stat_cards", title: "Overview", order: next(), isVisible: true, isCustom: false, visibilityRules: { rules: [] } },
    { sectionId: generateSectionId(), sectionType: "digital_membership_card", title: "Membership Card", order: next(), isVisible: true, isCustom: false, visibilityRules: { rules: ["active_members"] } },
    { sectionId: generateSectionId(), sectionType: "impact_section", title: "Your Impact", order: next(), isVisible: true, isCustom: false, visibilityRules: { rules: [] } },
    { sectionId: generateSectionId(), sectionType: "recent_activity", title: "Recent Activity", order: next(), isVisible: true, isCustom: false, visibilityRules: { rules: [] }, settings: { showQuickActions: true } },
    { sectionId: generateSectionId(), sectionType: "closing_cta", title: "Get Involved", order: next(), isVisible: true, isCustom: false, visibilityRules: { rules: [] } },
    {
      sectionId: generateSectionId(),
      sectionType: "custom_cta_banner",
      title: "Renew Membership",
      description: "Your membership has expired. Renew to keep your benefits.",
      order: next(),
      isVisible: true,
      isCustom: false,
      visibilityRules: { rules: ["expired_members"] },
      ctas: [{ id: "renew", text: "Renew Membership", url: "/membership#membership-matrix", style: "primary", visible: true }],
    },
    {
      sectionId: generateSectionId(),
      sectionType: "custom_cta_banner",
      title: "Become a Member",
      description: "Join Stichting The V.O.I.C.E. NL and unlock exclusive benefits.",
      order: next(),
      isVisible: true,
      isCustom: false,
      visibilityRules: { rules: ["non_members"] },
      ctas: [{ id: "join", text: "Become a Member", url: "/membership", style: "teal", visible: true }],
    },
  ];
}

async function ensureConfigDoc() {
  let doc = await CustomerDashboardConfig.findOne();
  if (!doc) {
    const sections = defaultSections();
    doc = await CustomerDashboardConfig.create({
      dashboardConfigId: "CDC-001",
      status: "draft",
      draftSections: sections,
      publishedSections: [],
      draftSettings: DEFAULT_SETTINGS,
      publishedSettings: DEFAULT_SETTINGS,
      publishedAt: null,
    });
  }
  return doc;
}

function sortSections(sections = []) {
  return [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function normalizeOrders(sections = []) {
  // Sections fresh off a Mongoose document are subdocuments — their schema
  // fields live behind getters, not as own-enumerable properties, so
  // spreading them directly silently drops everything except Mongoose's
  // internal bookkeeping fields. Normalize to a plain object first.
  return sortSections(sections).map((s, i) => ({ ...(s.toObject?.() || s), order: i }));
}

function sanitizeCustomerDashboardSection(section) {
  if (!section || typeof section !== "object") return section;
  const copy = { ...(section.toObject?.() || section) };
  if (copy.sectionType === "custom_rich_text") {
    if (copy.settings?.richText) {
      copy.settings = { ...copy.settings, richText: sanitizeHtml(copy.settings.richText) };
    }
    if (copy.description) {
      copy.description = sanitizeHtml(copy.description);
    }
  }
  return copy;
}

function sanitizeCustomerDashboardSections(sections = []) {
  return sections.map(sanitizeCustomerDashboardSection);
}

export async function getBuilderState(version = "draft") {
  const doc = await ensureConfigDoc();
  const isPublished = version === "published";
  return {
    dashboardConfigId: doc.dashboardConfigId,
    status: doc.status,
    settings: isPublished ? doc.publishedSettings : doc.draftSettings,
    sections: normalizeOrders(isPublished ? doc.publishedSections : doc.draftSections),
    publishedAt: doc.publishedAt,
    updatedAt: doc.updatedAt,
    version,
  };
}

export async function getPublishedConfig() {
  const doc = await ensureConfigDoc();
  if (!doc.publishedSections?.length) return null;
  return {
    dashboardConfigId: doc.dashboardConfigId,
    settings: doc.publishedSettings || DEFAULT_SETTINGS,
    sections: normalizeOrders(doc.publishedSections).filter((s) => s.isVisible !== false),
    publishedAt: doc.publishedAt,
  };
}

export async function saveDraft({ settings, sections, changeNote }, adminId) {
  const doc = await ensureConfigDoc();
  if (settings) doc.draftSettings = { ...doc.draftSettings?.toObject?.() || doc.draftSettings || {}, ...settings };
  if (sections) doc.draftSections = normalizeOrders(sanitizeCustomerDashboardSections(sections));
  doc.status = "draft";
  doc.updatedBy = adminId;
  await doc.save();

  await createCustomerDashboardVersion({
    config: doc.toObject(),
    changeNote: changeNote || "Draft saved",
    status: "draft",
    adminId,
  });

  return getBuilderState("draft");
}

export async function publishDashboard(adminId, changeNote = "") {
  const doc = await ensureConfigDoc();
  doc.publishedSections = JSON.parse(JSON.stringify(doc.draftSections || []));
  doc.publishedSettings = JSON.parse(JSON.stringify(doc.draftSettings || DEFAULT_SETTINGS));
  doc.status = "published";
  doc.publishedAt = new Date();
  doc.updatedBy = adminId;
  await doc.save();

  await createCustomerDashboardVersion({
    config: doc.toObject(),
    changeNote: changeNote || "Published",
    status: "published",
    adminId,
  });

  await logAdminAction({
    adminId,
    action: CUSTOMER_DASHBOARD_AUDIT.PUBLISHED,
    targetType: "customer_dashboard",
    targetId: doc.dashboardConfigId,
    summary: "Customer dashboard published",
  });

  return getBuilderState("published");
}

export async function addSection(payload, adminId) {
  const doc = await ensureConfigDoc();
  const maxOrder = Math.max(-1, ...(doc.draftSections || []).map((s) => s.order ?? 0));
  const section = sanitizeCustomerDashboardSection({
    sectionId: generateSectionId(),
    sectionType: payload.sectionType,
    title: payload.title || payload.sectionType,
    subtitle: payload.subtitle || "",
    description: payload.description || "",
    icon: payload.icon || "",
    imageUrl: payload.imageUrl || "",
    image: payload.image || {},
    ctas: payload.ctas || [],
    settings: payload.settings || {},
    visibilityRules: payload.visibilityRules || { rules: [] },
    order: maxOrder + 1,
    isVisible: true,
    isCustom: true,
  });
  doc.draftSections.push(section);
  doc.updatedBy = adminId;
  await doc.save();

  await logAdminAction({
    adminId,
    action: CUSTOMER_DASHBOARD_AUDIT.SECTION_CREATED,
    targetType: "customer_dashboard_section",
    targetId: section.sectionId,
    summary: `Added section: ${section.title}`,
  });

  return getBuilderState("draft");
}

const UPDATABLE_SECTION_FIELDS = [
  "sectionType",
  "title",
  "subtitle",
  "description",
  "icon",
  "imageUrl",
  "image",
  "ctas",
  "settings",
  "visibilityRules",
  "isVisible",
];

export async function updateSection(sectionId, payload, adminId) {
  const doc = await ensureConfigDoc();
  const idx = (doc.draftSections || []).findIndex((s) => s.sectionId === sectionId);
  if (idx === -1) throwError("Section not found.", 404);
  const existing = doc.draftSections[idx].toObject?.() || doc.draftSections[idx];
  const updates = {};
  for (const field of UPDATABLE_SECTION_FIELDS) {
    if (payload[field] !== undefined) updates[field] = payload[field];
  }
  doc.draftSections[idx] = sanitizeCustomerDashboardSection({
    ...existing,
    ...updates,
    sectionId,
  });
  doc.updatedBy = adminId;
  await doc.save();

  await logAdminAction({
    adminId,
    action: CUSTOMER_DASHBOARD_AUDIT.SECTION_UPDATED,
    targetType: "customer_dashboard_section",
    targetId: sectionId,
    summary: `Updated section: ${doc.draftSections[idx].title}`,
  });

  return getBuilderState("draft");
}

export async function deleteSection(sectionId, adminId) {
  const doc = await ensureConfigDoc();
  const section = (doc.draftSections || []).find((s) => s.sectionId === sectionId);
  if (!section) throwError("Section not found.", 404);
  if (!section.isCustom) throwError("Only custom sections can be deleted.");
  doc.draftSections = normalizeOrders(doc.draftSections.filter((s) => s.sectionId !== sectionId));
  doc.updatedBy = adminId;
  await doc.save();
  return getBuilderState("draft");
}

export async function duplicateSection(sectionId, adminId) {
  const doc = await ensureConfigDoc();
  const source = (doc.draftSections || []).find((s) => s.sectionId === sectionId);
  if (!source) throwError("Section not found.", 404);
  const maxOrder = Math.max(-1, ...(doc.draftSections || []).map((s) => s.order ?? 0));
  const copy = {
    ...JSON.parse(JSON.stringify(source.toObject?.() || source)),
    sectionId: generateSectionId(),
    title: `${source.title} (Copy)`,
    isCustom: true,
    order: maxOrder + 1,
  };
  doc.draftSections.push(copy);
  doc.updatedBy = adminId;
  await doc.save();
  return getBuilderState("draft");
}

export async function reorderSections(sectionOrder, adminId) {
  const doc = await ensureConfigDoc();
  const orderMap = new Map(sectionOrder.map((id, i) => [id, i]));
  doc.draftSections = normalizeOrders(
    (doc.draftSections || []).map((s) => ({
      ...s.toObject?.() || s,
      order: orderMap.has(s.sectionId) ? orderMap.get(s.sectionId) : s.order,
    }))
  );
  doc.updatedBy = adminId;
  await doc.save();

  await logAdminAction({
    adminId,
    action: CUSTOMER_DASHBOARD_AUDIT.SECTION_REORDERED,
    targetType: "customer_dashboard",
    targetId: doc.dashboardConfigId,
    summary: "Customer dashboard sections reordered",
  });

  return getBuilderState("draft");
}

export async function toggleSectionVisibility(sectionId, adminId) {
  const doc = await ensureConfigDoc();
  const section = (doc.draftSections || []).find((s) => s.sectionId === sectionId);
  if (!section) throwError("Section not found.", 404);
  section.isVisible = !section.isVisible;
  doc.updatedBy = adminId;
  await doc.save();

  await logAdminAction({
    adminId,
    action: CUSTOMER_DASHBOARD_AUDIT.SECTION_HIDDEN,
    targetType: "customer_dashboard_section",
    targetId: sectionId,
    summary: `${section.isVisible ? "Shown" : "Hidden"} section: ${section.title}`,
  });

  return getBuilderState("draft");
}

export async function restoreVersion(versionId, adminId) {
  const { getCustomerDashboardVersion } = await import("./customerDashboardVersionService.js");
  const version = await getCustomerDashboardVersion(versionId);
  const doc = await ensureConfigDoc();
  const snapshot = version.snapshot || {};
  if (snapshot.draftSections) doc.draftSections = normalizeOrders(sanitizeCustomerDashboardSections(snapshot.draftSections));
  if (snapshot.draftSettings) doc.draftSettings = snapshot.draftSettings;
  doc.updatedBy = adminId;
  await doc.save();

  await logAdminAction({
    adminId,
    action: CUSTOMER_DASHBOARD_AUDIT.VERSION_RESTORED,
    targetType: "customer_dashboard",
    targetId: doc.dashboardConfigId,
    summary: `Restored version ${versionId}`,
    detail: { versionId },
  });

  return getBuilderState("draft");
}
