import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../utils/api.js";
import "../../styles/public-booking-flows.css";

export default function SessionDetailPage() {
  const { t } = useTranslation(["misc"]);
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
      .catch((err) => setError(err.message || t("misc:sessionDetail.errorLoad")));
  }, [slug, t]);

  if (error) return <main className="events-page"><p className="events-page__error">{error}</p></main>;
  if (!session) return <main className="events-page"><p>{t("misc:sessionDetail.loading")}</p></main>;

  return (
    <main className="events-page">
      <section className="events-page__hero">
        <h1>{session.name}</h1>
        <p>{session.description || t("misc:sessionDetail.defaultDescription")}</p>
      </section>
      <section className="events-page__grid">
        <article className="event-card">
          <p><strong>{t("misc:sessionDetail.category")}:</strong> {session.category || t("misc:sessions.general")}</p>
          <p><strong>{t("misc:sessionDetail.location")}:</strong> {session.location || (session.mode === "online" ? t("misc:sessions.online") : "—")}</p>
          <p><strong>{t("misc:sessionDetail.duration")}:</strong> {session.durationMinutes} {t("misc:sessions.minutes")}</p>
          <p><strong>{t("misc:sessionDetail.price")}:</strong> {session.price}</p>
          <Link to={`/sessions/${slug}/book`}>{t("misc:sessionDetail.bookNow")}</Link>
        </article>
        <article className="event-card">
          <h3>{t("misc:sessionDetail.availableSlots")}</h3>
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
