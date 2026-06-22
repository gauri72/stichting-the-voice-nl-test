import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IconPlus,
  IconSearch,
  IconDownload,
  IconEye,
  IconEdit,
  IconTrash,
  IconX,
  IconMail,
  IconReceipt,
  IconCheck,
  IconRefresh,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch, apiUrl } from "../../utils/api.js";
import "../../styles/admin-sponsorships-donations-page.css";

const DONATION_TYPES = [
  { value: "", label: "All types" },
  { value: "one_time", label: "One-time" },
  { value: "recurring", label: "Recurring" },
  { value: "campaign", label: "Campaign" },
  { value: "anonymous", label: "Anonymous" },
  { value: "in_kind", label: "In-kind" },
];

const PAYMENT_STATUSES = [
  { value: "", label: "All payments" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
];

const RECEIPT_STATUSES = [
  { value: "", label: "All receipts" },
  { value: "not_sent", label: "Not Sent" },
  { value: "sent", label: "Sent" },
  { value: "resent", label: "Resent" },
  { value: "downloaded", label: "Downloaded" },
];

const RECURRING_STATUSES = [
  { value: "", label: "All recurring" },
  { value: "not_recurring", label: "Not Recurring" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed_payment", label: "Failed Payment" },
];

const EMPTY_FILTERS = {
  donationType: "",
  paymentStatus: "",
  receiptStatus: "",
  recurringStatus: "",
  campaignName: "",
  dateFrom: "",
  dateTo: "",
};

const EMPTY_FORM = {
  donorType: "individual",
  donorName: "",
  email: "",
  phone: "",
  address: "",
  country: "",
  donationType: "one_time",
  amount: "",
  currency: "EUR",
  campaignName: "",
  paymentMethod: "card",
  paymentStatus: "pending",
  donationDate: new Date().toISOString().slice(0, 10),
  recurringFrequency: "",
  recurringStatus: "not_recurring",
  notes: "",
  generateReceipt: true,
  sendReceiptEmail: false,
  sendThankYouEmail: false,
  addToMailingList: false,
  markAsAnonymous: false,
};

function formatMoney(minor) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(minor || 0) / 100);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL");
}

function badgeClass(status) {
  return `admin-finance__badge admin-finance__badge--${(status || "pending").replace(/\s/g, "_")}`;
}

