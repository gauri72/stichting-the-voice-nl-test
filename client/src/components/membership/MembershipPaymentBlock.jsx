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

export const MEMBERSHIP_CHECKOUT_SESSION_KEY = "voice_nl_membership_checkout";
const MEMBERSHIP_RETURN_PATH = "/membership";

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

const MembershipPaymentBlock = forwardRef(function MembershipPaymentBlock(
  { tier, onClose },
  ref
) {
  const { isDark } = useTheme();
  const activeTier = useResolvedCheckoutTier(MEMBERSHIP_CHECKOUT_SESSION_KEY, tier);
  const stripeAppearance = useMemo(() => getStripeElementsAppearance(isDark), [isDark]);
  const [step, setStep] = useState("details");
  const [member, setMember] = useState(() => readCheckoutPayer(readCheckoutSession(MEMBERSHIP_CHECKOUT_SESSION_KEY)) || {
    name: "",
    email: "",
    phone: "",
    country: ""
  });
  const [discountCode, setDiscountCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState(null);
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
    setDiscountCode("");
    setDiscountInfo(null);
  }, [activeTier?.id]);

  const stripeMissingKey = !PUBLISHABLE_KEY;

  useEffect(() => {
    if (!PUBLISHABLE_KEY) return;
    const promise = getStripePromise();
    if (!promise) return;

    promise.then(async (stripe) => {
      if (!stripe) return;
      if (!isPaymentReturnUrl()) return;
      setHandlingReturn(true);
      await completePaymentReturn(stripe, {
        onSuccess: async (paymentIntent) => {
          const saved = readCheckoutSession(MEMBERSHIP_CHECKOUT_SESSION_KEY);
          const payer = readCheckoutPayer(saved);
          if (payer) setMember((prev) => ({ ...prev, ...payer }));
          if (saved?.intentMeta) setIntentMeta(saved.intentMeta);
          if (saved?.discountInfo) setDiscountInfo(saved.discountInfo);
          setSubmitError("");
          setSuccess({ id: paymentIntent.id });
          setStep("done");
          clearCheckoutSession(MEMBERSHIP_CHECKOUT_SESSION_KEY);
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
    setMember((prev) => ({ ...prev, [name]: value }));
  }

  async function handleDetailsSubmit(event) {
    event.preventDefault();
    if (!PUBLISHABLE_KEY) {
      setSubmitError(
        "Stripe publishable key is missing. Add VITE_STRIPE_PUBLISHABLE_KEY to client/.env and restart the dev server."
      );
      return;
    }
    if (!activeTier?.id) {
      setSubmitError("Membership tier is missing. Please refresh and select a plan.");
      return;
    }
    setLoading(true);
    setWakingUp(false);
    setSubmitError("");

    const wakingTimer = setTimeout(() => setWakingUp(true), WAKING_HINT_DELAY_MS);

    try {
      const name = member.name.trim();
      const response = await fetchWithTimeout(
        apiUrl("/api/payments/create-payment-intent"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders()
          },
          body: JSON.stringify({
            kind: "membership",
            tierId: activeTier.id,
            discountCode: discountCode.trim(),
            sponsor: {
              name,
              firstName: name.split(" ")[0] || "",
              lastName: name.split(" ").slice(1).join(" "),
              email: member.email.trim(),
              phone: member.phone.trim(),
              country: member.country.trim()
            }
          })
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
      setDiscountInfo(data.discountApplied ? data.discountInfo : null);
      persistCheckoutSession(MEMBERSHIP_CHECKOUT_SESSION_KEY, {
        tier: activeTier,
        member,
        intentMeta: meta,
        discountInfo: data.discountApplied ? data.discountInfo : null
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
    setSuccess({ id: paymentIntent.id });
    setStep("done");
    clearCheckoutSession(MEMBERSHIP_CHECKOUT_SESSION_KEY);

    try {
      await fetchWithTimeout(apiUrl("/api/payments/confirm"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id })
      });
    } catch (_err) {
      // Webhook may still deliver.
    }
  }

  return (
    <section
      ref={ref}
      className="sponsorship-payment"
      id="membership-payment"
      aria-labelledby="membership-payment-title"
    >
      <div className="sponsorship-payment__container">
        <div className="sponsorship-payment__header">
          <div>
            <p className="sponsorship-payment__eyebrow">Secure Checkout</p>
            <h3 id="membership-payment-title" className="sponsorship-payment__title">
              {step === "done"
                ? "Welcome to the V.O.I.C.E. NL family!"
                : `Become a Member${activeTier?.name ? ` — ${activeTier.name}` : ""}`}
            </h3>
            {step !== "done" && activeTier ? (
              <p className="sponsorship-payment__subtitle">
                {activeTier.amountLabel}
                <span> / year</span>
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
                  value={member.name}
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
                  value={member.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label className="sponsorship-payment__field">
                <span>Phone</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={member.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+31 6 1234 5678"
                />
              </label>
              <label className="sponsorship-payment__field sponsorship-payment__field--full">
                <span>Country</span>
                <input
                  type="text"
                  autoComplete="country-name"
                  value={member.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder="The Netherlands"
                />
              </label>
              <label className="sponsorship-payment__field sponsorship-payment__field--full">
                <span>Discount code</span>
                <input
                  type="text"
                  value={discountCode}
                  onChange={(event) => setDiscountCode(event.target.value)}
                  placeholder="e.g. SAVE20"
                />
                <span className="sponsorship-payment__field-hint">
                  Please note: discount codes are case-sensitive.
                </span>
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
          <>
            {discountInfo ? (
              <div className="sponsorship-payment__discount-applied">
                <FaCheckCircle aria-hidden />
                <span>
                  Discount code <strong>{discountInfo.code}</strong> applied! ({discountInfo.discountValue}% discount)
                </span>
              </div>
            ) : null}
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
                payer={member}
                tier={activeTier}
                sessionKey={MEMBERSHIP_CHECKOUT_SESSION_KEY}
                returnPath={MEMBERSHIP_RETURN_PATH}
                onSuccess={handleSuccess}
                onError={(msg) => setSubmitError(msg)}
              />
            </Elements>
          </>
        ) : null}

        {step === "done" && success ? (
          <div className="sponsorship-payment__success" role="status" aria-live="polite">
            <span className="sponsorship-payment__success-icon" aria-hidden>
              <FaCheckCircle />
            </span>
            <h4>Your membership is confirmed.</h4>
            <p>
              A confirmation email with your membership ID, QR code, and receipt is on its way to{" "}
              <strong>{member.email || "your email address"}</strong>.
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
                Back to membership plans
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
});

export default MembershipPaymentBlock;
