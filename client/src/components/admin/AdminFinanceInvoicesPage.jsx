import { useCallback, useEffect, useState } from "react";
import {
  IconPlus, IconSearch, IconDownload, IconEye, IconEdit, IconTrash, IconX,
  IconMail, IconReceipt, IconCheck, IconCopy, IconFileInvoice, IconSettings,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import AdminLayout from "./AdminLayout.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { formatMoney, formatDate, badgeClass, downloadBlob, hasFinancePermission, canDeleteFinance } from "../../utils/financeAdmin.js";
import "../../styles/admin-sponsorships-donations-page.css";

const PAYMENT_STATUSES = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "viewed", label: "Viewed" },
  { value: "paid", label: "Paid" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const RELATED_TYPES = [
  { value: "", label: "All types" },
  { value: "sponsorship", label: "Sponsorship" },
  { value: "donation", label: "Donation" },
  { value: "event_vendor", label: "Event Vendor" },
  { value: "membership", label: "Membership" },
  { value: "ticketing", label: "Ticketing" },
  { value: "custom", label: "Custom" },
];

const CLIENT_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "company", label: "Company" },
  { value: "sponsor", label: "Sponsor" },
  { value: "vendor", label: "Vendor" },
  { value: "donor", label: "Donor" },
];

const EMPTY_LINE = { description: "", quantity: 1, unitPrice: "", vatRate: 21, discount: 0 };
const EMPTY_FORM = {
  clientType: "individual", clientName: "", companyName: "", contactPerson: "", email: "", phone: "",
  address: "", vatNumber: "", relatedType: "custom", relatedEventId: "", relatedModule: "", notes: "",
  invoiceDate: new Date().toISOString().slice(0, 10), dueDate: "", lineItems: [{ ...EMPTY_LINE }],
  footerNote: "", paymentLink: "", saveAsDraft: true, sendByEmail: false,
};

