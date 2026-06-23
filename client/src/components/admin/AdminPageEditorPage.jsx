import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  IconArrowLeft,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconPlus,
  IconRocket,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import CmsSectionList from "./cms/CmsSectionList.jsx";
import CmsSectionEditor from "./cms/CmsSectionEditor.jsx";
import CmsSeoPanel from "./cms/CmsSeoPanel.jsx";
import CmsVersionHistory from "./cms/CmsVersionHistory.jsx";
import CmsPagePreview from "./cms/CmsPagePreview.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { canPublishPages, canWritePages, formatSectionType } from "../../utils/pagesAdmin.js";
import "../../styles/admin-cms-page.css";

const MOBILE_TABS = ["sections", "edit", "preview", "settings"];

export default function AdminPageEditorPage() {
  const { pageSlug } = useParams();
  const [searchParams] = useSearchParams();
  const { admin } = useAdminAuth();
  const readOnly = !canWritePages(admin?.role);
  const canPublish = canPublishPages(admin?.role);

  const [page, setPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [seo, setSeo] = useState({});
  const [versions, setVersions] = useState([]);
  const [config, setConfig] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [mobileTab, setMobileTab] = useState("sections");
  const [previewMode, setPreviewMode] = useState("desktop");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionType, setNewSectionType] = useState("text");

  const selectedSection = useMemo(
    () => sections.find((s) => s.sectionId === selectedId) || null,
    [sections, selectedId]
  );

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pageData, configData, versionsData] = await Promise.all([
        apiFetch(`/api/admin/pages/${pageSlug}`, { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/pages/config", { headers: adminAuthHeaders() }).catch(() => ({})),
        apiFetch(`/api/admin/pages/${pageSlug}/versions`, { headers: adminAuthHeaders() }).catch(() => ({ versions: [] })),
      ]);
      setPage(pageData);
      setSections(pageData.sections || pageData.draftSections || []);
      setSeo(pageData.seo || {});
      setVersions(versionsData.versions || pageData.versions || []);
      setConfig(configData);
      if (!selectedId && (pageData.sections || pageData.draftSections || [])[0]) {
        setSelectedId((pageData.sections || pageData.draftSections)[0].sectionId);
      }
    } catch (err) {
      setError(err.message || "Could not load page.");
    } finally {
      setLoading(false);
    }
  }, [pageSlug]);

  useEffect(() => { loadPage(); }, [pageSlug]);

  useEffect(() => {
    if (searchParams.get("tab") === "versions") setMobileTab("settings");
  }, [searchParams]);

  function updateSectionLocal(updated) {
    setSections((prev) => prev.map((s) => (s.sectionId === updated.sectionId ? updated : s)));
  }

  async function saveDraft() {
    setSaving(true);
    setMessage("");
    try {
      const data = await apiFetch(`/api/admin/pages/${pageSlug}/save-draft`, {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ draftSections: sections, seo, changeNote: "Draft saved from editor" }),
      });
      setPage(data);
      setSections(data.sections || data.draftSections || []);
      setVersions(data.versions || versions);
      setMessage("Draft saved.");
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!canPublish) return;
    setSaving(true);
    try {
      await saveDraft();
      const data = await apiFetch(`/api/admin/pages/${pageSlug}/publish`, {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ changeNote: "Published from editor" }),
      });
      setPage(data);
      setMessage("Published successfully.");
    } catch (err) {
      setError(err.message || "Publish failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReorder(sectionOrder) {
    setSections((prev) => {
      const map = new Map(sectionOrder.map((id, i) => [id, i]));
      return [...prev].sort((a, b) => (map.get(a.sectionId) ?? a.order) - (map.get(b.sectionId) ?? b.order))
        .map((s, i) => ({ ...s, order: i }));
    });
    if (!readOnly) {
      try {
        const data = await apiFetch(`/api/admin/pages/${pageSlug}/sections/reorder`, {
          method: "POST",
          headers: adminAuthHeaders(),
          body: JSON.stringify({ sectionOrder }),
        });
        setSections(data.sections || data.draftSections || []);
      } catch (err) {
        setError(err.message);
      }
    }
  }

  function moveSection(sectionId, direction) {
    const ids = sections.map((s) => s.sectionId);
    const idx = ids.indexOf(sectionId);
    const swap = direction === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= ids.length) return;
    [ids[idx], ids[swap]] = [ids[swap], ids[idx]];
    handleReorder(ids);
  }

  async function toggleVisibility(sectionId) {
    if (readOnly) return;
    const data = await apiFetch(`/api/admin/pages/${pageSlug}/sections/${sectionId}/toggle-visibility`, {
      method: "POST",
      headers: adminAuthHeaders(),
    });
    setSections(data.sections || data.draftSections || []);
  }

  async function duplicateSection(sectionId) {
    const data = await apiFetch(`/api/admin/pages/${pageSlug}/sections/${sectionId}/duplicate`, {
      method: "POST",
      headers: adminAuthHeaders(),
    });
    setSections(data.sections || data.draftSections || []);
  }

  async function deleteSection(sectionId) {
    if (!confirm("Delete this custom section?")) return;
    const data = await apiFetch(`/api/admin/pages/${pageSlug}/sections/${sectionId}`, {
      method: "DELETE",
      headers: adminAuthHeaders(),
    });
    setSections(data.sections || data.draftSections || []);
    if (selectedId === sectionId) setSelectedId(null);
  }

  async function addSection() {
    const data = await apiFetch(`/api/admin/pages/${pageSlug}/sections`, {
      method: "POST",
      headers: adminAuthHeaders(),
      body: JSON.stringify({ sectionType: newSectionType, title: formatSectionType(newSectionType) }),
    });
    setSections(data.sections || data.draftSections || []);
    setShowAddSection(false);
  }

  async function restoreVersion(versionId) {
    if (!confirm("Restore this version to draft?")) return;
    const data = await apiFetch(`/api/admin/pages/${pageSlug}/restore-version`, {
      method: "POST",
      headers: adminAuthHeaders(),
      body: JSON.stringify({ versionId }),
    });
    setSections(data.sections || data.draftSections || []);
    setSeo(data.seo || {});
    setMessage("Version restored to draft.");
  }

  const editorPanel = (
    <CmsSectionEditor
      section={selectedSection}
      onChange={updateSectionLocal}
      config={config}
      readOnly={readOnly}
    />
  );

  return (
    <AdminLayout
      pageTitle={page?.title || pageSlug}
      pageSubtitle={page?.route || ""}
      hideBottomNav
    >
      <div className="admin-cms admin-cms--editor">
        <div className="admin-cms__editor-topbar">
          <Link to="/admin/pages" className="admin-cms__back">
            <IconArrowLeft size={18} /> Website Pages
          </Link>
          <div className="admin-cms__editor-actions">
            <a href={`/preview/${pageSlug}?version=draft`} target="_blank" rel="noopener noreferrer" className="admin-cms__btn admin-cms__btn--outline">
              Preview
            </a>
            {!readOnly ? (
              <>
                <button type="button" className="admin-cms__btn admin-cms__btn--outline" onClick={saveDraft} disabled={saving}>
                  <IconDeviceFloppy size={16} /> Save draft
                </button>
                {canPublish ? (
                  <button type="button" className="admin-cms__btn admin-cms__btn--primary" onClick={publish} disabled={saving}>
                    <IconRocket size={16} /> Publish
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        {error ? <p className="admin-cms__error">{error}</p> : null}
        {message ? <p className="admin-cms__success">{message}</p> : null}
        {loading ? <p className="admin-cms__status">Loading editor…</p> : null}

        <div className="admin-cms__mobile-tabs">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={mobileTab === tab ? "active" : ""}
              onClick={() => setMobileTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="admin-cms__editor-layout">
          <aside className={`admin-cms__panel admin-cms__panel--sections${mobileTab === "sections" ? " admin-cms__panel--mobile-active" : ""}`}>
            <div className="admin-cms__panel-header">
              <h3>Sections</h3>
              {!readOnly ? (
                <button type="button" className="admin-cms__btn admin-cms__btn--sm" onClick={() => setShowAddSection(true)}>
                  <IconPlus size={14} /> Add
                </button>
              ) : null}
            </div>
            {showAddSection ? (
              <div className="admin-cms__add-section">
                <select className="admin-cms__select" value={newSectionType} onChange={(e) => setNewSectionType(e.target.value)}>
                  {(config?.sectionTypes || ["text", "hero", "cta_banner"]).map((t) => (
                    <option key={t} value={t}>{formatSectionType(t)}</option>
                  ))}
                </select>
                <button type="button" className="admin-cms__btn admin-cms__btn--primary admin-cms__btn--sm" onClick={addSection}>Add section</button>
                <button type="button" className="admin-cms__btn admin-cms__btn--sm" onClick={() => setShowAddSection(false)}>Cancel</button>
              </div>
            ) : null}
            <CmsSectionList
              sections={sections}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onReorder={handleReorder}
              onMoveUp={(id) => moveSection(id, "up")}
              onMoveDown={(id) => moveSection(id, "down")}
              onToggleVisibility={toggleVisibility}
              onDuplicate={duplicateSection}
              onDelete={deleteSection}
              readOnly={readOnly}
            />
          </aside>

          <main className={`admin-cms__panel admin-cms__panel--edit${mobileTab === "edit" ? " admin-cms__panel--mobile-active" : ""}`}>
            {editorPanel}
          </main>

          <aside className={`admin-cms__panel admin-cms__panel--sidebar${mobileTab === "preview" || mobileTab === "settings" ? " admin-cms__panel--mobile-active" : ""}`}>
            <div className={`admin-cms__sidebar-section${mobileTab === "preview" ? "" : " admin-cms__sidebar-section--hide-mobile"}`}>
              <div className="admin-cms__panel-header">
                <h3>Preview</h3>
                <div className="admin-cms__preview-toggle">
                  <button type="button" className={previewMode === "desktop" ? "active" : ""} onClick={() => setPreviewMode("desktop")}>
                    <IconDeviceDesktop size={16} />
                  </button>
                  <button type="button" className={previewMode === "mobile" ? "active" : ""} onClick={() => setPreviewMode("mobile")}>
                    <IconDeviceMobile size={16} />
                  </button>
                </div>
              </div>
              <CmsPagePreview sections={sections} mode={previewMode} />
            </div>

            <div className={`admin-cms__sidebar-section${mobileTab === "settings" ? "" : " admin-cms__sidebar-section--hide-mobile"}`}>
              <details className="admin-cms__accordion" open>
                <summary>SEO settings</summary>
                <CmsSeoPanel seo={seo} onChange={setSeo} readOnly={readOnly} />
              </details>
              <details className="admin-cms__accordion">
                <summary>Page settings</summary>
                <div className="admin-cms__accordion-body">
                  <p><strong>Status:</strong> {page?.status}</p>
                  <p><strong>Slug:</strong> {page?.slug}</p>
                  <p><strong>Route:</strong> {page?.route}</p>
                </div>
              </details>
              <details className="admin-cms__accordion" open>
                <summary>Version history</summary>
                <CmsVersionHistory versions={versions} onRestore={restoreVersion} readOnly={readOnly} />
              </details>
            </div>
          </aside>
        </div>

        {!readOnly ? (
          <div className="admin-cms__sticky-save">
            <button type="button" className="admin-cms__btn admin-cms__btn--primary" onClick={saveDraft} disabled={saving}>
              Save draft
            </button>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
