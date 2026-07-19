import { loadStripe } from "@stripe/stripe-js";

export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

let stripePromise = null;

/** Shared singleton Stripe.js loader. Returns null when no publishable key is set. */
export function getStripePromise() {
  if (stripePromise) return stripePromise;
  if (!STRIPE_PUBLISHABLE_KEY) return null;
  stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  return stripePromise;
}

// V.Commerce runs on a separate Stripe account (marketplace checkout + Connect),
// distinct from the account used for donations/memberships/tickets/wallet.
export const VCOMMERCE_STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_VCOMMERCE_STRIPE_PUBLISHABLE_KEY || "";

let vcommerceStripePromise = null;

/** Shared singleton Stripe.js loader for the V.Commerce account. */
export function getVCommerceStripePromise() {
  if (vcommerceStripePromise) return vcommerceStripePromise;
  if (!VCOMMERCE_STRIPE_PUBLISHABLE_KEY) return null;
  vcommerceStripePromise = loadStripe(VCOMMERCE_STRIPE_PUBLISHABLE_KEY);
  return vcommerceStripePromise;
}