async function downloadBlob(url, filename) {
  const response = await fetch(apiUrl(url), { headers: adminAuthHeaders() });
  if (!response.ok) throw new Error("Download failed.");
  const blob = await response.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function AdminDonationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [selected, setSelected] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText] = useState("");

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    return params;
  }, [search, filters]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    const endpoint = `/api/admin/donations?${buildParams()}`;
    console.log("[DONATIONS_ADMIN_FETCH_STARTED]", { endpoint, filters, search });
    try {
      const [listData, statsData] = await Promise.all([
        apiFetch(endpoint, { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/donations/dashboard", { headers: adminAuthHeaders() }),
      ]);
      const records = listData.donations || listData.records || [];
      console.log("[DONATIONS_ADMIN_FETCH_COUNT]", {
        count: records.length,
        paymentStatuses: [...new Set(records.map((r) => r.paymentStatus))],
        receiptStatuses: [...new Set(records.map((r) => r.receiptStatus))],
      });
      setItems(records);
      setStats(statsData.stats || listData.stats || null);
    } catch (err) {
      console.error("[DONATIONS_ADMIN_FETCH_ERROR]", err.message);
      setError(err.message || "Could not load donations.");
    } finally {
      setLoading(false);
    }
  }, [buildParams, filters, search]);

  useEffect(() => { loadData(); }, [loadData]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setDrawerOpen(true);
  }

  function openEdit(item) {
    setForm({
      ...EMPTY_FORM,
      donorType: item.donorType,
      donorName: item.rawDonorName || item.donorName,
      email: item.email,
      phone: item.phone,
      address: item.address,
      country: item.country,
      donationType: item.donationType,
      amount: String(item.amount / 100),
      campaignName: item.campaignName,
      paymentMethod: item.paymentMethod,
      paymentStatus: item.paymentStatus,
      donationDate: item.donationDate ? item.donationDate.slice(0, 10) : "",
      recurringStatus: item.recurringStatus,
      recurringFrequency: item.recurringFrequency,
      notes: item.notes,
      markAsAnonymous: item.isAnonymous,
    });
    setEditId(item.id);
    setDrawerOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, amount: Number(form.amount), isAnonymous: form.markAsAnonymous };
      if (editId) {
        await apiFetch(`/api/admin/donations/${editId}`, { method: "PATCH", headers: adminAuthHeaders(), body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/admin/donations", { method: "POST", headers: adminAuthHeaders(), body: JSON.stringify(payload) });
      }
      setDrawerOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || "Could not save donation.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAction(id, action) {
    try {
      if (action === "delete") {
        if (!window.confirm("Delete this donation permanently?")) return;
        await apiFetch(`/api/admin/donations/${id}`, { method: "DELETE", headers: adminAuthHeaders() });
      } else if (action === "receipt") {
        await apiFetch(`/api/admin/donations/${id}/resend-receipt`, { method: "POST", headers: adminAuthHeaders() });
      } else if (action === "reminder") {
        await apiFetch(`/api/admin/donations/${id}/send-reminder`, { method: "POST", headers: adminAuthHeaders(), body: JSON.stringify({ templateType: "reminder" }) });
      } else if (action === "thank_you") {
        await apiFetch(`/api/admin/donations/${id}/send-reminder`, { method: "POST", headers: adminAuthHeaders(), body: JSON.stringify({ templateType: "thank_you" }) });
      } else if (action === "paid") {
        await apiFetch(`/api/admin/donations/${id}/mark-paid`, { method: "POST", headers: adminAuthHeaders(), body: JSON.stringify({ sendReceiptEmail: true }) });
      } else if (action === "refunded") {
        await apiFetch(`/api/admin/donations/${id}/mark-refunded`, { method: "POST", headers: adminAuthHeaders() });
      } else if (action === "download") {
        await downloadBlob(`/api/admin/donations/${id}/download-receipt`, `donation-receipt-${id}.pdf`);
      } else if (action === "note") {
        await apiFetch(`/api/admin/donations/${id}`, { method: "PATCH", headers: adminAuthHeaders(), body: JSON.stringify({ internalNote: noteText }) });
        setNoteModal(null);
        setNoteText("");
      }
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function runBackfill() {
    try {
      const result = await apiFetch("/api/admin/sponsorships/backfill-payments", {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      window.alert(
        `Imported ${result.sponsorshipsCreated || 0} sponsorship(s) and ${result.donationsCreated || 0} donation(s) from payment records.`
      );
      loadData();
    } catch (err) {
      setError(err.message || "Backfill failed.");
    }
  }

  function resetFilters() {
    setSearch("");
    setFilters({ ...EMPTY_FILTERS });
  }

  async function handleExport(exportType = "") {
    const params = buildParams();
    if (exportType) params.set("exportType", exportType);
    await downloadBlob(`/api/admin/donations/export?${params}`, "donations-export.csv");
  }

  const statCards = stats ? [
    { label: "Total Donations", value: stats.totalDonations },
    { label: "Total Donors", value: stats.totalDonors },
    { label: "Donation Revenue", value: stats.donationRevenue },
    { label: "Recurring Donations", value: stats.recurringDonations },
    { label: "Pending Receipts", value: stats.pendingReceipts },
    { label: "Reminders Due", value: stats.remindersDue },
  ] : [];

  return (
    <AdminLayout pageTitle="Donations" pageSubtitle="Manage donations, donors, receipts, reminders and giving history.">
      <div className="admin-finance">
        <div className="admin-finance__top-actions">
          <button type="button" className="admin-finance__btn admin-finance__btn--primary" onClick={openCreate}><IconPlus size={16} /> Add Donation</button>
          <button type="button" className="admin-finance__btn admin-finance__btn--accent" onClick={openCreate}><IconPlus size={16} /> Add Donor</button>
          <button type="button" className="admin-finance__btn" disabled={!selected.length} onClick={() => selected[0] && handleAction(selected[0], "receipt")}><IconReceipt size={16} /> Send Receipt</button>
          <button type="button" className="admin-finance__btn" onClick={() => handleExport()}><IconDownload size={16} /> Export Donations</button>
          <button type="button" className="admin-finance__btn" onClick={() => handleExport("paid")}><IconDownload size={16} /> Download Report</button>
          <button type="button" className="admin-finance__btn" onClick={runBackfill}>Import from Payments</button>
        </div>

        {statCards.length ? (
          <div className="admin-finance__stats">
            {statCards.map((s) => (
              <article key={s.label} className="admin-finance__stat">
                <p className="admin-finance__stat-value">{s.value}</p>
                <p className="admin-finance__stat-label">{s.label}</p>
              </article>
            ))}
          </div>
        ) : null}

        <div className="admin-finance__toolbar">
          <div className="admin-finance__search">
            <IconSearch size={16} />
            <input type="search" placeholder="Search donor, email, receipt…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={filters.donationType} onChange={(e) => setFilters((f) => ({ ...f, donationType: e.target.value }))}>
            {DONATION_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filters.paymentStatus} onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value }))}>
            {PAYMENT_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filters.receiptStatus} onChange={(e) => setFilters((f) => ({ ...f, receiptStatus: e.target.value }))}>
            {RECEIPT_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filters.recurringStatus} onChange={(e) => setFilters((f) => ({ ...f, recurringStatus: e.target.value }))}>
            {RECURRING_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} aria-label="From" />
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} aria-label="To" />
          <button type="button" className="admin-finance__btn" onClick={loadData}><IconRefresh size={16} /> Refresh</button>
          <button type="button" className="admin-finance__btn" onClick={resetFilters}>Reset Filters</button>
        </div>

        {error ? <p className="admin-finance__error">{error}</p> : null}
        {loading ? <p className="admin-finance__status">Loading donations…</p> : null}
        {!loading && !error && items.length === 0 ? (
          <p className="admin-finance__empty">
            No donation records found. If payments were completed on the website, use
            &quot;Import from Payments&quot; to load them from payment history.
          </p>
        ) : null}

        {!loading && items.length > 0 ? (
        <div className="admin-finance__table-wrap">
          <table className="admin-finance__table">
            <thead>
              <tr>
                <th><input type="checkbox" onChange={(e) => setSelected(e.target.checked ? items.map((i) => i.id) : [])} /></th>
                <th>Donor</th>
                <th>Email</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Receipt</th>
                <th>Recurring</th>
                <th>Campaign</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><input type="checkbox" checked={selected.includes(item.id)} onChange={() => setSelected((p) => p.includes(item.id) ? p.filter((x) => x !== item.id) : [...p, item.id])} /></td>
                  <td>{item.donorName}</td>
                  <td>{item.email || "—"}</td>
                  <td>{item.donationType?.replace(/_/g, " ")}</td>
                  <td>{formatMoney(item.amount)}</td>
                  <td><span className={badgeClass(item.paymentStatus)}>{item.paymentStatus}</span></td>
                  <td><span className={badgeClass(item.receiptStatus)}>{item.receiptStatus?.replace(/_/g, " ")}</span></td>
                  <td><span className={badgeClass(item.recurringStatus)}>{item.recurringStatus?.replace(/_/g, " ")}</span></td>
                  <td>{item.campaignName || "—"}</td>
                  <td>{formatDate(item.donationDate)}</td>
                  <td>
                    <div className="admin-finance__actions">
                      <button type="button" className="admin-finance__icon-btn" onClick={() => navigate(`/admin/donations/${item.id}`)}><IconEye size={14} /></button>
                      <button type="button" className="admin-finance__icon-btn" onClick={() => openEdit(item)}><IconEdit size={14} /></button>
                      <button type="button" className="admin-finance__icon-btn" onClick={() => handleAction(item.id, "receipt")}><IconReceipt size={14} /></button>
                      <button type="button" className="admin-finance__icon-btn" onClick={() => handleAction(item.id, "download")}><IconDownload size={14} /></button>
                      <button type="button" className="admin-finance__icon-btn" onClick={() => handleAction(item.id, "thank_you")}><IconMail size={14} /></button>
                      <button type="button" className="admin-finance__icon-btn" onClick={() => handleAction(item.id, "paid")}><IconCheck size={14} /></button>
                      <button type="button" className="admin-finance__icon-btn" onClick={() => setNoteModal(item.id)}><IconEdit size={14} /></button>
                      <button type="button" className="admin-finance__icon-btn" onClick={() => handleAction(item.id, "delete")}><IconTrash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : null}
      </div>

      {drawerOpen ? (
        <>
          <div className="admin-finance__overlay" onClick={() => setDrawerOpen(false)} aria-hidden />
          <aside className="admin-finance__drawer">
            <div className="admin-finance__drawer-head">
              <h2>{editId ? "Edit Donation" : "Add Donation"}</h2>
              <button type="button" className="admin-finance__icon-btn" onClick={() => setDrawerOpen(false)}><IconX size={18} /></button>
            </div>
            <form className="admin-finance__form-grid" onSubmit={handleSubmit}>
              <div className="admin-finance__field-row">
                <div className="admin-finance__field">
                  <label>Donor Type</label>
                  <select value={form.donorType} onChange={(e) => setForm({ ...form, donorType: e.target.value })}>
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                    <option value="anonymous">Anonymous</option>
                  </select>
                </div>
                <div className="admin-finance__field">
                  <label>Donation Type</label>
                  <select value={form.donationType} onChange={(e) => setForm({ ...form, donationType: e.target.value })}>
                    {DONATION_TYPES.filter((t) => t.value).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="admin-finance__field">
                <label>Donor Name *</label>
                <input required value={form.donorName} onChange={(e) => setForm({ ...form, donorName: e.target.value })} />
              </div>
              <div className="admin-finance__field-row">
                <div className="admin-finance__field">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="admin-finance__field">
                  <label>Amount (EUR) *</label>
                  <input type="number" min="0" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <div className="admin-finance__field-row">
                <div className="admin-finance__field">
                  <label>Campaign</label>
                  <input value={form.campaignName} onChange={(e) => setForm({ ...form, campaignName: e.target.value })} />
                </div>
                <div className="admin-finance__field">
                  <label>Donation Date</label>
                  <input type="date" value={form.donationDate} onChange={(e) => setForm({ ...form, donationDate: e.target.value })} />
                </div>
              </div>
              <div className="admin-finance__field-row">
                <div className="admin-finance__field">
                  <label>Payment Status</label>
                  <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                    {PAYMENT_STATUSES.filter((s) => s.value).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="admin-finance__field">
                  <label>Payment Method</label>
                  <input value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} />
                </div>
              </div>
              <div className="admin-finance__field">
                <label>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              {!editId ? (
                <div className="admin-finance__checkboxes">
                  <label><input type="checkbox" checked={form.generateReceipt} onChange={(e) => setForm({ ...form, generateReceipt: e.target.checked })} /> Generate Receipt</label>
                  <label><input type="checkbox" checked={form.sendReceiptEmail} onChange={(e) => setForm({ ...form, sendReceiptEmail: e.target.checked })} /> Send Receipt Email</label>
                  <label><input type="checkbox" checked={form.sendThankYouEmail} onChange={(e) => setForm({ ...form, sendThankYouEmail: e.target.checked })} /> Send Thank You Email</label>
                  <label><input type="checkbox" checked={form.markAsAnonymous} onChange={(e) => setForm({ ...form, markAsAnonymous: e.target.checked })} /> Mark as Anonymous</label>
                </div>
              ) : null}
              <button type="submit" className="admin-finance__btn admin-finance__btn--primary" disabled={submitting}>
                {submitting ? "Saving…" : editId ? "Update Donation" : "Create Donation"}
              </button>
            </form>
          </aside>
        </>
      ) : null}

      {noteModal ? (
        <>
          <div className="admin-finance__overlay" onClick={() => setNoteModal(null)} aria-hidden />
          <aside className="admin-finance__drawer">
            <div className="admin-finance__drawer-head"><h2>Internal Note</h2><button type="button" className="admin-finance__icon-btn" onClick={() => setNoteModal(null)}><IconX size={18} /></button></div>
            <textarea style={{ width: "100%", minHeight: 120 }} value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <button type="button" className="admin-finance__btn admin-finance__btn--primary" onClick={() => handleAction(noteModal, "note")}>Save Note</button>
          </aside>
        </>
      ) : null}
    </AdminLayout>
  );
}
