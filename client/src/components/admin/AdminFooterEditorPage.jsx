import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconArrowLeft, IconDeviceFloppy, IconRocket } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import CmsImageField from "./cms/CmsImageField.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { canPublishPages, canWritePages } from "../../utils/pagesAdmin.js";
import "../../styles/admin-cms-page.css";

export default function AdminFooterEditorPage() {
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
      const data = await apiFetch("/api/admin/pages/site/footer", { headers: adminAuthHeaders() });
      setDraft(data.draft || {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const content = draft?.content || {};
  const quickLinks = draft?.quickLinks || [];
  const socialLinks = draft?.socialLinks || [];
  const contact = draft?.contactDetails || {};

  function setContent(field, value) {
    setDraft((prev) => ({ ...prev, content: { ...prev.content, [field]: value } }));
  }

  function setContact(field, value) {
    setDraft((prev) => ({ ...prev, contactDetails: { ...prev.contactDetails, [field]: value } }));
  }

  function updateQuickLink(index, field, value) {
    setDraft((prev) => {
      const next = [...(prev.quickLinks || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, quickLinks: next };
    });
  }

  function updateSocialLink(index, field, value) {
    setDraft((prev) => {
      const next = [...(prev.socialLinks || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, socialLinks: next };
    });
  }

  async function save(publish = false) {
    setSaving(true);
    try {
      await apiFetch("/api/admin/pages/site/footer", {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ draft, publish }),
      });
      setMessage(publish ? "Footer published." : "Footer draft saved.");
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout pageTitle="Footer" pageSubtitle="Edit footer content, links, social media and contact details." hideBottomNav>
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
            <CmsImageField label="Footer background image" value={content.backgroundImage} onChange={(val) => setContent("backgroundImage", val)} imageType="background" disabled={readOnly} />
            <CmsImageField label="Footer logo" value={content.logo} onChange={(val) => setContent("logo", val)} imageType="logo" disabled={readOnly} />
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Hero heading</label>
              <input className="admin-cms__input" value={content.heroHeading || ""} onChange={(e) => setContent("heroHeading", e.target.value)} disabled={readOnly} />
            </div>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Hero subheading</label>
              <input className="admin-cms__input" value={content.heroSubheading || ""} onChange={(e) => setContent("heroSubheading", e.target.value)} disabled={readOnly} />
            </div>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Mission text</label>
              <textarea className="admin-cms__textarea" rows={3} value={content.missionText || ""} onChange={(e) => setContent("missionText", e.target.value)} disabled={readOnly} />
            </div>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">WhatsApp button text</label>
              <input className="admin-cms__input" value={content.whatsappButtonText || ""} onChange={(e) => setContent("whatsappButtonText", e.target.value)} disabled={readOnly} />
            </div>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">WhatsApp group URL</label>
              <input className="admin-cms__input" value={content.whatsappButtonUrl || ""} onChange={(e) => setContent("whatsappButtonUrl", e.target.value)} disabled={readOnly} />
            </div>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Copyright text</label>
              <input className="admin-cms__input" value={content.copyrightText || ""} onChange={(e) => setContent("copyrightText", e.target.value)} disabled={readOnly} />
            </div>
            <h3>Contact details</h3>
            {["kvk", "address", "email", "phone"].map((field) => (
              <div key={field} className="admin-cms__field-row">
                <label className="admin-cms__label">{field.toUpperCase()}</label>
                <input className="admin-cms__input" value={contact[field] || ""} onChange={(e) => setContact(field, e.target.value)} disabled={readOnly} />
              </div>
            ))}
            <h3>Quick links</h3>
            {quickLinks.map((link, index) => (
              <div key={link.id} className="admin-cms__cta-card">
                <div className="admin-cms__field-row">
                  <label className="admin-cms__label">Label</label>
                  <input className="admin-cms__input" value={link.label || ""} onChange={(e) => updateQuickLink(index, "label", e.target.value)} disabled={readOnly} />
                </div>
                <div className="admin-cms__field-row">
                  <label className="admin-cms__label">URL</label>
                  <input className="admin-cms__input" value={link.url || ""} onChange={(e) => updateQuickLink(index, "url", e.target.value)} disabled={readOnly} />
                </div>
                <label className="admin-cms__checkbox">
                  <input type="checkbox" checked={link.visible !== false} onChange={(e) => updateQuickLink(index, "visible", e.target.checked)} disabled={readOnly} />
                  Visible
                </label>
              </div>
            ))}
            <h3>Social links</h3>
            {socialLinks.map((link, index) => (
              <div key={link.id} className="admin-cms__cta-card">
                <div className="admin-cms__field-row">
                  <label className="admin-cms__label">Platform</label>
                  <input className="admin-cms__input" value={link.platform || link.label || ""} onChange={(e) => updateSocialLink(index, "platform", e.target.value)} disabled={readOnly} />
                </div>
                <div className="admin-cms__field-row">
                  <label className="admin-cms__label">URL</label>
                  <input className="admin-cms__input" value={link.url || ""} onChange={(e) => updateSocialLink(index, "url", e.target.value)} disabled={readOnly} />
                </div>
                <label className="admin-cms__checkbox">
                  <input type="checkbox" checked={link.visible !== false} onChange={(e) => updateSocialLink(index, "visible", e.target.checked)} disabled={readOnly} />
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
