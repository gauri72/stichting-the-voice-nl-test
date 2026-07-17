import { useCallback, useEffect, useState } from "react";
import {
  IconDownload,
  IconMail,
  IconQrcode,
  IconRefresh,
  IconSearch,
  IconTicket,
  IconEdit,
  IconTransfer,
  IconX,
  IconUser,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch, apiUrl } from "../../utils/api.js";
import AdminComplimentaryTicketPanel from "./AdminComplimentaryTicketPanel.jsx";
import "../../styles/admin-tickets-page.css";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [ticketTailorTickets, setTicketTailorTickets] = useState([]);
  const [ticketTailorMeta, setTicketTailorMeta] = useState(null);
  const [events, setEvents] = useState([]);
  const [ticketTailorEvents, setTicketTailorEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [transferForm, setTransferForm] = useState({ toName: "", toEmail: "", reason: "" });
  const [filters, setFilters] = useState({
    eventId: "",
    paymentStatus: "",
    paymentMethod: "",
    checkedIn: "",
    section: "",
    row: "",
    seatCategory: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filters.eventId) params.set("eventId", filters.eventId);
      if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
      if (filters.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
      if (filters.checkedIn) params.set("checkedIn", filters.checkedIn);
      if (filters.section) params.set("section", filters.section);
      if (filters.row) params.set("row", filters.row);
      if (filters.seatCategory) params.set("seatCategory", filters.seatCategory);

      const [ticketsData, eventsData, statsData] = await Promise.all([
        apiFetch(`/api/admin/events/tickets?${params}`, { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/events", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/events/stats", { headers: adminAuthHeaders() }),
      ]);
      setTickets(ticketsData.tickets || []);
      setTicketTailorTickets(ticketsData.ticketTailorTickets || []);
      setTicketTailorMeta(ticketsData.ticketTailorMeta || null);
      setEvents(eventsData.events || []);
      setTicketTailorEvents(eventsData.ticketTailorEvents || []);
      setStats(statsData.stats || null);
    } catch (err) {
      setError(err.message || "Could not load tickets.");
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleResend(ticketId) {
    try {
      await apiFetch(`/api/admin/events/tickets/${ticketId}/resend-email`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      window.alert("Confirmation email resent.");
    } catch (err) {
      window.alert(err.message || "Could not resend email.");
    }
  }

  async function handleCheckIn(ticketId) {
    try {
      await apiFetch(`/api/admin/events/tickets/${ticketId}/check-in`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      loadData();
    } catch (err) {
      window.alert(err.message || "Check-in failed.");
    }
  }

  async function handleRefund(ticketId) {
    if (!window.confirm("Mark this ticket as refunded?")) return;
    try {
      await apiFetch(`/api/admin/events/tickets/${ticketId}/refund`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      loadData();
    } catch (err) {
      window.alert(err.message || "Refund failed.");
    }
  }

  async function exportCsv() {
    const params = new URLSearchParams(filters);
    if (search) params.set("search", search);
    try {
      const response = await fetch(apiUrl(`/api/admin/events/tickets/export?${params}`), {
        headers: adminAuthHeaders(),
      });
      if (!response.ok) throw new Error("Export failed.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tickets-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err.message || "Could not export CSV.");
    }
  }

  async function downloadPdf(ticketId, ticketNumber) {
    try {
      const response = await fetch(apiUrl(`/api/admin/events/tickets/${ticketId}/pdf`), {
        headers: adminAuthHeaders(),
      });
      if (!response.ok) throw new Error("Download failed.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${ticketNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err.message || "Could not download PDF.");
    }
  }

  async function openTicket(t) {
    setSelectedTicket(t);
    setTicketDetail(null);
    setTransferOpen(false);
    setDetailLoading(true);
    try {
      const data = await apiFetch(`/api/admin/events/tickets/${t.id}`, { headers: adminAuthHeaders() });
      setTicketDetail(data);
      const ticket = data.ticket;
      setEditForm({
        attendeeName: ticket.attendeeName || "",
        attendeeEmail: ticket.attendeeEmail || "",
        alternateEmails: (ticket.alternateEmails || []).join(", "),
        partnerName: ticket.partnerDetails?.name || "",
        partnerEmail: ticket.partnerDetails?.email || "",
        partnerPhone: ticket.partnerDetails?.phone || "",
        partnerRelationship: ticket.partnerDetails?.relationship || "",
      });
    } catch (err) {
      window.alert(err.message || "Could not load ticket details.");
      setSelectedTicket(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function saveTicketDetails(e) {
    e.preventDefault();
    if (!selectedTicket || !editForm) return;
    setSaving(true);
    try {
      await apiFetch(`/api/admin/events/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify({
          attendeeName: editForm.attendeeName,
          attendeeEmail: editForm.attendeeEmail,
          alternateEmails: editForm.alternateEmails.split(",").map((email) => email.trim()).filter(Boolean),
          partnerDetails: {
            name: editForm.partnerName,
            email: editForm.partnerEmail,
            phone: editForm.partnerPhone,
            relationship: editForm.partnerRelationship,
          },
        }),
      });
      await openTicket(selectedTicket);
      await loadData();
    } catch (err) {
      window.alert(err.message || "Could not update ticket.");
    } finally {
      setSaving(false);
    }
  }

  async function transferTicket(e) {
    e.preventDefault();
    if (!selectedTicket) return;
    if (!window.confirm(`Transfer this ticket to ${transferForm.toEmail}? The existing QR code will stop working.`)) return;
    setSaving(true);
    try {
      const result = await apiFetch(`/api/admin/events/tickets/${selectedTicket.id}/transfer`, {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify(transferForm),
      });
      window.alert(
        result.recipientHasAccount
          ? "Ticket transferred and assigned to the recipient’s account."
          : "Ticket transferred. It will appear when the recipient creates an account with this email."
      );
      setTransferForm({ toName: "", toEmail: "", reason: "" });
      setTransferOpen(false);
      await openTicket(selectedTicket);
      await loadData();
    } catch (err) {
      window.alert(err.message || "Could not transfer ticket.");
    } finally {
      setSaving(false);
    }
  }

  function paymentMethodLabel(order) {
    if (!order) return "—";
    if (order.paymentStatus === "complimentary") return "Complimentary";
    if (order.paymentMethod === "wallet") return "V.Wallet";
    if (order.paymentMethod === "wallet_split") return "V.Wallet + Card";
    if (order.paymentStatus === "free") return "Free Booking";
    return "Card";
  }

  function renderTicketRow(t, { readOnly = false } = {}) {
    return (
      <tr
        key={t.id}
        className={`${readOnly ? "admin-tickets__row--tt" : "admin-tickets__row--interactive"}`}
        onClick={readOnly ? undefined : () => openTicket(t)}
      >
        <td>
          <span className="admin-tickets__mono">{t.ticketNumber}</span>
          <span className="admin-tickets__sub">{t.order?.orderNumber}</span>
          {readOnly ? <span className="admin-tickets__source-badge">TicketTailor</span> : null}
        </td>
        <td>
          {t.attendeeName}
          <span className="admin-tickets__sub">{t.attendeeEmail}</span>
        </td>
        <td>{t.eventTitle}</td>
        <td>{t.ticketTypeName}</td>
        <td>
          {t.section || t.row || t.seatNumber ? (
            <>
              {t.section ? <span className="admin-tickets__sub">{t.section}</span> : null}
              Row {t.row || "—"} · Seat {t.seatNumber || t.seatLabel || "—"}
              {t.seatCategory ? <span className="admin-tickets__sub">{t.seatCategory}</span> : null}
            </>
          ) : (
            "—"
          )}
        </td>
        <td>
          <span className={`admin-tickets__badge admin-tickets__badge--${t.order?.paymentMethod || t.order?.paymentStatus}`}>
            {paymentMethodLabel(t.order)}
          </span>
          {t.order?.bookingMode === "ai_assistant" ? (
            <span className="admin-tickets__badge admin-tickets__badge--ai">V.Assist</span>
          ) : null}
        </td>
        <td>{t.checkedIn ? "✓ Yes" : "No"}</td>
        <td className="admin-tickets__actions" onClick={(event) => event.stopPropagation()}>
          {readOnly ? (
            <>
              <button type="button" onClick={() => openTicket(t)} title="View and edit ticket"><IconEdit size={14} /></button>
              {t.ticketTailor?.qrCodeUrl ? (
                <a
                  href={t.ticketTailor.qrCodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View QR code"
                >
                  <IconQrcode size={14} />
                </a>
              ) : null}
              {t.ticketTailor?.barcodeUrl ? (
                <a
                  href={t.ticketTailor.barcodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View barcode"
                >
                  <IconTicket size={14} />
                </a>
              ) : null}
            </>
          ) : (
            <>
              {!t.checkedIn && t.status === "valid" ? (
                <button type="button" onClick={() => handleCheckIn(t.id)} title="Check in">✓</button>
              ) : null}
              <button type="button" onClick={() => handleResend(t.id)} title="Resend email"><IconMail size={14} /></button>
              <button type="button" onClick={() => downloadPdf(t.id, t.ticketNumber)} title="Download PDF"><IconDownload size={14} /></button>
              {t.status !== "refunded" ? (
                <button type="button" onClick={() => handleRefund(t.id)} title="Refund">↩</button>
              ) : null}
            </>
          )}
        </td>
      </tr>
    );
  }

  const ttStats = stats?.ticketTailor;

  return (
    <AdminLayout pageTitle="Tickets" pageSubtitle="Manage bookings, check-ins, and exports.">
      <div className="admin-tickets">
        {stats ? (
          <section className="admin-tickets__stats" aria-label="Ticketing statistics">
            {[
              { label: "Platform tickets", value: stats.totalTicketsSold },
              { label: "Platform revenue", value: stats.totalRevenue },
              { label: "Checked in", value: stats.ticketsCheckedIn },
              { label: "Refunded", value: stats.refundedTickets },
            ].map((s) => (
              <article key={s.label} className="admin-tickets__stat">
                <p className="admin-tickets__stat-value">{s.value}</p>
                <p className="admin-tickets__stat-label">{s.label}</p>
              </article>
            ))}
            {ttStats ? (
              <>
                <article className="admin-tickets__stat admin-tickets__stat--tt">
                  <p className="admin-tickets__stat-value">{ttStats.totalTickets}</p>
                  <p className="admin-tickets__stat-label">TicketTailor tickets</p>
                </article>
                <article className="admin-tickets__stat admin-tickets__stat--tt">
                  <p className="admin-tickets__stat-value">{ttStats.totalRevenue}</p>
                  <p className="admin-tickets__stat-label">TicketTailor revenue</p>
                </article>
                <article className="admin-tickets__stat admin-tickets__stat--tt">
                  <p className="admin-tickets__stat-value">{ttStats.ticketsCheckedIn}</p>
                  <p className="admin-tickets__stat-label">TT checked in</p>
                </article>
              </>
            ) : null}
          </section>
        ) : null}

        <AdminComplimentaryTicketPanel events={events} />

        <div className="admin-tickets__toolbar">
          <div className="admin-tickets__search">
            <IconSearch size={18} />
            <input
              type="search"
              placeholder="Search name, email, order or ticket ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select value={filters.eventId} onChange={(e) => setFilters((f) => ({ ...f, eventId: e.target.value }))}>
            <option value="">All events</option>
            <optgroup label="Platform events">
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </optgroup>
            {ticketTailorEvents.length ? (
              <optgroup label="TicketTailor events">
                {ticketTailorEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </optgroup>
            ) : null}
          </select>
          <select value={filters.paymentStatus} onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value }))}>
            <option value="">All payments</option>
            <option value="paid">Paid</option>
            <option value="free">Free booking</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
          <select value={filters.paymentMethod} onChange={(e) => setFilters((f) => ({ ...f, paymentMethod: e.target.value }))}>
            <option value="">All payment methods</option>
            <option value="wallet">V.Wallet</option>
            <option value="card">Card</option>
            <option value="free">Free</option>
            <option value="complimentary">Complimentary</option>
          </select>
          <select value={filters.checkedIn} onChange={(e) => setFilters((f) => ({ ...f, checkedIn: e.target.value }))}>
            <option value="">Check-in: all</option>
            <option value="true">Checked in</option>
            <option value="false">Not checked in</option>
          </select>
          <input
            type="text"
            placeholder="Section"
            value={filters.section}
            onChange={(e) => setFilters((f) => ({ ...f, section: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Row"
            value={filters.row}
            onChange={(e) => setFilters((f) => ({ ...f, row: e.target.value }))}
          />
          <select value={filters.seatCategory} onChange={(e) => setFilters((f) => ({ ...f, seatCategory: e.target.value }))}>
            <option value="">All seat categories</option>
            {["regular", "premium", "vip", "wheelchair", "companion", "staff", "blocked"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button type="button" className="admin-tickets__btn" onClick={loadData}>
            <IconRefresh size={16} /> Refresh
          </button>
          <button type="button" className="admin-tickets__btn admin-tickets__btn--primary" onClick={exportCsv}>
            <IconDownload size={16} /> Export CSV
          </button>
          <Link to="/admin/check-in" className="admin-tickets__btn admin-tickets__btn--accent">
            <IconQrcode size={16} /> QR Check-in
          </Link>
        </div>

        {loading ? <p className="admin-tickets__status">Loading tickets…</p> : null}
        {error ? <p className="admin-tickets__error" role="alert">{error}</p> : null}

        {ticketTailorMeta?.warning ? (
          <p className="admin-tickets__tt-warning" role="status">{ticketTailorMeta.warning}</p>
        ) : null}

        {tickets.length > 0 ? (
          <>
            <h2 className="admin-tickets__section-title">Platform Tickets</h2>
            <div className="admin-tickets__table-wrap">
              <table className="admin-tickets__table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Attendee</th>
                    <th>Event</th>
                    <th>Type</th>
                    <th>Seat</th>
                    <th>Payment</th>
                    <th>Check-in</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>{tickets.map((t) => renderTicketRow(t))}</tbody>
              </table>
            </div>
          </>
        ) : null}

        {ticketTailorTickets.length > 0 ? (
          <>
            <h2 className="admin-tickets__section-title admin-tickets__section-title--tt">
              TicketTailor Issued Tickets
              {ticketTailorMeta?.total > ticketTailorTickets.length ? (
                <span className="admin-tickets__section-meta">
                  Showing {ticketTailorTickets.length} of {ticketTailorMeta.total}
                </span>
              ) : null}
            </h2>
            <div className="admin-tickets__table-wrap admin-tickets__table-wrap--tt">
              <table className="admin-tickets__table">
                <thead>
                  <tr>
                    <th>Ticket / Barcode</th>
                    <th>Attendee</th>
                    <th>Event</th>
                    <th>Type</th>
                    <th>Payment</th>
                    <th>Check-in</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>{ticketTailorTickets.map((t) => renderTicketRow(t, { readOnly: true }))}</tbody>
              </table>
            </div>
          </>
        ) : null}

        {!loading && tickets.length === 0 && ticketTailorTickets.length === 0 ? (
          <div className="admin-tickets__table-wrap">
            <p className="admin-tickets__status admin-tickets__status--empty">
              <IconTicket size={32} /> No tickets found.
            </p>
          </div>
        ) : null}

        {selectedTicket ? (
          <div className="admin-ticket-detail__backdrop" role="presentation" onMouseDown={() => setSelectedTicket(null)}>
            <aside className="admin-ticket-detail" role="dialog" aria-modal="true" aria-label="Manage ticket" onMouseDown={(e) => e.stopPropagation()}>
              <header className="admin-ticket-detail__header">
                <div>
                  <span>Ticket management</span>
                  <h2>{selectedTicket.ticketNumber}</h2>
                </div>
                <button type="button" onClick={() => setSelectedTicket(null)} aria-label="Close"><IconX /></button>
              </header>

              {detailLoading || !ticketDetail || !editForm ? (
                <p className="admin-tickets__status">Loading ticket details…</p>
              ) : (
                <div className="admin-ticket-detail__body">
                  <section className="admin-ticket-detail__summary">
                    <div><small>Event</small><strong>{ticketDetail.ticket.eventTitle}</strong></div>
                    <div><small>Ticket type</small><strong>{ticketDetail.ticket.ticketTypeName}</strong></div>
                    <div><small>Payment</small><strong>{paymentMethodLabel(ticketDetail.ticket.order)}</strong></div>
                    <div><small>Check-in</small><strong>{ticketDetail.ticket.checkedIn ? "Checked in" : "Not checked in"}</strong></div>
                  </section>

                  <form className="admin-ticket-detail__form" onSubmit={saveTicketDetails}>
                    <h3><IconUser /> Holder details</h3>
                    <label>Full name<input value={editForm.attendeeName} onChange={(e) => setEditForm((f) => ({ ...f, attendeeName: e.target.value }))} required /></label>
                    <label>Primary email<input type="email" value={editForm.attendeeEmail} onChange={(e) => setEditForm((f) => ({ ...f, attendeeEmail: e.target.value }))} required /></label>
                    <label className="admin-ticket-detail__wide">Alternate emails <small>Separate multiple addresses with commas.</small><input value={editForm.alternateEmails} onChange={(e) => setEditForm((f) => ({ ...f, alternateEmails: e.target.value }))} placeholder="email1@example.com, email2@example.com" /></label>

                    <h3 className="admin-ticket-detail__wide">Partner / companion details</h3>
                    <label>Name<input value={editForm.partnerName} onChange={(e) => setEditForm((f) => ({ ...f, partnerName: e.target.value }))} /></label>
                    <label>Email<input type="email" value={editForm.partnerEmail} onChange={(e) => setEditForm((f) => ({ ...f, partnerEmail: e.target.value }))} /></label>
                    <label>Phone<input value={editForm.partnerPhone} onChange={(e) => setEditForm((f) => ({ ...f, partnerPhone: e.target.value }))} /></label>
                    <label>Relationship<input value={editForm.partnerRelationship} onChange={(e) => setEditForm((f) => ({ ...f, partnerRelationship: e.target.value }))} /></label>
                    <button type="submit" className="admin-tickets__btn admin-tickets__btn--primary admin-ticket-detail__wide" disabled={saving}>
                      {saving ? "Saving…" : "Save ticket details"}
                    </button>
                  </form>

                  <section className="admin-ticket-detail__transfer">
                    <button type="button" onClick={() => setTransferOpen((value) => !value)}><IconTransfer /> Transfer ticket</button>
                    <p>Transfers invalidate the current QR code and assign a new QR code to the recipient.</p>
                    {transferOpen ? (
                      <form onSubmit={transferTicket}>
                        <label>Recipient name<input value={transferForm.toName} onChange={(e) => setTransferForm((f) => ({ ...f, toName: e.target.value }))} required /></label>
                        <label>Recipient email<input type="email" value={transferForm.toEmail} onChange={(e) => setTransferForm((f) => ({ ...f, toEmail: e.target.value }))} required /></label>
                        <label>Reason<textarea value={transferForm.reason} onChange={(e) => setTransferForm((f) => ({ ...f, reason: e.target.value }))} rows={3} /></label>
                        <button type="submit" className="admin-tickets__btn admin-tickets__btn--accent" disabled={saving}>Confirm secure transfer</button>
                      </form>
                    ) : null}
                  </section>

                  <section className="admin-ticket-detail__activity">
                    <h3>Activity</h3>
                    {ticketDetail.activity?.length ? ticketDetail.activity.map((item) => (
                      <div key={item.id}><strong>{item.summary || item.action}</strong><time>{new Date(item.createdAt).toLocaleString()}</time></div>
                    )) : <p>No administrative changes recorded yet.</p>}
                  </section>
                </div>
              )}
            </aside>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
