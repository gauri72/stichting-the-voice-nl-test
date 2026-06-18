import { useCallback, useEffect, useState } from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import "../../styles/admin-tickets-page.css";

const EMPTY = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  usageLimit: "",
  expiryDate: "",
  status: "active",
  eligibleEvents: [],
};

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [v, e] = await Promise.all([
        apiFetch("/api/admin/events/vouchers", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/events", { headers: adminAuthHeaders() }),
      ]);
      setVouchers(v.vouchers || []);
      setEvents(e.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await apiFetch("/api/admin/events/vouchers", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({
          ...form,
          discountValue: Number(form.discountValue),
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
          expiryDate: form.expiryDate || null,
        }),
      });
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this voucher?")) return;
    await apiFetch(`/api/admin/events/vouchers/${id}`, { method: "DELETE", headers: adminAuthHeaders() });
    load();
  }

  return (
    <AdminLayout pageTitle="Vouchers" pageSubtitle="Event voucher codes for ticket discounts.">
      <div className="admin-tickets">
        {error ? <p className="admin-tickets__error">{error}</p> : null}
        <form className="admin-tickets__voucher-form" onSubmit={handleCreate}>
          <input placeholder="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} required />
          <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount (€)</option>
          </select>
          <input type="number" placeholder="Value" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} required />
          <input type="number" placeholder="Usage limit" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} />
          <input type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} />
          <button type="submit" className="admin-tickets__btn admin-tickets__btn--primary"><IconPlus size={16} /> Add</button>
        </form>
        {loading ? <p className="admin-tickets__status">Loading…</p> : (
          <table className="admin-tickets__table">
            <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Used</th><th>Expires</th><th></th></tr></thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.id}>
                  <td className="admin-tickets__mono">{v.code}</td>
                  <td>{v.discountType}</td>
                  <td>{v.discountType === "percentage" ? `${v.discountValue}%` : `€${v.discountValue}`}</td>
                  <td>{v.usedCount}{v.usageLimit ? ` / ${v.usageLimit}` : ""}</td>
                  <td>{v.expiryDate ? new Date(v.expiryDate).toLocaleDateString() : "—"}</td>
                  <td><button type="button" onClick={() => handleDelete(v.id)}><IconTrash size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
