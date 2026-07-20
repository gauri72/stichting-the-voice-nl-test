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
    sellingMode: { type: String, enum: ["hosted", "external", "hybrid"], default: "hosted", index: true },
    packageId: { type: String, enum: ["starter", "growth", "spotlight"], default: "starter" },
    billingCycle: { type: String, enum: ["monthly", "annual"], default: "monthly" },
    packageStatus: { type: String, enum: ["trial", "active", "past_due", "cancelled"], default: "trial" },
    stripeSubscriptionId: { type: String, default: "", trim: true, index: true },
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
      enum: ["setup", "review", "active", "suspended", "paused"],
      default: "setup",
      index: true,
    },
    isFeaturedThisWeek: { type: Boolean, default: false, index: true },
    featuredWeekStartDate: { type: Date, default: null },
    featuredWeekHistory: { type: [Date], default: [] },
    platformFeePercent: { type: Number, default: 5, min: 0, max: 100 },
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
    stripeConnectedAccountId: { type: String, default: "", trim: true, index: true },
    stripeConnectStatus: { type: String, enum: ["not_started", "pending", "restricted", "enabled"], default: "not_started" },
    stripeDetailsSubmitted: { type: Boolean, default: false },
    stripeChargesEnabled: { type: Boolean, default: false },
    stripeTransfersEnabled: { type: Boolean, default: false },
    payoutsEnabled: { type: Boolean, default: false },
    stripeRequirementsCurrentlyDue: { type: [String], default: [] },
    stripeRequirementsEventuallyDue: { type: [String], default: [] },
    stripeDisabledReason: { type: String, default: "", trim: true },
    stripeCountry: { type: String, default: "", trim: true },
    stripeDefaultCurrency: { type: String, default: "eur", trim: true, lowercase: true },
    stripeLastSyncedAt: { type: Date, default: null },
    connectCheckoutEnabled: { type: Boolean, default: false, index: true },
    payoutScheduleInterval: { type: String, enum: ["daily", "weekly", "monthly", "manual", ""], default: "" },
    // Days Stripe holds a charge before it's eligible for payout, per this account's
    // own Stripe Connect settings (distinct from payoutScheduleInterval, which is how
    // often payouts run once eligible).
    payoutScheduleDelayDays: { type: Number, default: null },
    // Global marketplace fields
    vatNumber: { type: String, default: "", trim: true },
    companyRegistrationNumber: { type: String, default: "", trim: true, maxlength: 100 },
    payoutRegistration: {
      entityType: { type: String, enum: ["", "individual", "company"], default: "" },
      legalName: { type: String, default: "", trim: true, maxlength: 200 },
      dateOfBirth: { type: Date, default: null },
      nationality: { type: String, default: "", trim: true, maxlength: 60 },
      address: {
        street: { type: String, default: "", trim: true },
        houseNumber: { type: String, default: "", trim: true },
        postalCode: { type: String, default: "", trim: true },
        city: { type: String, default: "", trim: true },
        country: { type: String, default: "NL", trim: true },
      },
      companyLegalName: { type: String, default: "", trim: true, maxlength: 200 },
      representative: {
        legalName: { type: String, default: "", trim: true },
        dateOfBirth: { type: Date, default: null },
        address: {
          street: { type: String, default: "", trim: true },
          houseNumber: { type: String, default: "", trim: true },
          postalCode: { type: String, default: "", trim: true },
          city: { type: String, default: "", trim: true },
          country: { type: String, default: "NL", trim: true },
        },
      },
      bankAccountHolderName: { type: String, default: "", trim: true },
      stripeBankToken: { type: String, default: "", trim: true },
      ibanLast4: { type: String, default: "", trim: true, maxlength: 4 },
      consentAcceptedAt: { type: Date, default: null },
    },
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
