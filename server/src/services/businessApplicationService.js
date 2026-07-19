import crypto from "crypto";
import BusinessApplication from "../models/BusinessApplication.js";
import BusinessProfile from "../models/BusinessProfile.js";
import { VCOMMERCE_PLATFORM_FEE_PERCENT, resolveVCommercePlan } from "../config/vcommercePlans.js";
import BusinessProduct from "../models/BusinessProduct.js";

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function makeUniqueSlug(base) {
  let slug = base;
  let attempt = 0;
  while (await BusinessProfile.exists({ slug })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
  return slug;
}

function sanitizeAddress(address) {
  const a = address || {};
  return {
    street: String(a.street || "").trim(),
    houseNumber: String(a.houseNumber || "").trim(),
    postalCode: String(a.postalCode || "").trim(),
    city: String(a.city || "").trim(),
    country: String(a.country || "NL").trim().toUpperCase().slice(0, 2) || "NL",
  };
}

// Shared by application submission and the post-approval backfill flow (businessConnectService.updatePayoutRegistration).
// Deliberately whitelists every field and never accepts a raw IBAN — only a pre-tokenized
// Stripe bank token + the last 4 digits the client derived locally before discarding the rest.
export function sanitizePayoutRegistration(data) {
  const reg = data || {};
  const entityType = ["individual", "company"].includes(reg.entityType) ? reg.entityType : "";
  const dob = reg.dateOfBirth ? new Date(reg.dateOfBirth) : null;
  const repDob = reg.representative?.dateOfBirth ? new Date(reg.representative.dateOfBirth) : null;
  return {
    entityType,
    legalName: String(reg.legalName || "").trim().slice(0, 200),
    dateOfBirth: Number.isNaN(dob?.getTime()) ? null : dob,
    nationality: String(reg.nationality || "").trim().slice(0, 60),
    address: sanitizeAddress(reg.address),
    companyLegalName: entityType === "company" ? String(reg.companyLegalName || "").trim().slice(0, 200) : "",
    representative: entityType === "company" ? {
      legalName: String(reg.representative?.legalName || "").trim().slice(0, 200),
      dateOfBirth: Number.isNaN(repDob?.getTime()) ? null : repDob,
      address: sanitizeAddress(reg.representative?.address),
    } : { legalName: "", dateOfBirth: null, address: sanitizeAddress(null) },
    bankAccountHolderName: String(reg.bankAccountHolderName || "").trim().slice(0, 200),
    stripeBankToken: String(reg.stripeBankToken || "").trim(),
    ibanLast4: String(reg.ibanLast4 || "").trim().slice(0, 4),
    consentAcceptedAt: reg.consentAcceptedAt ? new Date() : null,
  };
}

export async function getApplicationStatus(userId) {
  const [application, business] = await Promise.all([
    BusinessApplication.findOne({ userId }).sort({ createdAt: -1 }).lean(),
    BusinessProfile.findOne({ userId }).lean(),
  ]);
  const isLegacyUnpaidPending =
    application?.status === "pending" && !application.paidAt && !application.businessProfileId;
  const applicationStatus = isLegacyUnpaidPending ? "payment_pending" : (application?.status || null);
  return {
    hasApprovedBusiness: !!business,
    businessSlug: business?.slug || null,
    alreadyApplied: !!application,
    applicationStatus,
    reviewNote: application?.status === "rejected" ? (application.reviewNote || "") : "",
    applicationDraft: applicationStatus === "payment_pending" ? {
      applicantType: application?.applicantType,
      sellingMode: application?.sellingMode,
      packageId: application?.packageId,
      billingCycle: application?.billingCycle,
      businessName: application?.businessName,
      category: application?.category,
      tagline: application?.tagline,
      description: application?.description,
      contactEmail: application?.contactEmail,
      contactPhone: application?.contactPhone,
      website: application?.website,
      socialLinks: application?.socialLinks,
      companyRegistrationNumber: application?.companyRegistrationNumber,
      vatNumber: application?.vatNumber,
      applicationMessage: application?.applicationMessage,
      // Bank token/last-4 are deliberately excluded: tokens are short-lived, so a resumed
      // draft always requires the IBAN to be re-entered and re-tokenized.
      payoutRegistration: application?.payoutRegistration ? {
        entityType: application.payoutRegistration.entityType,
        legalName: application.payoutRegistration.legalName,
        dateOfBirth: application.payoutRegistration.dateOfBirth,
        nationality: application.payoutRegistration.nationality,
        address: application.payoutRegistration.address,
        companyLegalName: application.payoutRegistration.companyLegalName,
        representative: application.payoutRegistration.representative,
        bankAccountHolderName: application.payoutRegistration.bankAccountHolderName,
      } : null,
    } : null,
  };
}

function generateReferralCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars e.g. "A3F9D2"
}

async function makeUniqueReferralCode() {
  let code;
  do {
    code = generateReferralCode();
  } while (await BusinessProfile.exists({ directReferralCode: code }));
  return code;
}

