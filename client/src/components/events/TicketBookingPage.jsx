import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { IconCalendar, IconMapPin, IconTicket, IconCheck } from "@tabler/icons-react";
import StripeCheckoutForm from "../payments/StripeCheckoutForm.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { apiFetch, authHeaders } from "../../utils/api.js";
import { getStripePromise, STRIPE_PUBLISHABLE_KEY } from "../../utils/stripeClient.js";
import {
  clearCheckoutSession,
  completePaymentReturn,
  getStripeElementsAppearance,
  isPaymentReturnUrl,
  persistCheckoutSession,
  readCheckoutSession,
} from "../../utils/stripePayment.js";
import "../../styles/ticket-booking-page.css";
import "../../styles/sponsorship-payment-block.css";

const TICKET_CHECKOUT_SESSION_KEY = "voice_nl_ticket_checkout";

const EMPTY_ATTENDEE = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

export default function TicketBookingPage() {
  const { eventIdOrSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const stripeAppearance = useMemo(() => getStripeElementsAppearance(isDark), [isDark]);

  const [event, setEvent] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [attendee, setAttendee] = useState(EMPTY_ATTENDEE);
  const [voucherCode, setVoucherCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [quote, setQuote] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [voucherMessage, setVoucherMessage] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [handlingReturn, setHandlingReturn] = useState(() => isPaymentReturnUrl());
  const checkoutInitRef = useRef(false);

  const returnPath = `/events/${eventIdOrSlug}/tickets`;
  const payer = useMemo(
    () => ({
      firstName: attendee.firstName,
      lastName: attendee.lastName,
      name: `${attendee.firstName} ${attendee.lastName}`.trim(),
      email: attendee.email,
      phone: attendee.phone,
    }),
    [attendee]
  );

  const amountLabel = quote?.summary?.total || "€0.00";

  useEffect(() => {
    if (user) {
      setAttendee({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch(`/api/events/${eventIdOrSlug}`);
        if (!cancelled) {
          setEvent(data.event);
          const initial = {};
          (data.event.ticketTypes || []).forEach((tt) => {
            initial[tt.id] = 0;
          });
          setQuantities(initial);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Event not found.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [eventIdOrSlug]);

  const selectedItems = (event?.ticketTypes || [])
    .filter((tt) => (quantities[tt.id] || 0) > 0)
    .map((tt) => ({ ticketTypeId: tt.id, quantity: quantities[tt.id] }));

  const refreshQuote = useCallback(async () => {
    if (!selectedItems.length || !event?.id) {
      setQuote(null);
      return;
    }
    try {
      const data = await apiFetch(`/api/events/${event.id}/quote`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ items: selectedItems, voucherCode: voucherCode || undefined }),
      });
      setQuote(data);
      setError("");
    } catch (err) {
      setError(err.message || "Could not calculate total.");
    }
  }, [event?.id, selectedItems, voucherCode]);

  useEffect(() => {
    if (step >= 2 && selectedItems.length) {
      const timer = window.setTimeout(refreshQuote, 300);
      return () => window.clearTimeout(timer);
    }
  }, [step, refreshQuote, selectedItems.length]);

  const goToConfirmation = useCallback(
    (orderNumber) => {
      clearCheckoutSession(TICKET_CHECKOUT_SESSION_KEY);
      navigate(`/events/${eventIdOrSlug}/tickets/confirmation/${orderNumber}`);
    },
    [eventIdOrSlug, navigate]
  );

  const resolveOrderId = useCallback((paymentIntent) => {
    const saved = readCheckoutSession(TICKET_CHECKOUT_SESSION_KEY);
    return (
      saved?.orderId ||
      paymentIntent?.metadata?.order_id ||
      null
    );
  }, []);

  const finalizeTicketPayment = useCallback(
    async (paymentIntent) => {
      const orderId = resolveOrderId(paymentIntent);
      try {
        if (orderId) {
          const confirmed = await apiFetch(`/api/events/orders/${orderId}/confirm`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
          });
          goToConfirmation(confirmed.order.orderNumber);
          return;
        }

        const confirmed = await apiFetch("/api/events/orders/confirm-intent", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });
        goToConfirmation(confirmed.order.orderNumber);
      } catch (err) {
        setError(err.message || "Could not confirm your booking.");
      }
    },
    [goToConfirmation, resolveOrderId]
  );

  useEffect(() => {
    const promise = getStripePromise();
    if (!promise || !isPaymentReturnUrl()) return;

    promise.then(async (stripe) => {
      if (!stripe) return;
      setHandlingReturn(true);
      await completePaymentReturn(stripe, {
        onSuccess: finalizeTicketPayment,
        onError: (msg) => {
          setError(msg);
          setStep(3);
        },
      });
      setHandlingReturn(false);
    });
  }, [finalizeTicketPayment]);

  async function applyVoucher() {
    if (!voucherCode.trim()) return;
    setVoucherMessage("");
    try {
      await apiFetch(`/api/events/${event.id}/validate-voucher`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ code: voucherCode }),
      });
      setVoucherMessage("Voucher applied successfully.");
      refreshQuote();
    } catch (err) {
      setVoucherMessage(err.message || "Invalid voucher.");
    }
  }

  async function initCheckout() {
    if (!STRIPE_PUBLISHABLE_KEY && (quote?.summary?.totalAmountMinor ?? 1) > 0) {
      setError(
        "Stripe is not configured. Add VITE_STRIPE_PUBLISHABLE_KEY to client/.env and STRIPE_SECRET_KEY to server/.env."
      );
      return;
    }

    setCheckoutLoading(true);
    setError("");
    setClientSecret("");
    setCheckoutOrder(null);

    try {
      const checkout = await apiFetch(`/api/events/${event.id}/checkout`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          items: selectedItems,
          attendeeFirstName: attendee.firstName,
          attendeeLastName: attendee.lastName,
          attendeeEmail: attendee.email,
          attendeePhone: attendee.phone,
          voucherCode: voucherCode || undefined,
          termsAccepted,
        }),
      });

      setCheckoutOrder(checkout.order);

      persistCheckoutSession(TICKET_CHECKOUT_SESSION_KEY, {
        orderId: checkout.order.id,
        orderNumber: checkout.order.orderNumber,
        paymentIntentId: checkout.payment?.paymentIntentId || null,
        eventIdOrSlug,
        payer,
      });

      if (
        checkout.payment?.mode === "free" ||
        checkout.order.totalAmountMinor === 0
      ) {
        await finalizeTicketPayment({
          id: checkout.payment?.paymentIntentId || null,
          metadata: { order_id: checkout.order.id },
        });
        return;
      }

      if (checkout.payment?.mode === "stripe" && checkout.payment?.clientSecret) {
        setClientSecret(checkout.payment.clientSecret);
        return;
      }

      throw new Error(checkout.payment?.message || "Could not start secure checkout.");
    } catch (err) {
      setError(err.message || "Could not start checkout.");
      setStep(2);
    } finally {
      setCheckoutLoading(false);
    }
  }

  function goToPaymentStep() {
    checkoutInitRef.current = false;
    setClientSecret("");
    setCheckoutOrder(null);
    setStep(3);
  }

  useEffect(() => {
    if (step !== 3 || clientSecret || checkoutLoading || handlingReturn || checkoutOrder) return;
    if (checkoutInitRef.current) return;
    checkoutInitRef.current = true;
    initCheckout();
  }, [step, clientSecret, checkoutLoading, handlingReturn, checkoutOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStripeSuccess(paymentIntent) {
    const orderId = checkoutOrder?.id || resolveOrderId(paymentIntent);
    if (!orderId && !paymentIntent?.id) {
      setError("Order reference missing. Please contact support.");
      return;
    }
    try {
      await finalizeTicketPayment(paymentIntent);
    } catch (err) {
      setError(err.message || "Payment succeeded but booking confirmation failed.");
    }
  }

  if (loading) {
    return (
      <div className="ticket-booking">
        <p className="ticket-booking__status">Loading event…</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="ticket-booking">
        <p className="ticket-booking__error" role="alert">{error || "Event not found."}</p>
        <Link to="/events">← Back to events</Link>
      </div>
    );
  }

  const eventDate = new Date(event.date).toLocaleDateString("nl-NL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="ticket-booking">
      {event.heroImage ? (
        <div className="ticket-booking__hero" style={{ backgroundImage: `url(${event.heroImage})` }} />
      ) : (
        <div className="ticket-booking__hero ticket-booking__hero--placeholder" />
      )}

      <div className="ticket-booking__container">
        <header className="ticket-booking__header">
          <p className="ticket-booking__eyebrow">Book tickets</p>
          <h1>{event.title}</h1>
          <div className="ticket-booking__meta">
            <span><IconCalendar size={16} /> {eventDate} · {event.startTime}</span>
            <span><IconMapPin size={16} /> {event.venueName}</span>
          </div>
          {event.description ? <p className="ticket-booking__desc">{event.description}</p> : null}
        </header>

        <div className="ticket-booking__steps" aria-label="Booking progress">
          {["Select tickets", "Your details", "Payment"].map((label, i) => (
            <span key={label} className={`ticket-booking__step${step === i + 1 ? " ticket-booking__step--active" : ""}${step > i + 1 ? " ticket-booking__step--done" : ""}`}>
              {step > i + 1 ? <IconCheck size={14} /> : i + 1} {label}
            </span>
          ))}
        </div>

        {error ? <p className="ticket-booking__error" role="alert">{error}</p> : null}

        {step === 1 ? (
          <section className="ticket-booking__card">
            <h2><IconTicket size={20} /> Select tickets</h2>
            <ul className="ticket-booking__ticket-list">
              {(event.ticketTypes || []).map((tt) => (
                <li key={tt.id} className="ticket-booking__ticket-row">
                  <div>
                    <p className="ticket-booking__ticket-name">{tt.name}</p>
                    <p className="ticket-booking__ticket-desc">{tt.description}</p>
                    <p className="ticket-booking__ticket-price">€{tt.price}</p>
                    <p className="ticket-booking__ticket-avail">{tt.available} available · max {tt.maxPerOrder} per order</p>
                  </div>
                  <label className="ticket-booking__qty-label">
                    <span className="ticket-booking__qty-text">Qty</span>
                    <select
                    value={quantities[tt.id] || 0}
                    disabled={tt.status === "sold_out" || tt.available === 0}
                    onChange={(e) => setQuantities((q) => ({ ...q, [tt.id]: Number(e.target.value) }))}
                    aria-label={`Quantity for ${tt.name}`}
                  >
                    {Array.from({ length: Math.min(tt.maxPerOrder, tt.available) + 1 }, (_, i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="ticket-booking__cta"
              disabled={!selectedItems.length}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="ticket-booking__card">
            <h2>Attendee information</h2>
            <div className="ticket-booking__form-grid">
              <label>
                First name *
                <input value={attendee.firstName} onChange={(e) => setAttendee((a) => ({ ...a, firstName: e.target.value }))} />
              </label>
              <label>
                Last name *
                <input value={attendee.lastName} onChange={(e) => setAttendee((a) => ({ ...a, lastName: e.target.value }))} />
              </label>
              <label>
                Email *
                <input type="email" value={attendee.email} onChange={(e) => setAttendee((a) => ({ ...a, email: e.target.value }))} />
              </label>
              <label>
                Phone
                <input type="tel" value={attendee.phone} onChange={(e) => setAttendee((a) => ({ ...a, phone: e.target.value }))} />
              </label>
            </div>

            {quote?.membershipDiscountPercent > 0 ? (
              <p className="ticket-booking__discount-note">
                Member discount: {quote.membershipDiscountPercent}% applied automatically
              </p>
            ) : null}

            <div className="ticket-booking__voucher">
              <input
                placeholder="Voucher code"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              />
              <button type="button" onClick={applyVoucher}>Apply</button>
            </div>
            {voucherMessage ? <p className="ticket-booking__voucher-msg">{voucherMessage}</p> : null}

            {quote?.summary ? (
              <div className="ticket-booking__summary">
                <div><span>Subtotal</span><span>{quote.summary.subtotal}</span></div>
                <div><span>Booking fee</span><span>{quote.summary.bookingFee}</span></div>
                {quote.summary.discountAmountMinor > 0 ? (
                  <div className="ticket-booking__summary-discount"><span>Discount</span><span>-{quote.summary.discount}</span></div>
                ) : null}
                <div><span>VAT (incl.)</span><span>{quote.summary.vat}</span></div>
                <div className="ticket-booking__summary-total"><span>Total</span><span>{quote.summary.total}</span></div>
              </div>
            ) : null}

            <label className="ticket-booking__terms">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
              I accept the <Link to="/terms-and-conditions" target="_blank">terms and conditions</Link>
            </label>

            <div className="ticket-booking__nav">
              <button type="button" className="ticket-booking__back" onClick={() => setStep(1)}>Back</button>
              <button
                type="button"
                className="ticket-booking__cta"
                disabled={!termsAccepted || !attendee.firstName || !attendee.lastName || !attendee.email}
                onClick={goToPaymentStep}
              >
                Continue to payment
              </button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="ticket-booking__card ticket-booking__card--payment">
            <h2>Secure payment</h2>
            {quote?.summary ? (
              <div className="ticket-booking__summary ticket-booking__summary--large">
                <div className="ticket-booking__summary-total"><span>Total due</span><span>{quote.summary.total}</span></div>
              </div>
            ) : null}

            {handlingReturn || checkoutLoading ? (
              <p className="ticket-booking__status" role="status">
                {handlingReturn ? "Confirming your payment…" : "Preparing secure checkout…"}
              </p>
            ) : null}

            {!STRIPE_PUBLISHABLE_KEY && (quote?.summary?.totalAmountMinor ?? 0) > 0 ? (
              <p className="ticket-booking__error">
                Stripe is not configured. Add <code>VITE_STRIPE_PUBLISHABLE_KEY</code> to client/.env and restart.
              </p>
            ) : null}

            {clientSecret && STRIPE_PUBLISHABLE_KEY ? (
              <div className="ticket-booking__stripe">
                <Elements
                  key={isDark ? "ticket-stripe-dark" : "ticket-stripe-light"}
                  stripe={getStripePromise()}
                  options={{
                    clientSecret,
                    appearance: stripeAppearance,
                    locale: "auto",
                  }}
                >
                  <StripeCheckoutForm
                    amountLabel={amountLabel}
                    payer={payer}
                    tier={{ id: event.id, name: event.title }}
                    sessionKey={TICKET_CHECKOUT_SESSION_KEY}
                    returnPath={returnPath}
                    onSuccess={handleStripeSuccess}
                    onError={(msg) => setError(msg)}
                  />
                </Elements>
              </div>
            ) : null}

            <div className="ticket-booking__nav">
              <button
                type="button"
                className="ticket-booking__back"
                disabled={checkoutLoading || handlingReturn}
                onClick={() => {
                  setClientSecret("");
                  setCheckoutOrder(null);
                  setStep(2);
                }}
              >
                Back
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
