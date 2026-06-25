import DOMPurify from "dompurify";

/**
 * Client-side defense-in-depth for every dangerouslySetInnerHTML call site.
 * The server already sanitizes admin/CMS-authored HTML at save time
 * (cmsValidationService.js); this is a second layer so a single missed
 * write path doesn't become a stored-XSS vector.
 */
export function sanitizeHtml(html) {
  if (!html) return "";
  return DOMPurify.sanitize(String(html), {
    ADD_ATTR: ["target"],
  });
}
