import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconCalendarEvent, IconDownload, IconMapPin, IconTicket } from "@tabler/icons-react";
import { apiFetch, apiUrl, authHeaders } from "../../../utils/api.js";
import TicketDetailModal from "./TicketDetailModal.jsx";
import "../../../styles/dashboard-my-bookings-section.css";

const VISIBLE_TICKETS_PER_EVENT = 3;
const VISIBLE_TICKETS_PER_EVENT_COMPACT = 2;

function TicketRow({ ticket, onSelect }) {
  const qrPng = ticket.verificationToken
    ? `/api/tickets/qr/${ticket.verificationToken}.png`
    : ticket.qrCodeUrl;

  return (
    <li className="dash-my-bookings__ticket">
      <button
        type="button"
        className="dash-my-bookings__ticket-trigger"
        onClick={() => onSelect(ticket)}
        aria-label={`View ticket details for ${ticket.ticketTypeName} — ${ticket.attendeeName}`}
      >
        {qrPng ? (
          <img
            src={apiUrl(qrPng)}
            alt=""
            className="dash-my-bookings__qr"
            width={56}
            height={56}
          />
        ) : null}
        <div className="dash-my-bookings__ticket-info">
          <p className="dash-my-bookings__ticket-type">{ticket.ticketTypeName}</p>
          <p className="dash-my-bookings__ticket-holder">{ticket.attendeeName}</p>
        </div>
      </button>
      <a
        href={apiUrl(ticket.pdfUrl)}
        className="dash-my-bookings__pdf-btn"
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Download PDF for ticket ${ticket.ticketNumber}`}
      >
        <IconDownload size={16} aria-hidden="true" />
      </a>
    </li>
  );
}

function BookingCard({ booking, onSelectTicket, compact }) {
  const limit = compact ? VISIBLE_TICKETS_PER_EVENT_COMPACT : VISIBLE_TICKETS_PER_EVENT;
  const visibleTickets = booking.tickets.slice(0, limit);
  const remaining = booking.ticketCount - visibleTickets.length;

  return (
    <article className="dash-my-bookings__card">
      <header className="dash-my-bookings__card-head">
        <div>
          <h3 className="dash-my-bookings__title">{booking.eventTitle}</h3>
          <p className="dash-my-bookings__meta">
            <IconCalendarEvent size={14} aria-hidden="true" /> {booking.dateLabel}
            {booking.timeLabel ? ` · ${booking.timeLabel}` : ""}
          </p>
          {booking.venueName && !compact ? (
            <p className="dash-my-bookings__meta">
              <IconMapPin size={14} aria-hidden="true" /> {booking.venueName}
            </p>
          ) : null}
        </div>
        <span className="dash-my-bookings__count">
          <IconTicket size={14} aria-hidden="true" /> {booking.ticketCount} ticket{booking.ticketCount === 1 ? "" : "s"}
        </span>
      </header>

      <ul className="dash-my-bookings__ticket-list">
        {visibleTickets.map((ticket) => (
          <TicketRow key={ticket.id} ticket={ticket} onSelect={(t) => onSelectTicket(t, booking)} />
        ))}
      </ul>

      <Link to={booking.ticketsUrl} className="dash-my-bookings__view-all">
        {remaining > 0 ? `+${remaining} more — View All Tickets` : "View All Tickets"}
      </Link>
    </article>
  );
}

export default function DashboardMyBookingsSection({ compact = false }) {
  const [bookings, setBookings] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    apiFetch("/api/dashboard/bookings", { headers: authHeaders() })
      .then((data) => setBookings(data?.bookings || []))
      .catch(() => setBookings([]))
      .finally(() => setLoaded(true));
  }, []);

  // Only meant to surface real upcoming bookings — nothing to show, nothing rendered.
  if (!loaded || !bookings.length) return null;

  return (
    <section className={`dash-my-bookings${compact ? " dash-my-bookings--compact" : ""}`} aria-labelledby="dash-my-bookings-title">
      <h2 id="dash-my-bookings-title" className="dash-my-bookings__section-title">My Bookings</h2>
      <div className="dash-my-bookings__grid">
        {bookings.map((booking) => (
          <BookingCard
            key={booking.eventId}
            booking={booking}
            compact={compact}
            onSelectTicket={(ticket, bookingForTicket) => setSelected({ ticket, booking: bookingForTicket })}
          />
        ))}
      </div>

      <TicketDetailModal
        ticket={selected?.ticket}
        booking={selected?.booking}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
