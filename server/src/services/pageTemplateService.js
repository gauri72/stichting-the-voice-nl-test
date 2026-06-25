import PageTemplate from "../models/PageTemplate.js";
import Page from "../models/Page.js";
import { CMS_AUDIT_ACTIONS } from "../config/cmsConfig.js";
import { logAdminAction } from "./adminAuditService.js";
import { throwError, generateId } from "./cmsValidationService.js";
import { getPageBySlug } from "./pageService.js";

// Named, admin-visible presets — generalizes the per-slug defaults that
// `defaultSectionsForPage()` already applies for system pages (home,
// events/experience) into a selectable gallery for *new* pages.
const SYSTEM_TEMPLATES = [
  {
    templateId: "tpl-landing-page",
    name: "Landing Page",
    category: "marketing",
    description: "Hero, featured events, pillars, CTA banner, stats and sponsors — the Home page layout.",
    sectionBlueprint: [
      { sectionKey: "hero", sectionType: "hero", title: "Hero", content: { heading: "", subheading: "", description: "" }, images: { hero: { url: "", alt: "" } }, order: 0, settings: { themeMode: "dark", textAlign: "center" } },
      { sectionKey: "featured-events", sectionType: "featured_events", title: "Featured Events", content: { variant: "fullHero" }, order: 1 },
      { sectionKey: "pillars", sectionType: "feature_cards", title: "Our Pillars", content: { heading: "Our Pillars", cards: [] }, order: 2 },
      { sectionKey: "get-involved", sectionType: "cta_banner", title: "Get Involved", content: { heading: "Get Involved" }, order: 3 },
      { sectionKey: "impact-stats", sectionType: "statistics", title: "Impact Stats", content: { stats: [] }, order: 4 },
      { sectionKey: "sponsors", sectionType: "sponsor_logos", title: "Sponsors", content: { heading: "Our Sponsors" }, order: 5 },
    ],
  },
  {
    templateId: "tpl-event-page",
    name: "Event Page",
    category: "events",
    description: "Breadcrumb hero, featured events, past highlights slider and testimonials.",
    sectionBlueprint: [
      { sectionKey: "breadcrumb", sectionType: "breadcrumb_hero", title: "Hero", content: { heading: "" }, images: { background: { url: "", alt: "" } }, order: 0 },
      { sectionKey: "featured-events", sectionType: "featured_events", title: "Featured Events", content: { variant: "compactHero" }, order: 1 },
      { sectionKey: "event-highlights", sectionType: "event_slider", title: "Past Event Highlights", order: 2 },
      { sectionKey: "testimonials", sectionType: "testimonials", title: "Testimonials", content: { variant: "community" }, order: 3 },
    ],
  },
  {
    templateId: "tpl-experience-page",
    name: "Experience Page",
    category: "events",
    description: "Breadcrumb hero, an image/text introduction and an events slider.",
    sectionBlueprint: [
      { sectionKey: "breadcrumb", sectionType: "breadcrumb_hero", title: "Hero", content: { heading: "" }, images: { background: { url: "", alt: "" } }, order: 0 },
      { sectionKey: "intro", sectionType: "image_text", title: "Introduction", content: { heading: "", description: "" }, order: 1 },
      { sectionKey: "event-highlights", sectionType: "event_slider", title: "Highlights", order: 2 },
    ],
  },
  {
    templateId: "tpl-story-page",
    name: "Story Page",
    category: "content",
    description: "Breadcrumb hero, an image/text story, testimonials and a photo gallery.",
    sectionBlueprint: [
      { sectionKey: "breadcrumb", sectionType: "breadcrumb_hero", title: "Hero", content: { heading: "" }, images: { background: { url: "", alt: "" } }, order: 0 },
      { sectionKey: "story", sectionType: "image_text", title: "The Story", content: { heading: "", description: "" }, order: 1 },
      { sectionKey: "testimonials", sectionType: "testimonials", title: "Testimonials", order: 2 },
      { sectionKey: "gallery", sectionType: "gallery", title: "Gallery", order: 3 },
    ],
  },
  {
    templateId: "tpl-membership-page",
    name: "Membership Page",
    category: "membership",
    description: "Hero, membership pricing tiers, FAQ and a join CTA.",
    sectionBlueprint: [
      { sectionKey: "hero", sectionType: "hero", title: "Hero", content: { heading: "", subheading: "" }, order: 0, settings: { themeMode: "dark", textAlign: "center" } },
      { sectionKey: "pricing", sectionType: "membership_pricing", title: "Membership Tiers", order: 1 },
      { sectionKey: "faq", sectionType: "faq", title: "FAQ", order: 2 },
      { sectionKey: "join-cta", sectionType: "cta_banner", title: "Join Us", content: { heading: "Become a Member" }, order: 3 },
    ],
  },
  {
    templateId: "tpl-team-page",
    name: "Team Page",
    category: "about",
    description: "Breadcrumb hero, a team members grid and a closing text section.",
    sectionBlueprint: [
      { sectionKey: "breadcrumb", sectionType: "breadcrumb_hero", title: "Hero", content: { heading: "Our Team" }, images: { background: { url: "", alt: "" } }, order: 0 },
      { sectionKey: "team", sectionType: "team_members", title: "Team Members", order: 1 },
      { sectionKey: "closing", sectionType: "text", title: "Closing Note", content: { heading: "", richText: "" }, order: 2 },
    ],
  },
  {
    templateId: "tpl-campaign-page",
    name: "Campaign Page",
    category: "marketing",
    description: "Hero, impact stats, a CTA banner and sponsor logos — for fundraising/campaign pages.",
    sectionBlueprint: [
      { sectionKey: "hero", sectionType: "hero", title: "Hero", content: { heading: "", subheading: "" }, order: 0, settings: { themeMode: "dark", textAlign: "center" } },
      { sectionKey: "stats", sectionType: "statistics", title: "Impact Stats", content: { stats: [] }, order: 1 },
      { sectionKey: "cta", sectionType: "cta_banner", title: "Call To Action", order: 2 },
      { sectionKey: "sponsors", sectionType: "sponsor_logos", title: "Sponsors", order: 3 },
    ],
  },
  {
    templateId: "tpl-dashboard-page",
    name: "Dashboard Page",
    category: "account",
    description: "Breadcrumb hero, a card grid of quick links and a text section.",
    sectionBlueprint: [
      { sectionKey: "breadcrumb", sectionType: "breadcrumb_hero", title: "Hero", content: { heading: "" }, order: 0 },
      { sectionKey: "quick-links", sectionType: "card_grid", title: "Quick Links", order: 1 },
      { sectionKey: "notes", sectionType: "text", title: "Notes", content: { heading: "", richText: "" }, order: 2 },
    ],
  },
];

