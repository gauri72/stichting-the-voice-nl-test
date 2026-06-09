import mongoose from "mongoose";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import { getStripe } from "./stripe.js";

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

async function loadUser(userId) {
  if (!isDbReady()) {
    const err = new Error("Database is not available. Please try again later.");
    err.status = 503;
    throw err;
  }
  const user = await User.findById(userId);
  if (!user || !user.isVerified) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }
  return user;
}

/** Find or create the Stripe Customer that stores this user's saved payment methods. */
export async function ensureStripeCustomer(userId) {
  const stripe = getStripe();
  const user = await loadUser(userId);

  if (user.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(user.stripeCustomerId);
      if (existing && !existing.deleted) {
        return { user, customerId: user.stripeCustomerId };
      }
    } catch {
      // Stored id is stale (e.g. switched Stripe accounts) — recreate below.
    }
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  const customer = await stripe.customers.create({
    email: user.email,
    name: fullName || undefined,
    phone: user.phone || undefined,
    metadata: { user_id: user._id.toString() }
  });

  user.stripeCustomerId = customer.id;
  await user.save();

  return { user, customerId: customer.id };
}

/** SetupIntent so the user can save a reusable payment method (cards, iDEAL→SEPA, wallets). */
export async function createSetupIntent(userId) {
  const stripe = getStripe();
  const { customerId } = await ensureStripeCustomer(userId);

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: "off_session",
    automatic_payment_methods: { enabled: true }
  });

  return {
    clientSecret: setupIntent.client_secret,
    setupIntentId: setupIntent.id,
    customerId
  };
}

function normalizePaymentMethod(pm, defaultPmId) {
  const base = {
    id: pm.id,
    type: pm.type,
    isDefault: pm.id === defaultPmId,
    createdAt: pm.created ? new Date(pm.created * 1000).toISOString() : null
  };

  if (pm.type === "card" && pm.card) {
    return {
      ...base,
      brand: pm.card.brand || "card",
      last4: pm.card.last4 || "",
      expMonth: pm.card.exp_month || null,
      expYear: pm.card.exp_year || null,
      wallet: pm.card.wallet?.type || null,
      label: "Card"
    };
  }
  if (pm.type === "sepa_debit" && pm.sepa_debit) {
    return {
      ...base,
      brand: "sepa",
      last4: pm.sepa_debit.last4 || "",
      bank: pm.sepa_debit.bank_code || "",
      label: "SEPA Direct Debit"
    };
  }
  if (pm.type === "ideal" && pm.ideal) {
    return {
      ...base,
      brand: "ideal",
      bank: pm.ideal.bank || "",
      label: "iDEAL"
    };
  }
  if (pm.type === "bancontact") {
    return { ...base, brand: "bancontact", label: "Bancontact" };
  }
  if (pm.type === "paypal" && pm.paypal) {
    return { ...base, brand: "paypal", email: pm.paypal.payer_email || "", label: "PayPal" };
  }

  return { ...base, brand: pm.type, label: pm.type.replace(/_/g, " ") };
}

/** List the user's saved payment methods, flagging the default one. */
export async function listPaymentMethods(userId) {
  const stripe = getStripe();
  const user = await loadUser(userId);

  if (!user.stripeCustomerId) {
    return { methods: [] };
  }

  let customer;
  try {
    customer = await stripe.customers.retrieve(user.stripeCustomerId);
  } catch {
    return { methods: [] };
  }
  if (!customer || customer.deleted) {
    return { methods: [] };
  }

  const defaultPmId =
    customer.invoice_settings?.default_payment_method || null;

  const list = await stripe.customers.listPaymentMethods(user.stripeCustomerId, {
    limit: 100
  });

  const methods = (list?.data || [])
    .map((pm) => normalizePaymentMethod(pm, defaultPmId))
    .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

  return { methods };
}

async function assertOwnsPaymentMethod(stripe, customerId, paymentMethodId) {
  const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
  if (!pm || pm.customer !== customerId) {
    const err = new Error("Payment method not found.");
    err.status = 404;
    throw err;
  }
  return pm;
}

/** Mark a saved payment method as the customer's default for future charges. */
export async function setDefaultPaymentMethod(userId, paymentMethodId) {
  const stripe = getStripe();
  const user = await loadUser(userId);
  if (!user.stripeCustomerId) {
    const err = new Error("No payment methods on file.");
    err.status = 404;
    throw err;
  }

  await assertOwnsPaymentMethod(stripe, user.stripeCustomerId, paymentMethodId);

  await stripe.customers.update(user.stripeCustomerId, {
    invoice_settings: { default_payment_method: paymentMethodId }
  });

  return listPaymentMethods(userId);
}

/** Remove a saved payment method from the user's Stripe customer. */
export async function deletePaymentMethod(userId, paymentMethodId) {
  const stripe = getStripe();
  const user = await loadUser(userId);
  if (!user.stripeCustomerId) {
    const err = new Error("No payment methods on file.");
    err.status = 404;
    throw err;
  }

  await assertOwnsPaymentMethod(stripe, user.stripeCustomerId, paymentMethodId);
  await stripe.paymentMethods.detach(paymentMethodId);

  return listPaymentMethods(userId);
}

/**
 * After the client confirms a SetupIntent, finalize: attach as default if it's the
 * first saved method and record an activity entry.
 */
export async function confirmSetupIntent(userId, setupIntentId) {
  const stripe = getStripe();
  const user = await loadUser(userId);
  if (!user.stripeCustomerId) {
    const err = new Error("No Stripe customer on file.");
    err.status = 400;
    throw err;
  }

  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
  if (!setupIntent || setupIntent.customer !== user.stripeCustomerId) {
    const err = new Error("Setup request not found.");
    err.status = 404;
    throw err;
  }
  if (setupIntent.status !== "succeeded" || !setupIntent.payment_method) {
    return { ...(await listPaymentMethods(userId)), recorded: false };
  }

  const customer = await stripe.customers.retrieve(user.stripeCustomerId);
  const hasDefault = Boolean(customer?.invoice_settings?.default_payment_method);
  if (!hasDefault) {
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: setupIntent.payment_method }
    });
  }

  try {
    await ActivityLog.create({
      userId: user._id,
      kind: "payment_method_added",
      summary: "A new payment method was added"
    });
  } catch (error) {
    console.error("[payment-methods] activity log failed:", error.message);
  }

  return { ...(await listPaymentMethods(userId)), recorded: true };
}
