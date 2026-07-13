import crypto from "crypto";
import Membership from "../models/Membership.js";
import BusinessApplication from "../models/BusinessApplication.js";
import BusinessProfile from "../models/BusinessProfile.js";

const FAMILY_PLAN_IDS = ["privilegedFamily", "premiumFamily", "family", "privileged"];

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

export async function checkFamilyMembership(userId) {
  const now = new Date();
  const membership = await Membership.findOne({
    userId,
    active: true,
    planId: { $in: FAMILY_PLAN_IDS },
    endsAt: { $exists: true, $ne: null, $gt: now },
  }).lean();
  return {
    hasMembership: !!membership,
    planId: membership?.planId || null,
  };
}

export async function getApplicationStatus(userId) {
  const [application, business, { hasMembership }] = await Promise.all([
    BusinessApplication.findOne({ userId }).sort({ createdAt: -1 }).lean(),
    BusinessProfile.findOne({ userId }).lean(),
    checkFamilyMembership(userId),
  ]);
  return {
    hasFamilyMembership: hasMembership,
    hasApprovedBusiness: !!business,
    businessSlug: business?.slug || null,
    alreadyApplied: !!application,
    applicationStatus: application?.status || null,
    reviewNote: application?.status === "rejected" ? (application.reviewNote || "") : "",
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
  let planId = null;

  // Only community members need Family Membership
  if (applicantType === "community_member") {
    const { hasMembership, planId: pid } = await checkFamilyMembership(userId);
    if (!hasMembership) {
      const err = new Error("A Family Membership is required to apply as a community member.");
      err.status = 403;
      throw err;
    }
    planId = pid;
  }

  // Prevent duplicate pending applications
  const existing = await BusinessApplication.findOne({ userId, status: "pending" });
  if (existing) {
    const err = new Error("You already have a pending application.");
    err.status = 409;
    throw err;
  }

  const application = await BusinessApplication.create({
    userId,
    membershipPlanId: planId || "",
    applicantType,
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
    status: "pending",
  });

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
    const baseSlug = generateSlug(application.businessName);
    const slug = await makeUniqueSlug(baseSlug);
    const directReferralCode = await makeUniqueReferralCode();

    const profile = await BusinessProfile.create({
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
      socialLinks: application.socialLinks,
      vatNumber: application.vatNumber || "",
      directReferralCode,
      status: "active",
    });

    application.businessProfileId = profile._id;
  }

  await application.save();
  return application;
}
