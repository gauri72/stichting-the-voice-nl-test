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

export const MEMBERSHIP_CHECKOUT_SESSION_KEY = "voice_nl_membership_checkout";
const MEMBERSHIP_RETURN_PATH = "/membership";
const PUBLISHABLE_KEY = STRIPE_PUBLISHABLE_KEY;

const MembershipPaymentBlock = forwardRef(function MembershipPaymentBlock(
  { tier, onClose },
  ref
) {
  const { t } = useTranslation(["checkout"]);
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

  useApiWarmup();

  const amountLabel = useMemo(
    () => formatStripeAmountLabel(intentMeta, activeTier?.amountLabel || ""),
    [intentMeta, activeTier]
  );

  function updateField(name, value) {
    setMember((prev) => ({ ...prev, [name]: value }));
  }

  async function handleDetailsSubmit(event) {
    event.preventDefault();
    if (!PUBLISHABLE_KEY) {
      setSubmitError(t("checkout:paymentBlock.errors.stripeKeyMissing"));
      return;
    }
    if (!activeTier?.id) {
      setSubmitError(t("checkout:paymentBlock.membership.tierMissing"));
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
        throw new Error(data?.error || t("checkout:paymentBlock.errors.couldNotStart"));
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
            <p className="sponsorship-payment__eyebrow">{t("checkout:paymentBlock.secureCheckout")}</p>
            <h3 id="membership-payment-title" className="sponsorship-payment__title">
              {step === "done"
                ? t("checkout:paymentBlock.membership.thankYouTitle")
                : activeTier?.name
                  ? t("checkout:paymentBlock.membership.titleWithTier", { tier: activeTier.name })
                  : t("checkout:paymentBlock.membership.titleBase")}
            </h3>
            {step !== "done" && activeTier ? (
              <p className="sponsorship-payment__subtitle">
                {activeTier.amountLabel}
                <span>{t("checkout:paymentBlock.membership.perYear")}</span>
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
                  value={member.name}
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
                  value={member.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder={t("checkout:paymentBlock.emailPlaceholder")}
                />
              </label>
              <label className="sponsorship-payment__field">
                <span>{t("checkout:paymentBlock.phone")}</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={member.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder={t("checkout:paymentBlock.phonePlaceholder")}
                />
              </label>
              <label className="sponsorship-payment__field sponsorship-payment__field--full">
                <span>{t("checkout:paymentBlock.country")}</span>
                <input
                  type="text"
                  autoComplete="country-name"
                  value={member.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder={t("checkout:paymentBlock.countryPlaceholder")}
                />
              </label>
              <label className="sponsorship-payment__field sponsorship-payment__field--full">
                <span>{t("checkout:paymentBlock.discountCode")}</span>
                <input
                  type="text"
                  value={discountCode}
                  onChange={(event) => setDiscountCode(event.target.value)}
                  placeholder={t("checkout:paymentBlock.discountCodePlaceholder")}
                />
                <span className="sponsorship-payment__field-hint">
                  {t("checkout:paymentBlock.discountCaseSensitive")}
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
          <>
            {discountInfo ? (
              <div className="sponsorship-payment__discount-applied">
                <FaCheckCircle aria-hidden />
                <span>
                  {t("checkout:paymentBlock.discountApplied", { code: discountInfo.code, value: discountInfo.discountValue })}
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
            <h4>{t("checkout:paymentBlock.membership.receivedTitle")}</h4>
            <p>
              {t("checkout:paymentBlock.membership.receivedBody", { email: member.email || t("checkout:paymentBlock.emailPlaceholder") })}
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
                {t("checkout:paymentBlock.membership.backButton")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
});

export default MembershipPaymentBlock;
