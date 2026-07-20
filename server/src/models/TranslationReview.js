import mongoose from "mongoose";

const translationReviewSchema = new mongoose.Schema(
  {
    namespace: { type: String, required: true, index: true },
    key: { type: String, required: true },
    lang: { type: String, required: true, enum: ["nl", "de"] },
    englishText: { type: String, default: "" },
    translatedText: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    commitSha: { type: String, default: "" },
    reviewedBy: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "translation_reviews" }
);

const TranslationReview =
  mongoose.models.TranslationReview || mongoose.model("TranslationReview", translationReviewSchema);

export default TranslationReview;
