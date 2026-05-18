/** Shared Stripe Payment Element + redirect return handling (iDEAL, Revolut Pay, etc.). */

export const STRIPE_ELEMENTS_APPEARANCE = {
  theme: "stripe",
  variables: {
    colorPrimary: "#1f9f78",
    colorBackground: "#ffffff",
    colorText: "#17314b",
    colorDanger: "#c83b3b",
    fontFamily:
      '"Inter", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
    spacingUnit: "4px",
    borderRadius: "8px"
  },
  rules: {
    ".Input": {
      border: "1px solid #d9e1e8",
      boxShadow: "none"
    },
    ".Input:focus": {
      borderColor: "#1f9f78",
      boxShadow: "0 0 0 3px rgba(31,159,120,0.18)"
    },
    ".Label": {
      fontWeight: "600",
      color: "#1d3550"
    }
  }
};

/** Express Checkout: Apple Pay, Google Pay, Link buttons (requires domain verification). */
export function EXPRESS_CHECKOUT_OPTIONS(buttonType = "donate") {
  return {
    paymentMethods: {
      applePay: "always",
      googlePay: "always",
      link: "auto",
      paypal: "never",
      amazonPay: "never"
    },
    buttonType: {
      applePay: buttonType,
      googlePay: "plain"
    },
    layout: {
      maxColumns: 3,
      maxRows: 1
    }
  };
}

/** Payment Element: cards, iDEAL, Revolut Pay, and wallet tabs when available. */
export const PAYMENT_ELEMENT_OPTIONS = {
  layout: {
    type: "accordion",
    defaultCollapsed: false,
    radios: true
  },
  wallets: {
    applePay: "always",
    googlePay: "always"
  },
  business: {
    name: "Stichting The V.O.I.C.E. NL"
  }
};

export const PAYMENT_RETURN_PARAM = "payment_return";

export function buildPaymentReturnUrl(checkoutPath) {
  const url = new URL(checkoutPath, window.location.origin);
  url.searchParams.set(PAYMENT_RETURN_PARAM, "1");
  return url.toString();
}

export function persistCheckoutSession(storageKey, payload) {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (_err) {
    // Private browsing / quota — redirect return may lack donor details.
  }
}

export function readCheckoutSession(storageKey) {
  try {
    const raw = sessionStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
}

export function clearCheckoutSession(storageKey) {
  try {
    sessionStorage.removeItem(storageKey);
  } catch (_err) {
    // ignore
  }
}

export function clearPaymentReturnQuery() {
  const url = new URL(window.location.href);
  url.searchParams.delete(PAYMENT_RETURN_PARAM);
  url.searchParams.delete("payment_intent");
  url.searchParams.delete("payment_intent_client_secret");
  url.searchParams.delete("redirect_status");
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", next);
}

export function isPaymentReturnUrl() {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get(PAYMENT_RETURN_PARAM) === "1" &&
    Boolean(params.get("payment_intent_client_secret"))
  );
}

/**
 * After iDEAL / Revolut Pay redirect, finish the flow on the return URL.
 * @returns {Promise<boolean>} true if this was a return URL and was handled
 */
export async function completePaymentReturn(stripe, { onSuccess, onError }) {
  if (!stripe || !isPaymentReturnUrl()) return false;

  const clientSecret = new URLSearchParams(window.location.search).get(
    "payment_intent_client_secret"
  );

  const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret);
  clearPaymentReturnQuery();

  if (error) {
    onError?.(error.message || "Could not verify payment status.");
    return true;
  }

  if (paymentIntent?.status === "succeeded") {
    onSuccess?.(paymentIntent);
    return true;
  }

  if (paymentIntent?.status === "processing") {
    onError?.("Payment is processing. We will email you once it is confirmed.");
    return true;
  }

  onError?.("Payment could not be completed. Please try again.");
  return true;
}

export async function confirmCheckoutPayment(stripe, elements, { returnUrl, payer }) {
  return stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: returnUrl,
      receipt_email: payer.email,
      payment_method_data: {
        billing_details: {
          name: payer.name,
          email: payer.email,
          phone: payer.phone || undefined
        }
      }
    },
    redirect: "if_required"
  });
}
