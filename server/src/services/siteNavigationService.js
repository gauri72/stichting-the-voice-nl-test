import SiteNavigation from "../models/SiteNavigation.js";
import { CMS_AUDIT_ACTIONS } from "../config/cmsConfig.js";
import { logAdminAction } from "./adminAuditService.js";
import { throwError } from "./cmsValidationService.js";

const DEFAULT_HEADER = {
  logo: { url: "", alt: "Stichting The V.O.I.C.E. NL" },
  items: [
    { id: "nav-home", label: "Home", url: "/", order: 0, visible: true, mobileVisible: true, desktopVisible: true, children: [] },
    {
      id: "nav-pillars",
      label: "Our Pillars",
      url: "",
      order: 1,
      visible: true,
      mobileVisible: true,
      desktopVisible: true,
      children: [
        { id: "nav-experience", label: "Experience", url: "/events", order: 0, visible: true },
        { id: "nav-stories", label: "Stories", url: "/stories", order: 1, visible: true },
        { id: "nav-impact", label: "Impact", url: "/impact", order: 2, visible: true },
        { id: "nav-innovation", label: "Innovation", url: "/voice-venture-studio", order: 3, visible: true },
      ],
    },
    {
      id: "nav-partner",
      label: "Partner With Us",
      url: "",
      order: 2,
      visible: true,
      mobileVisible: true,
      desktopVisible: true,
      children: [
        { id: "nav-membership", label: "Become A Member", url: "/membership", order: 0, visible: true },
        { id: "nav-sponsor", label: "Sponsor Us", url: "/sponsorship", order: 1, visible: true },
        { id: "nav-donate", label: "Donate", url: "/donate", order: 2, visible: true },
      ],
    },
    { id: "nav-about", label: "About Us", url: "/about-us", order: 3, visible: true, mobileVisible: true, desktopVisible: true, children: [] },
  ],
  mobileItems: [],
  settings: {
    stickyHeader: true,
    themeToggleVisible: true,
    loginButtonText: "Log In Or Sign Up",
    loginButtonUrl: "/my-account",
    memberButtonText: "Become A Member",
    memberButtonUrl: "/membership",
    buyTicketsButtonText: "Buy Tickets",
    buyTicketsButtonUrl: "https://www.tickettailor.com/events/stichtingthevoicenl/2185529",
    buyTicketsOpenNewTab: true,
  },
  ctas: [],
  announcementBar: { visible: false, text: "", url: "", style: "info" },
};

async function ensureNavigationDoc() {
  let doc = await SiteNavigation.findOne({ type: "header" });
  if (!doc) {
    doc = await SiteNavigation.create({
      navigationId: "NAV-HEADER-001",
      type: "header",
      draft: DEFAULT_HEADER,
      published: DEFAULT_HEADER,
    });
  }
  return doc;
}

export async function getAdminHeader() {
  const doc = await ensureNavigationDoc();
  return {
    navigationId: doc.navigationId,
    draft: doc.draft,
    published: doc.published,
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy,
  };
}

export async function getPublicHeader() {
  const doc = await ensureNavigationDoc();
  return doc.published || DEFAULT_HEADER;
}

export async function updateHeaderDraft(payload, adminId) {
  const doc = await ensureNavigationDoc();
  if (payload.draft) {
    doc.draft = { ...doc.draft.toObject?.() || doc.draft, ...payload.draft };
  } else {
    Object.assign(doc.draft, payload);
  }
  doc.updatedBy = adminId;
  await doc.save();

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.HEADER_UPDATED,
    targetType: "cms_header",
    targetId: doc.navigationId,
    summary: "Header navigation updated (draft)",
  });

  return getAdminHeader();
}

export async function publishHeader(adminId) {
  const doc = await ensureNavigationDoc();
  doc.published = JSON.parse(JSON.stringify(doc.draft));
  doc.updatedBy = adminId;
  await doc.save();

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.HEADER_UPDATED,
    targetType: "cms_header",
    targetId: doc.navigationId,
    summary: "Header navigation published",
  });

  return getAdminHeader();
}
