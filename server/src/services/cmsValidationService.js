import crypto from "crypto";

export function throwError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

export function generateId(prefix = "") {
  const id = crypto.randomUUID();
  return prefix ? `${prefix}-${id}` : id;
}

const INTERNAL_PATH_PATTERN = /^\/([a-z0-9-]+(\/[a-z0-9-]+)*)?(\?.*)?(#.*)?$/i;
const EXTERNAL_URL_PATTERN = /^https?:\/\/.+/i;
const MAILTO_PATTERN = /^mailto:.+/i;
const TEL_PATTERN = /^tel:.+/i;
const HASH_PATH_PATTERN = /^#.+$/;

export function validateUrl(url, { allowEmpty = true, fieldName = "URL" } = {}) {
  if (!url || url.trim() === "") {
    if (allowEmpty) return "";
    throwError(`${fieldName} is required.`);
  }
  const trimmed = url.trim();
  if (
    INTERNAL_PATH_PATTERN.test(trimmed) ||
    EXTERNAL_URL_PATTERN.test(trimmed) ||
    MAILTO_PATTERN.test(trimmed) ||
    TEL_PATTERN.test(trimmed) ||
    HASH_PATH_PATTERN.test(trimmed)
  ) {
    return trimmed;
  }
  throwError(`Invalid ${fieldName}: "${trimmed}"`);
}

import sanitizeHtmlLib from "sanitize-html";

const HTML_ALLOWED_TAGS = sanitizeHtmlLib.defaults.allowedTags.concat([
  "img",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "figure",
  "figcaption",
  "video",
  "source",
  "iframe",
]);

const HTML_ALLOWED_ATTRIBUTES = {
  ...sanitizeHtmlLib.defaults.allowedAttributes,
  img: ["src", "alt", "title", "width", "height", "loading"],
  a: ["href", "name", "target", "rel", "title"],
  iframe: ["src", "title", "width", "height", "allow", "allowfullscreen", "frameborder"],
  video: ["src", "controls", "width", "height", "poster"],
  source: ["src", "type"],
  "*": ["class", "id", "style"],
};

export function sanitizeHtml(html = "") {
  if (!html || typeof html !== "string") return "";
  return sanitizeHtmlLib(html, {
    allowedTags: HTML_ALLOWED_TAGS,
    allowedAttributes: HTML_ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto", "tel", "data"],
    allowedSchemesByTag: {
      iframe: ["https"],
    },
    allowVulnerableTags: false,
    disallowedTagsMode: "discard",
  });
}

export function sanitizeSection(section) {
  if (!section || typeof section !== "object") return section;
  const copy = JSON.parse(JSON.stringify(section));
  if (copy.content?.richText) {
    copy.content.richText = sanitizeHtml(copy.content.richText);
  }
  if (copy.content?.longContent) {
    copy.content.longContent = sanitizeHtml(copy.content.longContent);
  }
  if (copy.content?.customHtml) {
    copy.content.customHtml = sanitizeHtml(copy.content.customHtml);
  }
  if (Array.isArray(copy.ctas)) {
    copy.ctas = copy.ctas.map((cta) => ({
      ...cta,
      url: validateUrl(cta.url, { allowEmpty: true, fieldName: "CTA URL" }),
    }));
  }
  return copy;
}

export function sortSections(sections = []) {
  return [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function normalizeSectionOrders(sections = []) {
  return sortSections(sections).map((section, index) => ({
    ...section,
    order: index,
  }));
}

export function getVisibleSections(sections = []) {
  return sortSections(sections).filter((s) => s.isVisible !== false);
}
