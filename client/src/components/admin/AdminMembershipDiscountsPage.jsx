import { useCallback, useEffect, useState } from "react";
import { IconPlus, IconEdit, IconTrash, IconPlayerPause, IconPlayerPlay, IconX } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import EventTicketTypeScopePicker from "./EventTicketTypeScopePicker.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import "../../styles/admin-discounts-page.css";

// Real membership plan IDs (server/src/config/membershipPlans.js) mapped to admin-friendly
// labels — the user's "Silver/Gold/Platinum" wording is illustrative, not literal; there is
// no separate tier-naming system in this codebase, so tiers map 1:1 to membership plans.
const TIERS = [
  { value: "student", label: "Student" },
  { value: "privilegedSingle", label: "Privileged Single" },
  { value: "privilegedFamily", label: "Privileged Family" },
  { value: "premiumSingle", label: "Premium Single" },
  { value: "premiumFamily", label: "Premium Family" },
];
const TIER_LABELS = Object.fromEntries(TIERS.map((t) => [t.value, t.label]));

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "paused", label: "Paused" },
  { value: "expired", label: "Expired" },
  { value: "archived", label: "Archived" },
];

const EMPTY_FORM = {
  name: "",
  tier: "",
  discountType: "percentage",
  discountValue: "",
  applyToAllEvents: true,
  eventScopes: [],
  startDate: "",
  expiryDate: "",
  allowStacking: true,
  status: "active",
  description: "",
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL");
}

function statusBadge(status) {
  return `admin-discounts__badge admin-discounts__badge--${status || "paused"}`;
}

