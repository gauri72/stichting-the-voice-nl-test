import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/public/sessions")
      .then((data) => setSessions(data.sessions || []))
      .catch((err) => setError(err.message || "Could not load sessions."));
  }, []);

  return (
    <main className="events-page">
      <section className="events-page__hero"><h1>Sessions</h1><p>Book classes, appointments, courts, tables and workshops.</p></section>
      {error ? <p className="events-page__error">{error}</p> : null}
      <section className="events-page__grid">
        {sessions.map((s) => (
          <article key={s.id} className="event-card">
            <h3>{s.name}</h3>
            <p>{s.description || "—"}</p>
            <p>{s.category || "General"} · {s.durationMinutes} min</p>
            <p>{s.location || (s.mode === "online" ? "Online" : "—")} · {s.price}</p>
            <Link to={`/sessions/${s.slug}`}>View session</Link>
          </article>
        ))}
      </section>
    </main>
  );
}
