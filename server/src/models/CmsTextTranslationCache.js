import mongoose from "mongoose";

const cmsTextTranslationCacheSchema = new mongoose.Schema(
  {
    sourceHash: { type: String, required: true, index: true },
    sourceText: { type: String, required: true },
    lang: { type: String, required: true },
    translatedText: { type: String, required: true },
  },
  { timestamps: true, collection: "cms_text_translation_cache" }
);

cmsTextTranslationCacheSchema.index({ sourceHash: 1, lang: 1 }, { unique: true });

const CmsTextTranslationCache =
  mongoose.models.CmsTextTranslationCache ||
  mongoose.model("CmsTextTranslationCache", cmsTextTranslationCacheSchema);

export default CmsTextTranslationCache;
