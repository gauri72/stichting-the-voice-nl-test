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
