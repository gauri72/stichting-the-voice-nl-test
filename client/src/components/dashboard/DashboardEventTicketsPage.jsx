import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconArrowLeft,
  IconDownload,
  IconQrcode,
  IconTicket,
  IconWallet,
} from "@tabler/icons-react";
import { apiFetch, apiUrl, authHeaders } from "../../utils/api.js";
import { DASHBOARD_ROUTES } from "./dashboardUtils.js";
import { slugifyFilename } from "./myEventsUtils.js";
import "../../styles/dashboard-my-events.css";

function DashboardShell({ children }) {
  return (
    <div className="member-dashboard-viewport">
      <section className="member-dashboard dash-my-events-page">{children}</section>
    </div>
  );
}

async function downloadFile(url, filename) {
  const response = await fetch(apiUrl(url), { headers: authHeaders() });
  if (!response.ok) throw new Error("Download failed.");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

function TicketCard({ ticket, eventTitle, orderNumber, t }) {
  const qrPng = ticket.verificationToken
    ? `/api/tickets/qr/${ticket.verificationToken}.png`
    : ticket.qrCodeUrl;
  const qrSvg = ticket.verificationToken
    ? `/api/tickets/qr/${ticket.verificationToken}.svg`
    : null;
  const pdfUrl =
    ticket.pdfUrl ||
    (ticket.ticketNumber && ticket.verificationToken
      ? `/api/tickets/${ticket.ticketNumber}/pdf?token=${encodeURIComponent(ticket.verificationToken)}`
      : "");
  const baseName = `${slugifyFilename(eventTitle)}-${ticket.ticketNumber}`;

  const statusLabel = ticket.checkedIn
    ? t("dashboardMain:eventTickets.ticketCard.checkedIn")
    : ticket.status === "valid"
    ? t("dashboardMain:eventTickets.ticketCard.valid")
    : ticket.status;

  return (
    <article className="dash-event-tickets__card">
      <header className="dash-event-tickets__card-head">
        <div>
          <p className="dash-event-tickets__type">{ticket.ticketTypeName}</p>
          <h3 className="dash-event-tickets__holder">{ticket.attendeeName}</h3>
          <p className="dash-event-tickets__number">{ticket.ticketNumber}</p>
        </div>
        {qrPng ? (
          <img
            src={apiUrl(qrPng)}
            alt={`QR code for ${ticket.ticketNumber}`}
            className="dash-event-tickets__qr"
            width={120}
            height={120}
          />
        ) : null}
      </header>

      <div className="dash-event-tickets__status-row">
        <span className={`dash-event-tickets__pill dash-event-tickets__pill--${ticket.status}`}>
          {statusLabel}
        </span>
        <span className="dash-event-tickets__order-ref">{t("dashboardMain:eventTickets.ticketCard.orderRef", { orderNumber })}</span>
      </div>

      <div className="dash-event-tickets__actions">
        <a
          href={apiUrl(pdfUrl)}
          className="dash-my-events__btn dash-my-events__btn--primary"
          target="_blank"
          rel="noreferrer"
        >
          <IconDownload size={16} /> {t("dashboardMain:eventTickets.ticketCard.downloadPdf")}
        </a>
        <button
          type="button"
          className="dash-my-events__btn dash-my-events__btn--secondary"
          onClick={() => downloadFile(qrPng, `${baseName}.png`)}
        >
          <IconQrcode size={16} /> {t("dashboardMain:eventTickets.ticketCard.downloadQrPng")}
        </button>
        {qrSvg ? (
          <button
            type="button"
            className="dash-my-events__btn dash-my-events__btn--secondary"
            onClick={() => downloadFile(qrSvg, `${baseName}.svg`)}
          >
            <IconQrcode size={16} /> {t("dashboardMain:eventTickets.ticketCard.downloadQrSvg")}
          </button>
        ) : null}
        <button type="button" className="dash-my-events__btn dash-my-events__btn--ghost" disabled title={t("dashboardMain:eventTickets.ticketCard.comingSoon")}>
          <IconWallet size={16} /> {t("dashboardMain:eventTickets.ticketCard.addToWallet")}
        </button>
        <a
          href={apiUrl(pdfUrl)}
          className="dash-my-events__btn dash-my-events__btn--ghost"
          target="_blank"
          rel="noreferrer"
        >
          <IconTicket size={16} /> {t("dashboardMain:eventTickets.ticketCard.viewFullTicket")}
        </a>
      </div>
    </article>
  );
}

export default function DashboardEventTicketsPage() {
  const { t } = useTranslation(["dashboardMain"]);
  const { eventId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiFetch(`/api/dashboard/events/${eventId}/tickets`, {
        headers: authHeaders(),
      });
      setData(result);
    } catch (e) {
      setError(e.message || t("dashboardMain:eventTickets.loadError"));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <DashboardShell>
        <div className="member-dashboard__status">{t("dashboardMain:eventTickets.loading")}</div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="member-dashboard__status member-dashboard__status--error" role="alert">
          <p>{error}</p>
          <Link to={DASHBOARD_ROUTES.myEvents} className="dash-my-events__back">
            <IconArrowLeft size={18} /> {t("dashboardMain:eventTickets.backToMyEvents")}
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const { event, summary, tickets } = data;

  return (
    <DashboardShell>
      <header className="dash-my-events__hero">
        <Link to={DASHBOARD_ROUTES.myEvents} className="dash-my-events__back">
          <IconArrowLeft size={18} aria-hidden /> {t("dashboardMain:eventTickets.backLink")}
        </Link>
        <h1 className="dash-my-events__page-title">{event.title}</h1>
        <p className="dash-my-events__page-subtitle">{t("dashboardMain:eventTickets.subtitle")}</p>
      </header>

      <section className="dash-event-tickets__summary" aria-labelledby="ticket-summary-title">
        <h2 id="ticket-summary-title" className="dash-my-events__section-title">{t("dashboardMain:eventTickets.summary.heading")}</h2>
        <dl className="dash-event-tickets__summary-grid">
          <div>
            <dt>{t("dashboardMain:eventTickets.summary.ticketType")}</dt>
            <dd>
              {summary.ticketTypes?.map((line) => `${line.quantity}× ${line.ticketTypeName}`).join(", ") || "—"}
            </dd>
          </div>
          <div>
            <dt>{t("dashboardMain:eventTickets.summary.quantity")}</dt>
            <dd>{summary.quantity}</dd>
          </div>
          <div>
            <dt>{t("dashboardMain:eventTickets.summary.orderNumber")}</dt>
            <dd>{summary.orderNumber}</dd>
          </div>
          <div>
            <dt>{t("dashboardMain:eventTickets.summary.purchaseDate")}</dt>
            <dd>{summary.purchaseDateLabel}</dd>
          </div>
          <div>
            <dt>{t("dashboardMain:eventTickets.summary.status")}</dt>
            <dd>{summary.status?.replace(/_/g, " ")}</dd>
          </div>
          <div>
            <dt>{t("dashboardMain:eventTickets.summary.totalPaid")}</dt>
            <dd>€{((summary.totalAmountMinor || 0) / 100).toFixed(2)}</dd>
          </div>
          <div>
            <dt>{t("dashboardMain:eventTickets.summary.paymentMethod")}</dt>
            <dd>
              {summary.paymentMethod === "wallet"
                ? t("dashboardMain:eventTickets.summary.paymentMethodValues.wallet")
                : summary.paymentMethod === "wallet_split"
                ? t("dashboardMain:eventTickets.summary.paymentMethodValues.walletSplit")
                : summary.paymentStatus === "free"
                ? t("dashboardMain:eventTickets.summary.paymentMethodValues.free")
                : t("dashboardMain:eventTickets.summary.paymentMethodValues.card")}
              {summary.bookedVia === "V.Assist" ? (
                <span className="dash-event-tickets__pill dash-event-tickets__pill--ai">V.Assist</span>
              ) : null}
            </dd>
          </div>
        </dl>
        <p className="dash-event-tickets__event-meta">
          {event.dateLabel}
          {event.timeLabel ? ` · ${event.timeLabel}` : ""}
          {event.venueName ? ` · ${event.venueName}` : ""}
        </p>
      </section>

      <section className="dash-event-tickets__list" aria-labelledby="your-tickets-title">
        <h2 id="your-tickets-title" className="dash-my-events__section-title">{t("dashboardMain:eventTickets.list.heading")}</h2>
        <div className="dash-event-tickets__cards">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              eventTitle={event.title}
              orderNumber={summary.orderNumber}
              t={t}
            />
          ))}
        </div>
      </section>

      <div className="dash-event-tickets__footer">
        <Link to={event.slug ? `/events/${event.slug}/tickets` : `/events/${event.id}/tickets`} className="dash-my-events__btn dash-my-events__btn--secondary">
          {t("dashboardMain:eventTickets.buyMoreTickets")}
        </Link>
      </div>
    </DashboardShell>
  );
}
