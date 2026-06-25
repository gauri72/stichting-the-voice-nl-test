import { useCallback, useEffect, useState } from "react";
import { IconPlus, IconTrash, IconDownload, IconTicket } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import EventTicketTypeScopePicker from "./EventTicketTypeScopePicker.jsx";
import { adminAuthHeaders, apiFetch, apiUrl } from "../../utils/api.js";
import "../../styles/admin-tickets-page.css";

const EMPTY = {
  name: "",
  code: "",
  discountType: "percentage",
  discountValue: "",
  usageLimit: "",
  expiryDate: "",
  status: "active",
  assignedEmail: "",
  applyToAllEvents: true,
  eventScopes: [],
};

const EMPTY_BULK = {
  mode: "count",
  count: "10",
  assignedEmails: "",
  discountType: "percentage",
  discountValue: "",
  expiryDate: "",
  codePrefix: "",
  applyToAllEvents: true,
  eventScopes: [],
};

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [bulkForm, setBulkForm] = useState(EMPTY_BULK);
  const [showBulk, setShowBulk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bulkResult, setBulkResult] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [v, e] = await Promise.all([
        apiFetch("/api/admin/events/vouchers", { headers: adminAuthHeaders() }),
        // Published events only — vouchers must never be assignable to a draft event.
        apiFetch("/api/admin/discounts/events", { headers: adminAuthHeaders() }),
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
    try {
      await apiFetch(`/api/admin/events/vouchers/${id}`, { method: "DELETE", headers: adminAuthHeaders() });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleBulkGenerate(e) {
    e.preventDefault();
    setError("");
    setBulkResult(null);
    try {
      const payload = {
        discountType: bulkForm.discountType,
        discountValue: Number(bulkForm.discountValue),
        expiryDate: bulkForm.expiryDate || null,
        codePrefix: bulkForm.codePrefix,
        applyToAllEvents: bulkForm.applyToAllEvents,
        eventScopes: bulkForm.eventScopes,
      };
      if (bulkForm.mode === "emails") {
        payload.assignedEmails = bulkForm.assignedEmails
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        payload.count = Number(bulkForm.count);
      }
      const result = await apiFetch("/api/admin/events/vouchers/bulk-generate", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify(payload),
      });
      setBulkResult(result.vouchers || []);
      setBulkForm(EMPTY_BULK);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleExportCsv() {
    try {
      const response = await fetch(apiUrl("/api/admin/events/vouchers/export.csv"), {
        headers: adminAuthHeaders(),
      });
      if (!response.ok) throw new Error("Export failed.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vouchers.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err.message || "Export failed.");
    }
  }

  function describeScope(v) {
    if (v.applyToAllEvents) return "All events";
    const count = v.eventScopes?.length || v.eligibleEvents?.length || 0;
    return count ? `${count} event(s)` : "No events assigned";
  }

  return (
    <AdminLayout pageTitle="Vouchers" pageSubtitle="Single-use and bulk-generated voucher codes for ticket discounts.">
      <div className="admin-tickets">
        {error ? <p className="admin-tickets__error">{error}</p> : null}

        <div className="admin-tickets__voucher-actions">
          <button type="button" className="admin-tickets__btn" onClick={() => setShowBulk((v) => !v)}>
            <IconTicket size={16} /> {showBulk ? "Hide Bulk Generate" : "Bulk Generate"}
          </button>
          <button type="button" className="admin-tickets__btn" onClick={handleExportCsv}>
            <IconDownload size={16} /> Export CSV
          </button>
        </div>

        <form className="admin-tickets__voucher-form admin-tickets__voucher-form--full" onSubmit={handleCreate}>
          <h3>Create a single voucher</h3>
          <div className="admin-tickets__voucher-form-grid">
            <input placeholder="Code (leave blank to auto-generate)" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
            <input placeholder="Internal name (optional)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount (€)</option>
            </select>
            <input type="number" placeholder="Value" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} required />
            <input type="number" placeholder="Usage limit" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} />
            <input type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} />
            <input type="email" placeholder="Assign to email (optional)" value={form.assignedEmail} onChange={(e) => setForm((f) => ({ ...f, assignedEmail: e.target.value }))} />
          </div>
          <EventTicketTypeScopePicker
            events={events}
            value={{ applyToAllEvents: form.applyToAllEvents, eventScopes: form.eventScopes }}
            onChange={(next) => setForm((f) => ({ ...f, ...next }))}
          />
          <button type="submit" className="admin-tickets__btn admin-tickets__btn--primary"><IconPlus size={16} /> Add Voucher</button>
        </form>

        {showBulk ? (
          <form className="admin-tickets__voucher-form admin-tickets__voucher-form--full" onSubmit={handleBulkGenerate}>
            <h3>Bulk generate vouchers</h3>
            <div className="admin-tickets__voucher-form-grid">
              <label className="admin-tickets__radio">
                <input type="radio" checked={bulkForm.mode === "count"} onChange={() => setBulkForm((f) => ({ ...f, mode: "count" }))} />
                Anonymous codes
              </label>
              <label className="admin-tickets__radio">
                <input type="radio" checked={bulkForm.mode === "emails"} onChange={() => setBulkForm((f) => ({ ...f, mode: "emails" }))} />
                One per email
              </label>
            </div>
            {bulkForm.mode === "count" ? (
              <input
                type="number"
                min="1"
                max="500"
                placeholder="How many?"
                value={bulkForm.count}
                onChange={(e) => setBulkForm((f) => ({ ...f, count: e.target.value }))}
              />
            ) : (
              <textarea
                rows={4}
                placeholder="One email per line (or comma-separated)"
                value={bulkForm.assignedEmails}
                onChange={(e) => setBulkForm((f) => ({ ...f, assignedEmails: e.target.value }))}
              />
            )}
            <div className="admin-tickets__voucher-form-grid">
              <select value={bulkForm.discountType} onChange={(e) => setBulkForm((f) => ({ ...f, discountType: e.target.value }))}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount (€)</option>
              </select>
              <input type="number" placeholder="Value" value={bulkForm.discountValue} onChange={(e) => setBulkForm((f) => ({ ...f, discountValue: e.target.value }))} required />
              <input type="date" value={bulkForm.expiryDate} onChange={(e) => setBulkForm((f) => ({ ...f, expiryDate: e.target.value }))} />
              <input placeholder="Code prefix (optional)" value={bulkForm.codePrefix} onChange={(e) => setBulkForm((f) => ({ ...f, codePrefix: e.target.value }))} />
            </div>
            <EventTicketTypeScopePicker
              events={events}
              value={{ applyToAllEvents: bulkForm.applyToAllEvents, eventScopes: bulkForm.eventScopes }}
              onChange={(next) => setBulkForm((f) => ({ ...f, ...next }))}
            />
            <p className="admin-tickets__status">Every generated voucher is single-use (usage limit 1).</p>
            <button type="submit" className="admin-tickets__btn admin-tickets__btn--primary">Generate</button>
            {bulkResult ? (
              <p className="admin-tickets__status">Generated {bulkResult.length} voucher(s): {bulkResult.map((v) => v.code).join(", ")}</p>
            ) : null}
          </form>
        ) : null}

        {loading ? <p className="admin-tickets__status">Loading…</p> : (
          <div className="admin-tickets__table-wrap admin-table-scroll">
            <table className="admin-tickets__table">
              <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Assigned</th><th>Events</th><th>Used</th><th>Expires</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.id}>
                    <td className="admin-tickets__mono">{v.code}</td>
                    <td>{v.discountType}</td>
                    <td>{v.discountType === "percentage" ? `${v.discountValue}%` : `€${v.discountValue}`}</td>
                    <td>{v.assignedEmail || "—"}</td>
                    <td>{describeScope(v)}</td>
                    <td>{v.usedCount}{v.usageLimit ? ` / ${v.usageLimit}` : ""}</td>
                    <td>{v.expiryDate ? new Date(v.expiryDate).toLocaleDateString() : "—"}</td>
                    <td>{v.status}</td>
                    <td><button type="button" onClick={() => handleDelete(v.id)} aria-label="Delete voucher"><IconTrash size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
