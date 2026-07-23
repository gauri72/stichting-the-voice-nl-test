import { translateCmsText } from "../services/cmsTextTranslationService.js";
import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[cms-text]" });
}

export async function translateCmsTextHandler(req, res) {
  const { text, lang } = req.body || {};

  try {
    const translatedText = await translateCmsText(text, lang);
    return res.status(200).json({ translatedText });
  } catch (error) {
    return handleError(res, error);
  }
}
