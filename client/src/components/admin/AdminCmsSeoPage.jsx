import { Fragment, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconAlertTriangle, IconArrowLeft, IconCheck, IconDeviceFloppy } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { canWritePages } from "../../utils/pagesAdmin.js";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import "../../styles/admin-cms-page.css";

const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;

function seoWarnings(seo = {}) {
  const warnings = [];
  const titleLen = (seo.metaTitle || "").length;
  const descLen = (seo.metaDescription || "").length;
  if (!titleLen) warnings.push("Missing meta title");
  else if (titleLen < TITLE_MIN || titleLen > TITLE_MAX) warnings.push(`Meta title length (${titleLen}) outside ${TITLE_MIN}-${TITLE_MAX} chars`);
  if (!descLen) warnings.push("Missing meta description");
  else if (descLen < DESC_MIN || descLen > DESC_MAX) warnings.push(`Meta description length (${descLen}) outside ${DESC_MIN}-${DESC_MAX} chars`);
  if (!seo.ogImage?.url) warnings.push("Missing OG image");
  return warnings;
}

function SeoPreview({ title, route, seo }) {
  const domain = "stichtingthevoice.nl";
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
      <div style={{ maxWidth: 480, padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, fontFamily: "arial, sans-serif" }}>
        <div style={{ color: "#1a0dab", fontSize: 18, lineHeight: 1.3 }}>{seo.metaTitle || title}</div>
        <div style={{ color: "#006621", fontSize: 13 }}>{domain}{route}</div>
        <div style={{ color: "#545454", fontSize: 13, marginTop: 2 }}>{seo.metaDescription || "No meta description set."}</div>
      </div>
      <div style={{ maxWidth: 320, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ height: 100, background: seo.ogImage?.url ? `url(${seo.ogImage.url}) center/cover` : "#1f2937", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12 }}>
          {!seo.ogImage?.url ? "No OG image" : null}
        </div>
        <div style={{ padding: 8, fontFamily: "arial, sans-serif" }}>
          <div style={{ fontSize: 11, color: "#65676b", textTransform: "uppercase" }}>{domain}</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{seo.ogTitle || seo.metaTitle || title}</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCmsSeoPage() {
  const { admin } = useAdminAuth();
  const readOnly = !canWritePages(admin?.role);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSlug, setExpandedSlug] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/admin/pages?includeSeo=true", { headers: adminAuthHeaders() });
      setPages(data.pages || []);
    } catch (err) {
      setError(err.message || "Could not load pages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleExpand(page) {
    if (expandedSlug === page.slug) {
      setExpandedSlug(null);
      return;
    }
    setExpandedSlug(page.slug);
    setDrafts((prev) => ({ ...prev, [page.slug]: prev[page.slug] || { ...page.seo } }));
  }

  function setField(slug, field, value) {
    setDrafts((prev) => ({ ...prev, [slug]: { ...prev[slug], [field]: value } }));
  }

  async function save(slug) {
    setSaving(true);
    try {
      await apiFetch(`/api/admin/pages/${slug}`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ seo: drafts[slug] }),
      });
      await load();
    } catch (err) {
      alert(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout pageTitle="SEO Manager" pageSubtitle="All pages at a glance — meta titles, descriptions and previews.">
      <div className="admin-cms">
        {error ? <p className="admin-cms__error">{error}</p> : null}
        {loading ? <p className="admin-cms__status">Loading…</p> : null}
        <div className="admin-cms__table-wrap">
          <table className="admin-cms__table">
            <thead>
              <tr><th>Page</th><th>Route</th><th>Meta title</th><th>Issues</th><th></th></tr>
            </thead>
            <tbody>
              {pages.map((page) => {
                const warnings = seoWarnings(page.seo);
                const isOpen = expandedSlug === page.slug;
                const draft = drafts[page.slug] || page.seo || {};
                return (
                  <Fragment key={page.slug}>
                    <tr>
                      <td><strong>{page.title}</strong></td>
                      <td><code>{page.route}</code></td>
                      <td>{page.seo?.metaTitle || <em>Not set</em>}</td>
                      <td>
                        {warnings.length ? (
                          <span style={{ color: "#b45309", display: "flex", alignItems: "center", gap: 4 }}>
                            <IconAlertTriangle size={14} /> {warnings.length}
                          </span>
                        ) : (
                          <span style={{ color: "#16a34a", display: "flex", alignItems: "center", gap: 4 }}>
                            <IconCheck size={14} /> Good
                          </span>
                        )}
                      </td>
                      <td>
                        <button type="button" className="admin-cms__btn admin-cms__btn--sm" onClick={() => toggleExpand(page)}>
                          {isOpen ? "Close" : "Edit"}
                        </button>
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr>
                        <td colSpan={5}>
                          {warnings.length ? (
                            <ul style={{ color: "#b45309", margin: "0 0 8px", paddingLeft: 18 }}>
                              {warnings.map((w) => <li key={w}>{w}</li>)}
                            </ul>
                          ) : null}
                          <div className="admin-cms__field-row">
                            <label className="admin-cms__label">Meta title</label>
                            <input className="admin-cms__input" value={draft.metaTitle || ""} maxLength={200} onChange={(e) => setField(page.slug, "metaTitle", e.target.value)} disabled={readOnly} />
                          </div>
                          <div className="admin-cms__field-row">
                            <label className="admin-cms__label">Meta description</label>
                            <textarea className="admin-cms__textarea" rows={2} maxLength={500} value={draft.metaDescription || ""} onChange={(e) => setField(page.slug, "metaDescription", e.target.value)} disabled={readOnly} />
                          </div>
                          <div className="admin-cms__field-row">
                            <label className="admin-cms__label">OG title</label>
                            <input className="admin-cms__input" value={draft.ogTitle || ""} onChange={(e) => setField(page.slug, "ogTitle", e.target.value)} disabled={readOnly} />
                          </div>
                          <SeoPreview title={page.title} route={page.route} seo={draft} />
                          {!readOnly ? (
                            <button type="button" className="admin-cms__btn admin-cms__btn--primary admin-cms__btn--sm" style={{ marginTop: 12 }} onClick={() => save(page.slug)} disabled={saving}>
                              <IconDeviceFloppy size={14} /> Save SEO
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 16 }}>
          <Link to="/admin/cms" className="admin-cms__back"><IconArrowLeft size={16} /> Back to CMS</Link>
        </p>
      </div>
    </AdminLayout>
  );
}
