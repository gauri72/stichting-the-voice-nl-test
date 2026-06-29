import { useEffect, useState } from "react";
import { apiFetch, authHeaders } from "../../../utils/api.js";
import "../../../styles/dashboard-my-sessions-section.css";

export default function DashboardMySessionsSection() {
  const [sessions, setSessions] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/dashboard/sessions", { headers: authHeaders() }).catch(() => ({ upcoming: [] })),
      apiFetch("/api/dashboard/rsvps", { headers: authHeaders() }).catch(() => ({ responses: [] })),
    ]).then(([sessionsData, rsvpData]) => {
      setSessions(sessionsData.upcoming || []);
      setRsvps(rsvpData.responses || []);
      setLoaded(true);
    });
  }, []);

  // Purely informational (no CTA either way) — showing it with two stacked
  // "nothing here" bullets adds clutter without telling the member anything,
  // so skip rendering once we know for sure there's nothing to show.
  if (loaded && !sessions.length && !rsvps.length) return null;

  return (
    <section className="member-dashboard__panel">
      <header className="member-dashboard__panel-head">
        <h2>My Sessions & RSVPs</h2>
        <p className="member-dashboard__panel-subtitle">
          Workshops and community sessions you've booked, and your RSVP replies.
        </p>
      </header>
      <div className="member-dashboard__panel-body">
        {sessions.length ? (
          <>
            <h3 style={{ marginTop: 0 }}>Upcoming Sessions</h3>
            <ul>
              {sessions.slice(0, 5).map((s) => (
                <li key={s.bookingId}>
                  {new Date(s.startsAt).toLocaleString()} · {s.bookingId} · {s.bookingStatus}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {rsvps.length ? (
          <>
            <h3>My RSVPs</h3>
            <ul>
              {rsvps.slice(0, 5).map((r, i) => (
                <li key={`${r.eventSlug}-${i}`}>
                  {r.eventName} · {r.status} · {new Date(r.eventDate).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </section>
  );
}
