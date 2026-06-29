import { useEffect } from "react";
import { createPortal } from "react-dom";
import { IconCalendarEvent, IconDownload, IconMapPin, IconTicket, IconX } from "@tabler/icons-react";
import { apiUrl } from "../../../utils/api.js";

export default function TicketDetailModal({ ticket, booking, onClose }) {
  useEffect(() => {
    if (!ticket) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [ticket, onClose]);

  if (!ticket) return null;

  const qrPng = ticket.verificationToken
    ? `/api/tickets/qr/${ticket.verificationToken}.png`
    : ticket.qrCodeUrl;
  const statusLabel = ticket.checkedIn ? "Checked in" : ticket.status === "valid" ? "Valid" : ticket.status;
  const seatLabel = ticket.seatLabel || [ticket.section, ticket.row, ticket.seatNumber].filter(Boolean).join(" · ");

  return createPortal(
    <div className="dash-ticket-modal" role="dialog" aria-modal="true" aria-labelledby="dash-ticket-modal-title" onClick={onClose}>
      <div className="dash-ticket-modal__panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="dash-ticket-modal__close" onClick={onClose} aria-label="Close">
          <IconX size={20} stroke={2} aria-hidden />
        </button>

        <img
          src={apiUrl(qrPng)}
          alt={`QR code for ${ticket.ticketNumber}`}
          className="dash-ticket-modal__qr"
          width={180}
          height={180}
        />

        <h3 id="dash-ticket-modal-title" className="dash-ticket-modal__type">{ticket.ticketTypeName}</h3>
        <p className="dash-ticket-modal__holder">{ticket.attendeeName}</p>
        <p className="dash-ticket-modal__number">{ticket.ticketNumber}</p>

        <span className={`dash-ticket-modal__status dash-ticket-modal__status--${ticket.status}`}>{statusLabel}</span>

        <div className="dash-ticket-modal__divider" />

        <div className="dash-ticket-modal__event">
          <p className="dash-ticket-modal__event-title">{booking.eventTitle}</p>
          <p className="dash-ticket-modal__event-meta">
            <IconCalendarEvent size={14} aria-hidden="true" /> {booking.dateLabel}
            {booking.timeLabel ? ` · ${booking.timeLabel}` : ""}
          </p>
          {booking.venueName ? (
            <p className="dash-ticket-modal__event-meta">
              <IconMapPin size={14} aria-hidden="true" /> {booking.venueName}
            </p>
          ) : null}
          {seatLabel ? (
            <p className="dash-ticket-modal__event-meta">
              <IconTicket size={14} aria-hidden="true" /> Seat {seatLabel}
            </p>
          ) : null}
        </div>

        <a href={apiUrl(ticket.pdfUrl)} className="dash-ticket-modal__download" target="_blank" rel="noreferrer">
          <IconDownload size={16} aria-hidden="true" /> Download PDF
        </a>
      </div>
    </div>,
    document.body
  );
}
