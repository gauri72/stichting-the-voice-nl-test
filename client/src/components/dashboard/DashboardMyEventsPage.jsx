import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IconArrowLeft,
  IconCalendarEvent,
  IconSearch,
  IconTicket,
  IconCircleCheck,
  IconBan,
  IconReceiptRefund,
} from "@tabler/icons-react";
import { apiFetch, apiUrl, authHeaders } from "../../utils/api.js";
import { DASHBOARD_ROUTES } from "./dashboardUtils.js";
import DashboardEventCard from "./DashboardEventCard.jsx";
import { EVENT_FILTERS, filterEvents } from "./myEventsUtils.js";
import "../../styles/dashboard-my-events.css";

function DashboardShell({ children }) {
  return (
    <div className="member-dashboard-viewport">
      <section className="member-dashboard dash-my-events-page">{children}</section>
    </div>
  );
}

const HISTORY_STATUS_ICON = {
  booked: IconTicket,
  checked_in: IconCircleCheck,
  cancelled: IconBan,
  refunded: IconReceiptRefund,
};

function HistoryCard({ item }) {
  const Icon = HISTORY_STATUS_ICON[item.bookingStatus.toLowerCase()] || IconTicket;
  return (
    <li className={`dash-history-card dash-history-card--${item.bookingStatus.toLowerCase()}`}>
      <span className="dash-history-card__icon" aria-hidden>
        <Icon size={20} stroke={1.75} />
      </span>
      <div className="dash-history-card__body">
        <p className="dash-history-card__title">{item.title}</p>
        <p className="dash-history-card__date">{item.dateLabel}</p>
        <div className="dash-history-card__badges">
          <span className={`dash-history-card__status dash-history-card__status--${item.bookingStatus.toLowerCase()}`}>
            {item.bookingStatus.replace(/_/g, " ")}
          </span>
          <span className="dash-history-card__count">
            {item.ticketCount} ticket{item.ticketCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      {(item.ticketsUrl || item.pdfUrl) ? (
        <div className="dash-history-card__actions">
          {item.ticketsUrl ? (
            <Link to={item.ticketsUrl} className="dash-my-events__link-btn">View Ticket</Link>
          ) : null}
          {item.pdfUrl ? (
            <a href={apiUrl(item.pdfUrl)} className="dash-my-events__link-btn" target="_blank" rel="noreferrer">
              Download PDF
            </a>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export default function DashboardMyEventsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiFetch("/api/dashboard/events", { headers: authHeaders() });
      setData(result);
    } catch (e) {
      setError(e.message || "Could not load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredEvents = useMemo(() => {
    const result = filterEvents(data?.events, { filter, search });
    // Default view already shows featured events in their own section right
    // above — don't repeat the same cards immediately below in "All Events".
    // The dedicated "Featured" filter tab is unaffected since it isn't "all".
    if (filter === "all" && !search) {
      return result.filter((e) => !e.isFeatured);
    }
    return result;
  }, [data?.events, filter, search]);

  const hasBookedHistory = (data?.history?.length || 0) > 0;
  const hasAnyEvents = (data?.events?.length || 0) > 0;

  function handleViewTickets(event) {
    navigate(`/dashboard/events/${event.id}/tickets`);
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="member-dashboard__status">Loading your events…</div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="member-dashboard__status member-dashboard__status--error" role="alert">
          <p>{error}</p>
          <button type="button" className="member-dashboard__retry" onClick={load}>
            Try again
          </button>
        </div>
      </DashboardShell>
    );
  }

  const showFeatured = data.featured?.length > 0 && filter === "all" && !search;

  const historySection = (
    <section className="dash-my-events__section dash-my-events__section--history" aria-labelledby="history-title">
      <h2 id="history-title" className="dash-my-events__section-title">My Event History</h2>
      {!hasBookedHistory ? (
        <div className="dash-my-events__empty dash-my-events__empty--inline">
          <p>You haven&apos;t booked any events yet.</p>
          <Link to={DASHBOARD_ROUTES.events} className="dash-my-events__btn dash-my-events__btn--secondary">
            Explore Events
          </Link>
        </div>
      ) : (
        <ul className="dash-history-list">
          {data.history.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <DashboardShell>
      <header className="dash-my-events__hero">
        <Link to="/dashboard" className="dash-my-events__back">
          <IconArrowLeft size={18} aria-hidden /> Dashboard
        </Link>
        <h1 className="dash-my-events__page-title">My Events</h1>
        <p className="dash-my-events__page-subtitle">
          Discover upcoming experiences and access your tickets.
        </p>
      </header>

      <div className="dash-my-events__toolbar">
        <div className="dash-my-events__search">
          <IconSearch size={18} aria-hidden />
          <input
            type="search"
            placeholder="Search by event, venue, or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search events"
          />
        </div>
        <div className="dash-my-events__filters" role="tablist" aria-label="Filter events">
          {EVENT_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`dash-my-events__filter${filter === f.id ? " dash-my-events__filter--active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {showFeatured ? (
        <div className="dash-my-events__top-grid">
          <section className="dash-my-events__section" aria-labelledby="featured-events-title">
            <h2 id="featured-events-title" className="dash-my-events__section-title">Featured Events</h2>
            <div className="dash-my-events__grid">
              {data.featured.map((event) => (
                <DashboardEventCard key={event.id} event={event} onViewTickets={handleViewTickets} />
              ))}
            </div>
          </section>
          {historySection}
        </div>
      ) : (
        historySection
      )}

      {!hasAnyEvents ? (
        <div className="dash-my-events__empty">
          <IconCalendarEvent size={40} aria-hidden />
          <h2>No upcoming events available right now.</h2>
          <p>Check back soon for new V.O.I.C.E. NL experiences.</p>
          <Link to={DASHBOARD_ROUTES.events} className="dash-my-events__btn dash-my-events__btn--primary">
            Browse Experiences
          </Link>
        </div>
      ) : (
        <>
          {data.upcoming?.length > 0 && filter === "all" && !search ? (
            <section className="dash-my-events__section" aria-labelledby="upcoming-events-title">
              <h2 id="upcoming-events-title" className="dash-my-events__section-title">Upcoming Events</h2>
              <div className="dash-my-events__grid dash-my-events__grid--upcoming">
                {data.upcoming.map((event) => (
                  <DashboardEventCard key={event.id} event={event} onViewTickets={handleViewTickets} />
                ))}
              </div>
            </section>
          ) : null}

          {/* In the default (no filter/search) view, an empty "All Events"
              here is just Featured/Upcoming repeated as "nothing else" —
              not useful, so skip it. A filter or search the member actively
              chose still needs to report back when it finds nothing. */}
          {filteredEvents.length > 0 || filter !== "all" || search ? (
            <section className="dash-my-events__section" aria-labelledby="all-events-title">
              <h2 id="all-events-title" className="dash-my-events__section-title">
                {filter === "all" && !search ? "All Events" : "Results"}
              </h2>
              {filteredEvents.length === 0 ? (
                <p className="dash-my-events__no-results">No events match your search or filter.</p>
              ) : (
                <div className="dash-my-events__grid">
                  {filteredEvents.map((event) => (
                    <DashboardEventCard key={event.id} event={event} onViewTickets={handleViewTickets} />
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </>
      )}
    </DashboardShell>
  );
}
