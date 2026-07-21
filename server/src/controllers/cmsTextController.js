import { translateCmsText } from "../services/cmsTextTranslationService.js";

export async function translateCmsTextHandler(req, res) {
  const { text, lang } = req.body || {};

  try {
    const translatedText = await translateCmsText(text, lang);
    return res.status(200).json({ translatedText });
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) console.error("[cms-text] translate failed:", error.message);
    return res.status(status).json({ error: error.message || "Translation failed." });
  }
}
