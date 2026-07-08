import BusinessProfile from "../models/BusinessProfile.js";
import BusinessProduct from "../models/BusinessProduct.js";

export async function getFeaturedBusiness() {
  const business = await BusinessProfile.findOne({
    status: "active",
    isFeaturedThisWeek: true,
  }).lean();

  if (!business) return null;

  const products = await BusinessProduct.find({
    businessId: business._id,
    isAvailable: true,
  })
    .sort({ isFeatured: -1, sortOrder: 1 })
    .limit(6)
    .lean();

  return { ...business, products };
}

export async function listBusinesses({ category, search, page = 1, pageSize = 12 } = {}) {
  const filter = { status: "active" };
  if (category) filter.category = category;
  if (search) filter.businessName = { $regex: search, $options: "i" };

  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    BusinessProfile.find(filter)
      .sort({ isFeaturedThisWeek: -1, totalOrders: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    BusinessProfile.countDocuments(filter),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getBusinessBySlug(slug) {
  const business = await BusinessProfile.findOne({ slug, status: "active" }).lean();
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

export async function updateBusinessProfile(businessId, data) {
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

  const business = await BusinessProfile.findByIdAndUpdate(businessId, { $set: update }, { new: true, runValidators: true });
  if (!business) {
    const err = new Error("Business not found.");
    err.status = 404;
    throw err;
  }
  return business;
}
