/** Shared DOM-mutation helpers for per-page SEO tags — used by useCmsSeo and useSeo. */

export function setMetaTag(name, content, attribute = "name") {
  if (!content) return;
  let el = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attribute, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function setCanonicalLink(href) {
  if (!href) return;
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Deterministic readiness signal the prerender script waits on — must only be
 * set once a page's real content (or definitive "nothing to show") is
 * resolved, never on first render while data is still loading.
 */
export function markPrerenderReady() {
  document.documentElement.setAttribute("data-prerender-ready", "true");
}
