import BusinessProfile from "../models/BusinessProfile.js";
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

export async function createSellerOnboardingLink(userId, { returnUrl, refreshUrl }) {
  const business = await getOwnedBusiness(userId);
  const stripe = getStripe();

  if (!business.stripeConnectedAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: business.location?.country || "NL",
      email: business.contactEmail || undefined,
      business_type: "company",
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

export async function refreshSellerConnectStatus(userId) {
  const business = await getOwnedBusiness(userId);
  if (!business.stripeConnectedAccountId) {
    return { status: "not_started", payoutsEnabled: false, detailsSubmitted: false };
  }

  const account = await getStripe().accounts.retrieve(business.stripeConnectedAccountId);
  const status = account.payouts_enabled
    ? "enabled"
    : account.details_submitted
      ? "restricted"
      : "pending";

  business.stripeConnectStatus = status;
  business.payoutsEnabled = Boolean(account.payouts_enabled);
  await business.save();

  return {
    status,
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
  };
}
