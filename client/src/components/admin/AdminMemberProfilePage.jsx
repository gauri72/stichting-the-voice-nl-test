import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  IconArrowLeft,
  IconDownload,
  IconMail,
  IconQrcode,
  IconRefresh,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch, apiUrl } from "../../utils/api.js";
import { resolveMembershipQrSrc } from "../dashboard/dashboardUtils.js";
import "../../styles/admin-memberships-page.css";

const TABS = [
  { id: "membership", label: "Membership" },
  { id: "events", label: "Event Participation" },
  { id: "tickettailor", label: "TicketTailor" },
  { id: "payments", label: "Payments" },
  { id: "discounts", label: "Discounts" },
  { id: "notes", label: "Notes" },
  { id: "timeline", label: "Activity" },
];

function statusBadgeClass(status) {
  return `admin-memberships__badge admin-memberships__badge--${status || "expired"}`;
}

export default function AdminMemberProfilePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("membership");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiFetch(`/api/admin/memberships/${id}`, {
        headers: adminAuthHeaders(),
      });
      setData(result);
      setNotes(result.notes || "");
    } catch (err) {
      setError(err.message || "Could not load member profile.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveNotes() {
    setSavingNotes(true);
    try {
      await apiFetch(`/api/admin/memberships/${id}`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ notes }),
      });
    } catch (err) {
      window.alert(err.message || "Could not save notes.");
    } finally {
      setSavingNotes(false);
    }
  }

  async function runAction(action) {
    try {
      await apiFetch(`/api/admin/memberships/${id}/${action}`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      await load();
    } catch (err) {
      window.alert(err.message || "Action failed.");
    }
  }

  async function downloadCard() {
    try {
      const response = await fetch(apiUrl(`/api/admin/memberships/${id}/download-card`), {
        headers: adminAuthHeaders(),
      });
      if (!response.ok) throw new Error("Download failed.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `membership-card-${data?.member?.membershipId || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err.message || "Could not download card.");
    }
  }

  if (loading) {
    return (
      <AdminLayout pageTitle="Member Profile" pageSubtitle="Loading…">
        <p className="admin-memberships__status">Loading member profile…</p>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout pageTitle="Member Profile">
        <p className="admin-memberships__error">{error || "Member not found."}</p>
        <Link to="/admin/memberships">← Back to memberships</Link>
      </AdminLayout>
    );
  }

  const { member, summary } = data;
  const qrSrc = resolveMembershipQrSrc(member.qrCodeUrl, member.membershipId);

  return (
    <AdminLayout pageTitle="Member Profile" pageSubtitle={member.membershipId}>
      <div className="admin-member-profile">
        <Link to="/admin/memberships" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, color: "var(--ad-muted)", textDecoration: "none" }}>
          <IconArrowLeft size={16} /> Back to memberships
        </Link>

        <header className="admin-member-profile__header">
          <div>
            <h1 className="admin-member-profile__name">{member.fullName}</h1>
            <p className="admin-member-profile__meta">
              {member.membershipType} · <span className={statusBadgeClass(member.membershipStatus)}>{member.membershipStatus.replace(/_/g, " ")}</span>
            </p>
            <p className="admin-member-profile__meta">{member.email} · {member.membershipId}</p>
            <p className="admin-member-profile__meta">Since {member.memberSinceLabel} · Until {member.memberUntilLabel} · QR: {member.qrStatus}</p>
          </div>
          {qrSrc ? (
            <img src={apiUrl(qrSrc)} alt="Membership QR" width={100} height={100} style={{ borderRadius: 12, background: "#fff", padding: 6 }} />
          ) : null}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {!member.readOnly ? (
              <>
            <button type="button" className="admin-memberships__btn admin-memberships__btn--accent" onClick={() => runAction("renew")}>
              <IconRefresh size={16} /> Renew
            </button>
            <button type="button" className="admin-memberships__btn" onClick={downloadCard}>
              <IconDownload size={16} /> Card
            </button>
            <button type="button" className="admin-memberships__btn" onClick={() => runAction("resend-email")}>
              <IconMail size={16} /> Email
            </button>
            <button type="button" className="admin-memberships__btn" onClick={() => runAction("regenerate-qr")}>
              <IconQrcode size={16} /> Regenerate QR
            </button>
              </>
            ) : (
              <span className="admin-memberships__badge admin-memberships__badge--expiring_soon">TicketTailor record (read-only)</span>
            )}
          </div>
        </header>

        <section className="admin-member-profile__summary">
          {[
            { label: "Events Attended", value: summary.totalEventsAttended },
            { label: "Upcoming Events", value: summary.upcomingEvents },
            { label: "Tickets Purchased", value: summary.totalTicketsPurchased },
            { label: "Lifetime Ticket Spend", value: summary.lifetimeTicketSpend },
            { label: "Discounts Used", value: summary.discountsUsed },
            { label: "Membership Savings", value: summary.membershipSavings },
          ].map((s) => (
            <article key={s.label} className="admin-member-profile__summary-card">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </article>
          ))}
        </section>

        <nav className="admin-member-profile__tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`admin-member-profile__tab${tab === t.id ? " admin-member-profile__tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="admin-member-profile__panel">
          {tab === "membership" ? (
            <dl style={{ margin: 0, display: "grid", gap: 12 }}>
              {[
                ["Membership ID", member.membershipId],
                ["Type", member.membershipType],
                ["Status", member.membershipStatus],
                ["Payment", member.paymentStatus],
                ["Phone", member.phone || "—"],
                ["Country", member.country || "—"],
                ["Auto renewal", member.autoRenewal ? "Yes" : "No"],
                ["Amount paid", member.amountPaid],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt style={{ fontSize: "0.75rem", color: "var(--ad-muted)", textTransform: "uppercase" }}>{label}</dt>
                  <dd style={{ margin: "4px 0 0" }}>{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {tab === "events" ? (
            <table className="admin-memberships__table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Ticket</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Check-in</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(data.eventParticipation || []).map((row, i) => (
                  <tr key={i}>
                    <td>{row.eventName}</td>
                    <td>{row.eventDateLabel}</td>
                    <td>{row.ticketType}</td>
                    <td>{row.quantity}</td>
                    <td>{row.bookingStatus}</td>
                    <td>{row.checkInStatus}</td>
                    <td>{row.amountPaidMinor ? `€ ${(row.amountPaidMinor / 100).toFixed(2)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {tab === "tickettailor" ? (
            <table className="admin-memberships__table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Ticket</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Check-in</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(data.ticketTailorActivity || []).map((row) => (
                  <tr key={row.id}>
                    <td>{row.eventName}</td>
                    <td>{row.eventDateLabel}</td>
                    <td>{row.ticketType} ×{row.quantity}</td>
                    <td><code>{row.orderNumber}</code></td>
                    <td>{row.bookingStatus}</td>
                    <td>{row.checkInStatus}</td>
                    <td>{row.amountPaid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {tab === "payments" ? (
            <table className="admin-memberships__table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Receipt</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {(data.payments || []).map((p) => (
                  <tr key={p.id}>
                    <td>{p.paidAtLabel}</td>
                    <td>{p.amount}</td>
                    <td>{p.receiptNumber}</td>
                    <td><code>{p.paymentReference}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {tab === "discounts" ? (
            <div>
              <p><strong>Total savings:</strong> {data.discounts?.totalSavings}</p>
              <p><strong>Voucher codes used:</strong> {data.discounts?.membershipDiscountsUsed}</p>
              <ul style={{ marginTop: 16, paddingLeft: 20 }}>
                {(data.discounts?.voucherCodesUsed || []).map((v, i) => (
                  <li key={i}>{v.code} — {v.discount} on order {v.orderNumber} ({v.date})</li>
                ))}
              </ul>
            </div>
          ) : null}

          {tab === "notes" ? (
            <div>
              <textarea
                rows={8}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "var(--ad-input-bg)", color: "inherit", font: "inherit" }}
              />
              <button type="button" className="admin-memberships__btn admin-memberships__btn--primary" style={{ marginTop: 12 }} onClick={saveNotes} disabled={savingNotes}>
                {savingNotes ? "Saving…" : "Save notes"}
              </button>
            </div>
          ) : null}

          {tab === "timeline" ? (
            <ul className="admin-member-profile__timeline">
              {(data.timeline || []).map((ev, i) => (
                <li key={i}>
                  <time>{new Date(ev.date).toLocaleString()}</time>
                  <strong>{ev.summary}</strong>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </AdminLayout>
  );
}
