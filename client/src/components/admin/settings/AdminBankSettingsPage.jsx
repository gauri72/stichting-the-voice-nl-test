import { useEffect, useState } from "react";
import { useAdminAuth } from "../../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import { canWriteSettingsCategory } from "../../../utils/settingsAdmin.js";

export default function AdminBankSettingsPage() {
  const { admin } = useAdminAuth();
  const canWrite = canWriteSettingsCategory(admin?.role, "bank");
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    apiFetch("/api/admin/settings/bank", { headers: adminAuthHeaders() })
      .then((d) => setForm(d.settings || {}))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function save(e) {
    e.preventDefault();
    if (!canWrite || !confirmed) return;
    setSaving(true);
    try {
      const data = await apiFetch("/api/admin/settings/bank", {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ ...form, confirm: true }),
      });
      setForm(data.settings);
      setMessage("Bank details saved. Invoices and receipts will use the updated details.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function syncStripe() {
    try {
      const result = await apiFetch("/api/admin/settings/stripe/sync-bank", {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      setSyncResult(result);
      if (result.ok) setMessage("Stripe bank sync completed.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="admin-settings__panel">
      <header className="admin-settings__panel-header">
        <h1>Bank Account Settings</h1>
        <p className="admin-settings__warning">
          Changing bank details may affect invoices, receipts and payment instructions. Stripe payout bank changes may require additional verification.
        </p>
      </header>

      {loading ? <p>Loading…</p> : null}
      {message ? <p className="admin-settings__message">{message}</p> : null}
      {error ? <p className="admin-settings__error" role="alert">{error}</p> : null}
      {syncResult?.warning ? <p className="admin-settings__warning">{syncResult.warning}</p> : null}

      <form className="admin-settings__form" onSubmit={save}>
        <div className="admin-settings__form-grid">
          <label className="admin-settings__field admin-settings__field--full">
            Account holder name
            <input value={form.accountHolderName || ""} onChange={(e) => setForm((f) => ({ ...f, accountHolderName: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field">
            IBAN
            <input value={form.iban || ""} onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field">
            BIC / SWIFT
            <input value={form.bic || ""} onChange={(e) => setForm((f) => ({ ...f, bic: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field">
            Bank name
            <input value={form.bankName || ""} onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field admin-settings__field--full">
            Payment reference format
            <input value={form.paymentReferenceFormat || ""} onChange={(e) => setForm((f) => ({ ...f, paymentReferenceFormat: e.target.value }))} disabled={!canWrite} />
          </label>
          <label className="admin-settings__field admin-settings__field--full">
            Manual payment instructions
            <textarea rows={4} value={form.manualPaymentInstructions || ""} onChange={(e) => setForm((f) => ({ ...f, manualPaymentInstructions: e.target.value }))} disabled={!canWrite} />
          </label>
        </div>

        <p className="admin-settings__meta">
          Last Stripe sync: {form.lastStripeSyncAt || "Never"} ({form.lastStripeSyncStatus || "not_synced"})
        </p>

        {canWrite ? (
          <label className="admin-settings__checkbox admin-settings__confirm">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            I confirm these bank detail changes
          </label>
        ) : null}

        <div className="admin-settings__actions">
          {canWrite ? (
            <button type="submit" className="admin-settings__btn admin-settings__btn--primary" disabled={saving || !confirmed}>
              Save bank details
            </button>
          ) : null}
          <button type="button" className="admin-settings__btn" onClick={syncStripe} disabled={!canWrite}>
            Sync with Stripe
          </button>
        </div>
      </form>
    </section>
  );
}
