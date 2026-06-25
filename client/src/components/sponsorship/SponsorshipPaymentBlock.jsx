import { forwardRef, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Elements } from "@stripe/react-stripe-js";
import StripeCheckoutForm from "../payments/StripeCheckoutForm";
import { FaCheckCircle, FaTimes } from "react-icons/fa";
import {
  getStripeElementsAppearance,
  clearCheckoutSession,
  completePaymentReturn,
  isPaymentReturnUrl,
  persistCheckoutSession,
  readCheckoutPayer,
  readCheckoutSession,
  fetchWithTimeout,
  formatStripeAmountLabel,
  WAKING_HINT_DELAY_MS
} from "../../utils/stripePayment";
import { useResolvedCheckoutTier } from "../../hooks/useResolvedCheckoutTier.js";
import { useApiWarmup } from "../../hooks/useApiWarmup.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { authHeaders, apiUrl } from "../../utils/api.js";
import { getStripePromise, STRIPE_PUBLISHABLE_KEY } from "../../utils/stripeClient.js";
import "../../styles/sponsorship-payment-block.css";

export const SPONSOR_CHECKOUT_SESSION_KEY = "voice_nl_sponsor_checkout";
const SPONSOR_RETURN_PATH = "/sponsorship";
const PUBLISHABLE_KEY = STRIPE_PUBLISHABLE_KEY;

