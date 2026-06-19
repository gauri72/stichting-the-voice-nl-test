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
  IconAlertTriangle,
  IconFileInvoice,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch, apiUrl } from "../../utils/api.js";
import "../../styles/admin-sponsorships-donations-page.css";

const PAYMENT_STATUSES = [
  { value: "", label: "All payments" },
  { value: "unpaid", label: "Unpaid" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
];

const SPONSORSHIP_STATUSES = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "paid", label: "Paid" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

const RECEIPT_STATUSES = [
  { value: "", label: "All receipts" },
  { value: "not_sent", label: "Not Sent" },
  { value: "sent", label: "Sent" },
  { value: "resent", label: "Resent" },
  { value: "downloaded", label: "Downloaded" },
];

const FOLLOW_UP_STATUSES = [
  { value: "", label: "All follow-ups" },
  { value: "no_follow_up", label: "No Follow-up" },
  { value: "reminder_due", label: "Reminder Due" },
  { value: "reminder_sent", label: "Reminder Sent" },
  { value: "waiting_response", label: "Waiting" },
  { value: "completed", label: "Completed" },
];

const PACKAGES = ["Associate", "Silver", "Gold", "Platinum", "Custom"];

const EMPTY_FORM = {
  sponsorType: "company",
  sponsorName: "",
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  vatNumber: "",
  website: "",
  packageName: "Silver",
  customPackageName: "",
  packageBenefits: "",
  amount: "",
  currency: "EUR",
  campaignName: "",
  paymentStatus: "unpaid",
  sponsorshipStatus: "pending",
  dueDate: "",
  notes: "",
  generateInvoice: true,
  sendInvoiceEmail: false,
  sendConfirmationEmail: false,
  createReceiptAfterPayment: true,
  addToMailingList: false,
};

function formatMoney(minor) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
    Number(minor || 0) / 100
  );
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

