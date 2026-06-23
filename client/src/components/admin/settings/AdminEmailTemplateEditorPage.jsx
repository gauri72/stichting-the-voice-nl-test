import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { IconArrowLeft } from "@tabler/icons-react";
import { useAdminAuth } from "../../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import { canWriteTemplates } from "../../../utils/settingsAdmin.js";

const VARIABLES = [
  "first_name", "full_name", "email", "event_name", "amount", "currency",
  "receipt_number", "invoice_number", "organization_name", "website_url", "support_email",
];

export default function AdminEmailTemplateEditorPage() {
  const { id } = useParams();
  const { admin } = useAdminAuth();
  const canWrite = canWriteTemplates(admin?.role);
  const [form, setForm] = useState(null);
  const [preview, setPreview] = useState("");
  const [testTo, setTestTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/admin/settings/email-templates/${id}`, { headers: adminAuthHeaders() })
      .then((d) => setForm(d.template))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function save(e) {
    e.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    try {
      const data = await apiFetch(`/api/admin/settings/email-templates/${id}`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(form),
      });
      setForm(data.template);
      setMessage("Template saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function loadPreview() {
    const data = await apiFetch(`/api/admin/settings/email-templates/${id}/preview`, {
      method: "POST",
      headers: adminAuthHeaders(),
      body: JSON.stringify({}),
    });
    setPreview(data.preview?.html || "");
  }

  async function sendTest() {
    await apiFetch(`/api/admin/settings/email-templates/${id}/send-test`, {
      method: "POST",
      headers: adminAuthHeaders(),
      body: JSON.stringify({ to: testTo }),
    });
    setMessage(`Test email sent to ${testTo}.`);
  }

  async function restoreDefault() {
    const data = await apiFetch(`/api/admin/settings/email-templates/${id}/restore-default`, {
      method: "POST",
      headers: adminAuthHeaders(),
    });
    setForm(data.template);
    setMessage("Default template restored.");
  }

  function insertVariable(variable) {
    setForm((f) => ({ ...f, htmlBody: `${f.htmlBody || ""}{{${variable}}}` }));
  }

  if (loading || !form) return <p>Loading template…</p>;

  return (
    <section className="admin-settings__panel">
      <Link to="/admin/settings/email-templates" className="admin-settings__back">
        <IconArrowLeft size={16} /> Back to templates
      </Link>

      <header className="admin-settings__panel-header">
        <h1>{form.name}</h1>
        <p>{form.templateType}</p>
      </header>

      {message ? <p className="admin-settings__message">{message}</p> : null}
      {error ? <p className="admin-settings__error" role="alert">{error}</p> : null}

      <form className="admin-settings__form admin-settings__form--split" onSubmit={save}>
        <div className="admin-settings__editor">
          <label className="admin-settings__field admin-settings__field--full">
            Subject
            <input value={form.subject || ""} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field admin-settings__field--full">
            Preheader
            <input value={form.preheader || ""} onChange={(e) => setForm((f) => ({ ...f, preheader: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field admin-settings__field--full">
            HTML body
            <textarea className="admin-settings__code" rows={16} value={form.htmlBody || ""} onChange={(e) => setForm((f) => ({ ...f, htmlBody: e.target.value }))} disabled={!canWrite} />
          </label>
          <div className="admin-settings__variables">
            <span>Insert variable:</span>
            {VARIABLES.map((v) => (
              <button key={v} type="button" className="admin-settings__chip" onClick={() => insertVariable(v)} disabled={!canWrite}>
                {`{{${v}}}`}
              </button>
            ))}
          </div>
        </div>

        <aside className="admin-settings__preview">
          <h3>Preview</h3>
          <button type="button" className="admin-settings__btn" onClick={loadPreview}>Refresh preview</button>
          <div className="admin-settings__preview-frame" dangerouslySetInnerHTML={{ __html: preview || "<p>Click refresh preview</p>" }} />
          <label className="admin-settings__field admin-settings__field--full">
            Send test to
            <input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
          </label>
          <button type="button" className="admin-settings__btn" onClick={sendTest} disabled={!testTo}>Send test email</button>
        </aside>

        <div className="admin-settings__actions admin-settings__field--full">
          {canWrite ? (
            <>
              <button type="submit" className="admin-settings__btn admin-settings__btn--primary" disabled={saving}>
                Save template
              </button>
              <button type="button" className="admin-settings__btn" onClick={restoreDefault}>
                Restore default
              </button>
            </>
          ) : (
            <p className="admin-settings__readonly">Read-only access</p>
          )}
        </div>
      </form>
    </section>
  );
}
