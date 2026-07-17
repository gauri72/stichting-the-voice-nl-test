import PageSectionRenderer from "./PageSectionRenderer.jsx";
import { useCmsPage, useCmsSeo } from "../../hooks/useCmsPage.js";

export default function CmsAwarePage({ slug, fallback, append = null, preview = false, version = "published" }) {
  const { data, loading, hasCms } = useCmsPage(slug, { preview, version });
  useCmsSeo(data);

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
