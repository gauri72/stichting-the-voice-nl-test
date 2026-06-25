import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useBookingFlow from "../../hooks/useBookingFlow.js";

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
  const { t } = useTranslation(["misc"]);
  const { eventSlug } = useParams();
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const { fetchPreview, checkout } = useBookingFlow({
    flowType: "rsvp",
    slug: eventSlug,
    email: form.email,
    enabled: Boolean(eventSlug),
  });

  const loadEvent = useCallback(async () => {
    if (!eventSlug) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchPreview({ slug: eventSlug });
      setEvent(data.event);
    } catch (err) {
      setError(err.message || t("misc:rsvp.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [eventSlug, fetchPreview, t]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await checkout({ slug: eventSlug, ...form });
      setSuccess(data.response);
      setForm(EMPTY);
    } catch (err) {
      setError(err.message || t("misc:rsvp.errorSubmit"));
    }
  }

  if (loading && !event) {
    return (
      <main className="events-page">
        <p>{error || t("misc:rsvp.loading")}</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="events-page">
        <p>{error || t("misc:rsvp.notFound")}</p>
      </main>
    );
  }

  const full = event.capacityRemaining === 0 && event.capacity > 0;

  return (
    <main className="events-page">
      <section className="events-page__hero">
        <h1>{event.eventName}</h1>
        <p>{event.eventDescription || t("misc:rsvp.defaultDescription")}</p>
      </section>
      <section className="events-page__grid">
        <article className="event-card">
          <p>
            <strong>{t("misc:rsvp.date")}:</strong> {new Date(event.eventDate).toLocaleDateString()}
          </p>
          <p>
            <strong>{t("misc:rsvp.time")}:</strong> {event.startTime || "—"}{" "}
            {event.endTime ? `- ${event.endTime}` : ""}
          </p>
          <p>
            <strong>{t("misc:rsvp.venue")}:</strong> {event.venue || "—"}
          </p>
          <p>
            <strong>{t("misc:rsvp.capacity")}:</strong> {event.capacity || t("misc:rsvp.unlimited")}
          </p>
          <p>
            <strong>{t("misc:rsvp.remaining")}:</strong> {event.capacityRemaining ?? t("misc:rsvp.unlimited")}
          </p>
          {full ? <p className="events-page__error">{t("misc:rsvp.fullyBooked")}</p> : null}
        </article>
        <form className="event-card" onSubmit={submit}>
          <h3>{t("misc:rsvp.formTitle")}</h3>
          <label>
            {t("misc:rsvp.name")}
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label>
            {t("misc:rsvp.email")}
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </label>
          <label>
            {t("misc:rsvp.status")}
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="yes">{t("misc:rsvp.statusYes")}</option>
              <option value="maybe">{t("misc:rsvp.statusMaybe")}</option>
              <option value="no">{t("misc:rsvp.statusNo")}</option>
            </select>
          </label>
          {event.allowGuests ? (
            <label>
              {t("misc:rsvp.guestCount")}
              <input
                type="number"
                min="0"
                max={event.maxGuests || 0}
                value={form.guestCount}
                onChange={(e) => setForm((f) => ({ ...f, guestCount: Number(e.target.value) }))}
              />
            </label>
          ) : null}
          <label>
            {t("misc:rsvp.foodPreference")}
            <input
              value={form.foodPreference}
              onChange={(e) => setForm((f) => ({ ...f, foodPreference: e.target.value }))}
            />
          </label>
          <label>
            {t("misc:rsvp.messageToHost")}
            <textarea
              value={form.messageToHost}
              onChange={(e) => setForm((f) => ({ ...f, messageToHost: e.target.value }))}
            />
          </label>
          <button type="submit" disabled={full}>
            {t("misc:rsvp.submit")}
          </button>
          {error ? <p className="events-page__error">{error}</p> : null}
          {success ? <p>{t("misc:rsvp.thankYou", { status: success.status })}</p> : null}
        </form>
      </section>
    </main>
  );
}
