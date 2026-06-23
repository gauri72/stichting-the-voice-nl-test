import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { IconArrowLeft } from "@tabler/icons-react";
import AdminLayout from "../AdminLayout.jsx";
import { fetchOpsOverview, formatEventDate } from "../../../utils/eventOperationsAdmin.js";
import "../../../styles/event-operations.css";

const TABS = [
  { to: "operations", label: "Overview", end: true },
  { to: "inventory", label: "Inventory" },
  { to: "technical-rider", label: "Technical Rider" },
  { to: "stage-plan", label: "Stage Plan" },
  { to: "documents", label: "Documents" },
];

export default function EventOperationsLayout() {
  const { eventId } = useParams();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchOpsOverview(eventId);
      setOverview(data);
    } catch (err) {
      setError(err.message || "Could not load event operations.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const event = overview?.event;
  const subtitle = event
    ? `${formatEventDate(event.date)}${event.venueName ? ` · ${event.venueName}` : ""}`
    : "Event operations";

  return (
    <AdminLayout
      pageTitle={event?.title ? `Event Operations — ${event.title}` : "Event Operations"}
      pageSubtitle={subtitle}
    >
      <div className="event-ops">
        <div className="event-ops__toolbar">
          <Link to="/admin/events" className="admin-events__outline-btn event-ops__back">
            <IconArrowLeft size={16} stroke={1.75} aria-hidden />
            Back to Events
          </Link>
        </div>

        <nav className="event-ops__tabs" aria-label="Event operations sections">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={`/admin/events/${eventId}/${tab.to}`}
              end={tab.end}
              className={({ isActive }) =>
                `event-ops__tab${isActive ? " event-ops__tab--active" : ""}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        {loading ? <p className="admin-events__hint">Loading…</p> : null}
        {error ? <p className="admin-events__error" role="alert">{error}</p> : null}

        <Outlet context={{ overview, reloadOverview: load, eventId }} />
      </div>
    </AdminLayout>
  );
}
