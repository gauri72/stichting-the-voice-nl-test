import { useEffect, useState } from "react";
import { adminGetWholesalers, adminPatchWholesaler } from "../vcommerce/shared/vcommerceApi.js";
import "../../styles/vcommerce-marketplace.css";

const STATUS_LABELS = { pending: "Pending", approved: "Approved", suspended: "Suspended" };
const STATUS_CLASS = { pending: "vco-badge--warning", approved: "vco-badge--success", suspended: "vco-badge--error" };

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminWholesalerPage() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // { profile, action }
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionErr, setActionErr] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await adminGetWholesalers({ status: statusFilter || undefined, page, pageSize: 20 });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [statusFilter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAction() {
    if (!modal) return;
    setActionLoading(true);
    setActionErr("");
    try {
      await adminPatchWholesaler(modal.profile._id, { action: modal.action, notes });
      setModal(null);
      setNotes("");
      load();
    } catch (e) {
      setActionErr(e.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="mkt-admin-section">
      <div className="mkt-admin-section__filters">
        {["", "pending", "approved", "suspended"].map((s) => (
          <button
            key={s || "all"}
            className={`vco-btn vco-btn--ghost vco-btn--sm ${statusFilter === s ? "vco-btn--active" : ""}`}
            onClick={() => { setStatusFilter(s); setPage(1); }}
          >
            {s === "" ? "All" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="vco-loading"><span className="vco-loading__dot" /><span className="vco-loading__dot" /><span className="vco-loading__dot" /></div>
      ) : items.length === 0 ? (
        <div className="vco-empty-state"><p>No wholesalers found.</p></div>
      ) : (
        <div className="mkt-order-table-wrap">
          <table className="mkt-order-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Country</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id}>
                  <td>
                    <strong>{p.companyName}</strong>
                    {p.userId && <div className="mkt-table__sub">{p.userId.firstName} {p.userId.lastName} — {p.userId.email}</div>}
                  </td>
                  <td>{p.companyType?.replace(/_/g, " ")}</td>
                  <td>{p.contactEmail}</td>
                  <td>{p.address?.country || "—"}</td>
                  <td><span className={`vco-badge ${STATUS_CLASS[p.status]}`}>{STATUS_LABELS[p.status]}</span></td>
                  <td>{formatDate(p.createdAt)}</td>
                  <td className="mkt-table__actions">
                    {p.status === "pending" && (
                      <>
                        <button className="vco-btn vco-btn--primary vco-btn--sm" onClick={() => { setModal({ profile: p, action: "approve" }); setNotes(""); }}>Approve</button>
                        <button className="vco-btn vco-btn--ghost vco-btn--sm" onClick={() => { setModal({ profile: p, action: "reject" }); setNotes(""); }}>Reject</button>
                      </>
                    )}
                    {p.status === "approved" && (
                      <button className="vco-btn vco-btn--ghost vco-btn--sm" onClick={() => { setModal({ profile: p, action: "suspend" }); setNotes(""); }}>Suspend</button>
                    )}
                    {p.status === "suspended" && (
                      <button className="vco-btn vco-btn--primary vco-btn--sm" onClick={() => { setModal({ profile: p, action: "approve" }); setNotes(""); }}>Re-activate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {total > 20 && (
            <div className="mkt-pagination">
              <button className="vco-btn vco-btn--ghost vco-btn--sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
              <span>Page {page} of {Math.ceil(total / 20)}</span>
              <button className="vco-btn vco-btn--ghost vco-btn--sm" onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total}>Next →</button>
            </div>
          )}
        </div>
      )}

      {modal && (
        <div className="vco-modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="vco-modal">
            <h2 className="vco-modal__title">
              {modal.action === "approve" ? "Approve" : modal.action === "suspend" ? "Suspend" : "Reject"} — {modal.profile.companyName}
            </h2>
            {actionErr && <p className="vco-error-banner" role="alert">{actionErr}</p>}
            <div className="vco-field">
              <label className="vco-label" htmlFor="adminWholesalerNotes">Notes (optional)</label>
              <textarea id="adminWholesalerNotes" className="vco-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
            </div>
            <div className="vco-modal__actions">
              <button className="vco-btn vco-btn--ghost" onClick={() => setModal(null)}>Cancel</button>
              <button
                className={`vco-btn ${modal.action === "approve" ? "vco-btn--primary" : "vco-btn--ghost"}`}
                onClick={handleAction}
                disabled={actionLoading}
              >
                {actionLoading ? "Saving…" : modal.action === "approve" ? "Approve" : modal.action === "suspend" ? "Suspend" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
