import { useState } from "react";
import {
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe
} from "@stripe/react-stripe-js";
import { FaLock } from "react-icons/fa";
import {
  EXPRESS_CHECKOUT_OPTIONS,
  PAYMENT_ELEMENT_OPTIONS,
  buildPaymentReturnUrl,
  confirmCheckoutPayment,
  persistCheckoutSession
} from "../../utils/stripePayment";

/**
 * Shared Stripe checkout: Express Checkout (Apple Pay / Google Pay / Link) + Payment Element.
 */
export default function StripeCheckoutForm({
  amountLabel,
  payer,
  tier,
  sessionKey,
  returnPath,
  expressButtonType = "donate",
  onSuccess,
  onError
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [expressAvailable, setExpressAvailable] = useState(false);

  const returnUrl = buildPaymentReturnUrl(returnPath);

  async function finalizePayment(paymentIntent) {
    if (paymentIntent?.status === "succeeded") {
      onSuccess?.(paymentIntent);
      return;
    }
    const msg = "Payment is processing. We will email you once it is confirmed.";
    setErrorMessage(msg);
    setSubmitting(false);
    onError?.(msg);
  }

  async function runConfirmation(event) {
    if (!stripe || !elements) return;

    const { error: submitError } = await elements.submit();
    if (submitError) {
      const msg = submitError.message || "Please check your payment details.";
      setErrorMessage(msg);
      setSubmitting(false);
      onError?.(msg);
      event?.paymentFailed?.({ reason: "fail", message: msg });
      return;
    }

    persistCheckoutSession(sessionKey, { tier, donor: payer, sponsor: payer });

    const { error, paymentIntent } = await confirmCheckoutPayment(stripe, elements, {
      returnUrl,
      payer
    });

    if (error) {
      const msg = error.message || "Payment could not be completed. Please try again.";
      setErrorMessage(msg);
      setSubmitting(false);
      onError?.(msg);
      event?.paymentFailed?.({ reason: "fail", message: msg });
      return;
    }

    await finalizePayment(paymentIntent);
  }

  async function handleExpressConfirm(event) {
    setSubmitting(true);
    setErrorMessage("");
    await runConfirmation(event);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    await runConfirmation();
  }

  return (
    <form className="sponsorship-payment__form" onSubmit={handleSubmit}>
      <div className="stripe-checkout__express">
        <ExpressCheckoutElement
          options={EXPRESS_CHECKOUT_OPTIONS(expressButtonType)}
          onReady={({ availablePaymentMethods }) => {
            const methods = availablePaymentMethods || {};
            setExpressAvailable(
              Boolean(methods.applePay || methods.googlePay || methods.link)
            );
          }}
          onConfirm={handleExpressConfirm}
        />
      </div>
      {expressAvailable ? (
        <p className="stripe-checkout__divider" aria-hidden="true">
          <span>or pay with</span>
        </p>
      ) : null}
      <PaymentElement options={PAYMENT_ELEMENT_OPTIONS} />
      {errorMessage ? (
        <p className="sponsorship-payment__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <button
        type="submit"
        className="sponsorship-payment__pay-btn"
        disabled={!stripe || submitting}
      >
        <FaLock aria-hidden /> {submitting ? "Processing..." : `Pay ${amountLabel} Securely`}
      </button>
      <p className="sponsorship-payment__assurance">
        Payments are processed securely by Stripe. Your card details never touch our servers.
      </p>
    </form>
  );
}
