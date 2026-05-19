import { Component, useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { FaLock } from "react-icons/fa";
import {
  PAYMENT_ELEMENT_OPTIONS,
  buildPaymentReturnUrl,
  confirmCheckoutPayment,
  persistCheckoutSession
} from "../../utils/stripePayment";

class PaymentElementErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/**
 * Stripe Payment Element checkout (cards, iDEAL, Apple Pay, Google Pay when enabled in Stripe).
 */
export default function StripeCheckoutForm({
  amountLabel,
  payer,
  tier,
  sessionKey,
  returnPath,
  onSuccess,
  onError
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const returnUrl = buildPaymentReturnUrl(returnPath);

  if (!stripe || !elements) {
    return (
      <p className="stripe-checkout__loading" role="status" aria-live="polite">
        Loading secure checkout…
      </p>
    );
  }

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

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    await runConfirmation();
  }

  return (
    <form className="sponsorship-payment__form" onSubmit={handleSubmit}>
      <PaymentElementErrorBoundary>
        <PaymentElement options={PAYMENT_ELEMENT_OPTIONS} />
      </PaymentElementErrorBoundary>
      {errorMessage ? (
        <p className="sponsorship-payment__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <button
        type="submit"
        className="sponsorship-payment__pay-btn"
        disabled={submitting}
      >
        <FaLock aria-hidden /> {submitting ? "Processing..." : `Pay ${amountLabel} Securely`}
      </button>
      <p className="sponsorship-payment__assurance">
        Payments are processed securely by Stripe. Your card details never touch our servers.
      </p>
    </form>
  );
}
