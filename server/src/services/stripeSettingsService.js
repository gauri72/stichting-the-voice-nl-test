import * as settingsService from "./settingsService.js";
import { getStripe, getStripeKeyMode, isStripeConfigured as envStripeConfigured } from "./stripe.js";
import env from "../config/env.js";

export async function getStripeSettings(masked = true) {
  return settingsService.getCategorySettings("stripe", { maskSecrets: masked });
}

export async function getEffectiveStripeSecretKey() {
  const dbKey = await settingsService.getSecret("stripe", "secretKey");
  return dbKey || env.stripe.secretKey || "";
}

export async function getEffectiveWebhookSecret() {
  const dbSecret = await settingsService.getSecret("stripe", "webhookSecret");
  return dbSecret || env.stripe.webhookSecret || "";
}

export async function getEffectiveConnectWebhookSecret() {
  const dbSecret = await settingsService.getSecret("stripe", "connectWebhookSecret");
  return dbSecret || env.stripe.connectWebhookSecret || "";
}

export function buildStripeWebhookConfigurationStatus({
  platformSecret = "",
  connectSecret = "",
  connectRequired = false,
} = {}) {
  const normalizedPlatformSecret = String(platformSecret || "").trim();
  const normalizedConnectSecret = String(connectSecret || "").trim();
  const platformConfigured = Boolean(normalizedPlatformSecret);
  const connectConfigured = Boolean(normalizedConnectSecret);
  const secretsDistinct =
    !platformConfigured ||
    !connectConfigured ||
    normalizedPlatformSecret !== normalizedConnectSecret;
  const configured =
    platformConfigured &&
    (!connectRequired || connectConfigured) &&
    secretsDistinct;

  let message;
  if (!platformConfigured) {
    message = "Platform webhook secret is not configured.";
  } else if (!secretsDistinct) {
    message =
      "Platform and connected-account destinations must use different signing secrets.";
  } else if (connectRequired && !connectConfigured) {
    message =
      "Stripe Connect is enabled, but its connected-account webhook secret is not configured.";
  } else if (connectConfigured) {
    message =
      "Platform and connected-account webhook secrets are configured. Webhook delivery has not been tested.";
  } else {
    message =
      "Platform webhook secret is configured. Stripe Connect is not enabled; webhook delivery has not been tested.";
  }

  return {
    configured,
    platformConfigured,
    connectConfigured,
    connectRequired: Boolean(connectRequired),
    secretsDistinct,
    deliveryVerification: "not_performed",
    message,
  };
}

export async function testStripeConnection() {
  const secretKey = await getEffectiveStripeSecretKey();
  if (!secretKey) {
    const error = new Error("Stripe secret key is not configured.");
    error.status = 400;
    throw error;
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });
  const account = await stripe.accounts.retrieve();
  const mode = getStripeKeyMode(secretKey);

  await settingsService.updateCategorySettings(
    "stripe",
    {
      lastTestAt: new Date().toISOString(),
      lastTestStatus: "ok",
      mode,
      accountId: account.id || "",
    },
    null
  );

  return {
    ok: true,
    mode,
    accountId: account.id,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
  };
}

export async function checkStripeWebhookConfiguration() {
  const platformSecret = await getEffectiveWebhookSecret();
  const connectSecret = await getEffectiveConnectWebhookSecret();
  return buildStripeWebhookConfigurationStatus({
    platformSecret,
    connectSecret,
    connectRequired: env.stripe.connectEnabled,
  });
}

// Backwards-compatible service alias for callers using the original name.
export const verifyStripeWebhook = checkStripeWebhookConfiguration;

export async function syncStripeBankAccount(adminId) {
  const secretKey = await getEffectiveStripeSecretKey();
  if (!secretKey) {
    const error = new Error("Stripe is not configured.");
    error.status = 400;
    throw error;
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });

  try {
    const account = await stripe.accounts.retrieve();
    const external = await stripe.accounts.listExternalAccounts(account.id, { object: "bank_account", limit: 1 });
    const bank = external.data?.[0];

    if (bank) {
      await settingsService.updateCategorySettings(
        "bank",
        {
          iban: bank.last4 ? `****${bank.last4}` : "",
          bankName: bank.bank_name || "",
          lastStripeSyncAt: new Date().toISOString(),
          lastStripeSyncStatus: "synced",
        },
        adminId
      );
    }

    return {
      ok: true,
      status: bank ? "synced" : "no_bank_account",
      bank: bank
        ? { bankName: bank.bank_name, country: bank.country, last4: bank.last4, currency: bank.currency }
        : null,
      warning:
        "Stripe payout bank details may require additional verification. Local invoice bank details are managed separately.",
    };
  } catch (err) {
    await settingsService.updateCategorySettings(
      "stripe",
      { lastStripeSyncStatus: "failed" },
      adminId
    );
    throw err;
  }
}

export function isStripeConfigured() {
  return envStripeConfigured();
}

export async function getActivePaymentProvider() {
  const payment = await settingsService.getCategorySettings("payment");
  if (!payment.onlinePaymentsEnabled) return null;
  return payment.defaultProvider || "stripe";
}