const SponsorshipPaymentBlock = forwardRef(function SponsorshipPaymentBlock(
  { tier, onClose },
  ref
) {
  const { t } = useTranslation(["checkout"]);
  const { isDark } = useTheme();
  const activeTier = useResolvedCheckoutTier(SPONSOR_CHECKOUT_SESSION_KEY, tier);
  const stripeAppearance = useMemo(() => getStripeElementsAppearance(isDark), [isDark]);
  const [step, setStep] = useState("details");
  const [sponsor, setSponsor] = useState(() => readCheckoutPayer(readCheckoutSession(SPONSOR_CHECKOUT_SESSION_KEY)) || {
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
          const saved = readCheckoutSession(SPONSOR_CHECKOUT_SESSION_KEY);
          const payer = readCheckoutPayer(saved);
          if (payer) setSponsor((prev) => ({ ...prev, ...payer }));
          if (saved?.intentMeta) setIntentMeta(saved.intentMeta);
          try {
            await fetch(apiUrl("/api/payments/confirm"), {
              method: "POST",
              headers: { "Content-Type": "application/json", ...authHeaders() },
              body: JSON.stringify({ paymentIntentId: paymentIntent.id })
            });
          } catch (_err) {
            // Webhook may still deliver.
          }
          clearCheckoutSession(SPONSOR_CHECKOUT_SESSION_KEY);
          setSuccess({
            id: paymentIntent.id,
            tierName: saved?.tier?.name || activeTier?.name || ""
          });
          setStep("done");
        },
        onError: (msg) => {
          setSubmitError(msg);
          setStep("payment");
        }
      });
      setHandlingReturn(false);
    });
  }, []);

  useApiWarmup();

  const amountLabel = useMemo(
    () => formatStripeAmountLabel(intentMeta, activeTier?.amountLabel || ""),
    [intentMeta, activeTier]
  );

  function updateField(name, value) {
    setSponsor((prev) => ({ ...prev, [name]: value }));
  }

  async function handleDetailsSubmit(event) {
    event.preventDefault();
    if (!PUBLISHABLE_KEY) {
      setSubmitError(t("checkout:paymentBlock.errors.stripeKeyMissing"));
      return;
    }
    setLoading(true);
    setWakingUp(false);
    setSubmitError("");

    // If the request is still in flight after a few seconds, surface a hint
    // explaining the delay (most likely a free-tier server cold start).
    const wakingTimer = setTimeout(() => setWakingUp(true), WAKING_HINT_DELAY_MS);

    if (!activeTier?.id) {
      clearTimeout(wakingTimer);
      setLoading(false);
      setSubmitError(t("checkout:paymentBlock.sponsorship.tierMissing"));
      return;
    }

    try {
      const body = {
        tierId: activeTier.id,
        sponsor: {
          name: sponsor.name.trim(),
          firstName: sponsor.name.trim().split(" ")[0] || "",
          lastName: sponsor.name.trim().split(" ").slice(1).join(" "),
          email: sponsor.email.trim(),
          phone: sponsor.phone.trim(),
          organization: sponsor.organization.trim(),
          country: sponsor.country.trim(),
          message: sponsor.message.trim()
        }
      };

      if (activeTier.allowCustom) {
        const cents = Math.round(Number(customAmount) * 100);
        if (activeTier.customOnly) {
          if (!Number.isFinite(cents) || cents < 50) {
            throw new Error(t("checkout:paymentBlock.sponsorship.amountInvalid"));
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
        throw new Error(data?.error || t("checkout:paymentBlock.errors.couldNotStart"));
      }

      const meta = {
        paymentIntentId: data.paymentIntentId,
        amount: data.amount,
        currency: data.currency
      };
      setClientSecret(data.clientSecret);
      setIntentMeta(meta);
      persistCheckoutSession(SPONSOR_CHECKOUT_SESSION_KEY, {
        tier: activeTier,
        sponsor,
        intentMeta: meta
      });
      setStep("payment");
    } catch (error) {
      if (error?.name === "AbortError") {
        setSubmitError(t("checkout:paymentBlock.errors.tooLong"));
      } else if (error instanceof TypeError) {
        setSubmitError(t("checkout:paymentBlock.errors.couldNotReach"));
      } else {
        setSubmitError(error.message || t("checkout:paymentBlock.errors.couldNotStartGeneric"));
      }
    } finally {
      clearTimeout(wakingTimer);
      setLoading(false);
      setWakingUp(false);
    }
  }

  async function handleSuccess(paymentIntent) {
    try {
      await fetch(apiUrl("/api/payments/confirm"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id })
      });
    } catch (_err) {
      // Webhook may still deliver.
    }
    setSuccess({
      id: paymentIntent.id,
      tierName: activeTier?.name || ""
    });
    setStep("done");
  }

  return (
    <section
      ref={ref}
      className="sponsorship-payment"
      id="sponsorship-payment"
      aria-labelledby="sponsorship-payment-title"
    >
      <div className="sponsorship-payment__container">
        <div className="sponsorship-payment__header">
          <div>
            <p className="sponsorship-payment__eyebrow">{t("checkout:paymentBlock.secureCheckout")}</p>
            <h3 id="sponsorship-payment-title" className="sponsorship-payment__title">
              {step === "done"
                ? t("checkout:paymentBlock.sponsorship.thankYouTitle")
                : activeTier?.name || t("checkout:paymentBlock.sponsorship.title")}
            </h3>
            {step !== "done" && activeTier ? (
              <p className="sponsorship-payment__subtitle">
                {activeTier.amountLabel}
                {activeTier.note ? ` - ${activeTier.note}` : ""}
              </p>
            ) : null}
          </div>
          {onClose ? (
            <button
              type="button"
              className="sponsorship-payment__close"
              onClick={onClose}
              aria-label={t("checkout:paymentBlock.closeBlock")}
            >
              <FaTimes aria-hidden />
            </button>
          ) : null}
        </div>

        {stripeMissingKey ? (
          <div className="sponsorship-payment__notice">
            <strong>{t("checkout:paymentBlock.stripeNotConfiguredTitle")}</strong>{" "}
            {t("checkout:paymentBlock.stripeNotConfiguredBody")}
          </div>
        ) : null}

        {handlingReturn && step !== "done" ? (
          <p className="sponsorship-payment__waking-hint" role="status" aria-live="polite">
            {t("checkout:paymentBlock.confirmingPayment")}
          </p>
        ) : null}

        {step === "details" && activeTier && !handlingReturn ? (
          <form className="sponsorship-payment__details" onSubmit={handleDetailsSubmit}>
            <div className="sponsorship-payment__grid">
              <label className="sponsorship-payment__field sponsorship-payment__field--full">
                <span>{t("checkout:paymentBlock.fullName")}</span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={sponsor.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder={t("checkout:paymentBlock.namePlaceholder")}
                />
              </label>
              <label className="sponsorship-payment__field">
                <span>{t("checkout:paymentBlock.email")}</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={sponsor.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder={t("checkout:paymentBlock.emailPlaceholder")}
                />
              </label>
              <label className="sponsorship-payment__field">
                <span>{t("checkout:paymentBlock.phone")}</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={sponsor.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder={t("checkout:paymentBlock.phonePlaceholder")}
                />
              </label>
              <label className="sponsorship-payment__field">
                <span>{t("checkout:paymentBlock.organization")}</span>
                <input
                  type="text"
                  autoComplete="organization"
                  value={sponsor.organization}
                  onChange={(event) => updateField("organization", event.target.value)}
                  placeholder={t("checkout:paymentBlock.organizationPlaceholder")}
                />
              </label>
              <label className="sponsorship-payment__field">
                <span>{t("checkout:paymentBlock.country")}</span>
                <input
                  type="text"
                  autoComplete="country-name"
                  value={sponsor.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder={t("checkout:paymentBlock.countryPlaceholder")}
                />
              </label>
              {activeTier.allowCustom ? (
                <label className="sponsorship-payment__field sponsorship-payment__field--full">
                  <span>
                    {activeTier.customOnly
                      ? t("checkout:paymentBlock.sponsorship.amountLabel")
                      : t("checkout:paymentBlock.sponsorship.customAmountLabel")}
                  </span>
                  <input
                    type="number"
                    min="0.5"
                    step="0.01"
                    required={Boolean(activeTier.customOnly)}
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                    placeholder={t("checkout:paymentBlock.sponsorship.amountPlaceholder")}
                  />
                </label>
              ) : null}
              <label className="sponsorship-payment__field sponsorship-payment__field--full">
                <span>{t("checkout:paymentBlock.message")}</span>
                <textarea
                  rows={3}
                  value={sponsor.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  placeholder={t("checkout:paymentBlock.sponsorship.messagePlaceholder")}
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
                  ? t("checkout:paymentBlock.wakingUp")
                  : t("checkout:paymentBlock.preparing")
                : t("checkout:paymentBlock.continueToPayment")}
            </button>
            {loading && wakingUp ? (
              <p className="sponsorship-payment__waking-hint" aria-live="polite">
                {t("checkout:paymentBlock.wakingHint")}
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
              payer={sponsor}
              tier={activeTier}
              sessionKey={SPONSOR_CHECKOUT_SESSION_KEY}
              returnPath={SPONSOR_RETURN_PATH}
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
            <h4>{t("checkout:paymentBlock.sponsorship.receivedTitle")}</h4>
            <p>
              {t("checkout:paymentBlock.sponsorship.receivedBody", { email: sponsor.email || t("checkout:paymentBlock.emailPlaceholder") })}
              {success.tierName || activeTier?.name
                ? t("checkout:paymentBlock.sponsorship.honouredWithTier", { tier: success.tierName || activeTier.name })
                : t("checkout:paymentBlock.sponsorship.honouredGeneric")}
            </p>
            <p className="sponsorship-payment__success-ref">
              {t("checkout:paymentBlock.paymentReference")}: <code>{success.id}</code>
            </p>
            {onClose ? (
              <button
                type="button"
                className="sponsorship-payment__continue-btn"
                onClick={onClose}
              >
                {t("checkout:paymentBlock.sponsorship.backButton")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
});

export default SponsorshipPaymentBlock;
