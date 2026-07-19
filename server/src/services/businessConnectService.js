import BusinessProfile from "../models/BusinessProfile.js";
import BusinessStripePayout from "../models/BusinessStripePayout.js";
import { getStripe } from "./stripe.js";

async function getOwnedBusiness(userId) {
  const business = await BusinessProfile.findOne({ userId });
  if (!business) {
    const err = new Error("No approved V.Commerce business was found.");
    err.status = 404;
    throw err;
  }
  return business;
}

function connectState(account) {
  const transfersEnabled = account.capabilities?.transfers === "active";
  const currentlyDue = account.requirements?.currently_due || [];
  const disabledReason = account.requirements?.disabled_reason || "";
  const enabled = Boolean(account.details_submitted && account.payouts_enabled && transfersEnabled && !disabledReason);
  return {
    status: enabled ? "enabled" : account.details_submitted ? "restricted" : "pending",
    detailsSubmitted: Boolean(account.details_submitted),
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    transfersEnabled,
    currentlyDue,
    eventuallyDue: account.requirements?.eventually_due || [],
    disabledReason,
    country: account.country || "",
    defaultCurrency: account.default_currency || "eur",
    payoutScheduleInterval: account.settings?.payouts?.schedule?.interval || "",
    checkoutEnabled: enabled,
  };
}

function normalizeCountry(value) {
  const country = String(value || "NL").trim().toUpperCase();
  const aliases = {
    NETHERLANDS: "NL",
    NEDERLAND: "NL",
    HOLLAND: "NL",
    BELGIUM: "BE",
    BELGIE: "BE",
    GERMANY: "DE",
    DEUTSCHLAND: "DE",
  };
  return aliases[country] || (/^[A-Z]{2}$/.test(country) ? country : "NL");
}

export async function syncConnectedAccount(account) {
  const business = await BusinessProfile.findOne({ stripeConnectedAccountId: account.id });
  if (!business) return null;
  const state = connectState(account);
  Object.assign(business, {
    stripeConnectStatus: state.status,
    stripeDetailsSubmitted: state.detailsSubmitted,
    stripeChargesEnabled: state.chargesEnabled,
    payoutsEnabled: state.payoutsEnabled,
    stripeTransfersEnabled: state.transfersEnabled,
    stripeRequirementsCurrentlyDue: state.currentlyDue,
    stripeRequirementsEventuallyDue: state.eventuallyDue,
    stripeDisabledReason: state.disabledReason,
    stripeCountry: state.country,
    stripeDefaultCurrency: state.defaultCurrency,
    payoutScheduleInterval: state.payoutScheduleInterval,
    connectCheckoutEnabled: state.checkoutEnabled,
    stripeLastSyncedAt: new Date(),
  });
  await business.save();
  return { business, ...state };
}

export async function createSellerOnboardingLink(userId, { returnUrl, refreshUrl }) {
  const business = await getOwnedBusiness(userId);
  const stripe = getStripe();

  if (!business.stripeConnectedAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: normalizeCountry(business.location?.country),
      email: business.contactEmail || undefined,
      capabilities: { transfers: { requested: true } },
      metadata: {
        vcommerceBusinessId: business._id.toString(),
        vcommercePackage: business.packageId || "starter",
      },
    });
    business.stripeConnectedAccountId = account.id;
    business.stripeConnectStatus = "pending";
    await business.save();
  }

  const link = await stripe.accountLinks.create({
    account: business.stripeConnectedAccountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
  return { url: link.url };
}

export async function createSellerDashboardLink(userId) {
  const business = await getOwnedBusiness(userId);
  if (!business.stripeConnectedAccountId) {
    const err = new Error("Complete Stripe payout onboarding first.");
    err.status = 409;
    throw err;
  }
  const link = await getStripe().accounts.createLoginLink(business.stripeConnectedAccountId);
  return { url: link.url };
}

export async function refreshSellerConnectStatus(userId) {
  const business = await getOwnedBusiness(userId);
  if (!business.stripeConnectedAccountId) {
    return { status: "not_started", payoutsEnabled: false, detailsSubmitted: false };
  }

  const account = await getStripe().accounts.retrieve(business.stripeConnectedAccountId);
  const synced = await syncConnectedAccount(account);
  return {
    status: synced.status,
    payoutsEnabled: synced.payoutsEnabled,
    detailsSubmitted: synced.detailsSubmitted,
    chargesEnabled: synced.chargesEnabled,
    transfersEnabled: synced.transfersEnabled,
    checkoutEnabled: synced.checkoutEnabled,
    requirementsCurrentlyDue: synced.currentlyDue,
    disabledReason: synced.disabledReason,
    payoutScheduleInterval: synced.payoutScheduleInterval,
  };
}

export async function getSellerConnectOverview(userId) {
  const status = await refreshSellerConnectStatus(userId);
  const business = await getOwnedBusiness(userId);
  if (!business.stripeConnectedAccountId) {
    return {
      ...status,
      balance: { available: [], pending: [] },
      payouts: [],
    };
  }

  let balance = { available: [], pending: [] };
  try {
    const stripeBalance = await getStripe().balance.retrieve(
      {},
      { stripeAccount: business.stripeConnectedAccountId }
    );
    balance = {
      available: stripeBalance.available || [],
      pending: stripeBalance.pending || [],
    };
  } catch (error) {
    balance.error = error.message;
  }

  const payouts = await BusinessStripePayout.find({ businessId: business._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return {
    ...status,
    connectedAccountId: business.stripeConnectedAccountId,
    balance,
    payouts,
  };
}
