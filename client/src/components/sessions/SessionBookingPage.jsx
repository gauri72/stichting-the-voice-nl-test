import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useBookingFlow from "../../hooks/useBookingFlow.js";

export default function SessionBookingPage() {
  const { t } = useTranslation(["misc"]);
  const { slug } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({
    slotId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    participants: 1,
    discountCode: "",
    payLater: false,
  });
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const { fetchPreview, checkout } = useBookingFlow({
    flowType: "session",
    slug,
    email: form.customerEmail,
    enabled: Boolean(slug),
  });

  const loadSession = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchPreview({ slug });
      setSession(data.session);
      setSlots(data.slots || []);
    } catch (err) {
      setError(err.message || t("misc:sessionBooking.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [slug, fetchPreview, t]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const result = await checkout({
        slug,
        sessionSlug: slug,
        ...form,
      });
      setSummary(result.booking);
      if (result.payment?.clientSecret) {
        setError(t("misc:sessionBooking.paymentIntentNotice"));
      }
    } catch (err) {
      setError(err.message || t("misc:sessionBooking.errorSubmit"));
    }
  }

  if (loading && !session) {
    return (
      <main className="events-page">
        <p>{t("misc:sessionBooking.loading")}</p>
      </main>
    );
  }

  return (
    <main className="events-page">
      <section className="events-page__hero">
        <h1>{t("misc:sessionBooking.pageTitle")}</h1>
        <p>{session?.name || slug}</p>
      </section>
      {error ? <p className="events-page__error">{error}</p> : null}
      <section className="events-page__grid">
        <form className="event-card" onSubmit={submit}>
          <label>
            {t("misc:sessionBooking.slot")}
            <select
              value={form.slotId}
              onChange={(e) => setForm((f) => ({ ...f, slotId: e.target.value }))}
              required
            >
              <option value="">{t("misc:sessionBooking.selectSlot")}</option>
              {slots.map((slot) => (
                <option key={slot.slotId} value={slot.slotId}>
                  {new Date(slot.startsAt).toLocaleString()} ({slot.remainingCapacity} {t("misc:sessionBooking.left")})
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("misc:sessionBooking.name")}
            <input
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              required
            />
          </label>
          <label>
            {t("misc:sessionBooking.email")}
            <input
              type="email"
              value={form.customerEmail}
              onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
              required
            />
          </label>
          <label>
            {t("misc:sessionBooking.phone")}
            <input
              value={form.customerPhone}
              onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
            />
          </label>
          <label>
            {t("misc:sessionBooking.participants")}
            <input
              type="number"
              min="1"
              value={form.participants}
              onChange={(e) => setForm((f) => ({ ...f, participants: Number(e.target.value) }))}
            />
          </label>
          <label>
            {t("misc:sessionBooking.discountCode")}
            <input
              value={form.discountCode}
              onChange={(e) => setForm((f) => ({ ...f, discountCode: e.target.value.toUpperCase() }))}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.payLater}
              onChange={(e) => setForm((f) => ({ ...f, payLater: e.target.checked }))}
            />{" "}
            {t("misc:sessionBooking.payLater")}
          </label>
          <button type="submit">{t("misc:sessionBooking.confirmBooking")}</button>
          <button type="button" onClick={() => navigate(`/sessions/${slug}`)}>
            {t("misc:sessionBooking.back")}
          </button>
        </form>
        <article className="event-card">
          <h3>{t("misc:sessionBooking.summaryTitle")}</h3>
          {summary ? (
            <>
              <p>{t("misc:sessionBooking.bookingId")}: {summary.bookingId}</p>
              <p>{t("misc:sessionBooking.status")}: {summary.bookingStatus}</p>
              <p>{t("misc:sessionBooking.payment")}: {summary.paymentStatus}</p>
              <p>{t("misc:sessionBooking.total")}: {summary.total}</p>
              {summary.pdfUrl ? (
                <p>
                  <a href={summary.pdfUrl} target="_blank" rel="noreferrer">
                    {t("misc:sessionBooking.downloadPdf")}
                  </a>
                </p>
              ) : null}
              {summary.qrCodeUrl ? (
                <p>
                  <a href={summary.qrCodeUrl} target="_blank" rel="noreferrer">
                    {t("misc:sessionBooking.openQr")}
                  </a>
                </p>
              ) : null}
            </>
          ) : (
            <p>{t("misc:sessionBooking.summaryEmpty")}</p>
          )}
        </article>
      </section>
    </main>
  );
}
