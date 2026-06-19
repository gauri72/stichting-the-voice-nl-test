import { useCallback, useEffect, useState } from "react";
import { IconPlus, IconSearch, IconDownload, IconEdit, IconTrash, IconX } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { formatDate, badgeClass, downloadBlob, hasFinancePermission, canDeleteFinance } from "../../utils/financeAdmin.js";
import "../../styles/admin-sponsorships-donations-page.css";

const TYPES = [
  { value: "", label: "All types" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "refund", label: "Refund" },
  { value: "transfer", label: "Transfer" },
  { value: "adjustment", label: "Adjustment" },
];

const MODULES = [
  { value: "", label: "All modules" },
  { value: "tickets", label: "Tickets" },
  { value: "tickettailor", label: "TicketTailor" },
  { value: "memberships", label: "Memberships" },
  { value: "sponsorships", label: "Sponsorships" },
  { value: "donations", label: "Donations" },
  { value: "invoices", label: "Invoices" },
  { value: "manual", label: "Manual" },
];

const EMPTY_FORM = {
  type: "income", category: "", description: "", relatedEventId: "", relatedModule: "manual",
  amount: "", vatAmount: "", paymentStatus: "pending", paymentMethod: "", paymentReference: "",
  transactionDate: new Date().toISOString().slice(0, 10), notes: "",
};

export default function AdminFinanceTransactionsPage() {
  const { admin } = useAdminAuth();
  const canWrite = hasFinancePermission(admin?.role, "transactions.write");
  const canDelete = canDeleteFinance(admin?.role);

  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ type: "", relatedModule: "" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filters.type) params.set("type", filters.type);
      if (filters.relatedModule) params.set("relatedModule", filters.relatedModule);
      const [listData, statsData, eventsData] = await Promise.all([
        apiFetch(`/api/admin/finance/transactions?${params}`, { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/finance/transactions/dashboard", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/events?limit=100", { headers: adminAuthHeaders() }).catch(() => ({ events: [] })),
      ]);
      setItems(listData.transactions || []);
      setStats(statsData.stats || null);
      setEvents(eventsData.events || []);
    } catch (err) {
      setError(err.message || "Could not load transactions.");
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, relatedEventId: form.relatedEventId || null };
      if (editId) {
        await apiFetch(`/api/admin/finance/transactions/${editId}`, { method: "PATCH", headers: adminAuthHeaders(), body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/admin/finance/transactions", { method: "POST", headers: adminAuthHeaders(), body: JSON.stringify(payload) });
      }
      setDrawerOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || "Could not save.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!canDelete || !window.confirm("Delete this transaction?")) return;
    try {
      await apiFetch(`/api/admin/finance/transactions/${id}`, { method: "DELETE", headers: adminAuthHeaders() });
      loadData();
    } catch (err) {
      setError(err.message || "Delete failed.");
    }
  }

  const statCards = stats ? [
    { label: "Total Transactions", value: stats.totalTransactions },
    { label: "Total Income", value: stats.totalIncome },
    { label: "Total Expenses", value: stats.totalExpenses },
    { label: "Net Result", value: stats.netResult },
  ] : [];

  return (
    <AdminLayout pageTitle="Transactions" pageSubtitle="Track all income, expenses and payment activities.">
      <div className="admin-finance">
        <div className="admin-finance__top-actions">
          {canWrite ? <button type="button" className="admin-finance__btn admin-finance__btn--primary" onClick={() => { setForm(EMPTY_FORM); setEditId(null); setDrawerOpen(true); }}><IconPlus size={16} /> Add Transaction</button> : null}
          <button type="button" className="admin-finance__btn" onClick={() => downloadBlob("/api/admin/finance/transactions/export", "transactions.csv")}><IconDownload size={16} /> Export</button>
        </div>

        {statCards.length ? <div className="admin-finance__stats">{statCards.map((s) => (
          <article key={s.label} className="admin-finance__stat"><p className="admin-finance__stat-value">{s.value}</p><p className="admin-finance__stat-label">{s.label}</p></article>
        ))}</div> : null}

        <div className="admin-finance__toolbar">
          <div className="admin-finance__search"><IconSearch size={16} /><input type="search" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>{TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          <select value={filters.relatedModule} onChange={(e) => setFilters((f) => ({ ...f, relatedModule: e.target.value }))}>{MODULES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        </div>

        {error ? <p className="admin-finance__error">{error}</p> : null}
        {loading ? <p className="admin-finance__status">Loading…</p> : null}

        <div className="admin-finance__table-wrap">
          <table className="admin-finance__table">
            <thead>
              <tr>
                <th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Event</th><th>Module</th>
                <th>Amount</th><th>VAT</th><th>Status</th><th>Method</th><th>Reference</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.transactionDate)}</td>
                  <td>{item.type}</td>
                  <td>{item.category}</td>
                  <td>{item.description}</td>
                  <td>{item.relatedEventName || "—"}</td>
                  <td>{item.relatedModule}</td>
                  <td>{item.amountFormatted}</td>
                  <td>{item.vatAmountFormatted}</td>
                  <td><span className={badgeClass(item.paymentStatus)}>{item.paymentStatus}</span></td>
                  <td>{item.paymentMethod || "—"}</td>
                  <td>{item.paymentReference || "—"}</td>
                  <td>
                    <div className="admin-finance__actions">
                      {canWrite ? <button type="button" className="admin-finance__icon-btn" onClick={() => { setEditId(item.id); setForm({ ...EMPTY_FORM, ...item, amount: String(Math.abs(item.amount) / 100), transactionDate: item.transactionDate?.slice?.(0, 10) || "" }); setDrawerOpen(true); }}><IconEdit size={16} /></button> : null}
                      {canDelete ? <button type="button" className="admin-finance__icon-btn" onClick={() => handleDelete(item.id)}><IconTrash size={16} /></button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drawerOpen ? (
        <>
          <div className="admin-finance__overlay" onClick={() => setDrawerOpen(false)} aria-hidden />
          <aside className="admin-finance__drawer">
            <div className="admin-finance__drawer-head">
              <h2>{editId ? "Edit Transaction" : "Add Transaction"}</h2>
              <button type="button" className="admin-finance__icon-btn" onClick={() => setDrawerOpen(false)}><IconX size={18} /></button>
            </div>
            <form className="admin-finance__form-grid" onSubmit={handleSubmit}>
              <label>Type<select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>{TYPES.filter((t) => t.value).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
              <label>Category<input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} /></label>
              <label className="admin-finance__full">Description<input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required /></label>
              <label>Amount (€)<input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required /></label>
              <label>Date<input type="date" value={form.transactionDate} onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))} /></label>
              <label>Module<select value={form.relatedModule} onChange={(e) => setForm((f) => ({ ...f, relatedModule: e.target.value }))}>{MODULES.filter((m) => m.value).map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
              <label>Event<select value={form.relatedEventId} onChange={(e) => setForm((f) => ({ ...f, relatedEventId: e.target.value }))}><option value="">—</option>{events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title || ev.name}</option>)}</select></label>
              <label>Payment Status<input value={form.paymentStatus} onChange={(e) => setForm((f) => ({ ...f, paymentStatus: e.target.value }))} /></label>
              <label>Reference<input value={form.paymentReference} onChange={(e) => setForm((f) => ({ ...f, paymentReference: e.target.value }))} /></label>
              <button type="submit" className="admin-finance__btn admin-finance__btn--primary admin-finance__full" disabled={submitting}>{submitting ? "Saving…" : "Save"}</button>
            </form>
          </aside>
        </>
      ) : null}
    </AdminLayout>
  );
}
