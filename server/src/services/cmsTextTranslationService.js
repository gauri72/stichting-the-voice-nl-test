import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import env from "../config/env.js";
import CmsTextTranslationCache from "../models/CmsTextTranslationCache.js";

const MODEL = "claude-sonnet-4-6";
const MAX_TEXT_LENGTH = 200;
const LANG_NAMES = { nl: "Dutch", de: "German" };

const BRAND_TERMS = [
  "V.O.I.C.E. NL", "Stichting The V.O.I.C.E. NL", "V.Commerce", "V.Wallet",
  "V.Assist", "V.Cashback", "HerBeats", "WhatsApp",
];

let cachedClient = null;
function getClient() {
  if (!env.anthropic.apiKey) {
    const err = new Error("AI translation is not configured (ANTHROPIC_API_KEY missing).");
    err.status = 503;
    throw err;
  }
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: env.anthropic.apiKey });
  }
  return cachedClient;
}

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

export async function translateCmsText(text, lang) {
  if (!LANG_NAMES[lang]) {
    const err = new Error(`Unsupported language: ${lang}`);
    err.status = 400;
    throw err;
  }

  const trimmed = String(text || "").trim();
  if (!trimmed) return "";

  if (trimmed.length > MAX_TEXT_LENGTH) {
    const err = new Error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters.`);
    err.status = 400;
    throw err;
  }

  const sourceHash = sha256(trimmed);
  const cached = await CmsTextTranslationCache.findOne({ sourceHash, lang });
  if (cached) return cached.translatedText;

  const langName = LANG_NAMES[lang];
  const client = getClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `Translate this UI button/label text for "Stichting The V.O.I.C.E. NL", a Dutch nonprofit community platform, into natural, professional ${langName}. Keep it short — it's a button label, not a paragraph.

Rules:
- Keep these brand/product names exactly as written, never translate them: ${BRAND_TERMS.join(", ")}.
- Reply with only the translated text, no quotes, no preamble.

Text: ${trimmed}`,
    }],
  });

  const translatedText = message.content?.[0]?.type === "text" ? message.content[0].text.trim() : "";
  if (!translatedText) {
    const err = new Error("Translation failed: empty response from AI model.");
    err.status = 502;
    throw err;
  }

  await CmsTextTranslationCache.updateOne(
    { sourceHash, lang },
    { $setOnInsert: { sourceText: trimmed, translatedText } },
    { upsert: true }
  );

  return translatedText;
}
