import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../utils/api.js";
import "../../styles/public-booking-flows.css";

export default function SessionsPage() {
  const { t } = useTranslation(["misc"]);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/public/sessions")
      .then((data) => setSessions(data.sessions || []))
      .catch((err) => setError(err.message || t("misc:sessions.errorLoad")));
  }, [t]);

  return (
    <main className="events-page">
      <section className="events-page__hero"><h1>{t("misc:sessions.heading")}</h1><p>{t("misc:sessions.tagline")}</p></section>
      {error ? <p className="events-page__error">{error}</p> : null}
      <section className="events-page__grid">
        {sessions.map((s) => (
          <article key={s.id} className="event-card">
            <h3>{s.name}</h3>
            <p>{s.description || t("misc:sessions.noDescription")}</p>
            <p>{s.category || t("misc:sessions.general")} · {s.durationMinutes} {t("misc:sessions.minutes")}</p>
            <p>{s.location || (s.mode === "online" ? t("misc:sessions.online") : "—")} · {s.price}</p>
            <Link to={`/sessions/${s.slug}`}>{t("misc:sessions.viewSession")}</Link>
          </article>
        ))}
      </section>
    </main>
  );
}
