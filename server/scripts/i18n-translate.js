// Fills in any English translation key missing from nl/de by asking Claude to
// translate it, then writes the result straight into the locale JSON files.
//
// Run: npm run i18n:translate --workspace server
// Requires ANTHROPIC_API_KEY (same key already used for V.Assist).
//
// Scope, deliberately: this only fills in KEYS THAT DON'T EXIST YET in nl/de.
// It never touches a key that already has a value — including values that
// happen to be identical to the English text. That "same as English on
// purpose (brand name) vs. genuinely forgotten" judgment call is nuanced
// (see the 2026-07-20 i18n audit) and isn't something to auto-rewrite
// unattended, especially with no PR review step in front of it. Run a
// manual audit periodically for that instead.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import {
  loadAll,
  computeMissingTranslations,
  flatten,
  unflatten,
  localeFile,
  writeNamespaceFile,
} from "./i18n-lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const MODEL = "claude-sonnet-4-6";

const LANG_NAMES = { nl: "Dutch", de: "German" };

const BRAND_TERMS = [
  "V.O.I.C.E. NL", "Stichting The V.O.I.C.E. NL", "V.Commerce", "V.Wallet",
  "V.Assist", "V.Cashback", "HerBeats", "WhatsApp",
];

async function translateBatch(client, ns, lang, keyValues) {
  const langName = LANG_NAMES[lang];
  const entries = Object.entries(keyValues);

  const prompt = `You are translating UI copy for "Stichting The V.O.I.C.E. NL", a Dutch nonprofit community platform (events, memberships, donations, a local-business marketplace called V.Commerce, and a member dashboard). Translate the following English UI strings into natural, professional, warm ${langName} — the tone a community organization uses with its members, not generic corporate copy.

Rules:
- Keep these brand/product names exactly as written, never translate them: ${BRAND_TERMS.join(", ")}.
- Preserve interpolation placeholders exactly as given, e.g. {{count}}, {{name}} — do not translate or alter what's inside {{ }}.
- Keys ending in "_one" and "_other" are i18next pluralization variants of the same phrase — make sure each pair reads as a natural, grammatically correct singular/plural pair in ${langName}, not a literal word-for-word match of the English pattern.
- Return a translation for every single key given — do not skip any, do not add keys that weren't given.
- Namespace/section for context: "${ns}".

Keys and their English source text:
${entries.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n")}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    tools: [{
      name: "submit_translations",
      description: `Submit the ${langName} translation for every key given.`,
      input_schema: {
        type: "object",
        properties: {
          translations: {
            type: "object",
            description: `Map of translation key to its ${langName} translation. Must include every key from the prompt, no more, no fewer.`,
            additionalProperties: { type: "string" },
          },
        },
        required: ["translations"],
      },
    }],
    tool_choice: { type: "tool", name: "submit_translations" },
    messages: [{ role: "user", content: prompt }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse) throw new Error(`No tool_use block in response for ${ns}/${lang}`);
  const translations = toolUse.input.translations || {};

  const missingBack = entries.filter(([k]) => !(k in translations));
  if (missingBack.length) {
    throw new Error(`${ns}/${lang}: model didn't return translations for: ${missingBack.map(([k]) => k).join(", ")}`);
  }
  return translations;
}

async function main() {
  const { namespaces, parsed, errors } = loadAll();
  if (errors.length) {
    console.error("i18n files have structural errors — run i18n:check and fix those first:");
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  const missing = computeMissingTranslations(parsed, namespaces);
  const nsLangPairs = [];
  for (const ns of Object.keys(missing)) {
    for (const lang of Object.keys(missing[ns])) nsLangPairs.push([ns, lang]);
  }

  if (!nsLangPairs.length) {
    console.log("Nothing to translate — en/nl/de are already in sync.");
    return;
  }

  // Only require the API key once we know there's actual translation work to do —
  // an already-in-sync repo shouldn't fail a run just because the key isn't set yet.
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(`ANTHROPIC_API_KEY is not set, but ${nsLangPairs.length} namespace/language pair(s) need translating. Set the key and re-run.`);
    process.exit(1);
  }

  console.log(`${nsLangPairs.length} namespace/language pair(s) have missing translations:`);
  nsLangPairs.forEach(([ns, lang]) => console.log(`  ${ns} [${lang}]: ${Object.keys(missing[ns][lang]).length} keys`));

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const batch = [];

  for (const [ns, lang] of nsLangPairs) {
    const keyValues = missing[ns][lang];
    console.log(`\nTranslating ${ns} [${lang}] (${Object.keys(keyValues).length} keys)...`);
    const translations = await translateBatch(client, ns, lang, keyValues);

    const file = localeFile(lang, ns);
    const current = JSON.parse(fs.readFileSync(file, "utf8"));
    const merged = { ...flatten(current), ...translations };
    writeNamespaceFile(lang, ns, unflatten(merged));
    console.log(`  ✓ wrote ${Object.keys(translations).length} translations to ${path.relative(process.cwd(), file)}`);

    for (const [key, translatedText] of Object.entries(translations)) {
      batch.push({ namespace: ns, lang, key, englishText: keyValues[key], translatedText });
    }
  }

  // In CI, hand the batch off to i18n-sync.yml, which posts it to the server's
  // admin-review ingest endpoint so a human can double-check what just went live.
  if (process.env.CI && batch.length) {
    fs.writeFileSync(path.join(__dirname, "../../batch.json"), JSON.stringify({ items: batch }, null, 2));
    console.log(`\nWrote ${batch.length}-item batch.json for admin-review ingest.`);
  }

  console.log("\nDone. Re-run i18n:check to confirm everything is in sync.");
}

main().catch((err) => {
  console.error("i18n:translate failed:", err.message);
  process.exit(1);
});
