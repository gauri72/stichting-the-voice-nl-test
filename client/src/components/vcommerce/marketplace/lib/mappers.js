import { BUSINESS_CATEGORY_LABELS } from "../../shared/BUSINESS_CATEGORIES.js";

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%230d1829'/%3E%3Crect x='155' y='110' width='90' height='80' rx='10' fill='%23203050'/%3E%3Ccircle cx='200' cy='135' r='22' fill='%23304060'/%3E%3C/svg%3E";

/**
 * @param {object} api — raw BusinessProfile from MongoDB
 * @returns {import('./types.js').Business}
 */
export function mapBusiness(api) {
  if (!api) return null;
  const id = String(api._id ?? api.id ?? "");
  const slug = String(api.slug || "");
  return {
    id,
    name: String(api.businessName || "").trim() || "Business unavailable",
    slug,
    category: String(api.category || "other"),
    categoryLabel: BUSINESS_CATEGORY_LABELS[api.category] || "Other",
    description: String(api.description || api.tagline || ""),
    location: [api.location?.city, api.location?.country].filter(Boolean).join(", ") || "Location not provided",
    rating: Number(api.avgRating ?? api.rating ?? 0),
    reviewCount: Number(api.reviewCount ?? 0),
    imageUrl: String(api.bannerUrl || api.logoUrl || "").trim() || PLACEHOLDER_IMG,
    logoUrl: String(api.logoUrl || "").trim() || undefined,
    tags: Array.isArray(api.tags) ? api.tags : [],
    featured: Boolean(api.isFeaturedThisWeek ?? api.featured),
    verified: String(api.status) === "active",
    shopUrl: `/vcommerce/${slug}`,
    cashbackPercent: Number(api.cashbackPercent ?? 0),
  };
}

/**
 * Maps a raw BusinessProduct + embedded business from the popular products aggregation.
 * @param {object} api
 * @returns {import('./types.js').Product}
 */
export function mapProduct(api) {
  if (!api) return null;
  const biz = api.business || {};
  const imageUrls = Array.isArray(api.imageUrls) ? api.imageUrls : [];
  return {
    id: String(api._id ?? api.id ?? ""),
    businessId: String(api.businessId ?? biz._id ?? ""),
    businessName: String(biz.businessName || "").trim() || "Business unavailable",
    businessSlug: String(biz.slug || ""),
    name: String(api.name || "").trim() || "Product unavailable",
    slug: String(api.slug || ""),
    category: BUSINESS_CATEGORY_LABELS[biz.category] || String(biz.category || ""),
    imageUrl: imageUrls.find(Boolean) || PLACEHOLDER_IMG,
    price: Number(api.priceMinor ?? 0) / 100,
    currency: "EUR",
    cashbackPercent: Number(biz.cashbackPercent ?? 0),
    favourite: false,
  };
}
