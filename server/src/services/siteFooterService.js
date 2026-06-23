import SiteFooter from "../models/SiteFooter.js";
import { CMS_AUDIT_ACTIONS } from "../config/cmsConfig.js";
import { logAdminAction } from "./adminAuditService.js";

const DEFAULT_FOOTER = {
  content: {
    heroHeading: "Together, We Can",
    heroSubheading: "Create a Better Tomorrow.",
    missionText: "We believe in positive change through community, creativity, and collaboration.",
    tagline: "",
    copyrightText: "© 2026 Stichting The V.O.I.C.E. NL",
    whatsappButtonText: "Join our WhatsApp group",
    whatsappButtonUrl: "",
    newsletterHeading: "Stay Connected",
    newsletterDescription: "Get updates on events, stories, and impact.",
    backgroundImage: { url: "", alt: "" },
    logo: { url: "", alt: "Stichting The V.O.I.C.E. NL" },
  },
  quickLinks: [
    { id: "fl-home", label: "Home", url: "/", icon: "IconHome", order: 0, visible: true },
    { id: "fl-events", label: "Experience", url: "/events", icon: "IconSparkles", order: 1, visible: true },
    { id: "fl-membership", label: "Become a member", url: "/membership", icon: "IconCrown", order: 2, visible: true },
    { id: "fl-sponsor", label: "Sponsor us", url: "/sponsorship", icon: "IconHeartHandshake", order: 3, visible: true },
    { id: "fl-donate", label: "Donate", url: "/donate", icon: "IconGift", order: 4, visible: true },
    { id: "fl-stories", label: "Stories", url: "/stories", icon: "IconMicrophone", order: 5, visible: true },
    { id: "fl-impact", label: "Impact", url: "/impact", icon: "IconHeartHandshake", order: 6, visible: true },
    { id: "fl-innovation", label: "Innovation", url: "/voice-venture-studio", icon: "IconBulb", order: 7, visible: true },
    { id: "fl-about", label: "About us", url: "/about-us", icon: "IconUsers", order: 8, visible: true },
    { id: "fl-policies", label: "Policies, terms & conditions", url: "/privacy-policy", icon: "IconShield", order: 9, visible: true },
  ],
  socialLinks: [
    { id: "soc-fb", platform: "Facebook", label: "Facebook", url: "https://www.facebook.com/p/The-VOICE-NL-61552129209396/", icon: "IconBrandFacebook", visible: true, order: 0 },
    { id: "soc-ig", platform: "Instagram", label: "Instagram", url: "https://www.instagram.com/stichting_the_voice_nl/?hl=en", icon: "IconBrandInstagram", visible: true, order: 1 },
    { id: "soc-li", platform: "LinkedIn", label: "LinkedIn", url: "https://www.linkedin.com/in/stichting-the-v-o-i-c-e-nl-b67427316/", icon: "IconBrandLinkedin", visible: true, order: 2 },
    { id: "soc-yt", platform: "YouTube", label: "YouTube", url: "https://www.youtube.com/@StichtingTheVOICENL", icon: "IconBrandYoutube", visible: true, order: 3 },
    { id: "soc-x", platform: "X", label: "X", url: "https://x.com/St_The_VOICE_NL", icon: "IconBrandX", visible: true, order: 4 },
  ],
  ctas: [],
  contactDetails: {
    kvk: "92180213",
    address: "Netherlands",
    email: "info@stichtingthevoice.nl",
    phone: "+31619032104",
  },
  settings: { showVentureStudio: true },
  sectionOrder: ["hero", "quickLinks", "contact", "social", "newsletter", "copyright"],
};

async function ensureFooterDoc() {
  let doc = await SiteFooter.findOne();
  if (!doc) {
    doc = await SiteFooter.create({
      footerId: "FOOTER-001",
      draft: DEFAULT_FOOTER,
      published: DEFAULT_FOOTER,
    });
  }
  return doc;
}

export async function getAdminFooter() {
  const doc = await ensureFooterDoc();
  return {
    footerId: doc.footerId,
    draft: doc.draft,
    published: doc.published,
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy,
  };
}

export async function getPublicFooter() {
  const doc = await ensureFooterDoc();
  return doc.published || DEFAULT_FOOTER;
}

export async function updateFooterDraft(payload, adminId) {
  const doc = await ensureFooterDoc();
  if (payload.draft) {
    doc.draft = { ...doc.draft.toObject?.() || doc.draft, ...payload.draft };
  } else {
    Object.assign(doc.draft, payload);
  }
  doc.updatedBy = adminId;
  await doc.save();

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.FOOTER_UPDATED,
    targetType: "cms_footer",
    targetId: doc.footerId,
    summary: "Footer updated (draft)",
  });

  return getAdminFooter();
}

export async function publishFooter(adminId) {
  const doc = await ensureFooterDoc();
  doc.published = JSON.parse(JSON.stringify(doc.draft));
  doc.updatedBy = adminId;
  await doc.save();

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.FOOTER_UPDATED,
    targetType: "cms_footer",
    targetId: doc.footerId,
    summary: "Footer published",
  });

  return getAdminFooter();
}
