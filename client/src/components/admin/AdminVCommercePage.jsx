import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import {
  adminGetApplications,
  adminReviewApplication,
  adminGetBusinesses,
  adminPatchBusiness,
  adminSetFeatured,
  adminGetOrders,
  adminGetPayouts,
  adminCreatePayout,
  adminMarkPayoutPaid,
  adminGetAnalytics,
} from "../vcommerce/shared/vcommerceApi.js";
import { BUSINESS_CATEGORY_LABELS } from "../vcommerce/shared/BUSINESS_CATEGORIES.js";
import AdminWholesalerPage from "./AdminWholesalerPage.jsx";

const TABS = ["Applications", "Businesses", "Orders", "Payouts", "Analytics", "Wholesalers"];

function formatPrice(minor, currency = "eur") {
  if (minor == null) return "—";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
}

const S = {
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" },
  th: { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--ad-border,rgba(128,128,128,0.2))", fontWeight: 600, color: "var(--ad-text-muted,#888)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em" },
  td: { padding: "12px", borderBottom: "1px solid var(--ad-border,rgba(128,128,128,0.1))", verticalAlign: "middle" },
  badge: (color) => ({ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 100, fontSize: "0.74rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", background: color === "green" ? "rgba(16,185,129,0.12)" : color === "red" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)", color: color === "green" ? "#059669" : color === "red" ? "#DC2626" : "#D97706" }),
  btn: (variant = "primary") => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: variant === "sm" ? "4px 10px" : "8px 16px", background: variant === "ghost" || variant === "sm" ? "transparent" : "var(--ad-accent,#8B5CF6)", color: variant === "ghost" || variant === "sm" ? "var(--ad-text,inherit)" : "#fff", border: variant === "ghost" || variant === "sm" ? "1px solid var(--ad-border,rgba(128,128,128,0.3))" : "none", borderRadius: 8, fontSize: variant === "sm" ? "0.78rem" : "0.875rem", fontWeight: 600, cursor: "pointer" }),
  card: { background: "var(--ad-card-bg,var(--color-card-bg,#fff))", borderRadius: 12, border: "1px solid var(--ad-border,rgba(128,128,128,0.15))", padding: 24, marginBottom: 20 },
  input: { padding: "8px 12px", border: "1px solid var(--ad-border,rgba(128,128,128,0.3))", borderRadius: 8, background: "var(--ad-bg,#fff)", color: "inherit", fontSize: "0.9rem", fontFamily: "inherit" },
  label: { fontSize: "0.8rem", fontWeight: 600, color: "var(--ad-text-muted,#888)", display: "block", marginBottom: 4 },
};

// ── Modal wrapper ──
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--ad-card-bg,#fff)", borderRadius: 16, maxWidth: 520, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--ad-border,rgba(128,128,128,0.15))" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>{title}</h3>
          <button type="button" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "var(--ad-text-muted,#888)" }} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Applications tab ──
function ApplicationsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [reviewing, setReviewing] = useState(null);
  const [reviewForm, setReviewForm] = useState({ action: "approve", note: "" });
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    adminGetApplications({ status: statusFilter })
      .then((d) => setItems(d.applications || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function submitReview(e) {
    e.preventDefault();
    try {
      await adminReviewApplication(reviewing._id, reviewForm);
      setMsg(`Application ${reviewForm.action === "approve" ? "approved" : "rejected"} successfully.`);
      setReviewing(null);
      load();
    } catch (err) {
      setMsg(err?.message || "Error reviewing application.");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["pending", "approved", "rejected"].map((s) => (
          <button key={s} type="button"
            style={{ ...S.btn("ghost"), background: statusFilter === s ? "var(--ad-accent,#8B5CF6)" : undefined, color: statusFilter === s ? "#fff" : undefined, border: statusFilter === s ? "none" : undefined }}
            onClick={() => setStatusFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {msg && <p style={{ padding: "10px 14px", background: "rgba(16,185,129,0.1)", borderRadius: 8, marginBottom: 16, fontSize: "0.875rem", color: "#059669" }}>{msg}</p>}

      {loading ? (
        <p style={{ color: "var(--ad-text-muted,#888)", padding: 40, textAlign: "center" }}>Loading…</p>
      ) : items.length === 0 ? (
        <p style={{ color: "var(--ad-text-muted,#888)", padding: 40, textAlign: "center" }}>No {statusFilter} applications.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Business Name</th>
                <th style={S.th}>Category</th>
                <th style={S.th}>Applicant</th>
                <th style={S.th}>Submitted</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((app) => (
                <tr key={app._id}>
                  <td style={S.td}><strong>{app.businessName}</strong></td>
                  <td style={S.td}>{BUSINESS_CATEGORY_LABELS[app.category] || app.category}</td>
                  <td style={S.td}>{app.userId?.firstName} {app.userId?.lastName}<br/><span style={{ fontSize:"0.78rem",color:"var(--ad-text-muted,#888)" }}>{app.userId?.email}</span></td>
                  <td style={S.td}>{formatDate(app.createdAt)}</td>
                  <td style={S.td}><span style={S.badge(app.status === "approved" ? "green" : app.status === "rejected" ? "red" : "yellow")}>{app.status}</span></td>
                  <td style={S.td}>
                    {app.status === "pending" && (
                      <button type="button" style={S.btn("sm")} onClick={() => { setReviewing(app); setReviewForm({ action: "approve", note: "" }); }}>
                        Review
                      </button>
                    )}
                    {app.reviewNote && <span style={{ fontSize: "0.78rem", color: "var(--ad-text-muted,#888)", display: "block", marginTop: 4 }}>Note: {app.reviewNote}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reviewing && (
        <Modal title={`Review: ${reviewing.businessName}`} onClose={() => setReviewing(null)}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.875rem" }}><strong>Category:</strong> {BUSINESS_CATEGORY_LABELS[reviewing.category]}</p>
            <p style={{ margin: "0 0 4px", fontSize: "0.875rem" }}><strong>Description:</strong> {reviewing.description}</p>
            {reviewing.applicationMessage && <p style={{ margin: "0 0 4px", fontSize: "0.875rem" }}><strong>Message:</strong> {reviewing.applicationMessage}</p>}
          </div>
          <form onSubmit={submitReview}>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Decision</label>
              <select style={{ ...S.input, width: "100%" }} value={reviewForm.action} onChange={(e) => setReviewForm((f) => ({ ...f, action: e.target.value }))}>
                <option value="approve">Approve</option>
                <option value="reject">Reject</option>
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Note (optional)</label>
              <textarea style={{ ...S.input, width: "100%", minHeight: 80, resize: "vertical" }}
                value={reviewForm.note}
                onChange={(e) => setReviewForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Feedback for the applicant…"
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" style={S.btn()}>Submit Decision</button>
              <button type="button" style={S.btn("ghost")} onClick={() => setReviewing(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Businesses tab ──
function BusinessesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    adminGetBusinesses()
      .then((d) => setItems(d.businesses || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSetFeatured(id) {
    try {
      await adminSetFeatured(id);
      setMsg("Featured business updated.");
      load();
    } catch (err) {
      setMsg(err?.message || "Error.");
    }
  }

  async function handleStatusToggle(b) {
    try {
      const newStatus = b.status === "active" ? "suspended" : "active";
      await adminPatchBusiness(b._id, { status: newStatus });
      load();
    } catch (err) {
      setMsg(err?.message || "Error.");
    }
  }

  async function submitEdit(e) {
    e.preventDefault();
    try {
      await adminPatchBusiness(editing._id, {
        platformFeePercent: Number(editForm.platformFeePercent),
        cashbackPercent: Number(editForm.cashbackPercent),
        payoutBankName: editForm.payoutBankName,
        payoutIBAN: editForm.payoutIBAN,
        payoutBankHolder: editForm.payoutBankHolder,
      });
      setMsg("Business updated.");
      setEditing(null);
      load();
    } catch (err) {
      setMsg(err?.message || "Error updating business.");
    }
  }

  return (
    <div>
      {msg && <p style={{ padding: "10px 14px", background: "rgba(16,185,129,0.1)", borderRadius: 8, marginBottom: 16, fontSize: "0.875rem", color: "#059669" }}>{msg}</p>}

      {loading ? (
        <p style={{ color: "var(--ad-text-muted,#888)", padding: 40, textAlign: "center" }}>Loading…</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Business</th>
                <th style={S.th}>Category</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Featured</th>
                <th style={S.th}>Fee %</th>
                <th style={S.th}>Cashback %</th>
                <th style={S.th}>Revenue</th>
                <th style={S.th}>Pending Payout</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b._id}>
                  <td style={S.td}><strong>{b.businessName}</strong><br/><span style={{ fontSize: "0.78rem", color: "var(--ad-text-muted,#888)" }}>/{b.slug}</span></td>
                  <td style={S.td}>{BUSINESS_CATEGORY_LABELS[b.category] || b.category}</td>
                  <td style={S.td}><span style={S.badge(b.status === "active" ? "green" : b.status === "review" ? "orange" : "red")}>{b.status}</span></td>
                  <td style={S.td}>
                    {b.isFeaturedThisWeek
                      ? <span style={S.badge("green")}>⭐ Featured</span>
                      : b.status === "active"
                        ? <button type="button" style={S.btn("sm")} onClick={() => handleSetFeatured(b._id)}>Set Featured</button>
                        : <span style={{ color: "var(--ad-text-muted,#888)", fontSize: "0.78rem" }}>Approval required</span>}
                  </td>
                  <td style={S.td}>{b.platformFeePercent}%</td>
                  <td style={S.td}>{b.cashbackPercent}%</td>
                  <td style={S.td}>{formatPrice(b.totalRevenueMinor)}</td>
                  <td style={S.td}>{formatPrice(b.pendingPayoutMinor)}</td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button type="button" style={S.btn("sm")} onClick={() => { setEditing(b); setEditForm({ platformFeePercent: b.platformFeePercent, cashbackPercent: b.cashbackPercent, payoutBankName: b.payoutBankName || "", payoutIBAN: b.payoutIBAN || "", payoutBankHolder: b.payoutBankHolder || "" }); }}>Edit</button>
                      {["active", "suspended", "paused"].includes(b.status) ? (
                        <button type="button" style={S.btn("sm")} onClick={() => handleStatusToggle(b)}>{b.status === "active" ? "Suspend" : "Activate"}</button>
                      ) : (
                        <span style={{ alignSelf: "center", color: "var(--ad-text-muted,#888)", fontSize: "0.78rem" }}>
                          {b.status === "review" ? "Review in Applications" : "Owner setup in progress"}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={`Edit: ${editing.businessName}`} onClose={() => setEditing(null)}>
          <form onSubmit={submitEdit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={S.label}>Platform Fee %</label>
                <input type="number" style={{ ...S.input, width: "100%" }} min={0} max={100} step={0.5}
                  value={editForm.platformFeePercent} onChange={(e) => setEditForm((f) => ({ ...f, platformFeePercent: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>Cashback %</label>
                <input type="number" style={{ ...S.input, width: "100%" }} min={0} max={50} step={0.5}
                  value={editForm.cashbackPercent} onChange={(e) => setEditForm((f) => ({ ...f, cashbackPercent: e.target.value }))} />
              </div>
            </div>
            <p style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ad-text-muted,#888)", margin: "0 0 12px" }}>Payout Bank Details</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={S.label}>Account Holder</label>
                <input type="text" style={{ ...S.input, width: "100%" }} value={editForm.payoutBankHolder}
                  onChange={(e) => setEditForm((f) => ({ ...f, payoutBankHolder: e.target.value }))} placeholder="Full legal name" />
              </div>
              <div>
                <label style={S.label}>IBAN</label>
                <input type="text" style={{ ...S.input, width: "100%" }} value={editForm.payoutIBAN}
                  onChange={(e) => setEditForm((f) => ({ ...f, payoutIBAN: e.target.value }))} placeholder="NL00 BANK 0000 0000 00" />
              </div>
              <div>
                <label style={S.label}>Bank Name</label>
                <input type="text" style={{ ...S.input, width: "100%" }} value={editForm.payoutBankName}
                  onChange={(e) => setEditForm((f) => ({ ...f, payoutBankName: e.target.value }))} placeholder="ING, Rabobank, etc." />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" style={S.btn()}>Save Changes</button>
              <button type="button" style={S.btn("ghost")} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Orders tab ──
function OrdersTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    adminGetOrders(statusFilter ? { status: statusFilter } : {})
      .then((d) => setItems(d.orders || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["", "pending", "paid", "fulfilled", "cancelled", "refunded"].map((s) => (
          <button key={s} type="button"
            style={{ ...S.btn("ghost"), background: statusFilter === s ? "var(--ad-accent,#8B5CF6)" : undefined, color: statusFilter === s ? "#fff" : undefined, border: statusFilter === s ? "none" : undefined }}
            onClick={() => setStatusFilter(s)}>
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--ad-text-muted,#888)", padding: 40, textAlign: "center" }}>Loading…</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Order #</th>
                <th style={S.th}>Business</th>
                <th style={S.th}>Customer</th>
                <th style={S.th}>Total</th>
                <th style={S.th}>Platform Fee</th>
                <th style={S.th}>Cashback</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0
                ? <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "var(--ad-text-muted,#888)", padding: 40 }}>No orders found.</td></tr>
                : items.map((o) => (
                  <tr key={o._id}>
                    <td style={S.td}><code style={{ fontSize: "0.78rem" }}>{o._id?.slice(-8)}</code></td>
                    <td style={S.td}>{o.businessName}</td>
                    <td style={S.td}>{o.customerName}<br/><span style={{ fontSize:"0.78rem",color:"var(--ad-text-muted,#888)" }}>{o.customerEmail}</span></td>
                    <td style={S.td}>{formatPrice(o.subtotalMinor, o.currency)}</td>
                    <td style={S.td}>{formatPrice(o.platformFeeMinor, o.currency)}</td>
                    <td style={S.td}>{formatPrice(o.cashbackMinor, o.currency)}</td>
                    <td style={S.td}><span style={S.badge(o.status === "paid" || o.status === "fulfilled" ? "green" : o.status === "cancelled" || o.status === "refunded" ? "red" : "yellow")}>{o.status}</span></td>
                    <td style={S.td}>{formatDate(o.createdAt)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Payouts tab ──
function PayoutsTab() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(null);
  const [createForm, setCreateForm] = useState({ businessId: "", orderIds: "" });
  const [paidForm, setPaidForm] = useState({ paymentReference: "", notes: "" });
  const [businesses, setBusinesses] = useState([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([adminGetPayouts(), adminGetBusinesses()])
      .then(([p, b]) => { setPayouts(p.payouts || []); setBusinesses(b.businesses || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreatePayout(e) {
    e.preventDefault();
    try {
      const orderIds = createForm.orderIds.split(",").map((s) => s.trim()).filter(Boolean);
      await adminCreatePayout({ businessId: createForm.businessId, orderIds });
      setMsg("Payout batch created.");
      setCreating(false);
      load();
    } catch (err) {
      setMsg(err?.message || "Error creating payout.");
    }
  }

  async function handleMarkPaid(e) {
    e.preventDefault();
    try {
      await adminMarkPayoutPaid(markingPaid._id, paidForm);
      setMsg("Payout marked as paid.");
      setMarkingPaid(null);
      load();
    } catch (err) {
      setMsg(err?.message || "Error marking payout.");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Payout Batches</h3>
        <button type="button" style={S.btn()} onClick={() => setCreating(true)}>+ Create Payout</button>
      </div>

      {msg && <p style={{ padding: "10px 14px", background: "rgba(16,185,129,0.1)", borderRadius: 8, marginBottom: 16, fontSize: "0.875rem", color: "#059669" }}>{msg}</p>}

      {loading ? (
        <p style={{ color: "var(--ad-text-muted,#888)", padding: 40, textAlign: "center" }}>Loading…</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Business</th>
                <th style={S.th}>Orders</th>
                <th style={S.th}>Gross</th>
                <th style={S.th}>Platform Fee</th>
                <th style={S.th}>Net to Business</th>
                <th style={S.th}>IBAN</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0
                ? <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "var(--ad-text-muted,#888)", padding: 40 }}>No payouts yet.</td></tr>
                : payouts.map((p) => (
                  <tr key={p._id}>
                    <td style={S.td}><strong>{p.businessName}</strong></td>
                    <td style={S.td}>{p.orderCount}</td>
                    <td style={S.td}>{formatPrice(p.grossMinor, p.currency)}</td>
                    <td style={S.td}>{formatPrice(p.platformFeeMinor, p.currency)}</td>
                    <td style={S.td}><strong>{formatPrice(p.netMinor, p.currency)}</strong></td>
                    <td style={S.td}><code style={{ fontSize: "0.78rem" }}>{p.ibanSnapshot || "—"}</code></td>
                    <td style={S.td}><span style={S.badge(p.status === "paid" ? "green" : p.status === "failed" ? "red" : "yellow")}>{p.status}</span></td>
                    <td style={S.td}>
                      {p.status === "pending" || p.status === "processing"
                        ? <button type="button" style={S.btn("sm")} onClick={() => { setMarkingPaid(p); setPaidForm({ paymentReference: "", notes: "" }); }}>Mark Paid</button>
                        : <span style={{ fontSize: "0.78rem", color: "var(--ad-text-muted,#888)" }}>{formatDate(p.paidAt)}</span>
                      }
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <Modal title="Create Payout Batch" onClose={() => setCreating(false)}>
          <form onSubmit={handleCreatePayout}>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Business</label>
              <select style={{ ...S.input, width: "100%" }} value={createForm.businessId}
                onChange={(e) => setCreateForm((f) => ({ ...f, businessId: e.target.value }))} required>
                <option value="">Select business…</option>
                {businesses.filter((b) => b.pendingPayoutMinor > 0).map((b) => (
                  <option key={b._id} value={b._id}>{b.businessName} — {formatPrice(b.pendingPayoutMinor)} pending</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Order IDs (comma-separated)</label>
              <textarea style={{ ...S.input, width: "100%", minHeight: 80, resize: "vertical" }}
                value={createForm.orderIds}
                onChange={(e) => setCreateForm((f) => ({ ...f, orderIds: e.target.value }))}
                placeholder="Paste order IDs separated by commas…"
                required
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" style={S.btn()}>Create Payout</button>
              <button type="button" style={S.btn("ghost")} onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {markingPaid && (
        <Modal title={`Mark Paid: ${markingPaid.businessName}`} onClose={() => setMarkingPaid(null)}>
          <p style={{ margin: "0 0 16px", fontSize: "0.9rem" }}>
            Net amount: <strong>{formatPrice(markingPaid.netMinor, markingPaid.currency)}</strong> to {markingPaid.bankHolderSnapshot}
          </p>
          <form onSubmit={handleMarkPaid}>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Payment Reference</label>
              <input type="text" style={{ ...S.input, width: "100%" }} value={paidForm.paymentReference}
                onChange={(e) => setPaidForm((f) => ({ ...f, paymentReference: e.target.value }))}
                placeholder="Bank transaction reference" required />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Notes (optional)</label>
              <textarea style={{ ...S.input, width: "100%", minHeight: 60, resize: "vertical" }}
                value={paidForm.notes}
                onChange={(e) => setPaidForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" style={S.btn()}>Confirm Payment</button>
              <button type="button" style={S.btn("ghost")} onClick={() => setMarkingPaid(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Analytics tab ──
function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetAnalytics()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: "var(--ad-text-muted,#888)", padding: 40, textAlign: "center" }}>Loading analytics…</p>;
  if (!data) return <p style={{ color: "var(--ad-text-muted,#888)", padding: 40, textAlign: "center" }}>Could not load analytics.</p>;

  const { totals, topBusinesses = [], revenueByMonth = [] } = data;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Revenue", value: formatPrice(totals?.totalRevenueMinor) },
          { label: "Total Fees", value: formatPrice(totals?.totalFeesMinor) },
          { label: "Total Paid Out", value: formatPrice(totals?.totalPayoutsMinor) },
          { label: "Pending Payouts", value: formatPrice(totals?.pendingPayoutMinor) },
          { label: "Total Orders", value: totals?.totalOrders ?? "—" },
          { label: "Active Businesses", value: totals?.totalActiveBusinesses ?? "—" },
        ].map(({ label, value }) => (
          <div key={label} style={S.card}>
            <p style={{ margin: "0 0 4px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ad-text-muted,#888)" }}>{label}</p>
            <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>{value}</p>
          </div>
        ))}
      </div>

      {topBusinesses.length > 0 && (
        <div style={S.card}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 700 }}>Top Businesses by Revenue</h3>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Business</th>
                <th style={S.th}>Revenue</th>
                <th style={S.th}>Fees</th>
                <th style={S.th}>Orders</th>
              </tr>
            </thead>
            <tbody>
              {topBusinesses.map((b) => (
                <tr key={b._id}>
                  <td style={S.td}><strong>{b.businessName}</strong></td>
                  <td style={S.td}>{formatPrice(b.totalRevenueMinor)}</td>
                  <td style={S.td}>{formatPrice(b.totalFeesMinor)}</td>
                  <td style={S.td}>{b.totalOrders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {revenueByMonth.length > 0 && (
        <div style={S.card}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 700 }}>Revenue by Month (last 12)</h3>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Month</th>
                <th style={S.th}>Revenue</th>
                <th style={S.th}>Fees</th>
                <th style={S.th}>Orders</th>
              </tr>
            </thead>
            <tbody>
              {revenueByMonth.map((m) => (
                <tr key={`${m._id?.year}-${m._id?.month}`}>
                  <td style={S.td}>{m._id?.month}/{m._id?.year}</td>
                  <td style={S.td}>{formatPrice(m.revenue)}</td>
                  <td style={S.td}>{formatPrice(m.fees)}</td>
                  <td style={S.td}>{m.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main page ──
export default function AdminVCommercePage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <AdminLayout pageTitle="V.Commerce" pageSubtitle="Manage business applications, listings, orders and payouts">
      <div style={{ padding: "0 0 32px" }}>
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--ad-border,rgba(128,128,128,0.15))", marginBottom: 28, overflowX: "auto" }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(i)}
              style={{
                padding: "12px 20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: activeTab === i ? 700 : 400,
                color: activeTab === i ? "var(--ad-accent,#8B5CF6)" : "var(--ad-text-secondary,#666)",
                borderBottom: activeTab === i ? "2px solid var(--ad-accent,#8B5CF6)" : "2px solid transparent",
                fontSize: "0.9rem",
                whiteSpace: "nowrap",
                marginBottom: -1,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 0 && <ApplicationsTab />}
        {activeTab === 1 && <BusinessesTab />}
        {activeTab === 2 && <OrdersTab />}
        {activeTab === 3 && <PayoutsTab />}
        {activeTab === 4 && <AnalyticsTab />}
        {activeTab === 5 && <AdminWholesalerPage />}
      </div>
    </AdminLayout>
  );
}
