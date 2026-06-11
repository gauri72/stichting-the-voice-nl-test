import { forwardRef, useEffect, useMemo, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import StripeCheckoutForm from "../payments/StripeCheckoutForm";
import { loadStripe } from "@stripe/stripe-js";
import { FaCheckCircle, FaTimes } from "react-icons/fa";
import {
  getStripeElementsAppearance,
  clearCheckoutSession,
  completePaymentReturn,
  isPaymentReturnUrl,
  persistCheckoutSession,
  readCheckoutPayer,
  readCheckoutSession
} from "../../utils/stripePayment";
import { useResolvedCheckoutTier } from "../../hooks/useResolvedCheckoutTier.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { authHeaders } from "../../utils/api.js";
import "../../styles/sponsorship-payment-block.css";

export const DONATE_CHECKOUT_SESSION_KEY = "voice_nl_donate_checkout";
const DONATE_RETURN_PATH = "/donate";

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const apiUrl = (path) => `${API_BASE}${path}`;

const REQUEST_TIMEOUT_MS = 75000;
const WAKING_HINT_DELAY_MS = 4000;

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

let stripePromise = null;
function getStripePromise() {
  if (stripePromise) return stripePromise;
  if (!PUBLISHABLE_KEY) return null;
  stripePromise = loadStripe(PUBLISHABLE_KEY);
  return stripePromise;
}

const DonatePaymentBlock = forwardRef(function DonatePaymentBlock({ tier, onClose }, ref) {
  const { isDark } = useTheme();
  const activeTier = useResolvedCheckoutTier(DONATE_CHECKOUT_SESSION_KEY, tier);
  const stripeAppearance = useMemo(() => getStripeElementsAppearance(isDark), [isDark]);
  const [step, setStep] = useState("details");
  const [donor, setDonor] = useState(() => readCheckoutPayer(readCheckoutSession(DONATE_CHECKOUT_SESSION_KEY)) || {
    name: "",
    email: "",
    phone: "",
    organization: "",
    country: "",
    message: ""
  });
  const [customAmount, setCustomAmount] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [intentMeta, setIntentMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(null);
  const [handlingReturn, setHandlingReturn] = useState(() => isPaymentReturnUrl());

  useEffect(() => {
    if (isPaymentReturnUrl()) return;
    setStep("details");
    setClientSecret("");
    setIntentMeta(null);
    setSubmitError("");
    setSuccess(null);
    setCustomAmount("");
  }, [activeTier?.id]);

  const stripeMissingKey = !PUBLISHABLE_KEY;

  useEffect(() => {
    if (!PUBLISHABLE_KEY) return;
    const stripePromise = getStripePromise();
    if (!stripePromise) return;

    stripePromise.then(async (stripe) => {
      if (!stripe) return;
      if (!isPaymentReturnUrl()) return;
      setHandlingReturn(true);
      await completePaymentReturn(stripe, {
        onSuccess: async (paymentIntent) => {
          const saved = readCheckoutSession(DONATE_CHECKOUT_SESSION_KEY);
          const payer = readCheckoutPayer(saved);
          if (payer) setDonor((prev) => ({ ...prev, ...payer }));
          if (saved?.intentMeta) setIntentMeta(saved.intentMeta);
          setSubmitError("");
          setSuccess({
            id: paymentIntent.id,
            tierName: saved?.tier?.name || activeTier?.name || ""
          });
          setStep("done");
          clearCheckoutSession(DONATE_CHECKOUT_SESSION_KEY);
          try {
            await fetchWithTimeout(apiUrl("/api/payments/confirm"), {
              method: "POST",
              headers: { "Content-Type": "application/json", ...authHeaders() },
              body: JSON.stringify({ paymentIntentId: paymentIntent.id })
            });
          } catch (_err) {
            // Webhook may still deliver.
          }
        },
        onError: (msg) => {
          setSubmitError(msg);
          setStep("payment");
        }
      });
      setHandlingReturn(false);
    });
  }, []);

  useEffect(() => {
    if (!API_BASE) return;
    const controller = new AbortController();
    (async () => {
      const url = apiUrl("/api/health");
      const attempts = [0, 3000, 8000, 15000];
      for (const delay of attempts) {
        if (controller.signal.aborted) return;
        if (delay > 0) {
          await new Promise((r) => setTimeout(r, delay));
          if (controller.signal.aborted) return;
        }
        try {
          const res = await fetch(url, {
            method: "GET",
            signal: controller.signal,
            cache: "no-store"
          });
          if (res.ok) return;
        } catch (_err) {
          // retry
        }
      }
    })();
    return () => controller.abort();
  }, []);

  const amountLabel = useMemo(() => {
    if (intentMeta?.amount) {
      try {
        return new Intl.NumberFormat("en-IE", {
          style: "currency",
          currency: (intentMeta.currency || "eur").toUpperCase()
        }).format(intentMeta.amount / 100);
      } catch (_err) {
        return `${(intentMeta.currency || "EUR").toUpperCase()} ${(intentMeta.amount / 100).toFixed(2)}`;
      }
    }
    return activeTier?.amountLabel || "";
  }, [intentMeta, activeTier]);

  function updateField(name, value) {
    setDonor((prev) => ({ ...prev, [name]: value }));
  }

  async function handleDetailsSubmit(event) {
    event.preventDefault();
    if (!PUBLISHABLE_KEY) {
      setSubmitError(
        "Stripe publishable key is missing. Add VITE_STRIPE_PUBLISHABLE_KEY to client/.env and restart the dev server."
      );
      return;
    }
    setLoading(true);
    setWakingUp(false);
    setSubmitError("");

    const wakingTimer = setTimeout(() => setWakingUp(true), WAKING_HINT_DELAY_MS);

    if (!activeTier?.id) {
      clearTimeout(wakingTimer);
      setLoading(false);
      setSubmitError("Donation tier is missing. Please refresh and select a plan.");
      return;
    }

    try {
      const body = {
        kind: "donation",
        tierId: activeTier.id,
        sponsor: {
          name: donor.name.trim(),
          firstName: donor.name.trim().split(" ")[0] || "",
          lastName: donor.name.trim().split(" ").slice(1).join(" "),
          email: donor.email.trim(),
          phone: donor.phone.trim(),
          organization: donor.organization.trim(),
          country: donor.country.trim(),
          message: donor.message.trim()
        }
      };

      if (activeTier.allowCustom) {
        const cents = Math.round(Number(customAmount) * 100);
        if (activeTier.customOnly) {
          if (!Number.isFinite(cents) || cents < 50) {
            throw new Error("Enter a valid donation amount in EUR.");
          }
          body.amount = cents;
        } else if (Number.isFinite(cents) && cents > 0) {
          body.amount = cents;
        }
      }

      const response = await fetchWithTimeout(
        apiUrl("/api/payments/create-payment-intent"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders()
          },
          body: JSON.stringify(body)
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Could not start the payment. Please try again.");
      }

      const meta = {
        paymentIntentId: data.paymentIntentId,
        amount: data.amount,
        currency: data.currency
      };
      setClientSecret(data.clientSecret);
      setIntentMeta(meta);
      persistCheckoutSession(DONATE_CHECKOUT_SESSION_KEY, {
        tier: activeTier,
        donor,
        intentMeta: meta
      });
      setStep("payment");
    } catch (error) {
      if (error?.name === "AbortError") {
        setSubmitError(
          "The payment server took too long to respond. It may be waking up from sleep. Please wait a moment and try again."
        );
      } else if (error instanceof TypeError) {
        setSubmitError(
          "Could not reach the payment server. Please check your connection and try again."
        );
      } else {
        setSubmitError(error.message || "Could not start the payment.");
      }
    } finally {
      clearTimeout(wakingTimer);
      setLoading(false);
      setWakingUp(false);
    }
  }

  async function handleSuccess(paymentIntent) {
    setSubmitError("");
    setSuccess({
      id: paymentIntent.id,
      tierName: activeTier?.name || ""
    });
    setStep("done");
    clearCheckoutSession(DONATE_CHECKOUT_SESSION_KEY);

    try {
      await fetchWithTimeout(apiUrl("/api/payments/confirm"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id })
      });
    } catch (_err) {
      // Webhook may still deliver; thank-you screen is already shown.
    }
  }

  return (
    <section
      ref={ref}
      className="sponsorship-payment"
      id="donate-payment"
      aria-labelledby="donate-payment-title"
    >
      <div className="sponsorship-payment__container">
        <div className="sponsorship-payment__header">
          <div>
            <p className="sponsorship-payment__eyebrow">Secure Checkout</p>
            <h3 id="donate-payment-title" className="sponsorship-payment__title">
              {step === "done"
                ? "Thank you for your donation!"
                : activeTier?.name
                  ? `Donate — ${activeTier.name}`
                  : "Donate"}
            </h3>
            {step !== "done" && activeTier ? (
              <p className="sponsorship-payment__subtitle">
                {activeTier.amountLabel}
                {activeTier.note ? ` — ${activeTier.note}` : ""}
              </p>
            ) : null}
          </div>
          {onClose ? (
            <button
              type="button"
              className="sponsorship-payment__close"
              onClick={onClose}
              aria-label="Close payment block"
            >
              <FaTimes aria-hidden />
            </button>
          ) : null}
        </div>

        {stripeMissingKey ? (
          <div className="sponsorship-payment__notice">
            <strong>Stripe is not configured yet.</strong> Add{" "}
            <code>VITE_STRIPE_PUBLISHABLE_KEY</code> to <code>client/.env</code> and{" "}
            <code>STRIPE_SECRET_KEY</code> to <code>server/.env</code>, then restart the dev server.
          </div>
        ) : null}

        {handlingReturn && step !== "done" ? (
          <p className="sponsorship-payment__waking-hint" role="status" aria-live="polite">
            Confirming your payment…
          </p>
        ) : null}

        {step === "details" && activeTier && !handlingReturn ? (
          <form className="sponsorship-payment__details" onSubmit={handleDetailsSubmit}>
            <div className="sponsorship-payment__grid">
              <label className="sponsorship-payment__field sponsorship-payment__field--full">
                <span>Full name *</span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={donor.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Jane Doe"
                />
              </label>
              <label className="sponsorship-payment__field">
                <span>Email *</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={donor.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label className="sponsorship-payment__field">
                <span>Phone</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={donor.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+31 6 1234 5678"
                />
              </label>
              <label className="sponsorship-payment__field">
                <span>Organization</span>
                <input
                  type="text"
                  autoComplete="organization"
                  value={donor.organization}
                  onChange={(event) => updateField("organization", event.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label className="sponsorship-payment__field">
                <span>Country</span>
                <input
                  type="text"
                  autoComplete="country-name"
                  value={donor.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder="The Netherlands"
                />
              </label>
              {activeTier.allowCustom ? (
                <label className="sponsorship-payment__field sponsorship-payment__field--full">
                  <span>{activeTier.customOnly ? "Donation amount (EUR) *" : `Custom amount (EUR)`}</span>
                  <input
                    type="number"
                    min="0.5"
                    step="0.01"
                    required={Boolean(activeTier.customOnly)}
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                    placeholder="e.g. 25"
                  />
                </label>
              ) : null}
              <label className="sponsorship-payment__field sponsorship-payment__field--full">
                <span>Message (optional)</span>
                <textarea
                  rows={3}
                  value={donor.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  placeholder="Anything you would like us to know?"
                />
              </label>
            </div>

            {submitError ? (
              <p className="sponsorship-payment__error" role="alert">
                {submitError}
              </p>
            ) : null}

            <button
              type="submit"
              className="sponsorship-payment__continue-btn"
              disabled={loading}
            >
              {loading
                ? wakingUp
                  ? "Waking up secure checkout, please wait..."
                  : "Preparing secure checkout..."
                : "Continue to payment"}
            </button>
            {loading && wakingUp ? (
              <p className="sponsorship-payment__waking-hint" aria-live="polite">
                Our payment service is starting up. The first request can take up
                to a minute. Subsequent requests will be instant.
              </p>
            ) : null}
          </form>
        ) : null}

        {step === "payment" && clientSecret && PUBLISHABLE_KEY ? (
          <Elements
            key={isDark ? "stripe-dark" : "stripe-light"}
            stripe={getStripePromise()}
            options={{
              clientSecret,
              appearance: stripeAppearance,
              locale: "auto"
            }}
          >
            <StripeCheckoutForm
              amountLabel={amountLabel}
              payer={donor}
              tier={activeTier}
              sessionKey={DONATE_CHECKOUT_SESSION_KEY}
              returnPath={DONATE_RETURN_PATH}
              onSuccess={handleSuccess}
              onError={(msg) => setSubmitError(msg)}
            />
          </Elements>
        ) : null}

        {step === "done" && success ? (
          <div className="sponsorship-payment__success" role="status" aria-live="polite">
            <span className="sponsorship-payment__success-icon" aria-hidden>
              <FaCheckCircle />
            </span>
            <h4>Your donation has been received.</h4>
            <p>
              A confirmation email is on its way to{" "}
              <strong>{donor.email || "your email address"}</strong>.
              {success.tierName || activeTier?.name
                ? ` We are grateful for your support as a ${success.tierName || activeTier.name}!`
                : " We are grateful for your support!"}
            </p>
            <p className="sponsorship-payment__success-ref">
              Payment reference: <code>{success.id}</code>
            </p>
            {onClose ? (
              <button
                type="button"
                className="sponsorship-payment__continue-btn"
                onClick={onClose}
              >
                Back to donation options
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
});

export default DonatePaymentBlock;
