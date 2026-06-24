import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useBookingFlow from "../../hooks/useBookingFlow.js";

export default function SessionBookingPage() {
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
      setError(err.message || "Could not load session.");
    } finally {
      setLoading(false);
    }
  }, [slug, fetchPreview]);

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
        setError("Stripe payment intent created. Continue with existing payment flow integration.");
      }
    } catch (err) {
      setError(err.message || "Could not complete booking.");
    }
  }

  if (loading && !session) {
    return (
      <main className="events-page">
        <p>Loading session…</p>
      </main>
    );
  }

  return (
    <main className="events-page">
      <section className="events-page__hero">
        <h1>Book Session</h1>
        <p>{session?.name || slug}</p>
      </section>
      {error ? <p className="events-page__error">{error}</p> : null}
      <section className="events-page__grid">
        <form className="event-card" onSubmit={submit}>
          <label>
            Slot
            <select
              value={form.slotId}
              onChange={(e) => setForm((f) => ({ ...f, slotId: e.target.value }))}
              required
            >
              <option value="">Select slot</option>
              {slots.map((slot) => (
                <option key={slot.slotId} value={slot.slotId}>
                  {new Date(slot.startsAt).toLocaleString()} ({slot.remainingCapacity} left)
                </option>
              ))}
            </select>
          </label>
          <label>
            Name
            <input
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.customerEmail}
              onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
              required
            />
          </label>
          <label>
            Phone
            <input
              value={form.customerPhone}
              onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
            />
          </label>
          <label>
            Participants
            <input
              type="number"
              min="1"
              value={form.participants}
              onChange={(e) => setForm((f) => ({ ...f, participants: Number(e.target.value) }))}
            />
          </label>
          <label>
            Discount code
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
            Pay later
          </label>
          <button type="submit">Confirm Booking</button>
          <button type="button" onClick={() => navigate(`/sessions/${slug}`)}>
            Back
          </button>
        </form>
        <article className="event-card">
          <h3>Booking Summary</h3>
          {summary ? (
            <>
              <p>Booking ID: {summary.bookingId}</p>
              <p>Status: {summary.bookingStatus}</p>
              <p>Payment: {summary.paymentStatus}</p>
              <p>Total: {summary.total}</p>
              {summary.pdfUrl ? (
                <p>
                  <a href={summary.pdfUrl} target="_blank" rel="noreferrer">
                    Download PDF
                  </a>
                </p>
              ) : null}
              {summary.qrCodeUrl ? (
                <p>
                  <a href={summary.qrCodeUrl} target="_blank" rel="noreferrer">
                    Open QR
                  </a>
                </p>
              ) : null}
            </>
          ) : (
            <p>Select a slot and confirm booking.</p>
          )}
        </article>
      </section>
    </main>
  );
}
