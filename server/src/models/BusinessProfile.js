import mongoose from "mongoose";
import { BUSINESS_CATEGORIES } from "../config/businessCategories.js";

const businessProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessApplication", default: null },
    businessName: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    tagline: { type: String, default: "", trim: true, maxlength: 160 },
    description: { type: String, default: "", trim: true, maxlength: 3000 },
    category: { type: String, enum: BUSINESS_CATEGORIES, index: true },
    logoUrl: { type: String, default: "", trim: true },
    bannerUrl: { type: String, default: "", trim: true },
    galleryUrls: { type: [String], default: [] },
    contactEmail: { type: String, default: "", trim: true, maxlength: 254 },
    contactPhone: { type: String, default: "", trim: true, maxlength: 30 },
    website: { type: String, default: "", trim: true, maxlength: 500 },
    socialLinks: {
      instagram: { type: String, default: "", trim: true },
      facebook: { type: String, default: "", trim: true },
      linkedin: { type: String, default: "", trim: true },
      tiktok: { type: String, default: "", trim: true },
      whatsapp: { type: String, default: "", trim: true },
    },
    location: {
      city: { type: String, default: "", trim: true },
      country: { type: String, default: "NL", trim: true },
    },
    status: {
      type: String,
      enum: ["active", "suspended", "paused"],
      default: "active",
      index: true,
    },
    isFeaturedThisWeek: { type: Boolean, default: false, index: true },
    featuredWeekStartDate: { type: Date, default: null },
    featuredWeekHistory: { type: [Date], default: [] },
    platformFeePercent: { type: Number, default: 0, min: 0, max: 100 },
    cashbackPercent: { type: Number, default: 5, min: 0, max: 50 },
    // Denormalized revenue counters — updated atomically on each order/payout
    totalRevenueMinor: { type: Number, default: 0 },
    totalFeesMinor: { type: Number, default: 0 },
    totalPayoutsMinor: { type: Number, default: 0 },
    pendingPayoutMinor: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    // Bank details for manual SEPA payout
    payoutBankName: { type: String, default: "", trim: true },
    payoutIBAN: { type: String, default: "", trim: true },
    payoutBankHolder: { type: String, default: "", trim: true },
    // Global marketplace fields
    vatNumber: { type: String, default: "", trim: true },
    minOrderValueMinor: { type: Number, default: 0, min: 0 },
    reorderFeePercent: { type: Number, default: 5, min: 0, max: 100 },
    directReferralCode: { type: String, default: null, trim: true, sparse: true },
    reviewCount: { type: Number, default: 0 },
    avgRating: { type: Number, default: null },
    importLogs: { type: [{ filename: String, importedAt: Date, importedCount: Number, errorCount: Number }], default: [] },
  },
  { timestamps: true, collection: "business_profiles" }
);

businessProfileSchema.index({ status: 1, isFeaturedThisWeek: 1 });
businessProfileSchema.index({ category: 1, status: 1 });

const BusinessProfile =
  mongoose.models.BusinessProfile || mongoose.model("BusinessProfile", businessProfileSchema);

export default BusinessProfile;