export { SYSTEM_TEMPLATES };

export async function ensureSystemTemplates() {
  for (const tpl of SYSTEM_TEMPLATES) {
    // eslint-disable-next-line no-await-in-loop
    await PageTemplate.findOneAndUpdate(
      { templateId: tpl.templateId },
      { ...tpl, isSystem: true },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
  return SYSTEM_TEMPLATES.length;
}

export async function listPageTemplates() {
  await ensureSystemTemplates();
  return PageTemplate.find().sort({ category: 1, name: 1 }).lean();
}

export async function getPageTemplate(templateId) {
  const template = await PageTemplate.findOne({ templateId }).lean();
  if (!template) throwError("Template not found.", 404);
  return template;
}

export async function createPageFromTemplate({ slug, title, route, templateId }, adminId) {
  const normalizedSlug = (slug || "").toLowerCase().trim();
  if (!normalizedSlug) throwError("Page slug is required.");
  const existing = await Page.findOne({ slug: normalizedSlug });
  if (existing) throwError("A page with this slug already exists.");

  const template = await getPageTemplate(templateId);
  const sections = template.sectionBlueprint.map((blueprint) => ({
    sectionId: generateId("sec"),
    sectionKey: blueprint.sectionKey,
    sectionType: blueprint.sectionType,
    title: blueprint.title,
    content: blueprint.content || {},
    images: blueprint.images || {},
    ctas: blueprint.ctas || [],
    settings: blueprint.settings || {},
    order: blueprint.order,
    isVisible: true,
    isCustom: true,
  }));

  const { getNextSequence } = await import("../utils/sequence.js");
  const seq = await getNextSequence("cms_page");
  const pageId = `PAGE-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;

  const page = await Page.create({
    pageId,
    slug: normalizedSlug,
    title: title || template.name,
    route: route || `/${normalizedSlug}`,
    status: "draft",
    draftSections: sections,
    publishedSections: [],
    createdBy: adminId,
    updatedBy: adminId,
  });

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.TEMPLATE_USED,
    targetType: "cms_page",
    targetId: page.pageId,
    summary: `Created page "${page.title}" from template "${template.name}"`,
  });

  return getPageBySlug(page.slug, { draft: true });
}
