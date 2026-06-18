import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { IconCheck, IconDownload } from "@tabler/icons-react";
import { apiFetch, authHeaders, apiUrl } from "../../utils/api.js";
import { resolveTicketQrSrc } from "../dashboard/dashboardUtils.js";
import "../../styles/ticket-booking-page.css";

export default function TicketConfirmationPage() {
  const { orderNumber } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await apiFetch(`/api/events/orders/${orderNumber}`, { headers: authHeaders() });
        setData(result);
      } catch (err) {
        setError(err.message || "Could not load order.");
      }
    }
    load();
  }, [orderNumber]);

  if (error) {
    return (
      <div className="ticket-booking">
        <p className="ticket-booking__error">{error}</p>
        <Link to="/events">Back to events</Link>
      </div>
    );
  }

  if (!data) {
    return <div className="ticket-booking"><p className="ticket-booking__status">Loading confirmation…</p></div>;
  }

  const { order, tickets } = data;

  return (
    <div className="ticket-booking ticket-booking--confirmation">
      <div className="ticket-booking__container">
        <div className="ticket-booking__success-icon"><IconCheck size={48} /></div>
        <h1>Booking confirmed!</h1>
        <p>Order <strong>{order.orderNumber}</strong> · {order.total}</p>
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
          A confirmation email with your QR tickets has been sent to {order.attendeeEmail}.
        </p>

        <ul className="ticket-booking__confirm-tickets">
          {tickets.map((t) => {
            const qrSrc = t.verificationToken
              ? `/api/tickets/qr/${t.verificationToken}.png`
              : resolveTicketQrSrc(t.qrCodeUrl);
            return (
            <li key={t.id} className="ticket-booking__confirm-ticket">
              <div>
                <p className="ticket-booking__ticket-name">{t.ticketTypeName}</p>
                <p className="ticket-booking__mono">{t.ticketNumber}</p>
              </div>
              {qrSrc ? (
                <img src={apiUrl(qrSrc)} alt="QR code" width={100} height={100} />
              ) : null}
              <a href={apiUrl(t.pdfUrl || `/api/tickets/${t.ticketNumber}/pdf`)} className="ticket-booking__pdf-btn" target="_blank" rel="noreferrer">
                <IconDownload size={16} /> PDF
              </a>
            </li>
            );
          })}
        </ul>

        <Link to="/events" className="ticket-booking__cta">Back to events</Link>
      </div>
    </div>
  );
}
