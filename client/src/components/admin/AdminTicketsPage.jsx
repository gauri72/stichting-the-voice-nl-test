import { useCallback, useEffect, useState } from "react";
import {
  IconDownload,
  IconMail,
  IconQrcode,
  IconRefresh,
  IconSearch,
  IconTicket,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch, apiUrl } from "../../utils/api.js";
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
  const [filters, setFilters] = useState({
    eventId: "",
    paymentStatus: "",
    checkedIn: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filters.eventId) params.set("eventId", filters.eventId);
      if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
      if (filters.checkedIn) params.set("checkedIn", filters.checkedIn);

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

  function renderTicketRow(t, { readOnly = false } = {}) {
    return (
      <tr key={t.id} className={readOnly ? "admin-tickets__row--tt" : undefined}>
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
          <span className={`admin-tickets__badge admin-tickets__badge--${t.order?.paymentStatus}`}>
            {t.order?.paymentStatus || "—"}
          </span>
        </td>
        <td>{t.checkedIn ? "✓ Yes" : "No"}</td>
        <td className="admin-tickets__actions">
          {readOnly ? (
            <>
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
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
          <select value={filters.checkedIn} onChange={(e) => setFilters((f) => ({ ...f, checkedIn: e.target.value }))}>
            <option value="">Check-in: all</option>
            <option value="true">Checked in</option>
            <option value="false">Not checked in</option>
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
      </div>
    </AdminLayout>
  );
}