export default function AdminSponsorshipsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    paymentStatus: "",
    sponsorshipStatus: "",
    receiptStatus: "",
    followUpStatus: "",
    campaignName: "",
    packageName: "",
    dateFrom: "",
    dateTo: "",
  });
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
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    return params;
  }, [search, filters]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = buildParams();
      const [listData, statsData] = await Promise.all([
        apiFetch(`/api/admin/sponsorships?${params}`, { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/sponsorships/dashboard", { headers: adminAuthHeaders() }),
      ]);
      setItems(listData.sponsorships || []);
      setStats(statsData.stats || null);
    } catch (err) {
      setError(err.message || "Could not load sponsorships.");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setDrawerOpen(true);
  }

  function openEdit(item) {
    setForm({
      ...EMPTY_FORM,
      sponsorType: item.sponsorType,
      sponsorName: item.sponsorName,
      companyName: item.companyName,
      contactPerson: item.contactPerson,
      email: item.email,
      phone: item.phone,
      address: item.address,
      vatNumber: item.vatNumber,
      website: item.website,
      packageName: item.packageName,
      packageBenefits: item.packageBenefits,
      amount: String(item.amount / 100),
      currency: item.currency,
      campaignName: item.campaignName,
      paymentStatus: item.paymentStatus,
      sponsorshipStatus: item.sponsorshipStatus,
      dueDate: item.dueDate ? item.dueDate.slice(0, 10) : "",
      notes: item.notes,
    });
    setEditId(item.id);
    setDrawerOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...form,
        packageName: form.packageName === "Custom" ? form.customPackageName : form.packageName,
        amount: Number(form.amount),
      };
      if (editId) {
        await apiFetch(`/api/admin/sponsorships/${editId}`, {
          method: "PATCH",
          headers: adminAuthHeaders(),
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/admin/sponsorships", {
          method: "POST",
          headers: adminAuthHeaders(),
          body: JSON.stringify(payload),
        });
      }
      setDrawerOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || "Could not save sponsorship.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAction(id, action, body) {
    setError("");
    try {
      if (action === "delete") {
        if (!window.confirm("Delete this sponsorship permanently?")) return;
        await apiFetch(`/api/admin/sponsorships/${id}`, {
          method: "DELETE",
          headers: adminAuthHeaders(),
        });
      } else if (action === "reminder") {
        await apiFetch(`/api/admin/sponsorships/${id}/send-reminder`, {
          method: "POST",
          headers: adminAuthHeaders(),
          body: JSON.stringify(body || { templateType: "payment_reminder" }),
        });
      } else if (action === "receipt") {
        await apiFetch(`/api/admin/sponsorships/${id}/resend-receipt`, {
          method: "POST",
          headers: adminAuthHeaders(),
        });
      } else if (action === "paid") {
        await apiFetch(`/api/admin/sponsorships/${id}/mark-paid`, {
          method: "POST",
          headers: adminAuthHeaders(),
          body: JSON.stringify({ sendReceiptEmail: true }),
        });
      } else if (action === "overdue") {
        await apiFetch(`/api/admin/sponsorships/${id}/mark-overdue`, {
          method: "POST",
          headers: adminAuthHeaders(),
        });
      } else if (action === "thank_you") {
        await apiFetch(`/api/admin/sponsorships/${id}/send-reminder`, {
          method: "POST",
          headers: adminAuthHeaders(),
          body: JSON.stringify({ templateType: "thank_you" }),
        });
      } else if (action === "download_receipt") {
        await downloadBlob(`/api/admin/sponsorships/${id}/download-receipt`, `receipt-${id}.pdf`);
      } else if (action === "download_invoice") {
        await downloadBlob(`/api/admin/sponsorships/${id}/download-invoice`, `invoice-${id}.pdf`);
      } else if (action === "note") {
        await apiFetch(`/api/admin/sponsorships/${id}`, {
          method: "PATCH",
          headers: adminAuthHeaders(),
          body: JSON.stringify({ internalNote: noteText }),
        });
        setNoteModal(null);
        setNoteText("");
      }
      loadData();
    } catch (err) {
      setError(err.message || "Action failed.");
    }
  }

  async function handleExport(exportType = "") {
    const params = buildParams();
    if (exportType) params.set("exportType", exportType);
    await downloadBlob(`/api/admin/sponsorships/export?${params}`, "sponsorships-export.csv");
  }

  function toggleSelect(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const statCards = stats
    ? [
        { label: "Total Sponsors", value: stats.totalSponsors },
        { label: "Active Sponsorships", value: stats.activeSponsorships },
        { label: "Pending Payments", value: stats.pendingPayments },
        { label: "Sponsorship Revenue", value: stats.sponsorshipRevenue },
        { label: "Receipts Sent", value: stats.receiptsSent },
        { label: "Follow-ups Due", value: stats.followUpsDue },
      ]
    : [];

  return (
    <AdminLayout
      pageTitle="Sponsorships"
      pageSubtitle="Manage sponsors, packages, payments, receipts and follow-ups."
    >
      <div className="admin-finance">
        <div className="admin-finance__top-actions">
          <button type="button" className="admin-finance__btn admin-finance__btn--primary" onClick={openCreate}>
            <IconPlus size={16} /> Add Sponsor
          </button>
          <button type="button" className="admin-finance__btn admin-finance__btn--accent" onClick={openCreate}>
            <IconPlus size={16} /> Create Sponsorship
          </button>
          <button
            type="button"
            className="admin-finance__btn"
            onClick={() => selected[0] && handleAction(selected[0], "reminder")}
            disabled={!selected.length}
          >
            <IconMail size={16} /> Send Reminder
          </button>
          <button type="button" className="admin-finance__btn" onClick={() => handleExport()}>
            <IconDownload size={16} /> Export Sponsorships
          </button>
          <button type="button" className="admin-finance__btn" onClick={() => handleExport("paid")}>
            <IconDownload size={16} /> Download Report
          </button>
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
            <input
              type="search"
              placeholder="Search sponsor, email, invoice…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={filters.paymentStatus}
            onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value }))}
          >
            {PAYMENT_STATUSES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={filters.sponsorshipStatus}
            onChange={(e) => setFilters((f) => ({ ...f, sponsorshipStatus: e.target.value }))}
          >
            {SPONSORSHIP_STATUSES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={filters.receiptStatus}
            onChange={(e) => setFilters((f) => ({ ...f, receiptStatus: e.target.value }))}
          >
            {RECEIPT_STATUSES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={filters.followUpStatus}
            onChange={(e) => setFilters((f) => ({ ...f, followUpStatus: e.target.value }))}
          >
            {FOLLOW_UP_STATUSES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            aria-label="From date"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            aria-label="To date"
          />
        </div>

        {error ? <p className="admin-finance__error" role="alert">{error}</p> : null}
        {loading ? <p className="admin-finance__status">Loading sponsorships…</p> : null}

        <div className="admin-finance__table-wrap">
          <table className="admin-finance__table">
            <thead>
              <tr>
                <th><input type="checkbox" aria-label="Select all" onChange={(e) => setSelected(e.target.checked ? items.map((i) => i.id) : [])} /></th>
                <th>Sponsor</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Company</th>
                <th>Package</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Receipt</th>
                <th>Follow-up</th>
                <th>Campaign</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                  <td>{item.sponsorName}</td>
                  <td>{item.contactPerson || "—"}</td>
                  <td>{item.email}</td>
                  <td>{item.companyName || "—"}</td>
                  <td>{item.packageName || "—"}</td>
                  <td>{formatMoney(item.amount)}</td>
                  <td><span className={badgeClass(item.paymentStatus)}>{item.paymentStatus?.replace(/_/g, " ")}</span></td>
                  <td><span className={badgeClass(item.receiptStatus)}>{item.receiptStatus?.replace(/_/g, " ")}</span></td>
                  <td><span className={badgeClass(item.followUpStatus)}>{item.followUpStatus?.replace(/_/g, " ")}</span></td>
                  <td>{item.campaignName || "—"}</td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <div className="admin-finance__actions">
                      <button type="button" className="admin-finance__icon-btn" title="View" onClick={() => navigate(`/admin/sponsorships/${item.id}`)}><IconEye size={14} /></button>
                      <button type="button" className="admin-finance__icon-btn" title="Edit" onClick={() => openEdit(item)}><IconEdit size={14} /></button>
                      <button type="button" className="admin-finance__icon-btn" title="Reminder" onClick={() => handleAction(item.id, "reminder")}><IconMail size={14} /></button>
                      <button type="button" className="admin-finance__icon-btn" title="Resend receipt" onClick={() => handleAction(item.id, "receipt")}><IconReceipt size={14} /></button>
                      <button type="button" className="admin-finance__icon-btn" title="Download receipt" onClick={() => handleAction(item.id, "download_receipt")}><IconDownload size={14} /></button>
                      <button type="button" className="admin-finance__icon-btn" title="Invoice" onClick={() => handleAction(item.id, "download_invoice")}><IconFileInvoice size={14} /></button>
                      <button type="button" className="admin-finance__icon-btn" title="Mark paid" onClick={() => handleAction(item.id, "paid")}><IconCheck size={14} /></button>
                      <button type="button" className="admin-finance__icon-btn" title="Mark overdue" onClick={() => handleAction(item.id, "overdue")}><IconAlertTriangle size={14} /></button>
                      <button type="button" className="admin-finance__icon-btn" title="Add note" onClick={() => setNoteModal(item.id)}><IconEdit size={14} /></button>
                      <button type="button" className="admin-finance__icon-btn" title="Delete" onClick={() => handleAction(item.id, "delete")}><IconTrash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-finance__cards-mobile">
          {items.map((item) => (
            <article key={item.id} className="admin-finance__card">
              <strong>{item.sponsorName}</strong>
              <p>{item.email} · {formatMoney(item.amount)}</p>
              <p><span className={badgeClass(item.paymentStatus)}>{item.paymentStatus}</span></p>
              <Link to={`/admin/sponsorships/${item.id}`} className="admin-finance__btn">View details</Link>
            </article>
          ))}
        </div>
      </div>

      {drawerOpen ? (
        <>
          <div className="admin-finance__overlay" onClick={() => setDrawerOpen(false)} aria-hidden />
          <aside className="admin-finance__drawer" role="dialog" aria-label={editId ? "Edit sponsorship" : "Create sponsorship"}>
            <div className="admin-finance__drawer-head">
              <h2>{editId ? "Edit Sponsorship" : "Create Sponsorship"}</h2>
              <button type="button" className="admin-finance__icon-btn" onClick={() => setDrawerOpen(false)}><IconX size={18} /></button>
            </div>
            <form className="admin-finance__form-grid" onSubmit={handleSubmit}>
              <div className="admin-finance__field-row">
                <div className="admin-finance__field">
                  <label>Sponsor Type</label>
                  <select value={form.sponsorType} onChange={(e) => setForm({ ...form, sponsorType: e.target.value })}>
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                    <option value="organization">Organization</option>
                  </select>
                </div>
                <div className="admin-finance__field">
                  <label>Sponsorship Status</label>
                  <select value={form.sponsorshipStatus} onChange={(e) => setForm({ ...form, sponsorshipStatus: e.target.value })}>
                    {SPONSORSHIP_STATUSES.filter((s) => s.value).map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="admin-finance__field">
                <label>Sponsor Name *</label>
                <input required value={form.sponsorName} onChange={(e) => setForm({ ...form, sponsorName: e.target.value })} />
              </div>
              <div className="admin-finance__field-row">
                <div className="admin-finance__field">
                  <label>Company Name</label>
                  <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
                </div>
                <div className="admin-finance__field">
                  <label>Contact Person</label>
                  <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
                </div>
              </div>
              <div className="admin-finance__field-row">
                <div className="admin-finance__field">
                  <label>Email *</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="admin-finance__field">
                  <label>Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="admin-finance__field">
                <label>Address</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="admin-finance__field-row">
                <div className="admin-finance__field">
                  <label>VAT Number</label>
                  <input value={form.vatNumber} onChange={(e) => setForm({ ...form, vatNumber: e.target.value })} />
                </div>
                <div className="admin-finance__field">
                  <label>Website</label>
                  <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                </div>
              </div>
              <div className="admin-finance__field-row">
                <div className="admin-finance__field">
                  <label>Package</label>
                  <select value={form.packageName} onChange={(e) => setForm({ ...form, packageName: e.target.value })}>
                    {PACKAGES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="admin-finance__field">
                  <label>Amount (EUR) *</label>
                  <input type="number" min="0" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              {form.packageName === "Custom" ? (
                <div className="admin-finance__field">
                  <label>Custom Package Name</label>
                  <input value={form.customPackageName} onChange={(e) => setForm({ ...form, customPackageName: e.target.value })} />
                </div>
              ) : null}
              <div className="admin-finance__field">
                <label>Package Benefits</label>
                <textarea value={form.packageBenefits} onChange={(e) => setForm({ ...form, packageBenefits: e.target.value })} />
              </div>
              <div className="admin-finance__field-row">
                <div className="admin-finance__field">
                  <label>Event / Campaign</label>
                  <input value={form.campaignName} onChange={(e) => setForm({ ...form, campaignName: e.target.value })} />
                </div>
                <div className="admin-finance__field">
                  <label>Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="admin-finance__field">
                <label>Payment Status</label>
                <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                  {PAYMENT_STATUSES.filter((s) => s.value).map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="admin-finance__field">
                <label>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              {!editId ? (
                <div className="admin-finance__checkboxes">
                  <label><input type="checkbox" checked={form.generateInvoice} onChange={(e) => setForm({ ...form, generateInvoice: e.target.checked })} /> Generate Invoice</label>
                  <label><input type="checkbox" checked={form.sendInvoiceEmail} onChange={(e) => setForm({ ...form, sendInvoiceEmail: e.target.checked })} /> Send Invoice Email</label>
                  <label><input type="checkbox" checked={form.sendConfirmationEmail} onChange={(e) => setForm({ ...form, sendConfirmationEmail: e.target.checked })} /> Send Confirmation Email</label>
                  <label><input type="checkbox" checked={form.addToMailingList} onChange={(e) => setForm({ ...form, addToMailingList: e.target.checked })} /> Add to Mailing List</label>
                </div>
              ) : null}
              <button type="submit" className="admin-finance__btn admin-finance__btn--primary" disabled={submitting}>
                {submitting ? "Saving…" : editId ? "Update Sponsorship" : "Create Sponsorship"}
              </button>
            </form>
          </aside>
        </>
      ) : null}

      {noteModal ? (
        <>
          <div className="admin-finance__overlay" onClick={() => setNoteModal(null)} aria-hidden />
          <aside className="admin-finance__drawer">
            <div className="admin-finance__drawer-head">
              <h2>Internal Note</h2>
              <button type="button" className="admin-finance__icon-btn" onClick={() => setNoteModal(null)}><IconX size={18} /></button>
            </div>
            <textarea className="admin-finance__field" style={{ width: "100%", minHeight: 120 }} value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <button type="button" className="admin-finance__btn admin-finance__btn--primary" onClick={() => handleAction(noteModal, "note")}>Save Note</button>
          </aside>
        </>
      ) : null}
    </AdminLayout>
  );
}
