import { useCallback, useEffect, useState } from "react";
import {
  IconPlus,
  IconSearch,
  IconDownload,
  IconRefresh,
  IconEye,
  IconEdit,
  IconCopy,
  IconPlayerPause,
  IconPlayerPlay,
  IconTrash,
  IconX,
  IconUsers,
  IconGift,
  IconTag,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch, apiUrl } from "../../utils/api.js";
import "../../styles/admin-discounts-page.css";

const DISCOUNT_TYPES = [
  { value: "", label: "All types" },
  { value: "automatic_member", label: "Automatic Member" },
  { value: "personalized_code", label: "Personalized Code" },
  { value: "referral_code", label: "Referral Code" },
  { value: "campaign_code", label: "Campaign Code" },
  { value: "event_code", label: "Event Code" },
  { value: "membership_code", label: "Membership Code" },
  { value: "legacy", label: "Legacy Code" },
  { value: "voucher", label: "Voucher" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "paused", label: "Paused" },
  { value: "expired", label: "Expired" },
  { value: "archived", label: "Archived" },
  { value: "hidden", label: "Hidden from dashboard" },
  { value: "deleted", label: "Deleted / Archived" },
];

const SOURCE_OPTIONS = [
  { value: "", label: "All sources" },
  { value: "platform", label: "Platform" },
  { value: "legacy", label: "Legacy" },
  { value: "voucher", label: "Voucher" },
  { value: "campaign", label: "Campaign" },
  { value: "referral", label: "Referral" },
  { value: "personal", label: "Personal" },
  { value: "event", label: "Event" },
  { value: "tickettailor", label: "TicketTailor" },
];

const TYPE_LABELS = Object.fromEntries(DISCOUNT_TYPES.filter((t) => t.value).map((t) => [t.value, t.label]));

const EMPTY_FORM = {
  name: "",
  code: "",
  type: "campaign_code",
  discountType: "percentage",
  discountValue: "",
  appliesTo: "tickets",
  eligibleEventIds: [],
  eligibleMembershipTypes: [],
  assignedUserId: "",
  assignedEmail: "",
  isPublic: false,
  referrerName: "",
  referrerEmail: "",
  referrerUserId: "",
  rewardType: "credit",
  rewardValue: "",
  usageLimit: "",
  usageLimitPerUser: "",
  minimumOrderAmount: "",
  startDate: "",
  expiryDate: "",
  allowStacking: true,
  status: "active",
  description: "",
  visibleToUsers: true,
  showOnDashboard: true,
  source: "platform",
};

function formatMoney(minor) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(minor || 0) / 100);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL");
}

