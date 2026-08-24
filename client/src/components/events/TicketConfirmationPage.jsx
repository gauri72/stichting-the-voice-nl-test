import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconCheck, IconDownload } from "@tabler/icons-react";
import { apiFetch, authHeaders, apiUrl } from "../../utils/api.js";
import { resolveTicketQrSrc } from "../dashboard/dashboardUtils.js";
import "../../styles/ticket-booking-page.css";
import "../../styles/amsterdam-flames-ticket-theme.css";

// Matches the AMSTERDAM_FLAMES_EVENT_SLUG event in TicketBookingPage.jsx — the
// order payload here only carries the event's Mongo id, not its slug.
const AMSTERDAM_FLAMES_EVENT_ID = "6a8c7530d507e734837cc9d4";

export default function TicketConfirmationPage() {
  const { t: tr } = useTranslation(["checkout"]);
  const { orderNumber } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const email = searchParams.get("email") || "";
        const token = searchParams.get("token") || "";
        const params = new URLSearchParams();
        if (email) params.set("email", email);
        if (token) params.set("token", token);
        const query = params.toString() ? `?${params.toString()}` : "";
        const result = await apiFetch(`/api/events/orders/${orderNumber}${query}`, { headers: authHeaders() });
        setData(result);
      } catch (err) {
        setError(err.message || "Could not load order.");
      }
    }
    load();
  }, [orderNumber, searchParams]);

  if (error) {
    return (
      <div className="ticket-booking">
        <p className="ticket-booking__error">{error}</p>
        <Link to="/events">{tr("checkout:confirmation.backToEvents")}</Link>
      </div>
    );
  }

  if (!data) {
    return <div className="ticket-booking"><p className="ticket-booking__status">{tr("checkout:confirmation.loading")}</p></div>;
  }

  const { order, tickets } = data;
  const isAmsterdamFlames = order.eventId === AMSTERDAM_FLAMES_EVENT_ID;
  const afClass = isAmsterdamFlames ? " ticket-booking--af" : "";
  const backToEventsPath = isAmsterdamFlames ? "/events/amsterdam-flames-night-of-the-stars" : "/events";

  return (
    <div className={`ticket-booking ticket-booking--confirmation${afClass}`}>
      <div className="ticket-booking__container">
        <div className="ticket-booking__success-icon"><IconCheck size={48} /></div>
        <h1>{tr("checkout:confirmation.title")}</h1>
        {order.isFreeBooking || order.paymentStatus === "free" ? (
          <p className="ticket-booking__free-badge">{tr("checkout:confirmation.freeBadge")}</p>
        ) : null}
        <p>{tr("checkout:confirmation.order")} <strong>{order.orderNumber}</strong> · {order.total}</p>
        {order.lineItems?.length ? (
          <ul className="ticket-booking__confirm-lines">
            {order.lineItems.map((line) => (
              <li key={`${line.ticketTypeId}-${line.quantity}`}>
                {line.quantity} × {line.ticketTypeName}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="ticket-booking__confirm-note">
          {tr("checkout:confirmation.emailNote", { email: order.attendeeEmail })}
        </p>

        <ul className="ticket-booking__confirm-tickets">
          {tickets.map((ticket) => {
            const qrSrc = ticket.verificationToken
              ? `/api/tickets/qr/${ticket.verificationToken}.png`
              : resolveTicketQrSrc(ticket.qrCodeUrl);
            return (
            <li key={ticket.id} className="ticket-booking__confirm-ticket">
              <div>
                <p className="ticket-booking__ticket-name">{ticket.ticketTypeName}</p>
                <p className="ticket-booking__mono">{ticket.ticketNumber}</p>
              </div>
              {qrSrc ? (
                <img src={apiUrl(qrSrc)} alt="QR code" width={100} height={100} />
              ) : null}
              <a
                href={apiUrl(
                  ticket.pdfUrl ||
                    (ticket.ticketNumber && ticket.verificationToken
                      ? `/api/tickets/${ticket.ticketNumber}/pdf?token=${encodeURIComponent(ticket.verificationToken)}`
                      : "")
                )}
                className="ticket-booking__pdf-btn"
                target="_blank"
                rel="noreferrer"
              >
                <IconDownload size={16} /> PDF
              </a>
            </li>
            );
          })}
        </ul>

        <Link to={backToEventsPath} className="ticket-booking__cta">{tr("checkout:confirmation.backToEvents")}</Link>
      </div>
    </div>
  );
}
