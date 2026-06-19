import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconPlus, IconSearch, IconDownload, IconEye, IconEdit, IconCopy, IconArchive, IconFileSpreadsheet } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { formatDate, badgeClass, downloadBlob, hasFinancePermission } from "../../utils/financeAdmin.js";
import "../../styles/admin-sponsorships-donations-page.css";

const BUDGET_STATUSES = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "finalized", label: "Finalized" },
  { value: "archived", label: "Archived" },
];

const EMPTY_FORM = {
  eventId: "", eventName: "", eventDate: "", venue: "", expectedAttendance: "", notes: "",
  plannedIncomeLines: [{ category: "ticket_sales", description: "", plannedAmount: "" }],
  plannedExpenseLines: [{ category: "venue_rental", description: "", plannedAmount: "", vendorPayee: "" }],
};

function varianceClass(value) {
  const n = Number(value) || 0;
  return n >= 0 ? "admin-finance__variance--positive" : "admin-finance__variance--negative";
}

export default function AdminFinanceEventBudgetsPage() {
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const canWrite = hasFinancePermission(admin?.role, "budgets.write");

  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filters.status) params.set("status", filters.status);
      const [listData, statsData, eventsData] = await Promise.all([
        apiFetch(`/api/admin/finance/event-budgets?${params}`, { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/finance/event-budgets/dashboard", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/events?limit=100", { headers: adminAuthHeaders() }).catch(() => ({ events: [] })),
      ]);
      setItems(listData.budgets || []);
      setStats(statsData.stats || null);
      setEvents(eventsData.events || []);
    } catch (err) {
      setError(err.message || "Could not load budgets.");
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        expectedAttendance: Number(form.expectedAttendance) || 0,
        plannedIncomeLines: form.plannedIncomeLines.map((l) => ({ ...l, plannedAmount: Math.round(Number(l.plannedAmount) * 100) })),
        plannedExpenseLines: form.plannedExpenseLines.map((l) => ({ ...l, plannedAmount: Math.round(Number(l.plannedAmount) * 100) })),
      };
      const res = await apiFetch("/api/admin/finance/event-budgets", { method: "POST", headers: adminAuthHeaders(), body: JSON.stringify(payload) });
      setDrawerOpen(false);
      navigate(`/admin/finance/event-budgets/${res.budget.id}`);
    } catch (err) {
      setError(err.message || "Could not create budget.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAction(id, action) {
    try {
      if (action === "pdf") await downloadBlob(`/api/admin/finance/event-budgets/${id}/export-pdf`, `budget-${id}.pdf`);
      else if (action === "excel") await downloadBlob(`/api/admin/finance/event-budgets/${id}/export-excel`, `budget-${id}.xlsx`);
      else if (action === "duplicate") await apiFetch(`/api/admin/finance/event-budgets/${id}/duplicate`, { method: "POST", headers: adminAuthHeaders() });
      else if (action === "import") await apiFetch(`/api/admin/finance/event-budgets/${id}/import-expenses`, { method: "POST", headers: adminAuthHeaders() });
      else if (action === "archive") await apiFetch(`/api/admin/finance/event-budgets/${id}/archive`, { method: "POST", headers: adminAuthHeaders() });
      loadData();
    } catch (err) {
      setError(err.message || "Action failed.");
    }
  }

  const statCards = stats ? [
    { label: "Events Budgeted", value: stats.totalEventsBudgeted },
    { label: "Planned Income", value: stats.plannedIncome },
    { label: "Actual Income", value: stats.actualIncome },
    { label: "Planned Expenses", value: stats.plannedExpenses },
    { label: "Actual Expenses", value: stats.actualExpenses },
    { label: "Net Result", value: stats.netResult },
    { label: "Budget Variance", value: stats.budgetVariance },
  ] : [];

  return (
    <AdminLayout pageTitle="Event Budgets" pageSubtitle="Plan, track and compare event budgets against actual performance.">
      <div className="admin-finance">
        <div className="admin-finance__top-actions">
          {canWrite ? <button type="button" className="admin-finance__btn admin-finance__btn--primary" onClick={() => { setForm(EMPTY_FORM); setDrawerOpen(true); }}><IconPlus size={16} /> Create Budget Sheet</button> : null}
          <button type="button" className="admin-finance__btn" onClick={() => downloadBlob("/api/admin/finance/event-budgets/export", "budgets.csv")}><IconDownload size={16} /> Export Budget</button>
          <Link to="/admin/finance/audit-reports" className="admin-finance__btn">Generate Budget Report</Link>
        </div>

        {statCards.length ? (
          <div className="admin-finance__stats">{statCards.map((s) => (
            <article key={s.label} className="admin-finance__stat"><p className="admin-finance__stat-value">{s.value}</p><p className="admin-finance__stat-label">{s.label}</p></article>
          ))}</div>
        ) : null}

        <div className="admin-finance__toolbar">
          <div className="admin-finance__search"><IconSearch size={16} /><input type="search" placeholder="Search event…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select value={filters.status} onChange={(e) => setFilters({ status: e.target.value })}>{BUDGET_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        </div>

        {error ? <p className="admin-finance__error">{error}</p> : null}
        {loading ? <p className="admin-finance__status">Loading…</p> : null}

        <div className="admin-finance__table-wrap">
          <table className="admin-finance__table">
            <thead>
              <tr>
                <th>Event</th><th>Date</th><th>Status</th><th>Planned Income</th><th>Actual Income</th>
                <th>Planned Expenses</th><th>Actual Expenses</th><th>Net</th><th>Variance</th><th>Updated</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.eventName}</td>
                  <td>{formatDate(item.eventDate)}</td>
                  <td><span className={badgeClass(item.status)}>{item.status}</span></td>
                  <td>{item.plannedIncomeTotalFormatted}</td>
                  <td>{item.actualIncomeTotalFormatted}</td>
                  <td>{item.plannedExpenseTotalFormatted}</td>
                  <td>{item.actualExpenseTotalFormatted}</td>
                  <td>{item.actualNetResultFormatted}</td>
                  <td className={varianceClass(item.variance)}>{item.varianceFormatted}</td>
                  <td>{formatDate(item.lastUpdated)}</td>
                  <td>
                    <div className="admin-finance__actions">
                      <button type="button" className="admin-finance__icon-btn" onClick={() => navigate(`/admin/finance/event-budgets/${item.id}`)}><IconEye size={16} /></button>
                      {canWrite ? <button type="button" className="admin-finance__icon-btn" onClick={() => navigate(`/admin/finance/event-budgets/${item.id}`)}><IconEdit size={16} /></button> : null}
                      {canWrite ? <button type="button" className="admin-finance__icon-btn" onClick={() => handleAction(item.id, "duplicate")}><IconCopy size={16} /></button> : null}
                      <button type="button" className="admin-finance__icon-btn" onClick={() => handleAction(item.id, "excel")}><IconFileSpreadsheet size={16} /></button>
                      <button type="button" className="admin-finance__icon-btn" onClick={() => handleAction(item.id, "pdf")}><IconDownload size={16} /></button>
                      {canWrite ? <button type="button" className="admin-finance__icon-btn" onClick={() => handleAction(item.id, "archive")}><IconArchive size={16} /></button> : null}
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
            <div className="admin-finance__drawer-head"><h2>Create Budget Sheet</h2></div>
            <form className="admin-finance__form-grid" onSubmit={handleSubmit}>
              <label>Event<select value={form.eventId} onChange={(e) => { const ev = events.find((x) => x.id === e.target.value); setForm((f) => ({ ...f, eventId: e.target.value, eventName: ev?.title || ev?.name || "", eventDate: ev?.startDate?.slice?.(0, 10) || "" })); }}><option value="">Select event</option>{events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title || ev.name}</option>)}</select></label>
              <label>Event Name<input value={form.eventName} onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))} required /></label>
              <label>Event Date<input type="date" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} /></label>
              <label>Expected Attendance<input type="number" value={form.expectedAttendance} onChange={(e) => setForm((f) => ({ ...f, expectedAttendance: e.target.value }))} /></label>
              <button type="submit" className="admin-finance__btn admin-finance__btn--primary admin-finance__full" disabled={submitting}>{submitting ? "Creating…" : "Create Budget"}</button>
            </form>
          </aside>
        </>
      ) : null}
    </AdminLayout>
  );
}
