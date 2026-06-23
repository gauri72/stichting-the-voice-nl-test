import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconEye,
  IconPlus,
  IconRocket,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import CmsSectionList from "./cms/CmsSectionList.jsx";
import CmsVersionHistory from "./cms/CmsVersionHistory.jsx";
import CustomerDashboardSectionEditor from "./customer-dashboard/CustomerDashboardSectionEditor.jsx";
import CustomerDashboardRenderer from "../dashboard/CustomerDashboardRenderer.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import {
  canPublishCustomerDashboard,
  canWriteCustomerDashboard,
  formatSectionType,
} from "../../utils/customerDashboardAdmin.js";
import "../../styles/admin-cms-page.css";
import "../../styles/admin-customer-dashboard-builder.css";
import "../../styles/dashboard-shared.css";
import "../../styles/dashboard-desktop.css";

const MOBILE_TABS = ["sections", "edit", "preview", "settings"];

export default function AdminCustomerDashboardBuilderPage() {
  const { admin } = useAdminAuth();
  const readOnly = !canWriteCustomerDashboard(admin?.role);
  const canPublish = canPublishCustomerDashboard(admin?.role);

  const [sections, setSections] = useState([]);
  const [settings, setSettings] = useState({});
  const [versions, setVersions] = useState([]);
  const [config, setConfig] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [mobileTab, setMobileTab] = useState("sections");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionType, setNewSectionType] = useState("custom_cta_banner");

  const selectedSection = useMemo(
    () => sections.find((s) => s.sectionId === selectedId) || null,
    [sections, selectedId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [state, cfg] = await Promise.all([
        apiFetch("/api/admin/customer-dashboard", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/customer-dashboard/config", { headers: adminAuthHeaders() }),
      ]);
      setSections(state.sections || []);
      setSettings(state.settings || {});
      setVersions(state.versions || []);
      setConfig(cfg);
      setSelectedId((prev) => prev || state.sections?.[0]?.sectionId || null);
    } catch (err) {
      setError(err.message || "Could not load builder.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function updateSectionLocal(updated) {
    setSections((prev) => prev.map((s) => (s.sectionId === updated.sectionId ? updated : s)));
  }

  async function saveDraft() {
    setSaving(true);
    setMessage("");
    try {
      const data = await apiFetch("/api/admin/customer-dashboard/save-draft", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ sections, settings, changeNote: "Draft saved from builder" }),
      });
      setSections(data.sections || []);
      setSettings(data.settings || {});
      setMessage("Draft saved.");
      const versionsData = await apiFetch("/api/admin/customer-dashboard/versions", { headers: adminAuthHeaders() });
      setVersions(versionsData.versions || []);
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
      await apiFetch("/api/admin/customer-dashboard/publish", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ changeNote: "Published from builder" }),
      });
      setMessage("Published successfully.");
      await load();
    } catch (err) {
      setError(err.message || "Publish failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReorder(sectionOrder) {
    setSections((prev) => {
      const map = new Map(sectionOrder.map((id, i) => [id, i]));
      return [...prev]
        .sort((a, b) => (map.get(a.sectionId) ?? a.order) - (map.get(b.sectionId) ?? b.order))
        .map((s, i) => ({ ...s, order: i }));
    });
    if (!readOnly) {
      try {
        const data = await apiFetch("/api/admin/customer-dashboard/sections/reorder", {
          method: "POST",
          headers: adminAuthHeaders(),
          body: JSON.stringify({ sectionOrder }),
        });
        setSections(data.sections || []);
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
    try {
      const data = await apiFetch(`/api/admin/customer-dashboard/sections/${sectionId}/toggle-visibility`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      setSections(data.sections || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function duplicateSection(sectionId) {
    if (readOnly) return;
    const data = await apiFetch(`/api/admin/customer-dashboard/sections/${sectionId}/duplicate`, {
      method: "POST",
      headers: adminAuthHeaders(),
    });
    setSections(data.sections || []);
  }

  async function deleteSection(sectionId) {
    if (readOnly) return;
    if (!window.confirm("Delete this custom section?")) return;
    const data = await apiFetch(`/api/admin/customer-dashboard/sections/${sectionId}`, {
      method: "DELETE",
      headers: adminAuthHeaders(),
    });
    setSections(data.sections || []);
    if (selectedId === sectionId) setSelectedId(data.sections?.[0]?.sectionId || null);
  }

  async function addSection() {
    if (readOnly) return;
    const data = await apiFetch("/api/admin/customer-dashboard/sections", {
      method: "POST",
      headers: adminAuthHeaders(),
      body: JSON.stringify({ sectionType: newSectionType, title: formatSectionType(newSectionType) }),
    });
    setSections(data.sections || []);
    setShowAddSection(false);
    const added = data.sections?.[data.sections.length - 1];
    if (added) setSelectedId(added.sectionId);
  }

  async function saveSelectedSection() {
    if (!selectedSection || readOnly) return;
    setSaving(true);
    try {
      const data = await apiFetch(`/api/admin/customer-dashboard/sections/${selectedSection.sectionId}`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(selectedSection),
      });
      setSections(data.sections || []);
      setMessage("Section saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function restoreVersion(versionId) {
    if (readOnly) return;
    const data = await apiFetch("/api/admin/customer-dashboard/restore-version", {
      method: "POST",
      headers: adminAuthHeaders(),
      body: JSON.stringify({ versionId }),
    });
    setSections(data.sections || []);
    setSettings(data.settings || {});
    setMessage("Version restored to draft.");
    await load();
  }

  const previewConfig = useMemo(
    () => ({ settings, sections: sections.filter((s) => s.isVisible !== false) }),
    [settings, sections]
  );

  const previewData = useMemo(
    () => ({
      profile: { fullName: admin?.firstName || "Preview User", email: admin?.email },
      overview: { events: { value: "3" }, donations: { value: "€50" }, sponsorships: { count: 1 } },
      activity: [],
      membership: null,
    }),
    [admin]
  );

  return (
    <AdminLayout
      pageTitle="Customer Dashboard Builder"
      pageSubtitle="Configure the member dashboard at /dashboard"
      hideBottomNav
    >
      <div className="admin-cms admin-cms--customer-dashboard">
        <header className="admin-cms__toolbar">
          <Link to="/admin/dashboard" className="admin-cms__back">
            <IconArrowLeft size={18} /> Back
          </Link>
          <div className="admin-cms__toolbar-actions">
            <Link to="/admin/customer-dashboard-builder/preview" className="admin-cms__btn admin-cms__btn--ghost" target="_blank">
              <IconEye size={16} /> Preview
            </Link>
            {!readOnly ? (
              <>
                <button type="button" className="admin-cms__btn" onClick={saveDraft} disabled={saving}>
                  <IconDeviceFloppy size={16} /> Save Draft
                </button>
                {canPublish ? (
                  <button type="button" className="admin-cms__btn admin-cms__btn--primary" onClick={publish} disabled={saving}>
                    <IconRocket size={16} /> Publish
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </header>

        {message ? <p className="admin-cms__message">{message}</p> : null}
        {error ? <p className="admin-cms__error" role="alert">{error}</p> : null}

        <nav className="admin-cms__mobile-tabs" aria-label="Builder tabs">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={mobileTab === tab ? "is-active" : ""}
              onClick={() => setMobileTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        {loading ? (
          <p className="admin-cms__loading">Loading builder…</p>
        ) : (
          <div className="admin-cms__layout">
            <aside className={`admin-cms__sidebar${mobileTab === "sections" ? " is-visible" : ""}`}>
              <div className="admin-cms__sidebar-header">
                <h2>Sections</h2>
                {!readOnly ? (
                  <button type="button" className="admin-cms__btn admin-cms__btn--sm" onClick={() => setShowAddSection(true)}>
                    <IconPlus size={14} /> Add
                  </button>
                ) : null}
              </div>
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
                formatType={formatSectionType}
              />
            </aside>

            <main className={`admin-cms__editor${mobileTab === "edit" ? " is-visible" : ""}`}>
              <CustomerDashboardSectionEditor
                section={selectedSection}
                onChange={updateSectionLocal}
                config={config}
                readOnly={readOnly}
              />
              {!readOnly && selectedSection ? (
                <div className="admin-cms__editor-actions">
                  <button type="button" className="admin-cms__btn admin-cms__btn--primary" onClick={saveSelectedSection} disabled={saving}>
                    Save section
                  </button>
                </div>
              ) : null}
            </main>

            <aside className={`admin-cms__preview${mobileTab === "preview" ? " is-visible" : ""}`}>
              <h2>Live preview</h2>
              <div className="admin-cms__preview-frame admin-cms__preview-frame--dashboard">
                <section className="member-dashboard member-dashboard--preview">
                  <CustomerDashboardRenderer
                    config={previewConfig}
                    data={previewData}
                    displayName={admin?.firstName || "Preview User"}
                    preview
                  />
                </section>
              </div>
            </aside>

            <aside className={`admin-cms__settings${mobileTab === "settings" ? " is-visible" : ""}`}>
              <h2>Dashboard settings</h2>
              <div className="admin-cms__field-row">
                <label className="admin-cms__label">Welcome message</label>
                <input
                  className="admin-cms__input"
                  value={settings.welcomeMessage || ""}
                  onChange={(e) => setSettings((s) => ({ ...s, welcomeMessage: e.target.value }))}
                  disabled={readOnly}
                  placeholder="Welcome, {{name}}"
                />
              </div>
              <div className="admin-cms__field-row">
                <label className="admin-cms__label">Intro text</label>
                <textarea
                  className="admin-cms__textarea"
                  rows={2}
                  value={settings.introText || ""}
                  onChange={(e) => setSettings((s) => ({ ...s, introText: e.target.value }))}
                  disabled={readOnly}
                />
              </div>
              <div className="admin-cms__field-row">
                <label className="admin-cms__label">Footer text</label>
                <textarea
                  className="admin-cms__textarea"
                  rows={2}
                  value={settings.footerText || ""}
                  onChange={(e) => setSettings((s) => ({ ...s, footerText: e.target.value }))}
                  disabled={readOnly}
                />
              </div>
              <label className="admin-cms__checkbox">
                <input
                  type="checkbox"
                  checked={settings.announcement?.visible === true}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      announcement: { ...s.announcement, visible: e.target.checked },
                    }))
                  }
                  disabled={readOnly}
                />
                Show announcement banner
              </label>
              {settings.announcement?.visible ? (
                <textarea
                  className="admin-cms__textarea"
                  rows={2}
                  value={settings.announcement?.text || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      announcement: { ...s.announcement, text: e.target.value },
                    }))
                  }
                  disabled={readOnly}
                />
              ) : null}

              <h3>Version history</h3>
              <CmsVersionHistory versions={versions} onRestore={restoreVersion} readOnly={readOnly} />
            </aside>
          </div>
        )}

        {showAddSection ? (
          <div className="admin-cms__modal" role="dialog" aria-modal="true">
            <div className="admin-cms__modal-card">
              <h3>Add widget</h3>
              <select
                className="admin-cms__select"
                value={newSectionType}
                onChange={(e) => setNewSectionType(e.target.value)}
              >
                {(config?.sectionTypes || []).map((type) => (
                  <option key={type} value={type}>
                    {formatSectionType(type)}
                  </option>
                ))}
              </select>
              <div className="admin-cms__modal-actions">
                <button type="button" className="admin-cms__btn" onClick={() => setShowAddSection(false)}>
                  Cancel
                </button>
                <button type="button" className="admin-cms__btn admin-cms__btn--primary" onClick={addSection}>
                  Add widget
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
