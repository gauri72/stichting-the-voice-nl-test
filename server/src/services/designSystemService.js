import DesignSystem, { ALLOWED_FONT_FAMILIES } from "../models/DesignSystem.js";
import { logAdminAction } from "./adminAuditService.js";
import { CMS_AUDIT_ACTIONS } from "../config/cmsConfig.js";

const DEFAULT_DESIGN_SYSTEM = {
  colors: {
    primary: "#1f9464",
    secondary: "#0e2f48",
    accent: "#7c3aed",
    success: "#2fa84f",
    warning: "#f0b429",
    error: "#f87171",
  },
  typography: {
    headingFont: "Poppins",
    bodyFont: "Inter",
    fontSizes: { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.5rem", "2xl": "2rem", "3xl": "2.75rem" },
    fontWeights: { normal: 400, medium: 500, bold: 700 },
    lineHeights: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
  },
  buttons: {
    primary: { background: "#1f9464", text: "#ffffff", border: "#1f9464" },
    secondary: { background: "#0e2f48", text: "#ffffff", border: "#0e2f48" },
    outline: { background: "transparent", text: "#1f9464", border: "#1f9464" },
    ghost: { background: "transparent", text: "#0e2f48", border: "transparent" },
  },
  layout: {
    spacing: { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "40px" },
    borderRadius: { sm: "4px", md: "8px", lg: "16px", full: "9999px" },
    shadows: {
      sm: "0 1px 2px rgba(15, 23, 42, 0.06)",
      md: "0 4px 12px rgba(15, 23, 42, 0.10)",
      lg: "0 12px 32px rgba(15, 23, 42, 0.16)",
    },
  },
};

async function ensureDesignSystemDoc() {
  let doc = await DesignSystem.findOne();
  if (!doc) {
    doc = await DesignSystem.create({
      designSystemId: "DESIGN-001",
      draft: DEFAULT_DESIGN_SYSTEM,
      published: DEFAULT_DESIGN_SYSTEM,
    });
  }
  return doc;
}

export async function getAdminDesignSystem() {
  const doc = await ensureDesignSystemDoc();
  return {
    designSystemId: doc.designSystemId,
    draft: doc.draft,
    published: doc.published,
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy,
    allowedFontFamilies: ALLOWED_FONT_FAMILIES,
  };
}

export async function getPublicDesignSystem() {
  const doc = await ensureDesignSystemDoc();
  return doc.published || DEFAULT_DESIGN_SYSTEM;
}

function sanitizeFonts(typography = {}) {
  const next = { ...typography };
  if (next.headingFont && !ALLOWED_FONT_FAMILIES.includes(next.headingFont)) {
    next.headingFont = DEFAULT_DESIGN_SYSTEM.typography.headingFont;
  }
  if (next.bodyFont && !ALLOWED_FONT_FAMILIES.includes(next.bodyFont)) {
    next.bodyFont = DEFAULT_DESIGN_SYSTEM.typography.bodyFont;
  }
  return next;
}

export async function updateDesignSystemDraft(payload, adminId) {
  const doc = await ensureDesignSystemDoc();
  const current = doc.draft?.toObject?.() || doc.draft || {};
  const next = { ...current, ...payload };
  if (next.typography) next.typography = sanitizeFonts(next.typography);
  doc.draft = next;
  doc.updatedBy = adminId;
  await doc.save();

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.DESIGN_SYSTEM_UPDATED,
    targetType: "cms_design_system",
    targetId: doc.designSystemId,
    summary: "Design system updated (draft)",
  });

  return getAdminDesignSystem();
}

export async function publishDesignSystem(adminId) {
  const doc = await ensureDesignSystemDoc();
  doc.published = JSON.parse(JSON.stringify(doc.draft));
  doc.updatedBy = adminId;
  await doc.save();

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.DESIGN_SYSTEM_PUBLISHED,
    targetType: "cms_design_system",
    targetId: doc.designSystemId,
    summary: "Design system published",
  });

  return getAdminDesignSystem();
}

export { DEFAULT_DESIGN_SYSTEM };
