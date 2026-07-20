import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const LANGS = ["en", "nl", "de"];
export const LOCALES_DIR = path.join(__dirname, "../../client/src/i18n/locales");
export const COMPONENTS_DIR = path.join(__dirname, "../../client/src/components");
export const I18N_DIR = path.join(__dirname, "../../client/src/i18n");

/**
 * Recursive-descent JSON parser that throws on duplicate keys within the same
 * object — plain JSON.parse silently keeps only the last one, which is exactly
 * the bug this catches (a real one shipped in vcommercePortal.json once).
 */
export function parseStrict(text, filename = "<file>") {
  let i = 0;
  function ws() { while (i < text.length && /\s/.test(text[i])) i++; }
  function parseValue() {
    ws();
    const c = text[i];
    if (c === "{") return parseObject();
    if (c === "[") return parseArray();
    if (c === "\"") return parseString();
    if (c === "t") { i += 4; return true; }
    if (c === "f") { i += 5; return false; }
    if (c === "n") { i += 4; return null; }
    const start = i;
    while (i < text.length && /[-+0-9.eE]/.test(text[i])) i++;
    return parseFloat(text.slice(start, i));
  }
  function parseString() {
    i++; // opening quote
    let s = "";
    while (text[i] !== "\"") {
      if (i >= text.length) throw new Error(`Unterminated string in ${filename} at position ${i}`);
      if (text[i] === "\\") { s += text[i] + text[i + 1]; i += 2; }
      else { s += text[i]; i++; }
    }
    i++; // closing quote
    return JSON.parse(`"${s}"`);
  }
  function parseObject() {
    i++; // {
    const obj = {};
    const seen = new Set();
    ws();
    if (text[i] === "}") { i++; return obj; }
    while (true) {
      ws();
      const key = parseString();
      ws();
      i++; // :
      const value = parseValue();
      if (seen.has(key)) throw new Error(`Duplicate key "${key}" in ${filename} (near position ${i})`);
      seen.add(key);
      obj[key] = value;
      ws();
      if (text[i] === ",") { i++; continue; }
      if (text[i] === "}") { i++; break; }
      throw new Error(`Unexpected character at position ${i} in ${filename}`);
    }
    return obj;
  }
  function parseArray() {
    i++; // [
    const arr = [];
    ws();
    if (text[i] === "]") { i++; return arr; }
    while (true) {
      arr.push(parseValue());
      ws();
      if (text[i] === ",") { i++; continue; }
      if (text[i] === "]") { i++; break; }
      throw new Error(`Unexpected character at position ${i} in ${filename}`);
    }
    return arr;
  }
  return parseValue();
}

export function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flatten(v, key));
    else out[key] = v;
  }
  return out;
}

/** Inverse of flatten() — turns {"a.b.c": "x"} back into {a: {b: {c: "x"}}}. */
export function unflatten(flat) {
  const out = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let node = out;
    for (let i = 0; i < parts.length - 1; i++) {
      node = node[parts[i]] ??= {};
    }
    node[parts[parts.length - 1]] = value;
  }
  return out;
}

export function readNamespaces() {
  return fs.readdirSync(path.join(LOCALES_DIR, "en"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}

export function localeFile(lang, ns) {
  return path.join(LOCALES_DIR, lang, `${ns}.json`);
}

/**
 * Loads and strictly parses every namespace/language file. Returns
 * { parsed: { [ns]: { en, nl, de } }, errors: string[] } — errors covers
 * missing files, JSON syntax errors, and duplicate keys. Namespaces/languages
 * that failed to parse strictly are re-parsed leniently (plain JSON.parse) so
 * the rest of the tooling can still run and report everything at once instead
 * of stopping at the first problem.
 */
export function loadAll() {
  const namespaces = readNamespaces();
  const parsed = {};
  const errors = [];
  for (const ns of namespaces) {
    parsed[ns] = {};
    for (const lang of LANGS) {
      const file = localeFile(lang, ns);
      if (!fs.existsSync(file)) {
        errors.push(`Missing file: ${file}`);
        continue;
      }
      const raw = fs.readFileSync(file, "utf8");
      try {
        parsed[ns][lang] = parseStrict(raw, file);
      } catch (e) {
        errors.push(e.message);
        try { parsed[ns][lang] = JSON.parse(raw); } catch (e2) {
          errors.push(`${file}: ${e2.message}`);
        }
      }
    }
  }
  return { namespaces, parsed, errors };
}

export function walkFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, files);
    else if (entry.name.endsWith(".jsx") || entry.name.endsWith(".js")) files.push(full);
  }
  return files;
}

/**
 * For every namespace, finds keys present in en but missing from nl/de.
 * Returns { [ns]: { nl: {key: enValue, ...}, de: {...} } } — only namespaces/
 * languages with at least one gap are included.
 */
export function computeMissingTranslations(parsed, namespaces) {
  const missing = {};
  for (const ns of namespaces) {
    if (!parsed[ns]?.en) continue;
    const en = flatten(parsed[ns].en);
    for (const lang of ["nl", "de"]) {
      if (!parsed[ns][lang]) continue;
      const data = flatten(parsed[ns][lang]);
      const gaps = {};
      for (const [key, value] of Object.entries(en)) {
        if (!(key in data) && typeof value === "string") gaps[key] = value;
      }
      if (Object.keys(gaps).length) {
        missing[ns] ??= {};
        missing[ns][lang] = gaps;
      }
    }
  }
  return missing;
}

/**
 * Scans every component file for t("namespace:key") calls (including simple
 * template-literal keys, which are skipped rather than falsely flagged since
 * they can't be resolved statically) and reports any that don't resolve
 * against the en namespace data — accounting for i18next's _one/_other
 * pluralization suffix convention.
 */
export function findDanglingReferences(parsed, namespaces) {
  const nsFlat = {};
  for (const ns of namespaces) {
    if (parsed[ns]?.en) nsFlat[ns] = flatten(parsed[ns].en);
  }
  const files = walkFiles(COMPONENTS_DIR).concat(walkFiles(I18N_DIR));
  const tCallRe = /\bt\(\s*["'`]\s*([a-zA-Z0-9_]+):([^"'`$]+?)\s*["'`]/g;
  const dangling = [];
  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    let m;
    while ((m = tCallRe.exec(src))) {
      const [, ns, key] = m;
      if (!nsFlat[ns]) { dangling.push(`${file}: unknown namespace "${ns}" (key ${key})`); continue; }
      const exists = key in nsFlat[ns] || `${key}_one` in nsFlat[ns] || `${key}_other` in nsFlat[ns];
      if (!exists) dangling.push(`${file}: ${ns}:${key} — key not found`);
    }
  }
  return dangling;
}

export function writeNamespaceFile(lang, ns, dataObject) {
  const file = localeFile(lang, ns);
  fs.writeFileSync(file, `${JSON.stringify(dataObject, null, 2)}\n`, "utf8");
}
