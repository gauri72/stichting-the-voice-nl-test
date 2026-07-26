/**
 * Single source of truth for "which public URLs does this site have" — used
 * by both the prerender script and the sitemap generator. Static routes are
 * hardcoded below; dynamic ones (V.Commerce businesses, sessions) are pulled
 * from the same public API endpoints the app itself uses.
 */

const API_BASE = (process.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

// Matches how business/session slugs are actually generated server-side
// (lowercase, trimmed) — anything outside this is rejected rather than used
// to build a URL or a dist/ file path.
const SAFE_SLUG = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

// Critical: if any of these fail to prerender, the whole build fails rather
// than shipping a degraded version of the site's most important pages.
export const CRITICAL_ROUTES = new Set(["/", "/events", "/membership", "/donate"]);

const STATIC_ROUTES = [
  "/",
  "/about-us",
  "/contact-us",
  "/stories",
  "/impact",
  "/voice-venture-studio",
  "/donate",
  "/sponsorship",
  "/membership",
  "/events",
  "/privacy-policy",
  "/terms-and-conditions",
];

async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`${path} responded ${res.status}`);
  }
  return res.json();
}

function validSlug(slug) {
  return typeof slug === "string" && SAFE_SLUG.test(slug);
}

async function enumerateBusinessSlugs() {
  const slugs = [];
  let page = 1;
  const pageSize = 50;
  // Businesses list is already filtered to status: "active" server-side.
  for (;;) {
    const result = await fetchJson(`/api/vcommerce?page=${page}&pageSize=${pageSize}`);
    for (const item of result.items || []) {
      if (validSlug(item.slug)) {
        slugs.push(item.slug);
      } else if (item.slug) {
        console.warn(`[enumerate-routes] Skipping invalid business slug: ${JSON.stringify(item.slug)}`);
      }
    }
    if (page >= (result.totalPages || 1)) break;
    page += 1;
  }
  return slugs;
}

async function enumerateSessionSlugs() {
  const result = await fetchJson("/api/public/sessions");
  const slugs = [];
  for (const session of result.sessions || []) {
    if (validSlug(session.slug)) {
      slugs.push(session.slug);
    } else if (session.slug) {
      console.warn(`[enumerate-routes] Skipping invalid session slug: ${JSON.stringify(session.slug)}`);
    }
  }
  return slugs;
}

/**
 * @returns {Promise<string[]>} every public route path to prerender/sitemap,
 *   e.g. ["/", "/events", "/vcommerce/some-business", "/sessions/some-slug"]
 */
export async function enumerateRoutes() {
  const [businessSlugs, sessionSlugs] = await Promise.all([
    enumerateBusinessSlugs(),
    enumerateSessionSlugs(),
  ]);

  return [
    ...STATIC_ROUTES,
    ...businessSlugs.map((slug) => `/vcommerce/${slug}`),
    ...sessionSlugs.map((slug) => `/sessions/${slug}`),
  ];
}