export async function createApplication(userId, data) {
  const applicantType = data.applicantType === "sponsor" ? "sponsor" : "community_member";
  const plan = resolveVCommercePlan(data.packageId);
  const sellingMode = ["hosted", "external", "hybrid"].includes(data.sellingMode) ? data.sellingMode : "hosted";
  const billingCycle = data.billingCycle === "annual" ? "annual" : "monthly";

  // One in-progress business journey per account. Payment-pending drafts can be
  // updated and retried without creating duplicate applications.
  const existing = await BusinessApplication.findOne({
    userId,
    status: { $in: ["payment_pending", "setup", "pending", "approved"] },
  }).sort({ createdAt: -1 });
  const canResumeLegacyUnpaid =
    existing?.status === "pending" && !existing.paidAt && !existing.businessProfileId;
  if (canResumeLegacyUnpaid) existing.status = "payment_pending";
  if (existing && existing.status !== "payment_pending") {
    const err = new Error("You already have a pending application.");
    err.status = 409;
    throw err;
  }

  const applicationData = {
    userId,
    membershipPlanId: "",
    applicantType,
    sellingMode,
    packageId: plan.id,
    billingCycle,
    businessName: data.businessName,
    category: data.category,
    description: data.description || "",
    tagline: data.tagline || "",
    contactEmail: data.contactEmail || "",
    contactPhone: data.contactPhone || "",
    website: data.website || "",
    socialLinks: data.socialLinks || {},
    applicationMessage: data.applicationMessage || "",
    companyRegistrationNumber: data.companyRegistrationNumber || "",
    vatNumber: data.vatNumber || "",
    payoutRegistration: sanitizePayoutRegistration(data.payoutRegistration),
    status: "payment_pending",
  };

  const application = existing
    ? await BusinessApplication.findByIdAndUpdate(existing._id, { $set: applicationData }, { new: true, runValidators: true })
    : await BusinessApplication.create(applicationData);

  return application;
}

export async function listApplications({ status, search, page = 1, pageSize = 20 } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.businessName = { $regex: search, $options: "i" };

  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    BusinessApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("userId", "firstName lastName email")
      .lean(),
    BusinessApplication.countDocuments(filter),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function reviewApplication(applicationId, adminId, { action, note }) {
  const application = await BusinessApplication.findById(applicationId);
  if (!application) {
    const err = new Error("Application not found.");
    err.status = 404;
    throw err;
  }
  if (application.status !== "pending") {
    const err = new Error("Application has already been reviewed.");
    err.status = 409;
    throw err;
  }

  application.status = action === "approve" ? "approved" : "rejected";
  application.reviewedBy = adminId;
  application.reviewedAt = new Date();
  application.reviewNote = note || "";

  if (action === "approve") {
    let profile = application.businessProfileId
      ? await BusinessProfile.findById(application.businessProfileId)
      : null;
    if (profile) {
      profile.status = "active";
      await profile.save();
    } else {
      const baseSlug = generateSlug(application.businessName);
      const slug = await makeUniqueSlug(baseSlug);
      const directReferralCode = await makeUniqueReferralCode();
      profile = await BusinessProfile.create({
        userId: application.userId,
        applicationId: application._id,
        businessName: application.businessName,
        slug,
        tagline: application.tagline,
        description: application.description,
        category: application.category,
        contactEmail: application.contactEmail,
        contactPhone: application.contactPhone,
        website: application.website,
        sellingMode: application.sellingMode || "hosted",
        packageId: application.packageId || "starter",
        billingCycle: application.billingCycle || "monthly",
        platformFeePercent: VCOMMERCE_PLATFORM_FEE_PERCENT,
        socialLinks: application.socialLinks,
        vatNumber: application.vatNumber || "",
        companyRegistrationNumber: application.companyRegistrationNumber || "",
        payoutRegistration: application.payoutRegistration,
        directReferralCode,
        status: "active",
      });
    }

    application.businessProfileId = profile._id;
  } else if (application.businessProfileId) {
    await BusinessProfile.findByIdAndUpdate(application.businessProfileId, { $set: { status: "setup" } });
  }

  await application.save();
  return application;
}

export async function submitBusinessForReview(userId) {
  const business = await BusinessProfile.findOne({ userId });
  if (!business) {
    const err = new Error("Your paid business workspace was not found.");
    err.status = 404;
    throw err;
  }
  const application = await BusinessApplication.findById(business.applicationId);
  if (!application) {
    const err = new Error("Business application was not found.");
    err.status = 404;
    throw err;
  }
  if (business.packageStatus !== "active" || !application.paidAt) {
    const err = new Error("Activate your V.Commerce package before submitting for verification.");
    err.status = 409;
    throw err;
  }

  const missing = [];
  if (!business.businessName?.trim()) missing.push("business name");
  if (!business.category) missing.push("business category");
  if (!business.description?.trim()) missing.push("brand description");
  if (!business.contactEmail?.trim()) missing.push("contact email");
  if (!business.logoUrl?.trim()) missing.push("business logo");
  if (["hosted", "hybrid"].includes(business.sellingMode)) {
    const productCount = await BusinessProduct.countDocuments({ businessId: business._id, isAvailable: true });
    if (productCount < 1) missing.push("at least one available product or service");
  }
  if (missing.length) {
    const err = new Error(`Complete the following before review: ${missing.join(", ")}.`);
    err.status = 400;
    err.missing = missing;
    throw err;
  }

  application.businessName = business.businessName;
  application.category = business.category;
  application.description = business.description;
  application.tagline = business.tagline;
  application.contactEmail = business.contactEmail;
  application.contactPhone = business.contactPhone;
  application.website = business.website;
  application.socialLinks = business.socialLinks;
  application.status = "pending";
  application.reviewNote = "";
  business.status = "review";
  await Promise.all([application.save(), business.save()]);
  return { application, business };
}
