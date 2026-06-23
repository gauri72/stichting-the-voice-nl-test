import { useEffect, useState } from "react";
import { useAdminAuth } from "../../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import { canWriteSettingsCategory } from "../../../utils/settingsAdmin.js";

export default function AdminEmailProviderSettingsPage() {
  const { admin } = useAdminAuth();
  const canWrite = canWriteSettingsCategory(admin?.role, "email_provider");
  const [form, setForm] = useState({});
  const [testTo, setTestTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/settings/email-provider", { headers: adminAuthHeaders() })
      .then((d) => {
        setForm(d.settings || {});
        setTestTo(d.settings?.testEmailAddress || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function save(e) {
    e.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    try {
      const data = await apiFetch("/api/admin/settings/email-provider", {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(form),
      });
      setForm(data.settings);
      setMessage("Email provider settings saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    try {
      await apiFetch("/api/admin/settings/email-provider/test", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ to: testTo }),
      });
      setMessage(`Test email sent to ${testTo}.`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="admin-settings__panel">
      <header className="admin-settings__panel-header">
        <h1>Email Provider Settings</h1>
        <p>API keys and SMTP passwords are encrypted and never shown in full.</p>
      </header>

      {loading ? <p>Loading…</p> : null}
      {message ? <p className="admin-settings__message">{message}</p> : null}
      {error ? <p className="admin-settings__error" role="alert">{error}</p> : null}

      <form className="admin-settings__form" onSubmit={save}>
        <div className="admin-settings__form-grid">
          <label className="admin-settings__field">
            Provider
            <select value={form.provider || "smtp"} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} disabled={!canWrite}>
              {["smtp", "resend", "sendgrid", "brevo", "mailgun"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="admin-settings__field">
            Sender name
            <input value={form.senderName || ""} onChange={(e) => setForm((f) => ({ ...f, senderName: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field">
            Sender email
            <input type="email" value={form.senderEmail || ""} onChange={(e) => setForm((f) => ({ ...f, senderEmail: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field">
            Reply-to email
            <input type="email" value={form.replyToEmail || ""} onChange={(e) => setForm((f) => ({ ...f, replyToEmail: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field">
            SMTP host
            <input value={form.smtpHost || ""} onChange={(e) => setForm((f) => ({ ...f, smtpHost: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field">
            SMTP port
            <input type="number" value={form.smtpPort ?? 587} onChange={(e) => setForm((f) => ({ ...f, smtpPort: Number(e.target.value) }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field">
            SMTP user
            <input value={form.smtpUser || ""} onChange={(e) => setForm((f) => ({ ...f, smtpUser: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field">
            SMTP password {form.smtpPasswordSet ? "(set)" : ""}
            <input type="password" placeholder="Replace only" onChange={(e) => setForm((f) => ({ ...f, smtpPassword: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field">
            API key {form.apiKeySet ? "(set)" : ""}
            <input type="password" placeholder="Replace only" onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field">
            Test email address
            <input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} disabled={!canWrite} />
          </label>
        </div>

        <div className="admin-settings__actions">
          {canWrite ? (
            <button type="submit" className="admin-settings__btn admin-settings__btn--primary" disabled={saving}>
              Save settings
            </button>
          ) : null}
          <button type="button" className="admin-settings__btn" onClick={sendTest}>Send test email</button>
        </div>
      </form>
    </section>
  );
}