function statusBadge(status) {
  return `admin-discounts__badge admin-discounts__badge--${status || "paused"}`;
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ type: "", status: "", source: "" });
  const [editCatalogId, setEditCatalogId] = useState(null);
  const [editRecordKind, setEditRecordKind] = useState("rule");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [showReferrals, setShowReferrals] = useState(false);
  const [createType, setCreateType] = useState("campaign_code");

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filters.type) params.set("type", filters.type);
    if (filters.status) params.set("status", filters.status);
    if (filters.source) params.set("source", filters.source);
    return params;
  }, [search, filters]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = buildParams();
      const [listData, statsData, usersData, eventsData, referralsData] = await Promise.all([
        apiFetch(`/api/admin/discounts?${params}`, { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/discounts/dashboard", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/discounts/users", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/discounts/events", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/discounts/referrals", { headers: adminAuthHeaders() }),
      ]);
      setDiscounts(listData.discounts || []);
      setStats(statsData.stats || null);
      setUsers(usersData.users || []);
      setEvents(eventsData.events || []);
      setReferrals(referralsData.referrals || []);
    } catch (err) {
      setError(err.message || "Could not load discounts.");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function openDetail(discount) {
    const catalogId = discount.catalogId || discount.id;
    setDetailId(catalogId);
    setDetailOpen(true);
    try {
      const data = await apiFetch(`/api/admin/discounts/${catalogId}`, { headers: adminAuthHeaders() });
      setDetail(data);
    } catch (err) {
      setError(err.message || "Could not load details.");
    }
  }

  function openCreate(type) {
    setCreateType(type);
    setForm({ ...EMPTY_FORM, type });
    setEditId(null);
    setEditCatalogId(null);
    setEditRecordKind("rule");
    setDrawerOpen(true);
  }

  function openEdit(d) {
    setForm({
      name: d.name || "",
      code: d.code || "",
      type: d.type === "legacy_code" ? "campaign_code" : d.type,
      discountType: d.discountType === "fixed" ? "fixed_amount" : d.discountType || "percentage",
      discountValue: String(d.discountValue ?? ""),
      appliesTo: d.appliesTo || "tickets",
      eligibleEventIds: d.eligibleEventIds || [],
      eligibleMembershipTypes: d.eligibleMembershipTypes || [],
      assignedUserId: d.assignedUserId || "",
      assignedEmail: d.assignedEmail || "",
      isPublic: Boolean(d.isPublic),
      referrerName: d.referrerName || "",
      referrerEmail: d.referrerEmail || "",
      referrerUserId: d.referrerUserId || "",
      rewardType: d.rewardType || "credit",
      rewardValue: String(d.rewardValue || ""),
      usageLimit: d.usageLimit != null ? String(d.usageLimit) : "",
      usageLimitPerUser: d.usageLimitPerUser != null ? String(d.usageLimitPerUser) : "",
      minimumOrderAmount: d.minimumOrderAmount ? String(d.minimumOrderAmount / 100) : "",
      startDate: d.startDate ? String(d.startDate).slice(0, 10) : "",
      expiryDate: d.expiryDate ? String(d.expiryDate).slice(0, 10) : "",
      allowStacking: d.allowStacking !== false,
      status: d.status || "active",
      description: d.description || "",
      visibleToUsers: d.visibleToUsers !== false,
      showOnDashboard: d.showOnDashboard !== false,
      source: d.source || "platform",
    });
    setEditId(d.id);
    setEditCatalogId(d.catalogId || d.id);
    setEditRecordKind(d.recordKind || "rule");
    setDrawerOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        rewardValue: Number(form.rewardValue) || 0,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        usageLimitPerUser: form.usageLimitPerUser ? Number(form.usageLimitPerUser) : null,
        minimumOrderAmount: form.minimumOrderAmount ? Math.round(Number(form.minimumOrderAmount) * 100) : 0,
        assignedUserId: form.assignedUserId || null,
        referrerUserId: form.referrerUserId || null,
        visibleToUsers: Boolean(form.visibleToUsers),
        showOnDashboard: Boolean(form.showOnDashboard),
      };
      const method = editId ? "PATCH" : "POST";
      let url = editId ? `/api/admin/discounts/${editId}` : "/api/admin/discounts";
      if (editId && (editRecordKind === "legacy" || editRecordKind === "voucher")) {
        url = `/api/admin/discounts/catalog/${editCatalogId}`;
      }
      await apiFetch(url, { method, headers: adminAuthHeaders(), body: JSON.stringify(payload) });
      setDrawerOpen(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      setEditCatalogId(null);
      setEditRecordKind("rule");
      await loadData();
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function runAction(discount, action) {
    const catalogId = discount.catalogId || discount.id;
    const recordKind = discount.recordKind || "rule";
    try {
      if (action === "delete") {
        if (!window.confirm("Delete this discount?")) return;
        if (recordKind === "legacy" || recordKind === "voucher") {
          await apiFetch(`/api/admin/discounts/catalog/${catalogId}`, { method: "DELETE", headers: adminAuthHeaders() });
        } else {
          await apiFetch(`/api/admin/discounts/${catalogId}`, { method: "DELETE", headers: adminAuthHeaders() });
        }
      } else if (action === "pause") {
        await apiFetch(`/api/admin/discounts/${catalogId}/pause`, { method: "POST", headers: adminAuthHeaders() });
      } else if (action === "activate") {
        await apiFetch(`/api/admin/discounts/${catalogId}/activate`, { method: "POST", headers: adminAuthHeaders() });
      } else if (action === "duplicate") {
        await apiFetch(`/api/admin/discounts/${catalogId}/duplicate`, { method: "POST", headers: adminAuthHeaders() });
      } else if (action === "hide") {
        await apiFetch(`/api/admin/discounts/catalog/${catalogId}/hide-dashboard`, { method: "POST", headers: adminAuthHeaders() });
      } else if (action === "archive") {
        if (!window.confirm("Archive this discount? It will be hidden from members.")) return;
        await apiFetch(`/api/admin/discounts/catalog/${catalogId}/archive`, { method: "POST", headers: adminAuthHeaders() });
      }
      await loadData();
    } catch (err) {
      window.alert(err.message || "Action failed.");
    }
  }

  async function bulkArchiveLegacy() {
    if (!window.confirm("Archive all legacy Couples Night / 10off discount codes?")) return;
    try {
      const result = await apiFetch("/api/admin/discounts/legacy/bulk-archive", {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      window.alert(`Archived ${result.archived || 0} legacy discount(s).`);
      await loadData();
    } catch (err) {
      window.alert(err.message || "Bulk archive failed.");
    }
  }

  async function exportUsage() {
    try {
      const response = await fetch(apiUrl(`/api/admin/discounts/export?${buildParams()}`), {
        headers: adminAuthHeaders(),
      });
      if (!response.ok) throw new Error("Export failed.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "discount-usage-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err.message || "Export failed.");
    }
  }

  async function syncDiscounts() {
    setSyncing(true);
    try {
      const result = await apiFetch("/api/admin/discounts/sync", {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      window.alert(`Sync complete: ${result.created} created, ${result.updated} updated.`);
      await loadData();
    } catch (err) {
      window.alert(err.message || "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function referralAction(id, action) {
    try {
      await apiFetch(`/api/admin/discounts/referrals/${id}/${action}`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
      });
      await loadData();
    } catch (err) {
      window.alert(err.message || "Action failed.");
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return false;
    return u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <AdminLayout
      pageTitle="Discounts & Codes"
      pageSubtitle="Manage member discounts, personal codes and referral campaigns."
    >
      <div className="admin-discounts">
        <div className="admin-discounts__top-actions">
          <button type="button" className="admin-discounts__btn admin-discounts__btn--primary" onClick={() => openCreate("automatic_member")}>
            <IconPlus size={16} /> Create Discount
          </button>
          <button type="button" className="admin-discounts__btn" onClick={() => openCreate("personalized_code")}>
            <IconUsers size={16} /> Create Personal Code
          </button>
          <button type="button" className="admin-discounts__btn" onClick={() => openCreate("referral_code")}>
            <IconGift size={16} /> Create Referral Code
          </button>
          <button type="button" className="admin-discounts__btn" onClick={exportUsage}>
            <IconDownload size={16} /> Export Usage
          </button>
          <button type="button" className="admin-discounts__btn admin-discounts__btn--accent" onClick={syncDiscounts} disabled={syncing}>
            <IconRefresh size={16} /> {syncing ? "Syncing…" : "Sync Discounts"}
          </button>
          <button type="button" className="admin-discounts__btn" onClick={bulkArchiveLegacy}>
            Archive Legacy Event Codes
          </button>
        </div>

        {stats ? (
          <section className="admin-discounts__stats">
            <article className="admin-discounts__stat"><p className="admin-discounts__stat-value">{stats.activeDiscounts}</p><p className="admin-discounts__stat-label">Active Discounts</p></article>
            <article className="admin-discounts__stat"><p className="admin-discounts__stat-value">{stats.memberDiscountsApplied}</p><p className="admin-discounts__stat-label">Member Discounts Applied</p></article>
            <article className="admin-discounts__stat"><p className="admin-discounts__stat-value">{stats.personalCodesUsed}</p><p className="admin-discounts__stat-label">Personal Codes Used</p></article>
            <article className="admin-discounts__stat"><p className="admin-discounts__stat-value">{formatMoney(stats.referralRevenue)}</p><p className="admin-discounts__stat-label">Referral Revenue</p></article>
            <article className="admin-discounts__stat"><p className="admin-discounts__stat-value">{formatMoney(stats.totalSavingsGiven)}</p><p className="admin-discounts__stat-label">Total Savings Given</p></article>
            <article className="admin-discounts__stat"><p className="admin-discounts__stat-value">{stats.expiringCodes}</p><p className="admin-discounts__stat-label">Expiring Codes</p></article>
          </section>
        ) : null}

        <div className="admin-discounts__toolbar">
          <div className="admin-discounts__search">
            <IconSearch size={16} />
            <input placeholder="Search code, email, referrer…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
            {DISCOUNT_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filters.source} onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value }))}>
            {SOURCE_OPTIONS.map((o) => <option key={o.value || "all-source"} value={o.value}>{o.label}</option>)}
          </select>
          <button type="button" className="admin-discounts__btn" onClick={() => setShowReferrals((v) => !v)}>
            <IconTag size={16} /> {showReferrals ? "Hide Referrals" : "Referral Rewards"}
          </button>
        </div>

        {error ? <p className="admin-discounts__error">{error}</p> : null}

        {showReferrals ? (
          <section className="admin-discounts__referrals">
            <h3>Referral Rewards</h3>
            {referrals.length === 0 ? (
              <p className="admin-discounts__empty">No referral rewards yet.</p>
            ) : (
              <div className="admin-discounts__table-wrap">
                <table className="admin-discounts__table">
                  <thead>
                    <tr><th>Referrer</th><th>Buyer</th><th>Discount</th><th>Reward</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {referrals.map((r) => (
                      <tr key={r.id}>
                        <td>{r.referrerEmail || "—"}</td>
                        <td>{r.buyerEmail || "—"}</td>
                        <td>{formatMoney(r.discountGiven)}</td>
                        <td>{r.rewardType} {r.rewardValue}</td>
                        <td><span className={statusBadge(r.rewardStatus)}>{r.rewardStatus}</span></td>
                        <td className="admin-discounts__actions-cell">
                          {r.rewardStatus === "pending" ? (
                            <button type="button" onClick={() => referralAction(r.id, "approve")}>Approve</button>
                          ) : null}
                          {r.rewardStatus === "approved" ? (
                            <button type="button" onClick={() => referralAction(r.id, "mark-paid")}>Mark Paid</button>
                          ) : null}
                          {["pending", "approved"].includes(r.rewardStatus) ? (
                            <button type="button" onClick={() => referralAction(r.id, "cancel")}>Cancel</button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}

        {loading ? (
          <p className="admin-discounts__status">Loading discounts…</p>
        ) : discounts.length === 0 ? (
          <p className="admin-discounts__empty">No discounts yet. Create one or sync member discounts.</p>
        ) : (
          <>
            <div className="admin-discounts__table-wrap admin-discounts__table-wrap--desktop">
              <table className="admin-discounts__table">
                <thead>
                  <tr>
                    <th>Code / Rule</th><th>Source</th><th>Type</th><th>Discount</th><th>Applies To</th><th>Visibility</th><th>Usage</th><th>Expiry</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((d) => (
                    <tr key={d.catalogId || d.id}>
                      <td><strong>{d.name}</strong>{d.code ? <span className="admin-discounts__code-tag">{d.code}</span> : null}</td>
                      <td>{d.source || "—"}</td>
                      <td>{TYPE_LABELS[d.type] || d.type}</td>
                      <td>{d.discountLabel}</td>
                      <td>{d.appliesTo}</td>
                      <td>{d.showOnDashboard === false ? "Hidden" : "Dashboard"}</td>
                      <td>{d.usage}/{d.usageLimit ?? "∞"}</td>
                      <td>{formatDate(d.expiryDate)}</td>
                      <td><span className={statusBadge(d.status)}>{d.status}</span></td>
                      <td className="admin-discounts__actions-cell">
                        <button type="button" aria-label="View" onClick={() => openDetail(d)}><IconEye size={16} /></button>
                        <button type="button" aria-label="Edit" onClick={() => openEdit(d)}><IconEdit size={16} /></button>
                        {d.recordKind === "rule" ? (
                          <button type="button" aria-label="Duplicate" onClick={() => runAction(d, "duplicate")}><IconCopy size={16} /></button>
                        ) : null}
                        {d.status === "active" && d.recordKind === "rule" ? (
                          <button type="button" aria-label="Pause" onClick={() => runAction(d, "pause")}><IconPlayerPause size={16} /></button>
                        ) : d.recordKind === "rule" ? (
                          <button type="button" aria-label="Activate" onClick={() => runAction(d, "activate")}><IconPlayerPlay size={16} /></button>
                        ) : null}
                        {d.showOnDashboard !== false ? (
                          <button type="button" aria-label="Hide from dashboard" onClick={() => runAction(d, "hide")}>Hide</button>
                        ) : null}
                        {d.status !== "archived" ? (
                          <button type="button" aria-label="Archive" onClick={() => runAction(d, "archive")}>Archive</button>
                        ) : null}
                        <button type="button" aria-label="Delete" onClick={() => runAction(d, "delete")}><IconTrash size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-discounts__cards admin-discounts__cards--mobile">
              {discounts.map((d) => (
                <article key={d.catalogId || d.id} className="admin-discounts__card">
                  <div className="admin-discounts__card-head">
                    <h3>{d.name}</h3>
                    {d.code ? <span className="admin-discounts__code-tag">{d.code}</span> : null}
                  </div>
                  <p>{d.source} · {TYPE_LABELS[d.type] || d.type} · {d.discountLabel}</p>
                  <p>Usage: {d.usage} · {d.showOnDashboard === false ? "Hidden" : "On dashboard"}</p>
                  <span className={statusBadge(d.status)}>{d.status}</span>
                  <div className="admin-discounts__card-actions">
                    <button type="button" onClick={() => openDetail(d)}>Details</button>
                    <button type="button" onClick={() => openEdit(d)}>Edit</button>
                    <button type="button" onClick={() => runAction(d, "hide")}>Hide</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <button type="button" className="admin-discounts__fab" aria-label="Create discount" onClick={() => openCreate(createType)}>
          <IconPlus size={22} />
        </button>
      </div>

      {drawerOpen ? (
        <div className="admin-discounts__drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <aside className="admin-discounts__drawer admin-discounts__drawer--open" onClick={(e) => e.stopPropagation()}>
            <div className="admin-discounts__drawer-head">
              <h2>{editId ? "Edit Discount" : "Create Discount"}</h2>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close"><IconX size={20} /></button>
            </div>
            <form className="admin-discounts__drawer-body" onSubmit={handleSubmit}>
              <fieldset className="admin-discounts__section">
                <legend>Basic Info</legend>
                <label>Name<input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></label>
                {form.type !== "automatic_member" ? (
                  <label>Code<input required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, "") }))} /></label>
                ) : null}
                <label>Type
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                    {DISCOUNT_TYPES.filter((t) => t.value).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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
                <label>Applies To
                  <select value={form.appliesTo} onChange={(e) => setForm((f) => ({ ...f, appliesTo: e.target.value }))}>
                    <option value="tickets">Tickets</option>
                    <option value="memberships">Memberships</option>
                    <option value="both">Both</option>
                  </select>
                </label>
              </fieldset>

              {form.type === "automatic_member" ? (
                <fieldset className="admin-discounts__section">
                  <legend>Eligibility</legend>
                  <label>Membership Type
                    <select value={form.eligibleMembershipTypes[0] || ""} onChange={(e) => setForm((f) => ({ ...f, eligibleMembershipTypes: e.target.value ? [e.target.value] : [] }))}>
                      <option value="">Select…</option>
                      <option value="student">Student</option>
                      <option value="privilegedSingle">Privileged Single</option>
                      <option value="privilegedFamily">Privileged Family</option>
                      <option value="premiumSingle">Premium Single</option>
                      <option value="premiumFamily">Premium Family</option>
                    </select>
                  </label>
                </fieldset>
              ) : null}

              {form.type === "personalized_code" ? (
                <fieldset className="admin-discounts__section">
                  <legend>Assigned User</legend>
                  <label>Assigned Email<input type="email" value={form.assignedEmail} onChange={(e) => setForm((f) => ({ ...f, assignedEmail: e.target.value }))} /></label>
                  <label className="admin-discounts__checkbox"><input type="checkbox" checked={form.isPublic} onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))} /> Public (anyone can use)</label>
                  <input placeholder="Search user…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                  {filteredUsers.slice(0, 5).map((u) => (
                    <button key={u.id} type="button" className="admin-discounts__user-pick" onClick={() => setForm((f) => ({ ...f, assignedUserId: u.id, assignedEmail: u.email }))}>
                      {u.firstName} {u.lastName} ({u.email})
                    </button>
                  ))}
                </fieldset>
              ) : null}

              {form.type === "referral_code" ? (
                <fieldset className="admin-discounts__section">
                  <legend>Referral Reward</legend>
                  <label>Referrer Name<input value={form.referrerName} onChange={(e) => setForm((f) => ({ ...f, referrerName: e.target.value }))} /></label>
                  <label>Referrer Email<input type="email" value={form.referrerEmail} onChange={(e) => setForm((f) => ({ ...f, referrerEmail: e.target.value }))} /></label>
                  <label>Reward Type
                    <select value={form.rewardType} onChange={(e) => setForm((f) => ({ ...f, rewardType: e.target.value }))}>
                      <option value="credit">Credit</option>
                      <option value="free_ticket">Free Ticket</option>
                      <option value="fixed_amount">Fixed Amount</option>
                      <option value="percentage">Percentage</option>
                      <option value="manual">Manual</option>
                    </select>
                  </label>
                  <label>Reward Value<input type="number" min="0" value={form.rewardValue} onChange={(e) => setForm((f) => ({ ...f, rewardValue: e.target.value }))} /></label>
                </fieldset>
              ) : null}

              <fieldset className="admin-discounts__section">
                <legend>Usage Limits & Schedule</legend>
                <label>Usage Limit<input type="number" min="1" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} /></label>
                <label>Per User Limit<input type="number" min="1" value={form.usageLimitPerUser} onChange={(e) => setForm((f) => ({ ...f, usageLimitPerUser: e.target.value }))} /></label>
                <label>Min Order (€)<input type="number" min="0" step="0.01" value={form.minimumOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minimumOrderAmount: e.target.value }))} /></label>
                <label>Start Date<input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} /></label>
                <label>Expiry Date<input type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} /></label>
                <label className="admin-discounts__checkbox"><input type="checkbox" checked={form.allowStacking} onChange={(e) => setForm((f) => ({ ...f, allowStacking: e.target.checked }))} /> Allow stacking with member discount</label>
                <label>Status
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="paused">Paused</option>
                    <option value="expired">Expired</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label className="admin-discounts__checkbox"><input type="checkbox" checked={form.visibleToUsers} onChange={(e) => setForm((f) => ({ ...f, visibleToUsers: e.target.checked }))} /> Visible to users</label>
                <label className="admin-discounts__checkbox"><input type="checkbox" checked={form.showOnDashboard} onChange={(e) => setForm((f) => ({ ...f, showOnDashboard: e.target.checked }))} /> Show on member dashboard</label>
              </fieldset>

              {!["automatic_member", "membership_code"].includes(form.type) ? (
                <fieldset className="admin-discounts__section">
                  <legend>Eligible Events</legend>
                  <select multiple value={form.eligibleEventIds} onChange={(e) => setForm((f) => ({ ...f, eligibleEventIds: Array.from(e.target.selectedOptions, (o) => o.value) }))}>
                    {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                  <small>Leave empty for all events</small>
                </fieldset>
              ) : null}

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

      {detailOpen && detail ? (
        <div className="admin-discounts__drawer-overlay" onClick={() => { setDetailOpen(false); setDetail(null); }}>
          <aside className="admin-discounts__drawer admin-discounts__drawer--open admin-discounts__drawer--detail" onClick={(e) => e.stopPropagation()}>
            <div className="admin-discounts__drawer-head">
              <h2>{detail.discount?.name}</h2>
              <button type="button" onClick={() => { setDetailOpen(false); setDetail(null); }} aria-label="Close"><IconX size={20} /></button>
            </div>
            <div className="admin-discounts__drawer-body">
              <div className="admin-discounts__detail-stats">
                <div><strong>{detail.stats?.totalUses}</strong><span>Total Uses</span></div>
                <div><strong>{detail.stats?.uniqueUsers}</strong><span>Unique Users</span></div>
                <div><strong>{formatMoney(detail.stats?.totalDiscountGiven)}</strong><span>Discount Given</span></div>
                <div><strong>{formatMoney(detail.stats?.revenueGenerated)}</strong><span>Revenue</span></div>
              </div>
              <h3>Recent Usage</h3>
              {detail.usages?.length ? detail.usages.map((u) => (
                <p key={u.id} className="admin-discounts__usage-row">{u.userEmail} · {formatMoney(u.discountAmount)} · {formatDate(u.usedAt)}</p>
              )) : <p className="admin-discounts__empty">No usage yet.</p>}
              <h3>Audit Log</h3>
              {detail.auditLogs?.length ? detail.auditLogs.map((l, i) => (
                <p key={i} className="admin-discounts__usage-row">{l.action}: {l.summary}</p>
              )) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </AdminLayout>
  );
}
