import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaMapMarkerAlt } from "react-icons/fa";
import {
  BOOKING_STATUS_LABELS,
  canViewTickets,
  viewTicketsLabel,
} from "./myEventsUtils.js";
import upcomingFallback from "../../assets/Dashboard/upcoming-event-1.png";

export default function DashboardEventCard({
  event,
  compact = false,
  onViewTickets,
  linkToDetail = false,
}) {
  const { t } = useTranslation(["dashboardMain"]);
  const statusLabel = BOOKING_STATUS_LABELS[event.bookingStatus];
  const imageSrc = event.heroImage || upcomingFallback;
  const ticketsEnabled = canViewTickets(event);

  const cardInner = (
    <>
      <div className="dash-my-events__media">
        <img src={imageSrc} alt="" loading="lazy" />
        {event.day ? (
          <span className="dash-my-events__date-chip">
            <strong>{event.day}</strong>
            <small>{event.month}</small>
          </span>
        ) : null}
        {event.isFeatured ? (
          <span className="dash-my-events__badge dash-my-events__badge--featured">{t("dashboardMain:eventCard.featuredBadge")}</span>
        ) : null}
        {event.daysRemaining != null && event.daysRemaining <= 14 ? (
          <span className="dash-my-events__badge dash-my-events__badge--days">
            {t("dashboardMain:eventCard.daysLeft", { count: event.daysRemaining })}
          </span>
        ) : null}
      </div>

      <div className="dash-my-events__body">
        {event.category ? (
          <p className="dash-my-events__category">{event.category}</p>
        ) : null}
        <h3 className="dash-my-events__title">{event.title}</h3>
        {!compact && event.shortDescription ? (
          <p className="dash-my-events__desc">{event.shortDescription}</p>
        ) : null}
        <p className="dash-my-events__meta">{event.dateLabel}</p>
        {event.timeLabel ? <p className="dash-my-events__meta">{event.timeLabel}</p> : null}
        <p className="dash-my-events__location">
          <FaMapMarkerAlt aria-hidden />
          {event.location || event.venueName}
        </p>

        {event.hasMembershipBenefit ? (
          <div className="dash-my-events__membership">
            <span className="dash-my-events__membership-badge">
              {event.membershipBenefitDescription || t("dashboardMain:eventCard.membershipBenefitDefault")}
            </span>
            {event.membershipBenefitLabel ? (
              <span className="dash-my-events__membership-value">{event.membershipBenefitLabel}</span>
            ) : null}
          </div>
        ) : null}

        {statusLabel ? (
          <p className={`dash-my-events__status dash-my-events__status--${event.bookingStatus.toLowerCase()}`}>
            {statusLabel}
          </p>
        ) : null}

        <div className="dash-my-events__actions">
          {onViewTickets ? (
            <button
              type="button"
              className={`dash-my-events__btn dash-my-events__btn--primary${ticketsEnabled ? "" : " dash-my-events__btn--disabled"}`}
              disabled={!ticketsEnabled}
              onClick={() => ticketsEnabled && onViewTickets(event)}
            >
              {viewTicketsLabel(event)}
            </button>
          ) : (
            <Link
              to={ticketsEnabled ? `/dashboard/events/${event.id}/tickets` : "#"}
              className={`dash-my-events__btn dash-my-events__btn--primary${ticketsEnabled ? "" : " dash-my-events__btn--disabled"}`}
              aria-disabled={!ticketsEnabled}
              onClick={(e) => !ticketsEnabled && e.preventDefault()}
            >
              {viewTicketsLabel(event)}
            </Link>
          )}
          <Link to={event.bookingUrl} className="dash-my-events__btn dash-my-events__btn--secondary">
            {t("dashboardMain:eventCard.buyTickets")}
          </Link>
        </div>
      </div>
    </>
  );

  if (linkToDetail) {
    return (
      <article className={`dash-my-events__card${compact ? " dash-my-events__card--compact" : ""}`}>
        <Link to={`/dashboard/events`} className="dash-my-events__card-link">
          {cardInner}
        </Link>
      </article>
    );
  }

  return (
    <article className={`dash-my-events__card${compact ? " dash-my-events__card--compact" : ""}`}>
      {cardInner}
    </article>
  );
}
