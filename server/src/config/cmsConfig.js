export const PAGE_STATUSES = ["draft", "published", "archived"];

export const VERSION_STATUSES = ["draft", "published", "archived"];

export const SECTION_TYPES = [
  "hero",
  "breadcrumb_hero",
  "text",
  "image_text",
  "card_grid",
  "feature_cards",
  "statistics",
  "cta_banner",
  "testimonials",
  "event_slider",
  "featured_events",
  "gallery",
  "video",
  "faq",
  "form",
  "sponsor_logos",
  "donation_cta",
  "membership_pricing",
  "contact_details",
  "footer_links",
  "header_navigation",
  "custom_html",
];

export const IMAGE_FOCUS_POSITIONS = ["center", "top", "bottom", "left", "right"];

export const CTA_STYLES = ["primary", "secondary", "outline", "gradient", "ghost"];

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];

export const MAX_IMAGE_SIZE_BYTES = 6 * 1024 * 1024;

export const CMS_ROLES = {
  superadmin: {
    permissions: ["*"],
  },
  admin: {
    permissions: ["pages.read", "pages.write", "pages.publish", "header.write", "footer.write", "upload"],
  },
  event_manager: {
    permissions: ["pages.read", "pages.write", "pages.publish", "upload"],
    allowedSectionTypes: ["event_slider", "featured_events", "testimonials", "hero", "breadcrumb_hero", "text", "cta_banner"],
  },
  viewer: {
    permissions: ["pages.read"],
  },
  finance: {
    permissions: ["pages.read"],
  },
};

export const CMS_AUDIT_ACTIONS = {
  PAGE_CREATED: "cms_page_created",
  PAGE_UPDATED: "cms_page_updated",
  SECTION_UPDATED: "cms_section_updated",
  SECTION_REORDERED: "cms_section_reordered",
  SECTION_HIDDEN: "cms_section_hidden",
  SECTION_PUBLISHED: "cms_section_published",
  PAGE_PUBLISHED: "cms_page_published",
  HEADER_UPDATED: "cms_header_updated",
  FOOTER_UPDATED: "cms_footer_updated",
  IMAGE_UPLOADED: "cms_image_uploaded",
  CTA_CHANGED: "cms_cta_changed",
  VERSION_RESTORED: "cms_version_restored",
};

export const DEFAULT_PAGES = [
  { slug: "home", title: "Home", route: "/" },
  { slug: "events", title: "Events", route: "/events" },
  { slug: "experience", title: "Experience", route: "/events" },
  { slug: "membership", title: "Membership", route: "/membership" },
  { slug: "stories", title: "Stories", route: "/stories" },
  { slug: "impact", title: "Impact", route: "/impact" },
  { slug: "innovation", title: "Innovation", route: "/voice-venture-studio" },
  { slug: "sponsor-us", title: "Sponsor Us", route: "/sponsorship" },
  { slug: "donate", title: "Donate", route: "/donate" },
  { slug: "about-us", title: "About Us", route: "/about-us" },
  { slug: "contact", title: "Contact", route: "/contact-us" },
  { slug: "policies-terms-conditions", title: "Policies, Terms & Conditions", route: "/privacy-policy" },
  { slug: "privacy-policy", title: "Privacy Policy", route: "/privacy-policy" },
  { slug: "terms-and-conditions", title: "Terms and Conditions", route: "/terms-and-conditions" },
  { slug: "volunteer-application", title: "Volunteer Application", route: "/#volunteer" },
  { slug: "request-for-query", title: "Request for Query", route: "/contact-us" },
  { slug: "request-for-quote", title: "Request for Quote", route: "/contact-us" },
  { slug: "testimonials", title: "Testimonials", route: "/testimonials" },
  { slug: "footer", title: "Footer", route: "/footer" },
  { slug: "header", title: "Header / Navigation", route: "/header" },
];

export function hasCmsPermission(role, permission) {
  const config = CMS_ROLES[role] || CMS_ROLES.viewer;
  if (config.permissions.includes("*")) return true;
  return config.permissions.includes(permission);
}

export function canEditSectionType(role, sectionType) {
  const config = CMS_ROLES[role] || CMS_ROLES.viewer;
  if (config.permissions.includes("*")) return true;
  if (!config.allowedSectionTypes) return hasCmsPermission(role, "pages.write");
  return config.allowedSectionTypes.includes(sectionType);
}
