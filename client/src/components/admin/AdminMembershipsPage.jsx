import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconDownload,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconEye,
  IconEdit,
  IconMail,
  IconQrcode,
  IconCloudDownload,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch, apiUrl } from "../../utils/api.js";
import "../../styles/admin-memberships-page.css";

const EMPTY_ISSUE = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  membershipType: "student",
  customTypeName: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  paymentStatus: "complimentary",
  autoRenewal: false,
  generateQr: true,
  sendEmail: true,
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "expiring_soon", label: "Expiring soon" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
  { value: "pending_payment", label: "Pending payment" },
];

function statusBadgeClass(status) {
  return `admin-memberships__badge admin-memberships__badge--${status || "expired"}`;
}

export default function AdminMembershipsPage() {
  const [memberships, setMemberships] = useState([]);
  const [stats, setStats] = useState(null);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    membershipType: "",
    membershipStatus: "",
    paymentStatus: "",
    autoRenewal: "",
    eventAttendance: "",
    ticketPurchaser: "",
  });
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueForm, setIssueForm] = useState(EMPTY_ISSUE);
  const [editMember, setEditMember] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [checkoutSettings, setCheckoutSettings] = useState(null);
  const [checkoutSettingsSaving, setCheckoutSettingsSaving] = useState(false);

  const loadCheckoutSettings = useCallback(async () => {
    try {
      const data = await apiFetch("/api/admin/memberships/checkout-settings", {
        headers: adminAuthHeaders(),
      });
      setCheckoutSettings(data.settings);
    } catch {
      /* optional */
    }
  }, []);

  async function saveCheckoutSettings() {
    setCheckoutSettingsSaving(true);
    try {
      const data = await apiFetch("/api/admin/memberships/checkout-settings", {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(checkoutSettings),
      });
      setCheckoutSettings(data.settings);
    } catch (err) {
      window.alert(err.message || "Could not save checkout settings.");
    } finally {
      setCheckoutSettingsSaving(false);
    }
  }

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
        apiFetch(`/api/admin/memberships?${params}`, { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/memberships/stats", { headers: adminAuthHeaders() }),
      ]);
      setMemberships(listData.memberships || []);
      setMembershipTypes(listData.membershipTypes || []);
      setStats(statsData.stats || null);
    } catch (err) {
      setError(err.message || "Could not load memberships.");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadCheckoutSettings();
  }, [loadCheckoutSettings]);

  async function handleIssue(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/admin/memberships", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify(issueForm),
      });
      setIssueOpen(false);
      setIssueForm(EMPTY_ISSUE);
      await loadData();
    } catch (err) {
      setError(err.message || "Could not issue membership.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSave(e) {
    e.preventDefault();
    if (!editMember) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/admin/memberships/${editMember.id}`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(editForm),
      });
      setEditMember(null);
      await loadData();
    } catch (err) {
      window.alert(err.message || "Update failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function runAction(id, action, confirmMsg) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    try {
      const method = action === "delete" ? "DELETE" : "POST";
      const path =
        action === "delete"
          ? `/api/admin/memberships/${id}`
          : `/api/admin/memberships/${id}/${action}`;
      await apiFetch(path, { method, headers: adminAuthHeaders() });
      await loadData();
    } catch (err) {
      window.alert(err.message || "Action failed.");
    }
  }

  async function downloadCard(id, membershipId) {
    try {
      const response = await fetch(apiUrl(`/api/admin/memberships/${id}/download-card`), {
        headers: adminAuthHeaders(),
      });
      if (!response.ok) throw new Error("Download failed.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `membership-card-${membershipId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err.message || "Could not download card.");
    }
  }

  async function exportCsv() {
    try {
      const response = await fetch(apiUrl(`/api/admin/memberships/export?${buildParams()}`), {
        headers: adminAuthHeaders(),
      });
      if (!response.ok) throw new Error("Export failed.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "memberships-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err.message || "Export failed.");
    }
  }

  async function syncTicketTailor() {
    setSyncing(true);
    try {
      const result = await apiFetch("/api/admin/tickettailor/sync", {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      window.alert(
        `TicketTailor sync complete.\n` +
          `• ${result.pastDataIssuedMemberships ?? 0} memberships imported\n` +
          `• ${result.upserted ?? 0} event bookings synced\n` +
          `• ${result.pastDataEmails ?? 0} customer emails updated`
      );
      await loadData();
    } catch (err) {
      window.alert(err.message || "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  function openEdit(m) {
    setEditMember(m);
    setEditForm({
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      phone: m.phone,
      country: m.country,
      endDate: m.memberUntil ? new Date(m.memberUntil).toISOString().slice(0, 10) : "",
      paymentStatus: m.paymentStatus,
      autoRenewal: m.autoRenewal,
      membershipStatus: m.storedStatus || m.membershipStatus,
    });
  }

  const statCards = stats
    ? [
        { label: "Total Memberships", value: stats.totalMemberships },
        { label: "Active", value: stats.activeMemberships },
        { label: "Expiring Soon", value: stats.expiringSoon },
        { label: "Expired", value: stats.expiredMemberships },
        { label: "Membership Revenue", value: stats.membershipRevenue },
        { label: "Renewals This Month", value: stats.renewalsThisMonth },
        { label: "Upcoming Events", value: stats.membersAttendingUpcomingEvents },
        { label: "TT Tickets", value: stats.ticketTailorTicketsPurchased },
        { label: "TT Revenue", value: stats.ticketTailorRevenue },
      ]
    : [];

  return (
    <AdminLayout
      pageTitle="Memberships"
      pageSubtitle="360° member view — memberships, events, TicketTailor activity, and engagement."
    >
      <div className="admin-memberships">
        {stats ? (
          <section className="admin-memberships__stats" aria-label="Membership statistics">
            {statCards.map((s) => (
              <article key={s.label} className="admin-memberships__stat">
                <p className="admin-memberships__stat-value">{s.value}</p>
                <p className="admin-memberships__stat-label">{s.label}</p>
              </article>
            ))}
          </section>
        ) : null}

        {checkoutSettings ? (
          <section className="admin-memberships__checkout-settings">
            <h2>Ticket checkout settings</h2>
            <div className="admin-memberships__checkout-grid">
              <label>
                <input
                  type="checkbox"
                  checked={checkoutSettings.allowPurchaseDuringTicketCheckout !== false}
                  onChange={(e) =>
                    setCheckoutSettings((s) => ({
                      ...s,
                      allowPurchaseDuringTicketCheckout: e.target.checked,
                    }))
                  }
                />
                Allow membership purchase during ticket checkout
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={checkoutSettings.allowRenewalDuringTicketCheckout !== false}
                  onChange={(e) =>
                    setCheckoutSettings((s) => ({
                      ...s,
                      allowRenewalDuringTicketCheckout: e.target.checked,
                    }))
                  }
                />
                Allow renewal during ticket checkout
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={checkoutSettings.instantBenefitRules?.applyToCurrentTicketPurchase !== false}
                  onChange={(e) =>
                    setCheckoutSettings((s) => ({
                      ...s,
                      instantBenefitRules: {
                        ...s.instantBenefitRules,
                        applyToCurrentTicketPurchase: e.target.checked,
                      },
                    }))
                  }
                />
                Instant benefit applies to current ticket purchase
              </label>
              <label>
                Membership checkout discount (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={checkoutSettings.membershipCheckoutDiscountPercent || 0}
                  onChange={(e) =>
                    setCheckoutSettings((s) => ({
                      ...s,
                      membershipCheckoutDiscountPercent: Number(e.target.value),
                    }))
                  }
                />
              </label>
            </div>

            <h3>TicketTailor membership detection</h3>
            <div className="admin-memberships__checkout-grid">
              <label>
                <input
                  type="checkbox"
                  checked={checkoutSettings.enableTicketTailorLookup !== false}
                  onChange={(e) =>
                    setCheckoutSettings((s) => ({
                      ...s,
                      enableTicketTailorLookup: e.target.checked,
                    }))
                  }
                />
                Enable TicketTailor membership lookup
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={checkoutSettings.useLiveTicketTailorApi !== false}
                  onChange={(e) =>
                    setCheckoutSettings((s) => ({
                      ...s,
                      useLiveTicketTailorApi: e.target.checked,
                    }))
                  }
                />
                Use live TicketTailor API
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={checkoutSettings.useSyncedTicketTailorData !== false}
                  onChange={(e) =>
                    setCheckoutSettings((s) => ({
                      ...s,
                      useSyncedTicketTailorData: e.target.checked,
                    }))
                  }
                />
                Use synced TicketTailor membership data
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={checkoutSettings.autoLinkTicketTailorMembership !== false}
                  onChange={(e) =>
                    setCheckoutSettings((s) => ({
                      ...s,
                      autoLinkTicketTailorMembership: e.target.checked,
                    }))
                  }
                />
                Auto-link TicketTailor membership on account creation
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={checkoutSettings.applyTicketTailorMembershipDiscounts !== false}
                  onChange={(e) =>
                    setCheckoutSettings((s) => ({
                      ...s,
                      applyTicketTailorMembershipDiscounts: e.target.checked,
                    }))
                  }
                />
                Apply TicketTailor membership discounts
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={checkoutSettings.enableMembershipCodeValidation !== false}
                  onChange={(e) =>
                    setCheckoutSettings((s) => ({
                      ...s,
                      enableMembershipCodeValidation: e.target.checked,
                    }))
                  }
                />
                Enable membership code validation
              </label>
            </div>

            <h3>TicketTailor priority</h3>
            <div className="admin-memberships__checkout-grid">
              <label>
                <input
                  type="checkbox"
                  checked={checkoutSettings.enableTicketTailorMembershipPriority !== false}
                  onChange={(e) =>
                    setCheckoutSettings((s) => ({
                      ...s,
                      enableTicketTailorMembershipPriority: e.target.checked,
                    }))
                  }
                />
                Enable TicketTailor membership priority
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={checkoutSettings.checkTicketTailorBeforeLocal !== false}
                  onChange={(e) =>
                    setCheckoutSettings((s) => ({
                      ...s,
                      checkTicketTailorBeforeLocal: e.target.checked,
                    }))
                  }
                />
                Check TicketTailor before local membership
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={checkoutSettings.requireLoginForTicketTailorBenefits !== false}
                  onChange={(e) =>
                    setCheckoutSettings((s) => ({
                      ...s,
                      requireLoginForTicketTailorBenefits: e.target.checked,
                    }))
                  }
                />
                Require login to apply TicketTailor membership benefits
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={checkoutSettings.allowTicketTailorMembershipDiscountStacking !== false}
                  onChange={(e) =>
                    setCheckoutSettings((s) => ({
                      ...s,
                      allowTicketTailorMembershipDiscountStacking: e.target.checked,
                    }))
                  }
                />
                Allow TicketTailor membership discount stacking
              </label>
              <label className="admin-memberships__full-width">
                Membership ticket type keywords (one per line)
                <textarea
                  rows={6}
                  value={(checkoutSettings.membershipTicketKeywords || []).join("\n")}
                  onChange={(e) =>
                    setCheckoutSettings((s) => ({
                      ...s,
                      membershipTicketKeywords: e.target.value
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean),
                    }))
                  }
                />
              </label>
            </div>

            <h3>TicketTailor discount rules by membership type</h3>
            <div className="admin-memberships__tt-discount-rules">
              {[
                { id: "student", label: "Student Membership" },
                { id: "privilegedSingle", label: "Privileged Single" },
                { id: "privilegedFamily", label: "Privileged Family" },
                { id: "premiumSingle", label: "Premium Single" },
                { id: "premiumFamily", label: "Premium Family" },
              ].map(({ id, label }) => {
                const rule = checkoutSettings.ticketTailorDiscountRules?.[id] || {
                  discountType: "percentage",
                  discountValue: 0,
                };
                return (
                  <div key={id} className="admin-memberships__tt-discount-row">
                    <span className="admin-memberships__tt-discount-label">{label}</span>
                    <select
                      value={rule.discountType || "percentage"}
                      onChange={(e) =>
                        setCheckoutSettings((s) => ({
                          ...s,
                          ticketTailorDiscountRules: {
                            ...(s.ticketTailorDiscountRules || {}),
                            [id]: { ...rule, discountType: e.target.value },
                          },
                        }))
                      }
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed_amount">Fixed amount</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      max={rule.discountType === "percentage" ? 100 : 9999}
                      value={rule.discountValue ?? 0}
                      onChange={(e) =>
                        setCheckoutSettings((s) => ({
                          ...s,
                          ticketTailorDiscountRules: {
                            ...(s.ticketTailorDiscountRules || {}),
                            [id]: { ...rule, discountValue: Number(e.target.value) },
                          },
                        }))
                      }
                    />
                    <span>{rule.discountType === "percentage" ? "%" : "€"}</span>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="admin-memberships__primary-btn"
              disabled={checkoutSettingsSaving}
              onClick={saveCheckoutSettings}
            >
              {checkoutSettingsSaving ? "Saving…" : "Save checkout settings"}
            </button>
          </section>
        ) : null}

        <div className="admin-memberships__toolbar">
          <div className="admin-memberships__search">
            <IconSearch size={18} />
            <input
              type="search"
              placeholder="Search membership ID, name, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={filters.membershipType}
            onChange={(e) => setFilters((f) => ({ ...f, membershipType: e.target.value }))}
          >
            <option value="">All types</option>
            {membershipTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <select
            value={filters.membershipStatus}
            onChange={(e) => setFilters((f) => ({ ...f, membershipStatus: e.target.value }))}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={filters.paymentStatus}
            onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value }))}
          >
            <option value="">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="complimentary">Complimentary</option>
            <option value="refunded">Refunded</option>
          </select>
          <button type="button" className="admin-memberships__btn" onClick={loadData}>
            <IconRefresh size={16} /> Refresh
          </button>
          <button
            type="button"
            className="admin-memberships__btn admin-memberships__btn--accent"
            onClick={syncTicketTailor}
            disabled={syncing}
          >
            <IconCloudDownload size={16} /> {syncing ? "Syncing…" : "Sync TT"}
          </button>
          <button type="button" className="admin-memberships__btn" onClick={exportCsv}>
            <IconDownload size={16} /> Export
          </button>
          <button
            type="button"
            className="admin-memberships__btn admin-memberships__btn--primary"
            onClick={() => setIssueOpen(true)}
          >
            <IconPlus size={16} /> Issue Membership
          </button>
        </div>

        {error ? <p className="admin-memberships__error" role="alert">{error}</p> : null}
        {loading ? <p className="admin-memberships__status">Loading memberships…</p> : null}

        {!loading && memberships.length === 0 ? (
          <p className="admin-memberships__status">No memberships found.</p>
        ) : null}

        <div className="admin-memberships__table-wrap">
          <table className="admin-memberships__table">
            <thead>
              <tr>
                <th>Membership ID</th>
                <th>Member</th>
                <th>Source</th>
                <th>Type</th>
                <th>Status</th>
                <th>Since</th>
                <th>Until</th>
                <th>Payment</th>
                <th>Attended</th>
                <th>Upcoming</th>
                <th>QR</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {memberships.map((m) => (
                <tr key={m.id}>
                  <td><code>{m.membershipId}</code></td>
                  <td>
                    <div>{m.fullName}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--ad-muted)" }}>{m.email}</div>
                  </td>
                  <td>{m.source === "ticket_tailor" ? "TicketTailor" : "Platform"}</td>
                  <td>{m.membershipType}</td>
                  <td><span className={statusBadgeClass(m.membershipStatus)}>{m.membershipStatus.replace(/_/g, " ")}</span></td>
                  <td>{m.memberSinceLabel}</td>
                  <td>{m.memberUntilLabel}</td>
                  <td>{m.paymentStatus}</td>
                  <td>{m.eventsAttended}</td>
                  <td>{m.upcomingEvents}</td>
                  <td>{m.qrStatus}</td>
                  <td>
                    <div className="admin-memberships__actions">
                      <Link to={`/admin/memberships/${m.id}`} className="admin-memberships__action-btn">
                        <IconEye size={14} /> View
                      </Link>
                      <button type="button" className="admin-memberships__action-btn" onClick={() => openEdit(m)}>
                        <IconEdit size={14} /> Edit
                      </button>
                      <button type="button" className="admin-memberships__action-btn" onClick={() => runAction(m.id, "renew")}>
                        Renew
                      </button>
                      <button type="button" className="admin-memberships__action-btn" onClick={() => downloadCard(m.id, m.membershipId)}>
                        Card
                      </button>
                      <button type="button" className="admin-memberships__action-btn" onClick={() => runAction(m.id, "resend-email")}>
                        <IconMail size={14} />
                      </button>
                      <button type="button" className="admin-memberships__action-btn" onClick={() => runAction(m.id, "regenerate-qr")}>
                        <IconQrcode size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-memberships__cards">
          {memberships.map((m) => (
            <article key={m.id} className="admin-memberships__card">
              <div className="admin-memberships__card-head">
                <div>
                  <p className="admin-memberships__card-name">{m.fullName}</p>
                  <p className="admin-memberships__card-meta">{m.membershipId} · {m.email}</p>
                </div>
                <span className={statusBadgeClass(m.membershipStatus)}>{m.membershipStatus.replace(/_/g, " ")}</span>
              </div>
              <div className="admin-memberships__card-grid">
                <div><span>Source</span>{m.source === "ticket_tailor" ? "TicketTailor" : "Platform"}</div>
                <div><span>Type</span>{m.membershipType}</div>
                <div><span>Until</span>{m.memberUntilLabel}</div>
                <div><span>Attended</span>{m.eventsAttended}</div>
                <div><span>Upcoming</span>{m.upcomingEvents}</div>
              </div>
              <div className="admin-memberships__card-actions">
                <Link to={`/admin/memberships/${m.id}`} className="admin-memberships__btn admin-memberships__btn--accent">View</Link>
                <button type="button" className="admin-memberships__btn" onClick={() => openEdit(m)}>Edit</button>
                <button type="button" className="admin-memberships__btn" onClick={() => runAction(m.id, "renew")}>Renew</button>
                <button type="button" className="admin-memberships__btn" onClick={() => downloadCard(m.id, m.membershipId)}>Card</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {issueOpen ? (
        <div className="admin-memberships__modal" role="dialog" aria-modal="true">
          <div className="admin-memberships__modal-panel">
            <h2>Issue Membership</h2>
            <form onSubmit={handleIssue}>
              <div className="admin-memberships__field-row">
                <div className="admin-memberships__field">
                  <label>First name</label>
                  <input required value={issueForm.firstName} onChange={(e) => setIssueForm((f) => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div className="admin-memberships__field">
                  <label>Last name</label>
                  <input value={issueForm.lastName} onChange={(e) => setIssueForm((f) => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="admin-memberships__field">
                <label>Email</label>
                <input type="email" required value={issueForm.email} onChange={(e) => setIssueForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="admin-memberships__field-row">
                <div className="admin-memberships__field">
                  <label>Phone</label>
                  <input value={issueForm.phone} onChange={(e) => setIssueForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="admin-memberships__field">
                  <label>Country</label>
                  <input value={issueForm.country} onChange={(e) => setIssueForm((f) => ({ ...f, country: e.target.value }))} />
                </div>
              </div>
              <div className="admin-memberships__field">
                <label>Membership type</label>
                <select value={issueForm.membershipType} onChange={(e) => setIssueForm((f) => ({ ...f, membershipType: e.target.value }))}>
                  {membershipTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              {issueForm.membershipType === "custom" ? (
                <div className="admin-memberships__field">
                  <label>Custom type name</label>
                  <input value={issueForm.customTypeName} onChange={(e) => setIssueForm((f) => ({ ...f, customTypeName: e.target.value }))} />
                </div>
              ) : null}
              <div className="admin-memberships__field-row">
                <div className="admin-memberships__field">
                  <label>Start date</label>
                  <input type="date" value={issueForm.startDate} onChange={(e) => setIssueForm((f) => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="admin-memberships__field">
                  <label>End date</label>
                  <input type="date" value={issueForm.endDate} onChange={(e) => setIssueForm((f) => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div className="admin-memberships__field-row">
                <div className="admin-memberships__field">
                  <label>Payment status</label>
                  <select value={issueForm.paymentStatus} onChange={(e) => setIssueForm((f) => ({ ...f, paymentStatus: e.target.value }))}>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="complimentary">Complimentary</option>
                  </select>
                </div>
                <div className="admin-memberships__field">
                  <label>Auto renewal</label>
                  <select value={issueForm.autoRenewal ? "true" : "false"} onChange={(e) => setIssueForm((f) => ({ ...f, autoRenewal: e.target.value === "true" }))}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
              <div className="admin-memberships__checks">
                <label><input type="checkbox" checked={issueForm.generateQr} onChange={(e) => setIssueForm((f) => ({ ...f, generateQr: e.target.checked }))} /> Generate QR code</label>
                <label><input type="checkbox" checked={issueForm.sendEmail} onChange={(e) => setIssueForm((f) => ({ ...f, sendEmail: e.target.checked }))} /> Send membership email</label>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="submit" className="admin-memberships__btn admin-memberships__btn--primary" disabled={submitting}>
                  {submitting ? "Issuing…" : "Issue Membership"}
                </button>
                <button type="button" className="admin-memberships__btn" onClick={() => setIssueOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className={`admin-memberships__drawer-overlay${editMember ? " admin-memberships__drawer-overlay--open" : ""}`} onClick={() => setEditMember(null)} aria-hidden="true" />
      <aside className={`admin-memberships__drawer${editMember ? " admin-memberships__drawer--open" : ""}`}>
        {editMember ? (
          <>
            <h2>Edit Membership</h2>
            <p style={{ color: "var(--ad-muted)", marginBottom: 16 }}>{editMember.membershipId}</p>
            <form onSubmit={handleEditSave}>
              <div className="admin-memberships__field-row">
                <div className="admin-memberships__field">
                  <label>First name</label>
                  <input value={editForm.firstName || ""} onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div className="admin-memberships__field">
                  <label>Last name</label>
                  <input value={editForm.lastName || ""} onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="admin-memberships__field">
                <label>Email</label>
                <input type="email" value={editForm.email || ""} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="admin-memberships__field">
                <label>Valid until</label>
                <input type="date" value={editForm.endDate || ""} onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
              <div className="admin-memberships__field">
                <label>Status</label>
                <select value={editForm.membershipStatus || "active"} onChange={(e) => setEditForm((f) => ({ ...f, membershipStatus: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending_payment">Pending payment</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="submit" className="admin-memberships__btn admin-memberships__btn--primary" disabled={submitting}>Save</button>
                <button type="button" className="admin-memberships__btn" onClick={() => setEditMember(null)}>Close</button>
              </div>
            </form>
          </>
        ) : null}
      </aside>
    </AdminLayout>
  );
}
