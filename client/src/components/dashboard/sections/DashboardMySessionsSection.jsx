import { useEffect, useState } from "react";
import { apiFetch, authHeaders } from "../../../utils/api.js";

export default function DashboardMySessionsSection() {
  const [sessions, setSessions] = useState([]);
  const [rsvps, setRsvps] = useState([]);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/dashboard/sessions", { headers: authHeaders() }).catch(() => ({ upcoming: [] })),
      apiFetch("/api/dashboard/rsvps", { headers: authHeaders() }).catch(() => ({ responses: [] })),
    ]).then(([sessionsData, rsvpData]) => {
      setSessions(sessionsData.upcoming || []);
      setRsvps(rsvpData.responses || []);
    });
  }, []);

  return (
    <section className="member-dashboard__panel">
      <header className="member-dashboard__panel-head">
        <h2>My Sessions & RSVPs</h2>
      </header>
      <div className="member-dashboard__panel-body">
        <h3 style={{ marginTop: 0 }}>Upcoming Sessions</h3>
        <ul>
          {sessions.slice(0, 5).map((s) => (
            <li key={s.bookingId}>
              {new Date(s.startsAt).toLocaleString()} · {s.bookingId} · {s.bookingStatus}
            </li>
          ))}
          {!sessions.length ? <li>No upcoming sessions.</li> : null}
        </ul>
        <h3>My RSVPs</h3>
        <ul>
          {rsvps.slice(0, 5).map((r, i) => (
            <li key={`${r.eventSlug}-${i}`}>
              {r.eventName} · {r.status} · {new Date(r.eventDate).toLocaleDateString()}
            </li>
          ))}
          {!rsvps.length ? <li>No RSVP responses yet.</li> : null}
        </ul>
      </div>
    </section>
  );
}
