import { Link } from "react-router-dom";
import { FaArrowRight, FaMapMarkerAlt, FaRegCheckCircle } from "react-icons/fa";
import featuredEventImage from "../../../assets/Dashboard/upcoming-event-1.png";
import { DASHBOARD_ROUTES, UPCOMING_EVENTS } from "../dashboardUtils.js";
import "../../../styles/dashboard-upcoming-events-section.css";

const COMING_SOON_COUNT = 3;

export default function DashboardUpcomingEventsSection() {
  const featuredEvent = UPCOMING_EVENTS[0];

  return (
    <section className="dash-events-section" aria-labelledby="dash-events-title">
      <div className="dash-events-section__head">
        <h2 id="dash-events-title" className="dash-events-section__title">
          Upcoming Events
        </h2>
        <Link to={DASHBOARD_ROUTES.events} className="dash-events__viewall">
          View All <FaArrowRight aria-hidden />
        </Link>
      </div>

      <div className="dash-events__grid">
        <article className="dash-events__card dash-events__card--featured">
          <div className="dash-events__media">
            <img src={featuredEventImage} alt="" loading="lazy" />
            <span className="dash-events__date">
              <strong>{featuredEvent.day}</strong>
              <small>{featuredEvent.month}</small>
            </span>
          </div>
          <div className="dash-events__body">
            <h3 className="dash-events__card-title">{featuredEvent.title}</h3>
            <p className="dash-events__location">
              <FaMapMarkerAlt aria-hidden />
              {featuredEvent.location}
            </p>
            <p className="dash-events__status">
              <FaRegCheckCircle aria-hidden />
              Registered
            </p>
            <a
              href={featuredEvent.ticketUrl || DASHBOARD_ROUTES.events}
              className="dash-events__ticket-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Ticket
            </a>
          </div>
        </article>

        {Array.from({ length: COMING_SOON_COUNT }, (_, index) => (
          <article key={`coming-soon-${index + 1}`} className="dash-events__card dash-events__card--soon">
            <div className="dash-events__media dash-events__media--soon" aria-hidden>
              <span className="dash-events__soon-badge">Coming Soon</span>
            </div>
            <div className="dash-events__body dash-events__body--soon">
              <p className="dash-events__soon-copy">More V.O.I.C.E. NL events are on the way.</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