export default function AdminMembershipDiscountsPage() {
  const [discounts, setDiscounts] = useState([]);
  const [events, setEvents] = useState([]);
  const [filterTicketTypes, setFilterTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ tier: "", status: "", eventId: "", ticketTypeId: "" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ type: "automatic_member" });
      if (filters.status) params.set("status", filters.status);
      if (filters.eventId) params.set("eventId", filters.eventId);
      if (filters.ticketTypeId) params.set("ticketTypeId", filters.ticketTypeId);
      const [listData, eventsData] = await Promise.all([
        apiFetch(`/api/admin/discounts?${params}`, { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/discounts/events", { headers: adminAuthHeaders() }),
      ]);
      const rows = filters.tier
        ? (listData.discounts || []).filter((d) => (d.eligibleMembershipTypes || []).includes(filters.tier))
        : listData.discounts || [];
      setDiscounts(rows);
      setEvents(eventsData.events || []);
    } catch (err) {
      setError(err.message || "Could not load membership discounts.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!filters.eventId) {
      setFilterTicketTypes([]);
      return;
    }
    apiFetch(`/api/admin/events/${filters.eventId}`, { headers: adminAuthHeaders() })
      .then((data) => setFilterTicketTypes(data.event?.ticketTypes || []))
      .catch(() => setFilterTicketTypes([]));
  }, [filters.eventId]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setDrawerOpen(true);
  }

  function openEdit(d) {
    setForm({
      name: d.name || "",
      tier: d.eligibleMembershipTypes?.[0] || "",
      discountType: d.discountType === "fixed" ? "fixed_amount" : d.discountType || "percentage",
      discountValue: String(d.discountValue ?? ""),
      applyToAllEvents: d.applyToAllEvents !== false,
      eventScopes: d.eventScopes || [],
      startDate: d.startDate ? String(d.startDate).slice(0, 10) : "",
      expiryDate: d.expiryDate ? String(d.expiryDate).slice(0, 10) : "",
      allowStacking: d.allowStacking !== false,
      status: d.status || "active",
      description: d.description || "",
    });
    setEditId(d.id);
    setDrawerOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.tier) {
      setError("Select a membership tier.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        type: "automatic_member",
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        appliesTo: "tickets",
        eligibleMembershipTypes: [form.tier],
        applyToAllEvents: form.applyToAllEvents,
        eventScopes: form.eventScopes,
        startDate: form.startDate || null,
        expiryDate: form.expiryDate || null,
        allowStacking: Boolean(form.allowStacking),
        status: form.status,
        description: form.description,
        visibleToUsers: true,
        showOnDashboard: true,
      };
      const method = editId ? "PATCH" : "POST";
      const url = editId ? `/api/admin/discounts/${editId}` : "/api/admin/discounts";
      await apiFetch(url, { method, headers: adminAuthHeaders(), body: JSON.stringify(payload) });
      setDrawerOpen(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function runAction(d, action) {
    try {
      if (action === "delete") {
        if (!window.confirm("Delete this membership discount?")) return;
        await apiFetch(`/api/admin/discounts/${d.id}`, { method: "DELETE", headers: adminAuthHeaders() });
      } else if (action === "pause") {
        await apiFetch(`/api/admin/discounts/${d.id}/pause`, { method: "POST", headers: adminAuthHeaders() });
      } else if (action === "activate") {
        await apiFetch(`/api/admin/discounts/${d.id}/activate`, { method: "POST", headers: adminAuthHeaders() });
      }
      await loadData();
    } catch (err) {
      window.alert(err.message || "Action failed.");
    }
  }

  return (
    <AdminLayout
      pageTitle="Membership Discounts"
      pageSubtitle="Discounts applied automatically based on a member's tier — no code entry required."
    >
      <div className="admin-discounts">
        <div className="admin-discounts__top-actions">
          <button type="button" className="admin-discounts__btn admin-discounts__btn--primary" onClick={openCreate}>
            <IconPlus size={16} /> Create Membership Discount
          </button>
        </div>

        <div className="admin-discounts__toolbar">
          <select value={filters.tier} onChange={(e) => setFilters((f) => ({ ...f, tier: e.target.value }))}>
            <option value="">All tiers</option>
            {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={filters.eventId}
            onChange={(e) => setFilters((f) => ({ ...f, eventId: e.target.value, ticketTypeId: "" }))}
          >
            <option value="">All events</option>
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </select>
          {filters.eventId ? (
            <select value={filters.ticketTypeId} onChange={(e) => setFilters((f) => ({ ...f, ticketTypeId: e.target.value }))}>
              <option value="">All ticket types</option>
              {filterTicketTypes.map((tt) => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
            </select>
          ) : null}
        </div>

        {error ? <p className="admin-discounts__error">{error}</p> : null}

        {loading ? (
          <p className="admin-discounts__status">Loading membership discounts…</p>
        ) : discounts.length === 0 ? (
          <p className="admin-discounts__empty">No membership discounts yet.</p>
        ) : (
          <div className="admin-discounts__table-wrap admin-discounts__table-wrap--desktop">
            <table className="admin-discounts__table">
              <thead>
                <tr><th>Name</th><th>Tier</th><th>Discount</th><th>Events</th><th>Stacking</th><th>Expiry</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {discounts.map((d) => (
                  <tr key={d.id}>
                    <td><strong>{d.name}</strong></td>
                    <td>{TIER_LABELS[d.eligibleMembershipTypes?.[0]] || d.eligibleMembershipTypes?.[0] || "—"}</td>
                    <td>{d.discountLabel}</td>
                    <td>{d.applyToAllEvents ? "All events" : `${d.eventScopes?.length || 0} event(s)`}</td>
                    <td>{d.allowStacking !== false ? "Stacks with code/voucher" : "Exclusive"}</td>
                    <td>{formatDate(d.expiryDate)}</td>
                    <td><span className={statusBadge(d.status)}>{d.status}</span></td>
                    <td className="admin-discounts__actions-cell">
                      <button type="button" aria-label="Edit" onClick={() => openEdit(d)}><IconEdit size={16} /></button>
                      {d.status === "active" ? (
                        <button type="button" aria-label="Pause" onClick={() => runAction(d, "pause")}><IconPlayerPause size={16} /></button>
                      ) : (
                        <button type="button" aria-label="Activate" onClick={() => runAction(d, "activate")}><IconPlayerPlay size={16} /></button>
                      )}
                      <button type="button" aria-label="Delete" onClick={() => runAction(d, "delete")}><IconTrash size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {drawerOpen ? (
        <div className="admin-discounts__drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <aside className="admin-discounts__drawer admin-discounts__drawer--open" onClick={(e) => e.stopPropagation()}>
            <div className="admin-discounts__drawer-head">
              <h2>{editId ? "Edit Membership Discount" : "Create Membership Discount"}</h2>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close"><IconX size={20} /></button>
            </div>
            <form className="admin-discounts__drawer-body" onSubmit={handleSubmit}>
              <fieldset className="admin-discounts__section">
                <legend>Basic Info</legend>
                <label>Name<input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></label>
                <label>Membership Tier
                  <select required value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}>
                    <option value="">Select…</option>
                    {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </label>
                <label>Description<textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></label>
              </fieldset>

              <fieldset className="admin-discounts__section">
                <legend>Discount Value</legend>
                <label>Discount Type
                  <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed Amount</option>
                    <option value="free_ticket">Free Ticket</option>
                  </select>
                </label>
                <label>Value<input type="number" required min="0" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} /></label>
              </fieldset>

              <fieldset className="admin-discounts__section">
                <legend>Eligible Events &amp; Ticket Types</legend>
                <EventTicketTypeScopePicker
                  events={events}
                  value={{ applyToAllEvents: form.applyToAllEvents, eventScopes: form.eventScopes }}
                  onChange={(next) => setForm((f) => ({ ...f, ...next }))}
                />
              </fieldset>

              <fieldset className="admin-discounts__section">
                <legend>Schedule &amp; Stacking</legend>
                <label>Start Date<input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} /></label>
                <label>Expiry Date<input type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} /></label>
                <label className="admin-discounts__checkbox">
                  <input type="checkbox" checked={form.allowStacking} onChange={(e) => setForm((f) => ({ ...f, allowStacking: e.target.checked }))} />
                  Allow stacking with a voucher or discount code
                </label>
                <small>When off, the customer's best single discount applies — this membership discount or their code/voucher, whichever is greater.</small>
                <label>Status
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </fieldset>

              <div className="admin-discounts__drawer-actions">
                <button type="button" className="admin-discounts__btn" onClick={() => setDrawerOpen(false)}>Cancel</button>
                <button type="submit" className="admin-discounts__btn admin-discounts__btn--primary" disabled={submitting}>
                  {submitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </AdminLayout>
  );
}
