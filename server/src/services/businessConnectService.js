import BusinessProfile from "../models/BusinessProfile.js";
import BusinessStripePayout from "../models/BusinessStripePayout.js";
import { getVCommerceStripe, isVCommerceStripeConfigured } from "./stripe.js";
import { sanitizePayoutRegistration } from "./businessApplicationService.js";

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

function splitLegalName(legalName) {
  const parts = String(legalName || "").trim().split(/\s+/);
  if (!parts[0]) return { first_name: undefined, last_name: undefined };
  const first_name = parts.shift();
  const last_name = parts.join(" ") || undefined;
  return { first_name, last_name };
}

function toStripeDob(date) {
  if (!date) return undefined;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return undefined;
  return { day: d.getUTCDate(), month: d.getUTCMonth() + 1, year: d.getUTCFullYear() };
}

function toStripeAddress(address) {
  if (!address) return undefined;
  const line1 = [address.street, address.houseNumber].filter(Boolean).join(" ").trim();
  if (!line1 && !address.city && !address.postalCode) return undefined;
  return {
    line1: line1 || undefined,
    postal_code: address.postalCode || undefined,
    city: address.city || undefined,
    country: normalizeCountry(address.country),
  };
}

// Builds the Stripe accounts.create() payload's prefillable fields from data already
// collected during application, so the hosted onboarding step only has to ask for the
// ID document photo and final review. Field shapes should be re-validated against
// Stripe's current NL Connect requirements — see server-side implementation notes.
function buildStripeAccountPrefill(business) {
  const reg = business.payoutRegistration || {};
  const isCompany = reg.entityType === "company";
  const person = isCompany ? reg.representative : reg;
  const { first_name, last_name } = splitLegalName(person?.legalName);

  const prefill = {
    business_type: isCompany ? "company" : "individual",
    business_profile: {
      name: business.businessName || undefined,
      url: business.website || undefined,
      support_email: business.contactEmail || undefined,
      support_phone: business.contactPhone || undefined,
    },
  };

  // Stripe rejects `individual` params on any account whose business_type isn't
  // "individual" — for company accounts the representative's details need to go
  // through the Persons API instead (not yet wired up), so leave them for the
  // seller to fill in during Stripe's own hosted onboarding rather than sending
  // a payload Stripe will reject outright.
  if (!isCompany && first_name) {
    prefill.individual = {
      first_name,
      last_name,
      dob: toStripeDob(person?.dateOfBirth),
      address: toStripeAddress(person?.address),
      email: business.contactEmail || undefined,
      phone: business.contactPhone || undefined,
    };
  }

  if (isCompany && reg.companyLegalName) {
    prefill.company = {
      name: reg.companyLegalName,
      registration_number: business.companyRegistrationNumber || undefined,
      tax_id: business.vatNumber || undefined,
    };
  }

  if (reg.stripeBankToken) {
    prefill.external_account = reg.stripeBankToken;
  }

  return prefill;
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
  if (!isVCommerceStripeConfigured()) {
    const err = new Error(
      "Marketplace payouts aren't switched on yet. Please contact support — we're finishing setup on our end."
    );
    err.status = 503;
    err.code = "CONNECT_NOT_ENABLED";
    throw err;
  }

  const business = await getOwnedBusiness(userId);
  const stripe = getVCommerceStripe();

  if (!business.stripeConnectedAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: normalizeCountry(business.location?.country),
      email: business.contactEmail || undefined,
      // Requesting transfers alone (without card_payments) needs manual Stripe approval —
      // requesting both is the standard, pre-approved combination for new platforms, even
      // though our destination-charge flow only actually uses the transfers capability.
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      metadata: {
        vcommerceBusinessId: business._id.toString(),
        vcommercePackage: business.packageId || "starter",
      },
      ...buildStripeAccountPrefill(business),
    });
    business.stripeConnectedAccountId = account.id;
    business.stripeConnectStatus = "pending";
    // The bank token is single-use and was just consumed by accounts.create — don't let it linger.
    if (business.payoutRegistration?.stripeBankToken) {
      business.payoutRegistration.stripeBankToken = "";
    }
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

// Lets an already-approved business (one that predates this feature, or wants to update
// its details before starting/retrying Stripe onboarding) submit payout registration data
// directly, outside the application flow.
export async function updatePayoutRegistration(userId, data) {
  const business = await getOwnedBusiness(userId);
  business.payoutRegistration = sanitizePayoutRegistration(data);
  if (data?.companyRegistrationNumber !== undefined) {
    business.companyRegistrationNumber = String(data.companyRegistrationNumber || "").trim().slice(0, 100);
  }
  if (data?.vatNumber !== undefined) {
    business.vatNumber = String(data.vatNumber || "").trim().slice(0, 50);
  }
  await business.save();
  return business.payoutRegistration;
}

export async function createSellerDashboardLink(userId) {
  const business = await getOwnedBusiness(userId);
  if (!business.stripeConnectedAccountId) {
    const err = new Error("Complete Stripe payout onboarding first.");
    err.status = 409;
    throw err;
  }
  const link = await getVCommerceStripe().accounts.createLoginLink(business.stripeConnectedAccountId);
  return { url: link.url };
}

export async function refreshSellerConnectStatus(userId) {
  const business = await getOwnedBusiness(userId);
  if (!business.stripeConnectedAccountId) {
    return { status: "not_started", payoutsEnabled: false, detailsSubmitted: false };
  }

  const account = await getVCommerceStripe().accounts.retrieve(business.stripeConnectedAccountId);
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
  status.connectPlatformEnabled = isVCommerceStripeConfigured();
  if (!business.stripeConnectedAccountId) {
    return {
      ...status,
      balance: { available: [], pending: [] },
      payouts: [],
    };
  }

  let balance = { available: [], pending: [] };
  try {
    const stripeBalance = await getVCommerceStripe().balance.retrieve(
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
