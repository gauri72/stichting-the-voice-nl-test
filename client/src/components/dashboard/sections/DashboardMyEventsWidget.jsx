import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { apiFetch, authHeaders } from "../../../utils/api.js";
import { DASHBOARD_ROUTES } from "../dashboardUtils.js";
import DashboardEventCard from "../DashboardEventCard.jsx";
import "../../../styles/dashboard-my-events.css";

export default function DashboardMyEventsWidget() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await apiFetch("/api/dashboard/events", { headers: authHeaders() });
        setEvents(result.widgetEvents || []);
      } catch (err) {
        console.warn("[my-events-widget]", err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return null;

  return (
    <section className="dash-my-events-widget" aria-labelledby="dash-my-events-widget-title">
      <div className="dash-my-events-widget__head">
        <div>
          <h2 id="dash-my-events-widget-title" className="dash-my-events-widget__title">
            Upcoming Experiences
          </h2>
          <p className="dash-my-events-widget__subtitle">
            Discover upcoming experiences and access your tickets.
          </p>
        </div>
        <Link to={DASHBOARD_ROUTES.myEvents} className="dash-events__viewall">
          View All <FaArrowRight aria-hidden />
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="dash-my-events-widget__empty">
          <p>No upcoming events available right now.</p>
          <Link to={DASHBOARD_ROUTES.events} className="dash-my-events__btn dash-my-events__btn--secondary">
            Browse Experiences
          </Link>
        </div>
      ) : (
        <div className="dash-my-events-widget__grid">
          {events.map((event) => (
            <DashboardEventCard key={event.id} event={event} compact />
          ))}
        </div>
      )}
    </section>
  );
}
