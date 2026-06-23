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
