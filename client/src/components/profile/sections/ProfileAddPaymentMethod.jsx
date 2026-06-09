import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { FaLock } from "react-icons/fa";
import { useTheme } from "../../../contexts/ThemeContext.jsx";
import { apiFetch, authHeaders } from "../../../utils/api.js";
import { getStripePromise, STRIPE_PUBLISHABLE_KEY } from "../../../utils/stripeClient.js";
import {
  buildSetupReturnUrl,
  getStripeElementsAppearance,
} from "../../../utils/stripePayment.js";

function SetupForm({ onCancel, onSaved }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError("");

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Please check your payment details.");
      setSubmitting(false);
      return;
    }

    const { error: confirmError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: buildSetupReturnUrl() },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || "Could not save your payment method. Please try again.");
      setSubmitting(false);
      return;
    }

    // Redirect-based methods (e.g. iDEAL) navigate away and resume on return.
    if (setupIntent && setupIntent.status === "succeeded") {
      try {
        await apiFetch("/api/payment-methods/confirm-setup", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ setupIntentId: setupIntent.id }),
        });
      } catch {
        // Listing still reflects the attached method even if logging fails.
      }
      await onSaved();
    }
    setSubmitting(false);
  }

  return (
    <form className="profile-pay__setup-form" onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: { type: "tabs", defaultCollapsed: false },
          wallets: { applePay: "auto", googlePay: "auto" },
        }}
      />
      {error ? (
        <p className="profile-form__error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="profile-form__actions">
        <button
          type="button"
          className="profile-btn profile-btn--outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button type="submit" className="profile-btn profile-btn--solid" disabled={submitting || !stripe}>
          <FaLock aria-hidden /> {submitting ? "Saving…" : "Save payment method"}
        </button>
      </div>
      <p className="profile-pay__secure profile-pay__secure--inline">
        <FaLock aria-hidden />
        Securely stored by Stripe. Your full card details never touch our servers.
      </p>
    </form>
  );
}

export default function ProfileAddPaymentMethod({ onCancel, onSaved }) {
  const { isDark } = useTheme();
  const appearance = useMemo(() => getStripeElementsAppearance(isDark), [isDark]);
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch("/api/payment-methods/setup-intent", {
          method: "POST",
          headers: authHeaders(),
        });
        if (!cancelled) setClientSecret(data.clientSecret);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not start adding a payment method.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="profile-pay__setup">
        <p className="profile-form__error" role="alert">
          Stripe is not configured. Add VITE_STRIPE_PUBLISHABLE_KEY to client/.env and restart.
        </p>
        <div className="profile-form__actions">
          <button type="button" className="profile-btn profile-btn--outline" onClick={onCancel}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-pay__setup">
      {loading ? <p className="profile-pay__hint">Preparing secure form…</p> : null}

      {!loading && error ? (
        <>
          <p className="profile-form__error" role="alert">
            {error}
          </p>
          <div className="profile-form__actions">
            <button type="button" className="profile-btn profile-btn--outline" onClick={onCancel}>
              Close
            </button>
          </div>
        </>
      ) : null}

      {!loading && !error && clientSecret ? (
        <Elements
          key={isDark ? "pm-dark" : "pm-light"}
          stripe={getStripePromise()}
          options={{ clientSecret, appearance, locale: "auto" }}
        >
          <SetupForm onCancel={onCancel} onSaved={onSaved} />
        </Elements>
      ) : null}
    </div>
  );
}
