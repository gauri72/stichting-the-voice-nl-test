// Verifies the client's translation files are internally consistent:
//   - every locale JSON file parses, with no duplicate keys
//   - en/nl/de have identical key sets for every namespace
//   - every t("namespace:key") call in client/src/components resolves to a
//     real key (accounting for i18next's _one/_other pluralization suffixes)
//
// Run: npm run i18n:check --workspace server
// Exits 1 if anything above fails. Missing translations alone are reported
// but don't fail the check on their own — that's what i18n-translate.js is
// for; this script's job is catching things auto-translation can't fix
// (malformed JSON, dangling references to keys that were renamed/removed).
import { loadAll, computeMissingTranslations, findDanglingReferences } from "./i18n-lib.js";

const { namespaces, parsed, errors } = loadAll();
const missing = computeMissingTranslations(parsed, namespaces);
const dangling = findDanglingReferences(parsed, namespaces);

let missingCount = 0;
for (const ns of Object.keys(missing)) {
  for (const lang of Object.keys(missing[ns])) missingCount += Object.keys(missing[ns][lang]).length;
}

console.log(`Namespaces checked: ${namespaces.length}`);
console.log(`Parse/duplicate-key errors: ${errors.length}`);
errors.forEach((e) => console.log(`  ✗ ${e}`));

console.log(`Dangling t() references: ${dangling.length}`);
dangling.forEach((d) => console.log(`  ✗ ${d}`));

console.log(`Missing translations (en key with no nl/de counterpart): ${missingCount}`);
for (const [ns, byLang] of Object.entries(missing)) {
  for (const [lang, keys] of Object.entries(byLang)) {
    console.log(`  ${ns} [${lang}]: ${Object.keys(keys).length} missing`);
  }
}

const hardFailure = errors.length > 0 || dangling.length > 0;

if (hardFailure) {
  console.log("\ni18n check FAILED — fix the errors/dangling references above.");
  process.exit(1);
}

if (missingCount > 0) {
  console.log(`\ni18n check passed structurally, but ${missingCount} translations are missing. Run "npm run i18n:translate --workspace server" to fill them in.`);
  process.exit(0);
}

console.log("\ni18n check passed — fully in sync.");
