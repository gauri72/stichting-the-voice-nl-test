import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconArrowLeft, IconDeviceFloppy, IconRocket } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import CmsImageField from "./cms/CmsImageField.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { canPublishPages, canWritePages } from "../../utils/pagesAdmin.js";
import "../../styles/admin-cms-page.css";

export default function AdminHeaderEditorPage() {
  const { admin } = useAdminAuth();
  const readOnly = !canWritePages(admin?.role);
  const canPublish = canPublishPages(admin?.role);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/admin/pages/site/header", { headers: adminAuthHeaders() });
      setDraft(data.draft || {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const settings = draft?.settings || {};
  const items = draft?.items || [];

  function setSettings(field, value) {
    setDraft((prev) => ({ ...prev, settings: { ...prev.settings, [field]: value } }));
  }

  function updateItem(index, field, value) {
    setDraft((prev) => {
      const nextItems = [...(prev.items || [])];
      nextItems[index] = { ...nextItems[index], [field]: value };
      return { ...prev, items: nextItems };
    });
  }

  async function save(publish = false) {
    setSaving(true);
    try {
      await apiFetch("/api/admin/pages/site/header", {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ draft, publish }),
      });
      setMessage(publish ? "Header published." : "Header draft saved.");
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout pageTitle="Header / Navigation" pageSubtitle="Edit logo, navigation items and header CTAs." hideBottomNav>
      <div className="admin-cms admin-cms--editor">
        <div className="admin-cms__editor-topbar">
          <Link to="/admin/pages" className="admin-cms__back"><IconArrowLeft size={18} /> Website Pages</Link>
          {!readOnly ? (
            <div className="admin-cms__editor-actions">
              <button type="button" className="admin-cms__btn admin-cms__btn--outline" onClick={() => save(false)} disabled={saving}>
                <IconDeviceFloppy size={16} /> Save draft
              </button>
              {canPublish ? (
                <button type="button" className="admin-cms__btn admin-cms__btn--primary" onClick={() => save(true)} disabled={saving}>
                  <IconRocket size={16} /> Publish
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        {message ? <p className="admin-cms__success">{message}</p> : null}
        {loading ? <p className="admin-cms__status">Loading…</p> : null}
        {draft ? (
          <div className="admin-cms__single-editor">
            <CmsImageField label="Logo" value={draft.logo} onChange={(logo) => setDraft((p) => ({ ...p, logo }))} imageType="logo" disabled={readOnly} />
            <h3>Header CTAs</h3>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Become a Member — text</label>
              <input className="admin-cms__input" value={settings.memberButtonText || ""} onChange={(e) => setSettings("memberButtonText", e.target.value)} disabled={readOnly} />
            </div>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Become a Member — URL</label>
              <input className="admin-cms__input" value={settings.memberButtonUrl || ""} onChange={(e) => setSettings("memberButtonUrl", e.target.value)} disabled={readOnly} />
            </div>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Buy Tickets — text</label>
              <input className="admin-cms__input" value={settings.buyTicketsButtonText || ""} onChange={(e) => setSettings("buyTicketsButtonText", e.target.value)} disabled={readOnly} />
            </div>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Buy Tickets — URL</label>
              <input className="admin-cms__input" value={settings.buyTicketsButtonUrl || ""} onChange={(e) => setSettings("buyTicketsButtonUrl", e.target.value)} disabled={readOnly} />
            </div>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Login — text</label>
              <input className="admin-cms__input" value={settings.loginButtonText || ""} onChange={(e) => setSettings("loginButtonText", e.target.value)} disabled={readOnly} />
            </div>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Login — URL</label>
              <input className="admin-cms__input" value={settings.loginButtonUrl || ""} onChange={(e) => setSettings("loginButtonUrl", e.target.value)} disabled={readOnly} />
            </div>
            <label className="admin-cms__checkbox">
              <input type="checkbox" checked={settings.themeToggleVisible !== false} onChange={(e) => setSettings("themeToggleVisible", e.target.checked)} disabled={readOnly} />
              Show theme toggle
            </label>
            <label className="admin-cms__checkbox">
              <input type="checkbox" checked={settings.stickyHeader !== false} onChange={(e) => setSettings("stickyHeader", e.target.checked)} disabled={readOnly} />
              Sticky header
            </label>
            <h3>Announcement bar</h3>
            <label className="admin-cms__checkbox">
              <input type="checkbox" checked={draft.announcementBar?.visible === true} onChange={(e) => setDraft((p) => ({ ...p, announcementBar: { ...p.announcementBar, visible: e.target.checked } }))} disabled={readOnly} />
              Show announcement bar
            </label>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Announcement text</label>
              <input className="admin-cms__input" value={draft.announcementBar?.text || ""} onChange={(e) => setDraft((p) => ({ ...p, announcementBar: { ...p.announcementBar, text: e.target.value } }))} disabled={readOnly} />
            </div>
            <h3>Navigation items</h3>
            {items.map((item, index) => (
              <div key={item.id} className="admin-cms__cta-card">
                <div className="admin-cms__field-row">
                  <label className="admin-cms__label">Label</label>
                  <input className="admin-cms__input" value={item.label || ""} onChange={(e) => updateItem(index, "label", e.target.value)} disabled={readOnly} />
                </div>
                <div className="admin-cms__field-row">
                  <label className="admin-cms__label">URL</label>
                  <input className="admin-cms__input" value={item.url || ""} onChange={(e) => updateItem(index, "url", e.target.value)} disabled={readOnly} />
                </div>
                <label className="admin-cms__checkbox">
                  <input type="checkbox" checked={item.visible !== false} onChange={(e) => updateItem(index, "visible", e.target.checked)} disabled={readOnly} />
                  Visible
                </label>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
