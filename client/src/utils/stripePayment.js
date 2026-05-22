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

/**
 * Payment Element: cards, iDEAL, Revolut Pay, Apple Pay, Google Pay (when enabled in Stripe).
 * Billing fields are collected on the donate/sponsor form above — do not ask again in the
 * payment window (iDEAL especially duplicates a full-name field otherwise).
 */
export const PAYMENT_ELEMENT_OPTIONS = {
  layout: {
    type: "tabs",
    defaultCollapsed: false
  },
  wallets: {
    applePay: "auto",
    googlePay: "auto"
  },
  business: {
    name: "Stichting The V.O.I.C.E. NL"
  },
  fields: {
    billingDetails: {
      name: "never",
      email: "never",
      phone: "never",
      address: "never"
    }
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

  const params = new URLSearchParams(window.location.search);
  const clientSecret = params.get("payment_intent_client_secret");
  const redirectStatus = params.get("redirect_status");

  const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret);
  clearPaymentReturnQuery();

  if (error) {
    onError?.(error.message || "Could not verify payment status.");
    return true;
  }

  if (redirectStatus === "failed") {
    onError?.("Payment could not be completed. Please try again.");
    return true;
  }

  if (
    paymentIntent?.status === "succeeded" ||
    paymentIntent?.status === "processing" ||
    redirectStatus === "succeeded" ||
    redirectStatus === "processing"
  ) {
    onSuccess?.(paymentIntent);
    return true;
  }

  onError?.("Payment could not be completed. Please try again.");
  return true;
}

const CONFIRM_TIMEOUT_MS = 12000;

/**
 * confirmPayment can hang when Stripe is about to redirect (iDEAL, etc.).
 * Fall back to retrieving the PaymentIntent so the UI can advance.
 */
export async function confirmCheckoutPaymentWithFallback(
  stripe,
  elements,
  { returnUrl, payer, clientSecret }
) {
  const confirmPromise = confirmCheckoutPayment(stripe, elements, { returnUrl, payer });

  let timedOut = false;
  const result = await Promise.race([
    confirmPromise,
    new Promise((resolve) => {
      setTimeout(() => {
        timedOut = true;
        resolve(null);
      }, CONFIRM_TIMEOUT_MS);
    })
  ]);

  if (result && (result.error || result.paymentIntent)) {
    return result;
  }

  if (!clientSecret) {
    if (timedOut) {
      return {
        error: { message: "Payment is taking longer than expected. Please check your email or try again." }
      };
    }
    return { paymentIntent: null };
  }

  const retrieved = await stripe.retrievePaymentIntent(clientSecret);
  if (retrieved.error) {
    return { error: retrieved.error };
  }

  const status = retrieved.paymentIntent?.status;
  if (status === "succeeded" || status === "processing") {
    return { paymentIntent: retrieved.paymentIntent };
  }

  if (timedOut && (status === "requires_action" || status === "requires_confirmation")) {
    return {
      error: {
        message:
          "Please complete payment in the window that opened, or try again if nothing appeared."
      }
    };
  }

  return { paymentIntent: retrieved.paymentIntent ?? null };
}

/** ISO 3166-1 alpha-2 for Stripe when Payment Element address fields are hidden. */
function resolveBillingCountryCode(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "NL";

  if (/^[a-z]{2}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  const key = trimmed.toLowerCase();
  const byName = {
    netherlands: "NL",
    "the netherlands": "NL",
    holland: "NL",
    nederland: "NL",
    belgium: "BE",
    belgie: "BE",
    belgië: "BE",
    germany: "DE",
    deutschland: "DE",
    france: "FR",
    "united kingdom": "GB",
    uk: "GB",
    "great britain": "GB",
    "united states": "US",
    usa: "US",
    "united states of america": "US",
    india: "IN"
  };

  return byName[key] || "NL";
}

/** Stichting The V.O.I.C.E. NL — used when Payment Element hides address fields. */
const ORG_BILLING_ADDRESS_NL = {
  line1: "Wengehout 30",
  city: "Zoetermeer",
  state: "ZH",
  postal_code: "2719KA"
};

/** Minimal valid-looking addresses per country (no extra checkout form fields). */
const BILLING_ADDRESS_BY_COUNTRY = {
  NL: ORG_BILLING_ADDRESS_NL,
  BE: { line1: "Anspachlaan 1", city: "Brussels", state: "BRU", postal_code: "1000" },
  DE: { line1: "Friedrichstrasse 1", city: "Berlin", state: "BE", postal_code: "10117" },
  FR: { line1: "1 Rue de Rivoli", city: "Paris", state: "IDF", postal_code: "75001" },
  GB: { line1: "1 High Street", city: "London", state: "ENG", postal_code: "SW1A1AA" },
  US: { line1: "123 Main Street", city: "New York", state: "NY", postal_code: "10001" },
  IN: { line1: "1 MG Road", city: "Mumbai", state: "MH", postal_code: "400001" }
};

function buildBillingAddressForConfirm(payer) {
  const country = resolveBillingCountryCode(payer?.country);
  const preset = BILLING_ADDRESS_BY_COUNTRY[country] || ORG_BILLING_ADDRESS_NL;
  return {
    country,
    line1: preset.line1,
    city: preset.city,
    state: preset.state,
    postal_code: preset.postal_code
  };
}

export async function confirmCheckoutPayment(stripe, elements, { returnUrl, payer }) {
  const billingDetails = {
    name: payer.name || undefined,
    email: payer.email,
    phone: payer.phone || undefined,
    address: buildBillingAddressForConfirm(payer)
  };

  return stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: returnUrl,
      payment_method_data: {
        billing_details: billingDetails
      }
    },
    redirect: "if_required"
  });
}
