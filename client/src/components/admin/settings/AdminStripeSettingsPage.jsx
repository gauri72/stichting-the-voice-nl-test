import { useEffect, useState } from "react";
import { useAdminAuth } from "../../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import { canWriteSettingsCategory } from "../../../utils/settingsAdmin.js";

export default function AdminStripeSettingsPage() {
  const { admin } = useAdminAuth();
  const canWrite = canWriteSettingsCategory(admin?.role, "stripe");
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    apiFetch("/api/admin/settings/stripe", { headers: adminAuthHeaders() })
      .then((d) => setForm(d.settings || {}))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function save(e) {
    e.preventDefault();
    if (!canWrite || !confirmed) return;
    setSaving(true);
    try {
      const data = await apiFetch("/api/admin/settings/stripe", {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ ...form, confirm: true }),
      });
      setForm(data.settings);
      setMessage("Stripe settings saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    try {
      const result = await apiFetch("/api/admin/settings/stripe/test", {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      setStatus(result);
      setMessage("Stripe connection successful.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function checkWebhookConfiguration() {
    try {
      const result = await apiFetch("/api/admin/settings/stripe/check-webhook-configuration", {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      setStatus(result);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="admin-settings__panel">
      <header className="admin-settings__panel-header">
        <h1>Stripe Settings</h1>
        <p>Secret keys are encrypted and masked. Enter a new value only to replace.</p>
      </header>

      {loading ? <p>Loading…</p> : null}
      {message ? <p className="admin-settings__message">{message}</p> : null}
      {error ? <p className="admin-settings__error" role="alert">{error}</p> : null}

      {status ? (
        <pre className="admin-settings__status-box">{JSON.stringify(status, null, 2)}</pre>
      ) : null}

      <form className="admin-settings__form" onSubmit={save}>
        <div className="admin-settings__form-grid">
          <label className="admin-settings__field">
            Mode
            <select value={form.mode || "test"} onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))} disabled={!canWrite}>
              <option value="test">Test</option>
              <option value="live">Live</option>
            </select>
          </label>
          <label className="admin-settings__field admin-settings__field--full">
            Publishable key
            <input value={form.publishableKey || ""} onChange={(e) => setForm((f) => ({ ...f, publishableKey: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field admin-settings__field--full">
            Secret key {form.secretKeySet ? "(set — enter to replace)" : ""}
            <input type="password" placeholder={form.secretKeySet ? "••••••••••••" : "sk_test_..."} onChange={(e) => setForm((f) => ({ ...f, secretKey: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field admin-settings__field--full">
            Platform webhook secret {form.webhookSecretSet ? "(set — enter to replace)" : ""}
            <input type="password" placeholder="whsec_..." onChange={(e) => setForm((f) => ({ ...f, webhookSecret: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field admin-settings__field--full">
            Connected-account webhook secret {form.connectWebhookSecretSet ? "(set — enter to replace)" : ""}
            <input type="password" placeholder="whsec_..." onChange={(e) => setForm((f) => ({ ...f, connectWebhookSecret: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field">
            Account ID
            <input value={form.accountId || ""} onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field">
            Connected account ID
            <input value={form.connectedAccountId || ""} onChange={(e) => setForm((f) => ({ ...f, connectedAccountId: e.target.value }))} disabled={!canWrite} />
          </label>
          {["cardPaymentsEnabled", "idealEnabled", "bancontactEnabled", "sepaEnabled", "applePayEnabled", "googlePayEnabled"].map((key) => (
            <label key={key} className="admin-settings__checkbox">
              <input type="checkbox" checked={form[key] !== false} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))} disabled={!canWrite} />
              {key.replace(/([A-Z])/g, " $1")}
            </label>
          ))}
        </div>

        {canWrite ? (
          <label className="admin-settings__checkbox admin-settings__confirm">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            I confirm these Stripe / payment changes
          </label>
        ) : null}

        <div className="admin-settings__actions">
          {canWrite ? (
            <button type="submit" className="admin-settings__btn admin-settings__btn--primary" disabled={saving || !confirmed}>
              Save Stripe Settings
            </button>
          ) : null}
          <button type="button" className="admin-settings__btn" onClick={testConnection}>Test connection</button>
          <button type="button" className="admin-settings__btn" onClick={checkWebhookConfiguration}>Check webhook configuration</button>
        </div>
      </form>
    </section>
  );
}
