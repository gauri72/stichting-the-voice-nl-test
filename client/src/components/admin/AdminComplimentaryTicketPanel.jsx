import { useEffect, useState } from "react";
import { IconGift } from "@tabler/icons-react";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";

const EMPTY = {
  eventId: "",
  ticketTypeId: "",
  quantity: 1,
  attendeeFirstName: "",
  attendeeLastName: "",
  attendeeEmail: "",
  attendeePhone: "",
  note: "",
};

export default function AdminComplimentaryTicketPanel({ events = [] }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastOrder, setLastOrder] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  useEffect(() => {
    if (!form.eventId) {
      setTicketTypes([]);
      return;
    }
    let cancelled = false;
    setLoadingTypes(true);
    apiFetch(`/api/admin/events/${form.eventId}`, { headers: adminAuthHeaders() })
      .then((data) => {
        if (!cancelled) {
          setTicketTypes(data.event?.ticketTypes || []);
          setForm((f) => ({ ...f, ticketTypeId: "" }));
        }
      })
      .catch(() => {
        if (!cancelled) setTicketTypes([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTypes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.eventId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const result = await apiFetch("/api/admin/booking/complimentary", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity) || 1,
        }),
      });
      setLastOrder(result.order || result);
      setMessage(
        `Complimentary ticket issued — order ${result.order?.orderNumber || result.orderNumber || "created"}.`
      );
      setForm((f) => ({
        ...EMPTY,
        eventId: f.eventId,
        ticketTypeId: f.ticketTypeId,
      }));
    } catch (err) {
      setError(err.message || "Could not issue complimentary ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="admin-tickets__complimentary" aria-labelledby="complimentary-heading">
      <header className="admin-tickets__complimentary-header">
        <IconGift size={20} />
        <div>
          <h2 id="complimentary-heading">Issue complimentary ticket</h2>
          <p>
            Admin-issued tickets flow through the unified booking engine (no payment). Festival
            passes purchased by customers use the public event checkout with automatic mode
            detection.
          </p>
        </div>
      </header>

      <form className="admin-tickets__complimentary-form" onSubmit={handleSubmit}>
        <label>
          Event
          <select
            value={form.eventId}
            onChange={(e) => setForm((f) => ({ ...f, eventId: e.target.value }))}
            required
          >
            <option value="">Select event</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          Ticket type
          <select
            value={form.ticketTypeId}
            onChange={(e) => setForm((f) => ({ ...f, ticketTypeId: e.target.value }))}
            required
            disabled={!form.eventId || loadingTypes}
          >
            <option value="">{loadingTypes ? "Loading types…" : "Select ticket type"}</option>
            {ticketTypes.map((tt) => (
              <option key={tt.id} value={tt.id}>
                {tt.name}
                {/festival|day pass|weekend pass|vip pass/i.test(tt.name || "")
                  ? " (festival pass)"
                  : ""}
              </option>
            ))}
          </select>
        </label>

        <label>
          Quantity
          <input
            type="number"
            min="1"
            max="20"
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
          />
        </label>

        <div className="admin-tickets__complimentary-row">
          <label>
            First name
            <input
              value={form.attendeeFirstName}
              onChange={(e) => setForm((f) => ({ ...f, attendeeFirstName: e.target.value }))}
              required
            />
          </label>
          <label>
            Last name
            <input
              value={form.attendeeLastName}
              onChange={(e) => setForm((f) => ({ ...f, attendeeLastName: e.target.value }))}
              required
            />
          </label>
        </div>

        <label>
          Email
          <input
            type="email"
            value={form.attendeeEmail}
            onChange={(e) => setForm((f) => ({ ...f, attendeeEmail: e.target.value }))}
            required
          />
        </label>

        <label>
          Phone
          <input
            value={form.attendeePhone}
            onChange={(e) => setForm((f) => ({ ...f, attendeePhone: e.target.value }))}
          />
        </label>

        <label>
          Admin note (optional)
          <textarea
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            rows={2}
            maxLength={500}
          />
        </label>

        {error ? <p className="admin-tickets__error">{error}</p> : null}
        {message ? <p className="admin-tickets__success">{message}</p> : null}
        {lastOrder?.tickets?.length ? (
          <p className="admin-tickets__sub">
            {lastOrder.tickets.length} ticket(s) generated for {lastOrder.order?.attendeeEmail}
          </p>
        ) : null}

        <button type="submit" disabled={submitting}>
          {submitting ? "Issuing…" : "Issue complimentary ticket"}
        </button>
      </form>
    </section>
  );
}
