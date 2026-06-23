import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";

const EMPTY = {
  name: "",
  email: "",
  status: "yes",
  guestCount: 0,
  guestNames: [],
  foodPreference: "",
  messageToHost: "",
};

export default function RsvpPage() {
  const { eventSlug } = useParams();
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/public/rsvp/${eventSlug}`)
      .then((data) => setEvent(data.event))
      .catch((err) => setError(err.message || "Could not load RSVP event."));
  }, [eventSlug]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await apiFetch(`/api/public/rsvp/${eventSlug}`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSuccess(data.response);
      setForm(EMPTY);
    } catch (err) {
      setError(err.message || "Could not submit RSVP.");
    }
  }

  if (!event) return <main className="events-page"><p>{error || "Loading RSVP event..."}</p></main>;

  const full = event.capacityRemaining === 0 && event.capacity > 0;

  return (
    <main className="events-page">
      <section className="events-page__hero">
        <h1>{event.eventName}</h1>
        <p>{event.eventDescription || "Please let us know if you can attend."}</p>
      </section>
      <section className="events-page__grid">
        <article className="event-card">
          <p><strong>Date:</strong> {new Date(event.eventDate).toLocaleDateString()}</p>
          <p><strong>Time:</strong> {event.startTime || "—"} {event.endTime ? `- ${event.endTime}` : ""}</p>
          <p><strong>Venue:</strong> {event.venue || "—"}</p>
          <p><strong>Capacity:</strong> {event.capacity || "Unlimited"}</p>
          <p><strong>Remaining:</strong> {event.capacityRemaining ?? "Unlimited"}</p>
          {full ? <p className="events-page__error">This event is fully booked.</p> : null}
        </article>
        <form className="event-card" onSubmit={submit}>
          <h3>RSVP</h3>
          <label>Name<input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></label>
          <label>Email<input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required /></label>
          <label>Status
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="yes">Yes, I will attend</option>
              <option value="maybe">Maybe</option>
              <option value="no">No, I cannot attend</option>
            </select>
          </label>
          {event.allowGuests ? (
            <label>Guest count
              <input type="number" min="0" max={event.maxGuests || 0} value={form.guestCount} onChange={(e) => setForm((f) => ({ ...f, guestCount: Number(e.target.value) }))} />
            </label>
          ) : null}
          <label>Food preference<input value={form.foodPreference} onChange={(e) => setForm((f) => ({ ...f, foodPreference: e.target.value }))} /></label>
          <label>Message to host<textarea value={form.messageToHost} onChange={(e) => setForm((f) => ({ ...f, messageToHost: e.target.value }))} /></label>
          <button type="submit" disabled={full}>Submit RSVP</button>
          {error ? <p className="events-page__error">{error}</p> : null}
          {success ? <p>Thank you! RSVP submitted as "{success.status}".</p> : null}
        </form>
      </section>
    </main>
  );
}
