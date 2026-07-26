import PageSectionRenderer from "./PageSectionRenderer.jsx";
import { useCmsPage, useCmsSeo } from "../../hooks/useCmsPage.js";

/**
 * @param {boolean} deferReadyToFallback - when true, this page's `fallback`
 *   contains its own async data (e.g. FeaturedEventsCarousel) that should own
 *   the prerender-readiness signal instead of CmsAwarePage marking ready as
 *   soon as its own (unrelated) CMS-content check settles. Only needed for
 *   fallbacks with real async children — plain static fallbacks don't need it.
 */
export default function CmsAwarePage({
  slug,
  fallback,
  append = null,
  preview = false,
  version = "published",
  deferReadyToFallback = false,
}) {
  const { data, loading, hasCms } = useCmsPage(slug, { preview, version });
  const hasRealCmsContent = hasCms && Boolean(data?.sections?.length);
  useCmsSeo(data, { loading, markReady: hasRealCmsContent || !deferReadyToFallback });

  if (loading) {
    return fallback ? fallback : <div className="cms-page-loading">Loading…</div>;
  }

  if (hasCms && data?.sections?.length) {
    return (
      <>
        {preview ? <div className="cms-preview-banner">Preview mode — draft content</div> : null}
        <PageSectionRenderer sections={data.sections} preview={preview} />
        {append}
      </>
    );
  }

  return fallback || null;
}
