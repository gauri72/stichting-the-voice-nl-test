import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { hasFinancePermission } from "../../utils/financeAdmin.js";
import "../../styles/admin-sponsorships-donations-page.css";

const EMPTY = {
  organizationName: "Stichting The V.O.I.C.E. NL",
  address: "", email: "", phone: "", vatNumber: "",
  bankName: "", iban: "", bic: "",
  defaultVatRate: 21, defaultCurrency: "EUR",
  invoicePrefix: "INV", invoiceTerms: "", invoiceFooterNote: "",
  paymentTermsDays: 30,
};

export default function AdminFinanceSettingsPage() {
  const { admin } = useAdminAuth();
  const canWrite = hasFinancePermission(admin?.role, "settings.write");
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/finance/settings", { headers: adminAuthHeaders() })
      .then((d) => setForm({ ...EMPTY, ...d.settings }))
      .catch(() => setMessage("Could not load settings."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    setMessage("");
    try {
      await apiFetch("/api/admin/finance/settings", {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(form),
      });
      setMessage("Settings saved.");
    } catch (err) {
      setMessage(err.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout pageTitle="Finance Settings" pageSubtitle="Invoice defaults, payment details and organization information.">
      <div className="admin-finance">
        {loading ? <p className="admin-finance__status">Loading…</p> : null}
        {message ? <p className="admin-finance__status">{message}</p> : null}
        <form className="admin-finance__form-grid admin-finance__settings-form" onSubmit={handleSubmit}>
          <h2 className="admin-finance__full">Organization</h2>
          <label className="admin-finance__full">Organization Name<input value={form.organizationName} onChange={(e) => setForm((f) => ({ ...f, organizationName: e.target.value }))} disabled={!canWrite} /></label>
          <label className="admin-finance__full">Address<textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={2} disabled={!canWrite} /></label>
          <label>Email<input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} disabled={!canWrite} /></label>
          <label>Phone<input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} disabled={!canWrite} /></label>
          <label>VAT Number<input value={form.vatNumber} onChange={(e) => setForm((f) => ({ ...f, vatNumber: e.target.value }))} disabled={!canWrite} /></label>

          <h2 className="admin-finance__full">Bank Details</h2>
          <label>Bank Name<input value={form.bankName} onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))} disabled={!canWrite} /></label>
          <label>IBAN<input value={form.iban} onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))} disabled={!canWrite} /></label>
          <label>BIC<input value={form.bic} onChange={(e) => setForm((f) => ({ ...f, bic: e.target.value }))} disabled={!canWrite} /></label>

          <h2 className="admin-finance__full">Invoice Defaults</h2>
          <label>Invoice Prefix<input value={form.invoicePrefix} onChange={(e) => setForm((f) => ({ ...f, invoicePrefix: e.target.value }))} disabled={!canWrite} /></label>
          <label>Default VAT %<input type="number" value={form.defaultVatRate} onChange={(e) => setForm((f) => ({ ...f, defaultVatRate: Number(e.target.value) }))} disabled={!canWrite} /></label>
          <label>Payment Terms (days)<input type="number" value={form.paymentTermsDays} onChange={(e) => setForm((f) => ({ ...f, paymentTermsDays: Number(e.target.value) }))} disabled={!canWrite} /></label>
          <label className="admin-finance__full">Invoice Terms<textarea value={form.invoiceTerms} onChange={(e) => setForm((f) => ({ ...f, invoiceTerms: e.target.value }))} rows={3} disabled={!canWrite} /></label>
          <label className="admin-finance__full">Footer Note<textarea value={form.invoiceFooterNote} onChange={(e) => setForm((f) => ({ ...f, invoiceFooterNote: e.target.value }))} rows={2} disabled={!canWrite} /></label>

          {canWrite ? (
            <button type="submit" className="admin-finance__btn admin-finance__btn--primary admin-finance__full" disabled={saving}>
              {saving ? "Saving…" : "Save Settings"}
            </button>
          ) : null}
        </form>
      </div>
    </AdminLayout>
  );
}
