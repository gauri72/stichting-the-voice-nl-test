export const CMS_PERMISSIONS = {
  superadmin: ["*"],
  admin: ["pages.read", "pages.write", "pages.publish", "header.write", "footer.write", "upload"],
  event_manager: ["pages.read", "pages.write", "pages.publish", "upload"],
  viewer: ["pages.read"],
  finance: ["pages.read"],
};

export const SECTION_TYPE_LABELS = {
  hero: "Hero Section",
  breadcrumb_hero: "Breadcrumb Hero",
  text: "Text Section",
  image_text: "Image + Text",
  card_grid: "Card Grid",
  feature_cards: "Feature Cards",
  statistics: "Statistics",
  cta_banner: "CTA Banner",
  testimonials: "Testimonials",
  event_slider: "Event Slider",
  featured_events: "Featured Events",
  gallery: "Gallery",
  video: "Video Section",
  faq: "FAQ Section",
  form: "Form Section",
  sponsor_logos: "Sponsor Logos",
  donation_cta: "Donation CTA",
  membership_pricing: "Membership Pricing",
  contact_details: "Contact Details",
  footer_links: "Footer Links",
  header_navigation: "Header Navigation",
  custom_html: "Custom HTML Block",
  team_members: "Our Team Slider",
};

export const CTA_STYLES = ["primary", "secondary", "outline", "gradient", "ghost"];
export const FOCUS_POSITIONS = ["center", "top", "bottom", "left", "right"];

export const PAGE_SLUG_MAP = {
  "/": "home",
  "/events": "events",
  "/membership": "membership",
  "/stories": "stories",
  "/impact": "impact",
  "/voice-venture-studio": "innovation",
  "/sponsorship": "sponsor-us",
  "/donate": "donate",
  "/about-us": "about-us",
  "/contact-us": "contact",
  "/contact": "contact",
  "/privacy-policy": "privacy-policy",
  "/terms-and-conditions": "terms-and-conditions",
  "/testimonials": "testimonials",
};

export function hasCmsPermission(role, permission) {
  const perms = CMS_PERMISSIONS[role] || CMS_PERMISSIONS.viewer;
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export function canWritePages(role) {
  return hasCmsPermission(role, "pages.write");
}

export function canPublishPages(role) {
  return hasCmsPermission(role, "pages.publish");
}

export function formatSectionType(type) {
  return SECTION_TYPE_LABELS[type] || type;
}

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusBadgeClass(status) {
  if (status === "published") return "admin-cms__badge--published";
  if (status === "archived") return "admin-cms__badge--archived";
  return "admin-cms__badge--draft";
}

export const SYSTEM_PAGE_SLUGS = new Set([
  "home",
  "events",
  "membership",
  "stories",
  "impact",
  "innovation",
  "sponsor-us",
  "donate",
  "about-us",
  "contact",
  "privacy-policy",
  "terms-and-conditions",
  "testimonials",
]);

export function isSystemPageSlug(slug) {
  return SYSTEM_PAGE_SLUGS.has(String(slug || "").toLowerCase());
}

export const PAGE_FILTER_OPTIONS = [
  { id: "all", label: "All pages" },
  { id: "main", label: "Main pages" },
  { id: "sub", label: "Sub pages" },
  { id: "policy", label: "Policy pages" },
  { id: "system", label: "System pages" },
  { id: "custom", label: "Custom pages" },
  { id: "draft", label: "Draft" },
  { id: "published", label: "Published" },
  { id: "archived", label: "Archived" },
];

export function classifyPage(page) {
  const slug = page.slug || "";
  const route = page.route || "";
  const isSystem = isSystemPageSlug(slug);
  const isPolicy = /policy|terms|privacy|policies/i.test(slug) || /policy|terms/i.test(route);
  const isSub = route.includes("-copy") || slug.includes("copy") || (route.split("/").filter(Boolean).length > 1 && !isPolicy);
  return { isSystem, isPolicy, isSub, isCustom: !isSystem && !page.isSystem };
}

export function filterPages(pages, filterId) {
  if (!filterId || filterId === "all") return pages;
  return pages.filter((page) => {
    const meta = classifyPage(page);
    switch (filterId) {
      case "main":
        return !meta.isSub && !meta.isPolicy && page.status !== "archived";
      case "sub":
        return meta.isSub;
      case "policy":
        return meta.isPolicy;
      case "system":
        return meta.isSystem;
      case "custom":
        return meta.isCustom;
      case "draft":
        return page.status === "draft";
      case "published":
        return page.status === "published";
      case "archived":
        return page.status === "archived";
      default:
        return true;
    }
  });
}

export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  if (!allowed.includes(file.type)) {
    throw new Error("Unsupported image type. Use JPG, PNG, WEBP, or SVG.");
  }
  if (file.size > 6 * 1024 * 1024) {
    throw new Error("Image must be under 6MB.");
  }
}

export function slugFromPath(pathname) {
  if (PAGE_SLUG_MAP[pathname]) return PAGE_SLUG_MAP[pathname];
  const clean = pathname.replace(/^\//, "").replace(/\/$/, "");
  return clean || "home";
}
