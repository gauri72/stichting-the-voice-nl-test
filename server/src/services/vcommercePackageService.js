import BusinessProfile from "../models/BusinessProfile.js";
import BusinessApplication from "../models/BusinessApplication.js";
import { resolveVCommercePlan } from "../config/vcommercePlans.js";
import { VCOMMERCE_PLATFORM_FEE_PERCENT } from "../config/vcommercePlans.js";
import { getStripe } from "./stripe.js";
import crypto from "crypto";

function slugify(name) {
  return String(name || "business").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

async function uniqueSlug(name) {
  const base = slugify(name);
  let slug = base;
  let attempt = 0;
  while (await BusinessProfile.exists({ slug })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
  return slug;
}

async function uniqueReferralCode() {
  let code;
  do {
    code = crypto.randomBytes(3).toString("hex").toUpperCase();
  } while (await BusinessProfile.exists({ directReferralCode: code }));
  return code;
}

export async function createApplicationPackageCheckout(userId, application, origin) {
  if (String(application.userId) !== String(userId)) {
    const err = new Error("This application does not belong to your account.");
    err.status = 403;
    throw err;
  }
  const plan = resolveVCommercePlan(application.packageId);
  const annual = application.billingCycle === "annual";
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: application.contactEmail || undefined,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: annual ? plan.annualMinor : plan.monthlyMinor,
        recurring: { interval: annual ? "year" : "month" },
        product_data: {
          name: `V.Commerce ${plan.name}`,
          description: `${plan.productLimit} product listings and hosted marketplace tools`,
        },
      },
    }],
    success_url: `${origin}/vcommerce/apply?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/vcommerce/apply?payment=cancelled`,
    metadata: {
      payment_kind: "vcommerce_application_package",
      applicationId: application._id.toString(),
      userId: userId.toString(),
      packageId: plan.id,
      billingCycle: application.billingCycle || "monthly",
    },
    subscription_data: {
      metadata: {
        payment_kind: "vcommerce_application_package",
        applicationId: application._id.toString(),
      },
    },
  });
  application.stripeCheckoutSessionId = session.id;
  await application.save();
  return { url: session.url, sessionId: session.id };
}

export async function activateApplicationFromCheckout(session, expectedUserId = null) {
  if (session.metadata?.payment_kind !== "vcommerce_application_package") return null;
  const application = await BusinessApplication.findById(session.metadata.applicationId);
  if (!application) {
    const err = new Error("Business application was not found.");
    err.status = 404;
    throw err;
  }
  if (expectedUserId && String(application.userId) !== String(expectedUserId)) {
    const err = new Error("This payment does not belong to your account.");
    err.status = 403;
    throw err;
  }
  if (!["paid", "no_payment_required"].includes(session.payment_status)) {
    const err = new Error("Package payment has not completed.");
    err.status = 409;
    throw err;
  }

  let business = await BusinessProfile.findOne({ applicationId: application._id });
  if (!business) {
    try {
      business = await BusinessProfile.create({
        userId: application.userId,
        applicationId: application._id,
        businessName: application.businessName,
        slug: await uniqueSlug(application.businessName),
        tagline: application.tagline,
        description: application.description,
        category: application.category,
        contactEmail: application.contactEmail,
        contactPhone: application.contactPhone,
        website: application.website,
        sellingMode: application.sellingMode || "hosted",
        packageId: application.packageId || "starter",
        billingCycle: application.billingCycle || "monthly",
        packageStatus: "active",
        platformFeePercent: VCOMMERCE_PLATFORM_FEE_PERCENT,
        socialLinks: application.socialLinks,
        vatNumber: application.vatNumber || "",
        directReferralCode: await uniqueReferralCode(),
        stripeSubscriptionId: String(session.subscription || ""),
        status: "setup",
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      business = await BusinessProfile.findOne({ userId: application.userId });
      if (!business) throw error;
    }
  } else {
    business.packageStatus = "active";
    business.stripeSubscriptionId = String(session.subscription || business.stripeSubscriptionId || "");
    await business.save();
  }

  application.status = "setup";
  application.paidAt = application.paidAt || new Date();
  application.businessProfileId = business._id;
  await application.save();
  return { application, business };
}

export async function confirmApplicationPackageCheckout(userId, sessionId) {
  if (!sessionId) {
    const err = new Error("Stripe checkout session is required.");
    err.status = 400;
    throw err;
  }
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  return activateApplicationFromCheckout(session, userId);
}

export async function createPackageCheckout(userId, origin) {
  const business = await BusinessProfile.findOne({ userId });
  if (!business) {
    const err = new Error("No approved V.Commerce business was found.");
    err.status = 404;
    throw err;
  }

  const plan = resolveVCommercePlan(business.packageId);
  const annual = business.billingCycle === "annual";
  const amountMinor = annual ? plan.annualMinor : plan.monthlyMinor;
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: business.contactEmail || undefined,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: amountMinor,
        recurring: { interval: annual ? "year" : "month" },
        product_data: {
          name: `V.Commerce ${plan.name}`,
          description: `${plan.productLimit} product listings and hosted marketplace tools`,
        },
      },
    }],
    success_url: `${origin}/dashboard/vcommerce?package=success`,
    cancel_url: `${origin}/dashboard/vcommerce?package=cancelled`,
    metadata: {
      payment_kind: "vcommerce_package",
      businessId: business._id.toString(),
      packageId: plan.id,
      billingCycle: business.billingCycle || "monthly",
    },
    subscription_data: {
      metadata: {
        payment_kind: "vcommerce_package",
        businessId: business._id.toString(),
        packageId: plan.id,
      },
    },
  });
  return { url: session.url };
}

export async function activatePackageFromCheckout(session) {
  if (session.metadata?.payment_kind === "vcommerce_application_package") {
    return activateApplicationFromCheckout(session);
  }
  if (session.metadata?.payment_kind !== "vcommerce_package") return null;
  return BusinessProfile.findByIdAndUpdate(
    session.metadata.businessId,
    {
      $set: {
        packageId: session.metadata.packageId,
        billingCycle: session.metadata.billingCycle || "monthly",
        packageStatus: "active",
        stripeSubscriptionId: String(session.subscription || ""),
      },
    },
    { new: true }
  );
}
