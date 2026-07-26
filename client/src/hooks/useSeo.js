import { useEffect } from "react";
import { setMetaTag, setCanonicalLink, markPrerenderReady } from "../utils/seoMeta.js";

/**
 * Per-page SEO tags for content that isn't CMS-backed (see useCmsSeo for
 * that case). Also sets the prerender-readiness marker.
 *
 * @param {{ title?: string, description?: string, ogImage?: string,
 *   canonicalUrl?: string, noindex?: boolean }} seo
 * @param {{ loading?: boolean, markReady?: boolean }} options - pass
 *   `loading` when the caller has its own async data fetch, so tags/marker
 *   only fire once it settles. Omit (or pass loading: false) for pages with
 *   no async data of their own. Pass `markReady: false` when some other
 *   component on the page (e.g. an embedded carousel with its own fetch)
 *   owns the actual readiness signal — this call then only sets tags.
 */
export function useSeo(seo = {}, { loading = false, markReady = true } = {}) {
  const { title, description, ogImage, canonicalUrl, noindex } = seo;

  useEffect(() => {
    if (loading) return;

    if (title) document.title = title;
    setMetaTag("description", description);
    if (noindex) setMetaTag("robots", "noindex, nofollow");
    setMetaTag("og:title", title, "property");
    setMetaTag("og:description", description, "property");
    if (ogImage) setMetaTag("og:image", ogImage, "property");
    setMetaTag("og:url", window.location.href, "property");
    if (canonicalUrl) setCanonicalLink(canonicalUrl);

    if (markReady) markPrerenderReady();
  }, [title, description, ogImage, canonicalUrl, noindex, loading, markReady]);
}
