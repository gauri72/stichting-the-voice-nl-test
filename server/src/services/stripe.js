import Stripe from "stripe";
import env from "../config/env.js";

let stripeInstance = null;

export function getStripe() {
  if (stripeInstance) return stripeInstance;

  if (!env.stripe.secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add it to server/.env before processing payments."
    );
  }

  stripeInstance = new Stripe(env.stripe.secretKey, {
    apiVersion: "2024-06-20"
  });

  return stripeInstance;
}

export function isStripeConfigured() {
  return Boolean(env.stripe.secretKey);
}
