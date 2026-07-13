import mongoose from "mongoose";
import { BUSINESS_CATEGORIES } from "../config/businessCategories.js";

const businessApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    businessName: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, enum: BUSINESS_CATEGORIES, required: true },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    tagline: { type: String, default: "", trim: true, maxlength: 160 },
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
    applicationMessage: { type: String, default: "", trim: true, maxlength: 1000 },
    membershipPlanId: { type: String, default: "", trim: true },
    applicantType: { type: String, enum: ["community_member", "sponsor"], default: "community_member" },
    companyRegistrationNumber: { type: String, default: "", trim: true, maxlength: 100 },
    vatNumber: { type: String, default: "", trim: true, maxlength: 50 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: "", trim: true, maxlength: 500 },
    businessProfileId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessProfile", default: null },
  },
  { timestamps: true, collection: "business_applications" }
);

businessApplicationSchema.index({ userId: 1, status: 1 });

const BusinessApplication =
  mongoose.models.BusinessApplication ||
  mongoose.model("BusinessApplication", businessApplicationSchema);

export default BusinessApplication;
