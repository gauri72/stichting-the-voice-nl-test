import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";

export default function SessionDetailPage() {
  const { slug } = useParams();
  const [session, setSession] = useState(null);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/public/sessions/${slug}`)
      .then((data) => {
        setSession(data.session);
        setSlots(data.slots || []);
      })
      .catch((err) => setError(err.message || "Could not load session."));
  }, [slug]);

  if (error) return <main className="events-page"><p className="events-page__error">{error}</p></main>;
  if (!session) return <main className="events-page"><p>Loading…</p></main>;

  return (
    <main className="events-page">
      <section className="events-page__hero">
        <h1>{session.name}</h1>
        <p>{session.description || "Session details"}</p>
      </section>
      <section className="events-page__grid">
        <article className="event-card">
          <p><strong>Category:</strong> {session.category || "General"}</p>
          <p><strong>Location:</strong> {session.location || (session.mode === "online" ? "Online" : "—")}</p>
          <p><strong>Duration:</strong> {session.durationMinutes} min</p>
          <p><strong>Price:</strong> {session.price}</p>
          <Link to={`/sessions/${slug}/book`}>Book now</Link>
        </article>
        <article className="event-card">
          <h3>Available Slots</h3>
          <ul>
            {slots.map((slot) => (
              <li key={slot.slotId}>
                {new Date(slot.startsAt).toLocaleString()} · {slot.remainingCapacity}/{slot.capacity}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
