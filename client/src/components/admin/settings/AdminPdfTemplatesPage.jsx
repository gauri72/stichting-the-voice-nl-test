import { useEffect, useState } from "react";
import { useAdminAuth } from "../../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import { canWriteSettingsCategory, formatTemplateType } from "../../../utils/settingsAdmin.js";

export default function AdminPdfTemplatesPage() {
  const { admin } = useAdminAuth();
  const canWrite = canWriteSettingsCategory(admin?.role, "pdf_templates");
  const [templates, setTemplates] = useState({});
  const [selected, setSelected] = useState("");
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/settings/pdf-templates", { headers: adminAuthHeaders() })
      .then((d) => {
        setTemplates(d.templates || {});
        const keys = Object.keys(d.templates || {});
        setSelected(keys[0] || "");
        setForm(d.templates?.[keys[0]] || {});
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected) setForm(templates[selected] || {});
  }, [selected, templates]);

  async function save(e) {
    e.preventDefault();
    if (!canWrite || !selected) return;
    setSaving(true);
    try {
      await apiFetch(`/api/admin/settings/pdf-templates/${selected}`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(form),
      });
      setTemplates((t) => ({ ...t, [selected]: form }));
      setMessage("PDF template saved.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-settings__panel">
      <header className="admin-settings__panel-header">
        <h1>PDF Templates</h1>
      </header>

      {loading ? <p>Loading…</p> : null}
      {message ? <p className="admin-settings__message">{message}</p> : null}

      <div className="admin-settings__form-grid">
        <label className="admin-settings__field">
          Template
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            {Object.keys(templates).map((key) => (
              <option key={key} value={key}>{formatTemplateType(key)}</option>
            ))}
          </select>
        </label>
      </div>

      <form className="admin-settings__form" onSubmit={save}>
        <div className="admin-settings__form-grid">
          {["logoUrl", "footerText", "copyrightText", "contactDetails", "termsText", "signatureText"].map((key) => (
            <label key={key} className={`admin-settings__field${key.includes("Text") || key.includes("Details") ? " admin-settings__field--full" : ""}`}>
              {formatTemplateType(key)}
              {key.includes("Text") || key.includes("Details") ? (
                <textarea rows={3} value={form[key] || ""} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} disabled={!canWrite} />
              ) : (
                <input value={form[key] || ""} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} disabled={!canWrite} />
              )}
            </label>
          ))}
          <label className="admin-settings__field">
            Color theme
            <select value={form.colorTheme || "teal"} onChange={(e) => setForm((f) => ({ ...f, colorTheme: e.target.value }))} disabled={!canWrite}>
              <option value="teal">Teal</option>
              <option value="blue">Blue</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="admin-settings__field">
            Layout style
            <select value={form.layoutStyle || "standard"} onChange={(e) => setForm((f) => ({ ...f, layoutStyle: e.target.value }))} disabled={!canWrite}>
              <option value="standard">Standard</option>
              <option value="compact">Compact</option>
            </select>
          </label>
        </div>
        {canWrite ? (
          <button type="submit" className="admin-settings__btn admin-settings__btn--primary" disabled={saving}>
            Save PDF template
          </button>
        ) : null}
      </form>
    </section>
  );
}