export default function AdminFinanceInvoicesPage() {
  const { admin } = useAdminAuth();
  const role = admin?.role || "admin";
  const canWrite = hasFinancePermission(role, "invoices.write");
  const canDelete = canDeleteFinance(role);
  const canSend = hasFinancePermission(role, "invoices.send");

  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ paymentStatus: "", relatedType: "", eventId: "", dateFrom: "", dateTo: "" });
  const [selected, setSelected] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    return params;
  }, [search, filters]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = buildParams();
      const [listData, statsData, eventsData] = await Promise.all([
        apiFetch(`/api/admin/finance/invoices?${params}`, { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/finance/invoices/dashboard", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/events?limit=100", { headers: adminAuthHeaders() }).catch(() => ({ events: [] })),
      ]);
      setItems(listData.invoices || []);
      setStats(statsData.stats || null);
      setEvents(eventsData.events || []);
    } catch (err) {
      setError(err.message || "Could not load invoices.");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { loadData(); }, [loadData]);

  function openCreate() { setForm(EMPTY_FORM); setEditId(null); setDrawerOpen(true); }

  function openEdit(item) {
    setForm({
      ...EMPTY_FORM,
      clientType: item.clientType,
      clientName: item.clientName,
      companyName: item.companyName,
      contactPerson: item.contactPerson,
      email: item.email,
      phone: item.phone,
      address: item.address,
      vatNumber: item.vatNumber,
      relatedType: item.relatedType,
      relatedEventId: item.relatedEventId || "",
      relatedModule: item.relatedModule,
      notes: item.notes,
      invoiceDate: item.invoiceDate ? item.invoiceDate.slice(0, 10) : "",
      dueDate: item.dueDate ? item.dueDate.slice(0, 10) : "",
      footerNote: item.footerNote,
      paymentLink: item.paymentLink,
      lineItems: item.lineItems?.length ? item.lineItems.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: String(l.unitPrice / 100),
        vatRate: l.vatRate,
        discount: String((l.discount || 0) / 100),
      })) : [{ ...EMPTY_LINE }],
    });
    setEditId(item.id);
    setDrawerOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canWrite) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        lineItems: form.lineItems.map((l) => ({
          ...l,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          vatRate: Number(l.vatRate),
          discount: Number(l.discount) || 0,
        })),
        relatedEventId: form.relatedEventId || null,
      };
      if (editId) {
        await apiFetch(`/api/admin/finance/invoices/${editId}`, { method: "PATCH", headers: adminAuthHeaders(), body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/admin/finance/invoices", { method: "POST", headers: adminAuthHeaders(), body: JSON.stringify(payload) });
      }
      setDrawerOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || "Could not save invoice.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAction(id, action) {
    try {
      if (action === "download") await downloadBlob(`/api/admin/finance/invoices/${id}/download-pdf`, `invoice-${id}.pdf`);
      else if (action === "send" && canSend) await apiFetch(`/api/admin/finance/invoices/${id}/send`, { method: "POST", headers: adminAuthHeaders() });
      else if (action === "resend" && canSend) await apiFetch(`/api/admin/finance/invoices/${id}/resend`, { method: "POST", headers: adminAuthHeaders() });
      else if (action === "paid" && canWrite) await apiFetch(`/api/admin/finance/invoices/${id}/mark-paid`, { method: "POST", headers: adminAuthHeaders(), body: JSON.stringify({}) });
      else if (action === "partial" && canWrite) await apiFetch(`/api/admin/finance/invoices/${id}/mark-paid`, { method: "POST", headers: adminAuthHeaders(), body: JSON.stringify({ partial: true }) });
      else if (action === "overdue" && canWrite) await apiFetch(`/api/admin/finance/invoices/${id}/mark-overdue`, { method: "POST", headers: adminAuthHeaders() });
      else if (action === "cancel" && canWrite) await apiFetch(`/api/admin/finance/invoices/${id}/cancel`, { method: "POST", headers: adminAuthHeaders() });
      else if (action === "duplicate" && canWrite) await apiFetch(`/api/admin/finance/invoices/${id}/duplicate`, { method: "POST", headers: adminAuthHeaders() });
      else if (action === "delete" && canDelete && window.confirm("Delete this invoice permanently?")) {
        await apiFetch(`/api/admin/finance/invoices/${id}`, { method: "DELETE", headers: adminAuthHeaders() });
      } else if (action === "view") {
        const data = await apiFetch(`/api/admin/finance/invoices/${id}`, { headers: adminAuthHeaders() });
        setViewItem(data.invoice);
      }
      loadData();
    } catch (err) {
      setError(err.message || "Action failed.");
    }
  }

  const statCards = stats ? [
    { label: "Total Invoices", value: stats.totalInvoices },
    { label: "Paid Invoices", value: stats.paidInvoices },
    { label: "Pending Invoices", value: stats.pendingInvoices },
    { label: "Overdue Invoices", value: stats.overdueInvoices },
    { label: "Invoice Revenue", value: stats.invoiceRevenue },
    { label: "Outstanding Amount", value: stats.outstandingAmount },
  ] : [];

  return (
    <AdminLayout pageTitle="Invoices" pageSubtitle="Create, send, track and manage invoices.">
      <div className="admin-finance">
        <div className="admin-finance__top-actions">
          {canWrite ? <button type="button" className="admin-finance__btn admin-finance__btn--primary" onClick={openCreate}><IconPlus size={16} /> Create Invoice</button> : null}
          <button type="button" className="admin-finance__btn" onClick={() => downloadBlob(`/api/admin/finance/invoices/export?${buildParams()}`, "invoices.csv")}><IconDownload size={16} /> Export Invoices</button>
          <button type="button" className="admin-finance__btn" onClick={() => downloadBlob(`/api/admin/finance/invoices/export?format=xlsx&${buildParams()}`, "invoices.xlsx")}><IconDownload size={16} /> Download Report</button>
          <Link to="/admin/finance/settings" className="admin-finance__btn"><IconSettings size={16} /> Invoice Settings</Link>
        </div>

        {statCards.length ? (
          <div className="admin-finance__stats">{statCards.map((s) => (
            <article key={s.label} className="admin-finance__stat">
              <p className="admin-finance__stat-value">{s.value}</p>
              <p className="admin-finance__stat-label">{s.label}</p>
            </article>
          ))}</div>
        ) : null}

        <div className="admin-finance__toolbar">
          <div className="admin-finance__search">
            <IconSearch size={16} />
            <input type="search" placeholder="Search invoice, client, email, event…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={filters.paymentStatus} onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value }))}>{PAYMENT_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          <select value={filters.relatedType} onChange={(e) => setFilters((f) => ({ ...f, relatedType: e.target.value }))}>{RELATED_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          <select value={filters.eventId} onChange={(e) => setFilters((f) => ({ ...f, eventId: e.target.value }))}>
            <option value="">All events</option>
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title || ev.name}</option>)}
          </select>
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} />
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} />
        </div>

        {error ? <p className="admin-finance__error" role="alert">{error}</p> : null}
        {loading ? <p className="admin-finance__status">Loading invoices…</p> : null}

        <div className="admin-finance__table-wrap">
          <table className="admin-finance__table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={selected.length === items.length && items.length > 0} onChange={(e) => setSelected(e.target.checked ? items.map((i) => i.id) : [])} /></th>
                <th>Invoice #</th><th>Client</th><th>Email</th><th>Type</th><th>Event</th>
                <th>Date</th><th>Due</th><th>Total</th><th>VAT</th><th>Status</th><th>Sent</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><input type="checkbox" checked={selected.includes(item.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, item.id] : selected.filter((id) => id !== item.id))} /></td>
                  <td>{item.invoiceNumber}</td>
                  <td>{item.clientName || item.companyName || "—"}</td>
                  <td>{item.email || "—"}</td>
                  <td>{item.relatedType}</td>
                  <td>{item.relatedEventName || "—"}</td>
                  <td>{formatDate(item.invoiceDate)}</td>
                  <td>{formatDate(item.dueDate)}</td>
                  <td>{item.totalAmountFormatted}</td>
                  <td>{item.vatAmountFormatted}</td>
                  <td><span className={badgeClass(item.paymentStatus)}>{item.paymentStatus}</span></td>
                  <td><span className={badgeClass(item.sentStatus)}>{item.sentStatus}</span></td>
                  <td>
                    <div className="admin-finance__actions">
                      <button type="button" className="admin-finance__icon-btn" title="View" onClick={() => handleAction(item.id, "view")}><IconEye size={16} /></button>
                      {canWrite ? <button type="button" className="admin-finance__icon-btn" title="Edit" onClick={() => openEdit(item)}><IconEdit size={16} /></button> : null}
                      {canWrite ? <button type="button" className="admin-finance__icon-btn" title="Duplicate" onClick={() => handleAction(item.id, "duplicate")}><IconCopy size={16} /></button> : null}
                      {canSend ? <button type="button" className="admin-finance__icon-btn" title="Send" onClick={() => handleAction(item.id, "send")}><IconMail size={16} /></button> : null}
                      <button type="button" className="admin-finance__icon-btn" title="PDF" onClick={() => handleAction(item.id, "download")}><IconFileInvoice size={16} /></button>
                      {canWrite ? <button type="button" className="admin-finance__icon-btn" title="Mark paid" onClick={() => handleAction(item.id, "paid")}><IconCheck size={16} /></button> : null}
                      {canDelete ? <button type="button" className="admin-finance__icon-btn" title="Delete" onClick={() => handleAction(item.id, "delete")}><IconTrash size={16} /></button> : null}
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
              <h2>{editId ? "Edit Invoice" : "Create Invoice"}</h2>
              <button type="button" className="admin-finance__icon-btn" onClick={() => setDrawerOpen(false)}><IconX size={18} /></button>
            </div>
            <form className="admin-finance__form-grid" onSubmit={handleSubmit}>
              <label>Client Type<select value={form.clientType} onChange={(e) => setForm((f) => ({ ...f, clientType: e.target.value }))}>{CLIENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
              <label>Client Name<input value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} required /></label>
              <label>Company<input value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} /></label>
              <label>Contact Person<input value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} /></label>
              <label>Email<input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></label>
              <label>Phone<input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></label>
              <label className="admin-finance__full">Address<textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={2} /></label>
              <label>VAT Number<input value={form.vatNumber} onChange={(e) => setForm((f) => ({ ...f, vatNumber: e.target.value }))} /></label>
              <label>Related Type<select value={form.relatedType} onChange={(e) => setForm((f) => ({ ...f, relatedType: e.target.value }))}>{RELATED_TYPES.filter((t) => t.value).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
              <label>Related Event<select value={form.relatedEventId} onChange={(e) => setForm((f) => ({ ...f, relatedEventId: e.target.value }))}><option value="">—</option>{events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title || ev.name}</option>)}</select></label>
              <label>Invoice Date<input type="date" value={form.invoiceDate} onChange={(e) => setForm((f) => ({ ...f, invoiceDate: e.target.value }))} /></label>
              <label>Due Date<input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} /></label>
              <div className="admin-finance__full">
                <h3>Line Items</h3>
                {form.lineItems.map((line, idx) => (
                  <div key={idx} className="admin-finance__line-row">
                    <input placeholder="Description" value={line.description} onChange={(e) => { const lines = [...form.lineItems]; lines[idx] = { ...line, description: e.target.value }; setForm((f) => ({ ...f, lineItems: lines })); }} />
                    <input type="number" placeholder="Qty" value={line.quantity} onChange={(e) => { const lines = [...form.lineItems]; lines[idx] = { ...line, quantity: e.target.value }; setForm((f) => ({ ...f, lineItems: lines })); }} />
                    <input type="number" step="0.01" placeholder="Unit €" value={line.unitPrice} onChange={(e) => { const lines = [...form.lineItems]; lines[idx] = { ...line, unitPrice: e.target.value }; setForm((f) => ({ ...f, lineItems: lines })); }} />
                    <input type="number" placeholder="VAT%" value={line.vatRate} onChange={(e) => { const lines = [...form.lineItems]; lines[idx] = { ...line, vatRate: e.target.value }; setForm((f) => ({ ...f, lineItems: lines })); }} />
                  </div>
                ))}
                <button type="button" className="admin-finance__btn" onClick={() => setForm((f) => ({ ...f, lineItems: [...f.lineItems, { ...EMPTY_LINE }] }))}>+ Add line</button>
              </div>
              <label className="admin-finance__full">Notes<textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></label>
              <label><input type="checkbox" checked={form.saveAsDraft} onChange={(e) => setForm((f) => ({ ...f, saveAsDraft: e.target.checked }))} /> Save as Draft</label>
              <label><input type="checkbox" checked={form.sendByEmail} onChange={(e) => setForm((f) => ({ ...f, sendByEmail: e.target.checked }))} /> Send by Email</label>
              <div className="admin-finance__drawer-actions admin-finance__full">
                <button type="submit" className="admin-finance__btn admin-finance__btn--primary" disabled={submitting}>{submitting ? "Saving…" : "Save Invoice"}</button>
              </div>
            </form>
          </aside>
        </>
      ) : null}

      {viewItem ? (
        <>
          <div className="admin-finance__overlay" onClick={() => setViewItem(null)} aria-hidden />
          <aside className="admin-finance__drawer">
            <div className="admin-finance__drawer-head">
              <h2>Invoice {viewItem.invoiceNumber}</h2>
              <button type="button" className="admin-finance__icon-btn" onClick={() => setViewItem(null)}><IconX size={18} /></button>
            </div>
            <div className="admin-finance-detail__grid">
              <p><strong>Client:</strong> {viewItem.clientName}</p>
              <p><strong>Total:</strong> {viewItem.totalAmountFormatted}</p>
              <p><strong>Balance:</strong> {viewItem.balanceDueFormatted}</p>
              <p><strong>Status:</strong> <span className={badgeClass(viewItem.paymentStatus)}>{viewItem.paymentStatus}</span></p>
            </div>
          </aside>
        </>
      ) : null}
    </AdminLayout>
  );
}
