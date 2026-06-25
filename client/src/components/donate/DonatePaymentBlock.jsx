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

export const DONATE_CHECKOUT_SESSION_KEY = "voice_nl_donate_checkout";
const DONATE_RETURN_PATH = "/donate";
const PUBLISHABLE_KEY = STRIPE_PUBLISHABLE_KEY;

const DonatePaymentBlock = forwardRef(function DonatePaymentBlock({ tier, onClose }, ref) {
  const { t } = useTranslation(["checkout"]);
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

  useApiWarmup();

  const amountLabel = useMemo(
    () => formatStripeAmountLabel(intentMeta, activeTier?.amountLabel || ""),
    [intentMeta, activeTier]
  );

  function updateField(name, value) {
    setDonor((prev) => ({ ...prev, [name]: value }));
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

    const wakingTimer = setTimeout(() => setWakingUp(true), WAKING_HINT_DELAY_MS);

    if (!activeTier?.id) {
      clearTimeout(wakingTimer);
      setLoading(false);
      setSubmitError(t("checkout:paymentBlock.donation.tierMissing"));
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
            throw new Error(t("checkout:paymentBlock.donation.amountInvalid"));
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
      persistCheckoutSession(DONATE_CHECKOUT_SESSION_KEY, {
        tier: activeTier,
        donor,
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
            <p className="sponsorship-payment__eyebrow">{t("checkout:paymentBlock.secureCheckout")}</p>
            <h3 id="donate-payment-title" className="sponsorship-payment__title">
              {step === "done"
                ? t("checkout:paymentBlock.donation.thankYouTitle")
                : activeTier?.name
                  ? t("checkout:paymentBlock.donation.titleWithTier", { tier: activeTier.name })
                  : t("checkout:paymentBlock.donation.title")}
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
                  value={donor.name}
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
                  value={donor.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder={t("checkout:paymentBlock.emailPlaceholder")}
                />
              </label>
              <label className="sponsorship-payment__field">
                <span>{t("checkout:paymentBlock.phone")}</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={donor.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder={t("checkout:paymentBlock.phonePlaceholder")}
                />
              </label>
              <label className="sponsorship-payment__field">
                <span>{t("checkout:paymentBlock.organization")}</span>
                <input
                  type="text"
                  autoComplete="organization"
                  value={donor.organization}
                  onChange={(event) => updateField("organization", event.target.value)}
                  placeholder={t("checkout:paymentBlock.organizationPlaceholder")}
                />
              </label>
              <label className="sponsorship-payment__field">
                <span>{t("checkout:paymentBlock.country")}</span>
                <input
                  type="text"
                  autoComplete="country-name"
                  value={donor.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder={t("checkout:paymentBlock.countryPlaceholder")}
                />
              </label>
              {activeTier.allowCustom ? (
                <label className="sponsorship-payment__field sponsorship-payment__field--full">
                  <span>
                    {activeTier.customOnly
                      ? t("checkout:paymentBlock.donation.amountLabel")
                      : t("checkout:paymentBlock.donation.customAmountLabel")}
                  </span>
                  <input
                    type="number"
                    min="0.5"
                    step="0.01"
                    required={Boolean(activeTier.customOnly)}
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                    placeholder={t("checkout:paymentBlock.donation.amountPlaceholder")}
                  />
                </label>
              ) : null}
              <label className="sponsorship-payment__field sponsorship-payment__field--full">
                <span>{t("checkout:paymentBlock.message")}</span>
                <textarea
                  rows={3}
                  value={donor.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  placeholder={t("checkout:paymentBlock.donation.messagePlaceholder")}
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
            <h4>{t("checkout:paymentBlock.donation.receivedTitle")}</h4>
            <p>
              {t("checkout:paymentBlock.donation.receivedBody", { email: donor.email || t("checkout:paymentBlock.emailPlaceholder") })}
              {success.tierName || activeTier?.name
                ? t("checkout:paymentBlock.donation.gratefulWithTier", { tier: success.tierName || activeTier.name })
                : t("checkout:paymentBlock.donation.gratefulGeneric")}
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
                {t("checkout:paymentBlock.donation.backButton")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
});

export default DonatePaymentBlock;
