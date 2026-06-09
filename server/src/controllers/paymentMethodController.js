import { isStripeConfigured } from "../services/stripe.js";
import {
  createSetupIntent,
  listPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  confirmSetupIntent
} from "../services/paymentMethodService.js";

function handleError(res, error) {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";
  if (status >= 500) {
    console.error("[payment-methods]", error);
  }
  return res.status(status).json({ error: message });
}

function ensureStripe(res) {
  if (!isStripeConfigured()) {
    res.status(503).json({
      error: "Stripe is not configured on the server. Set STRIPE_SECRET_KEY in server/.env."
    });
    return false;
  }
  return true;
}

export async function getPaymentMethods(req, res) {
  if (!ensureStripe(res)) return;
  try {
    const result = await listPaymentMethods(req.user.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postSetupIntent(req, res) {
  if (!ensureStripe(res)) return;
  try {
    const result = await createSetupIntent(req.user.id);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postConfirmSetup(req, res) {
  if (!ensureStripe(res)) return;
  try {
    const { setupIntentId } = req.body || {};
    if (!setupIntentId) {
      return res.status(400).json({ error: "setupIntentId is required." });
    }
    const result = await confirmSetupIntent(req.user.id, setupIntentId);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function putDefaultPaymentMethod(req, res) {
  if (!ensureStripe(res)) return;
  try {
    const result = await setDefaultPaymentMethod(req.user.id, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function removePaymentMethod(req, res) {
  if (!ensureStripe(res)) return;
  try {
    const result = await deletePaymentMethod(req.user.id, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}
