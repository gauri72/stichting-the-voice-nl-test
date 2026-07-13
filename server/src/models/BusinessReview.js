import mongoose from "mongoose";

const businessReviewSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessProfile", required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessOrder", required: true, unique: true },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewerName: { type: String, default: "", trim: true, maxlength: 100 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    body: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { timestamps: true, collection: "business_reviews" }
);

businessReviewSchema.index({ businessId: 1, createdAt: -1 });

const BusinessReview =
  mongoose.models.BusinessReview || mongoose.model("BusinessReview", businessReviewSchema);

export default BusinessReview;
