import BusinessProfile from "../models/BusinessProfile.js";
import BusinessProduct from "../models/BusinessProduct.js";
import BusinessOrder from "../models/BusinessOrder.js";

// Every unauthenticated, public-facing BusinessProfile read (list, profile, featured)
// MUST project through this allow-list. BusinessProfile carries payout bank details,
// Stripe Connect internals, and payoutRegistration (which includes DOB, home address,
// and a raw Stripe bank token) — a bare .find()/.findOne().lean() with no projection
// returns all of it. Only add a field here after confirming it's meant to be public.
const PUBLIC_BUSINESS_FIELDS =
  "businessName slug tagline description category logoUrl bannerUrl galleryUrls " +
  "contactEmail contactPhone website socialLinks location isFeaturedThisWeek " +
  "cashbackPercent reviewCount avgRating createdAt";

export async function getFeaturedBusiness() {
  const business = await BusinessProfile.findOne({
    status: "active",
    isFeaturedThisWeek: true,
  })
    .select(PUBLIC_BUSINESS_FIELDS)
    .lean();

  // Fetch alternates (up to 5 other active businesses) for the BOTW carousel
  const alternatesFilter = { status: "active" };
  if (business) alternatesFilter._id = { $ne: business._id };
  const alternates = await BusinessProfile.find(alternatesFilter)
    .select(PUBLIC_BUSINESS_FIELDS)
    .sort({ totalOrders: -1, createdAt: -1 })
    .limit(5)
    .lean();

  if (!business) return { business: null, alternates };

  const products = await BusinessProduct.find({
    businessId: business._id,
    isAvailable: true,
  })
    .sort({ isFeatured: -1, sortOrder: 1 })
    .limit(6)
    .lean();

  return { business: { ...business, products }, alternates };
}

/**
 * Aggregate marketplace-wide statistics.
 * verifiedBusinesses === activeShops because every listed BusinessProfile
 * has already cleared the admin review of its BusinessApplication.
 */
export async function getMarketplaceStats() {
  const [activeShops, countries, categories, customerIds] = await Promise.all([
    BusinessProfile.countDocuments({ status: "active" }),
    BusinessProfile.distinct("location.country", { status: "active" }),
    BusinessProfile.distinct("category", { status: "active" }),
    BusinessOrder.distinct("customerId", { status: { $in: ["paid", "fulfilled"] } }),
  ]);
  return {
    activeShops,
    verifiedBusinesses: activeShops,
    customers: customerIds.length,
    countries: countries.filter(Boolean).length,
    categories: categories.length,
  };
}

/**
 * Cross-business popular products with parent cashbackPercent attached.
 * No per-product cashback exists; business.cashbackPercent is the real rate.
 */
export async function getPopularProducts({ limit = 12 } = {}) {
  return BusinessProduct.aggregate([
    { $match: { isAvailable: true } },
    {
      $lookup: {
        from: "business_profiles",
        localField: "businessId",
        foreignField: "_id",
        as: "business",
      },
    },
    { $unwind: "$business" },
    { $match: { "business.status": "active" } },
    { $sort: { isFeatured: -1, "business.totalOrders": -1, sortOrder: 1 } },
    { $limit: Number(limit) || 12 },
    {
      $project: {
        _id: 1,
        name: 1,
        slug: 1,
        imageUrls: 1,
        priceMinor: 1,
        currency: 1,
        isFeatured: 1,
        "business._id": 1,
        "business.businessName": 1,
        "business.slug": 1,
        "business.category": 1,
        "business.cashbackPercent": 1,
      },
    },
  ]);
}

export async function listBusinesses({ category, search, page = 1, pageSize = 12 } = {}) {
  const filter = { status: "active" };
  if (category) filter.category = category;
  if (search) filter.businessName = { $regex: search, $options: "i" };

  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    BusinessProfile.find(filter)
      .select(PUBLIC_BUSINESS_FIELDS)
      .sort({ isFeaturedThisWeek: -1, totalOrders: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    BusinessProfile.countDocuments(filter),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getBusinessBySlug(slug) {
  const business = await BusinessProfile.findOne({ slug, status: "active" })
    .select(PUBLIC_BUSINESS_FIELDS)
    .lean();
  if (!business) {
    const err = new Error("Business not found.");
    err.status = 404;
    throw err;
  }

  const products = await BusinessProduct.find({
    businessId: business._id,
    isAvailable: true,
  })
    .sort({ isFeatured: -1, sortOrder: 1 })
    .lean();

  return { ...business, products };
}

export async function setFeaturedBusiness(businessId) {
  const candidate = await BusinessProfile.findById(businessId);
  if (!candidate) {
    const err = new Error("Business not found.");
    err.status = 404;
    throw err;
  }
  if (candidate.status !== "active") {
    const err = new Error("Only an approved, active business can be featured.");
    err.status = 409;
    throw err;
  }

  // Clear any existing featured flag
  await BusinessProfile.updateMany({ isFeaturedThisWeek: true }, { $set: { isFeaturedThisWeek: false } });

  const now = new Date();
  const business = await BusinessProfile.findByIdAndUpdate(
    businessId,
    {
      $set: { isFeaturedThisWeek: true, featuredWeekStartDate: now },
      $push: { featuredWeekHistory: now },
    },
    { new: true }
  );

  if (!business) {
    const err = new Error("Business not found.");
    err.status = 404;
    throw err;
  }

  return business;
}

export async function unsetFeaturedBusiness(businessId) {
  const business = await BusinessProfile.findByIdAndUpdate(
    businessId,
    { $set: { isFeaturedThisWeek: false, featuredWeekStartDate: null } },
    { new: true }
  );
  if (!business) {
    const err = new Error("Business not found.");
    err.status = 404;
    throw err;
  }

  return business;
}

export async function getAdminBusinessList({ status, category, search, page = 1, pageSize = 20 } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) filter.businessName = { $regex: search, $options: "i" };

  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    BusinessProfile.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("userId", "firstName lastName email")
      .lean(),
    BusinessProfile.countDocuments(filter),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function updateBusinessProfile(businessId, data, { allowLifecycleOverride = false } = {}) {
  const allowed = [
    "businessName", "tagline", "description", "category",
    "logoUrl", "bannerUrl", "galleryUrls",
    "contactEmail", "contactPhone", "website", "socialLinks",
    "location", "status", "platformFeePercent", "cashbackPercent",
    "payoutBankName", "payoutIBAN", "payoutBankHolder",
    "isFeaturedThisWeek",
  ];
  const update = {};
  for (const key of allowed) {
    if (data[key] !== undefined) update[key] = data[key];
  }

  const existing = await BusinessProfile.findById(businessId);
  if (!existing) {
    const err = new Error("Business not found.");
    err.status = 404;
    throw err;
  }

  if (!allowLifecycleOverride && update.status === "active" && ["setup", "review"].includes(existing.status)) {
    const err = new Error("Complete application approval before activating this business.");
    err.status = 409;
    throw err;
  }

  Object.assign(existing, update);
  await existing.save();
  const business = existing;
  return business;
}
