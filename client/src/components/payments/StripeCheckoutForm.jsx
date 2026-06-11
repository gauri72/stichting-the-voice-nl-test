import { Component, useMemo, useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { FaLock } from "react-icons/fa";
import {
  buildPaymentElementOptions,
  buildPaymentReturnUrl,
  confirmCheckoutPayment,
  persistCheckoutPayer
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
  const paymentElementOptions = useMemo(
    () => buildPaymentElementOptions(payer),
    [payer?.name, payer?.email, payer?.phone, payer?.firstName, payer?.lastName]
  );

  if (!stripe || !elements) {
    return (
      <p className="stripe-checkout__loading" role="status" aria-live="polite">
        Loading secure checkout…
      </p>
    );
  }

  async function finalizePayment(paymentIntent) {
    try {
      if (!paymentIntent) {
        const msg = "Payment could not be completed. Please try again.";
        setErrorMessage(msg);
        onError?.(msg);
        return;
      }

      if (paymentIntent.status === "succeeded" || paymentIntent.status === "processing") {
        await onSuccess?.(paymentIntent);
        return;
      }

      const msg = "Payment could not be completed. Please try again.";
      setErrorMessage(msg);
      onError?.(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function runConfirmation(event) {
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        const msg = submitError.message || "Please check your payment details.";
        setErrorMessage(msg);
        setSubmitting(false);
        onError?.(msg);
        event?.paymentFailed?.({ reason: "fail", message: msg });
        return;
      }

      persistCheckoutPayer(sessionKey, { tier, payer });

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
    } catch (err) {
      const msg = err?.message || "Payment could not be completed. Please try again.";
      setErrorMessage(msg);
      setSubmitting(false);
      onError?.(msg);
      event?.paymentFailed?.({ reason: "fail", message: msg });
    }
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
        <PaymentElement
          key={`${payer?.name || ""}-${payer?.email || ""}`}
          options={paymentElementOptions}
        />
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
